import time
import cv2
import numpy as np

from app.preprocessing.pipeline import PreprocessingPipeline
from app.orchestrator.analyzer import ConditionAnalyzer, MethodRecommender
from app.geometry.filtering import MatchFilter
from app.geometry.ransac import GeometricVerifier
from app.geometry.refinement import SpatialValidator, SubpixelRefiner
from app.registration.engine import RegistrationEngine
from app.matchers.lightglue import LightGlueMatcher

# Fallback models (if implemented)
# from app.matchers.sift import SIFTMatcher
# from app.matchers.loftr import LoFTRMatcher
# from app.matchers.rift2 import RIFT2Matcher

class LunaraOrchestrator:
    def __init__(self, matchers_registry: dict, config: dict = None):
        """
        matchers_registry: dict mapping 'lightglue', 'sift', 'loftr', 'rift2' to their instantiated classes.
        """
        self.config = config or {}
        self.matchers = matchers_registry
        
        self.preprocessor = PreprocessingPipeline(self.config.get("preprocessing", {}))
        self.analyzer = ConditionAnalyzer()
        self.recommender = MethodRecommender()
        self.match_filter = MatchFilter()
        self.verifier = GeometricVerifier()
        self.spatial_validator = SpatialValidator()
        self.refiner = SubpixelRefiner()
        self.reg_engine = RegistrationEngine()
        
    def execute(self, ref_path: str, src_path: str, requested_method: str = "auto") -> dict:
        total_start = time.time()
        
        # 1. Preprocessing (Assumes paths are raw images, we output to same or memory)
        # For orchestrator, we assume the caller handled saving raw. We just process in memory.
        image_a_cv = cv2.imread(ref_path, cv2.IMREAD_GRAYSCALE)
        image_b_cv = cv2.imread(src_path, cv2.IMREAD_GRAYSCALE)
        
        # Apply preprocessing
        prep_a = self.preprocessor._apply_clahe(image_a_cv) if self.preprocessor.config.get("clahe") else image_a_cv
        prep_b = self.preprocessor._apply_clahe(image_b_cv) if self.preprocessor.config.get("clahe") else image_b_cv
        
        # 2. Condition Analysis
        conditions = self.analyzer.analyze(prep_a, prep_b)
        
        # 3. Method Recommendation
        if requested_method == "auto":
            selected_method = self.recommender.recommend(conditions)
        else:
            selected_method = requested_method
            
        if selected_method not in self.matchers:
            print(f"Requested method {selected_method} not loaded. Falling back to lightglue.")
            selected_method = "lightglue"
            
        matcher = self.matchers.get(selected_method)
        
        # Matcher Execution
        match_start = time.time()
        
        # Depending on matcher, we might need tensor or cv2 image.
        # Matcher interface handles its own loading if needed, or we pass paths.
        # Let's pass the preprocessed paths or cv images. 
        # For simplicity, pass the original paths, but ideally the matchers should accept cv arrays.
        # However LightGlue requires specific torch formatting. Let's pass the image paths to be safe, 
        # or have the matcher convert cv2 to tensor.
        
        try:
            match_result = matcher.match(ref_path, src_path) # Matchers should handle loading now
        except Exception as e:
            print(f"Matcher {selected_method} failed: {e}")
            return {"status": "error", "message": str(e)}
            
        match_time = time.time() - match_start
        
        if match_result.num_matches < 4:
            return {"status": "error", "message": "Not enough matches found."}
            
        # Match Filtering
        valid_mask = self.match_filter.filter_matches(match_result)
        # Filter matches (just identity for now)
        
        # RANSAC Transformation Estimation
        geo_result = self.verifier.verify(
            match_result.keypoints_a,
            match_result.keypoints_b,
            match_result.matches,
            model="affine"
        )
        
        if not geo_result or geo_result.num_inliers < 4:
            return {"status": "error", "message": "RANSAC failed to find reliable transformation."}
            
        # Spatial Validation
        is_valid = self.spatial_validator.validate(geo_result.transformation_matrix, model="affine")
        
        if not is_valid:
            return {"status": "error", "message": "Spatial validation failed. Invalid warp matrix."}
            
        # ECC Subpixel Refinement (Only if reliable enough)
        if geo_result.inlier_ratio > 0.1 and geo_result.num_inliers >= 10:
            refined_matrix = self.refiner.refine_ecc(
                prep_a, 
                prep_b, 
                geo_result.transformation_matrix, 
                model="affine"
            )
        else:
            refined_matrix = geo_result.transformation_matrix
            
        # Registration
        reg_start = time.time()
        registered_image = self.reg_engine.register(
            image_b_cv, # we warp the original
            image_a_cv.shape,
            refined_matrix,
            model="affine"
        )
        reg_time = time.time() - reg_start
        
        # Quality Assessment
        # Calculate coverage (intersection of valid warped pixels)
        h, w = image_a_cv.shape
        corners = np.array([[0,0,1], [w,0,1], [w,h,1], [0,h,1]]).T
        warped_corners = refined_matrix[:2,:] @ corners
        
        # Simplified coverage calculation (bounding box intersection)
        min_x, max_x = max(0, np.min(warped_corners[0])), min(w, np.max(warped_corners[0]))
        min_y, max_y = max(0, np.min(warped_corners[1])), min(h, np.max(warped_corners[1]))
        overlap_area = max(0, max_x - min_x) * max(0, max_y - min_y)
        coverage = (overlap_area / (w * h)) * 100.0
        
        total_time = time.time() - total_start
        
        return {
            "status": "success",
            "method_used": selected_method,
            "registered_image": registered_image,
            "match_result": match_result,
            "geo_result": geo_result,
            "refined_matrix": refined_matrix,
            "metrics": {
                "inliers": geo_result.num_inliers,
                "inlier_ratio": geo_result.inlier_ratio,
                "rmse": geo_result.rmse,
                "coverage": coverage,
                "runtime": total_time
            }
        }
