import time
import cv2
import numpy as np

from app.preprocessing.production import ProcessedPair
from app.schemas.matching import AlgorithmResult
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
        
        self.analyzer = ConditionAnalyzer()
        self.recommender = MethodRecommender()
        self.match_filter = MatchFilter()
        self.verifier = GeometricVerifier()
        self.spatial_validator = SpatialValidator()
        self.refiner = SubpixelRefiner()
        self.reg_engine = RegistrationEngine()
        
    def execute(self, processed_pair: ProcessedPair, original_moving: np.ndarray, original_reference: np.ndarray, requested_method: str = "auto") -> AlgorithmResult:
        total_start = time.time()
        
        prep_a = processed_pair.reference_image
        prep_b = processed_pair.moving_image
        
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
            match_result = matcher.match(prep_a, prep_b)
        except Exception as e:
            print(f"Matcher {selected_method} failed: {e}")
            if selected_method != "lightglue" and "lightglue" in self.matchers:
                print("Auto-falling back to LightGlue model...")
                selected_method = "lightglue"
                matcher = self.matchers.get("lightglue")
                try:
                    match_result = matcher.match(prep_a, prep_b)
                except Exception as fb_err:
                    return AlgorithmResult(
                        status="error",
                        method_used=selected_method,
                        registered_image=None,
                        match_result=None,
                        geo_result=None,
                        refined_matrix=None,
                        metrics={},
                        preprocessing_metadata=processed_pair.preprocessing_metadata,
                        failure_reason=str(fb_err)
                    )
            else:
                return AlgorithmResult(
                    status="error",
                    method_used=selected_method,
                    registered_image=None,
                    match_result=None,
                    geo_result=None,
                    refined_matrix=None,
                    metrics={},
                    preprocessing_metadata=processed_pair.preprocessing_metadata,
                    failure_reason=str(e)
                )

        match_time = time.time() - match_start

        if match_result.num_matches < 4:
            if selected_method != "lightglue" and "lightglue" in self.matchers:
                print(f"Matcher {selected_method} found only {match_result.num_matches} matches. Auto-falling back to LightGlue...")
                selected_method = "lightglue"
                matcher = self.matchers.get("lightglue")
                try:
                    match_result = matcher.match(prep_a, prep_b)
                except Exception as fb_err:
                    print(f"Fallback LightGlue also failed: {fb_err}")

        if match_result.num_matches < 4:
            return AlgorithmResult(
                status="error",
                method_used=selected_method,
                registered_image=None,
                match_result=match_result,
                geo_result=None,
                refined_matrix=None,
                metrics={},
                preprocessing_metadata=processed_pair.preprocessing_metadata,
                failure_reason="Not enough matches found."
            )
            
        # Match Filtering
        valid_mask = self.match_filter.filter_matches(match_result)
        # Filter matches (just identity for now)
        
        # RANSAC Transformation Estimation (Two-stage Homography -> Affine Fallback)
        geo_result = self.verifier.verify(
            match_result.keypoints_a,
            match_result.keypoints_b,
            match_result.matches,
            model="homography"
        )
        used_model = "homography"
        is_valid = False

        if geo_result and geo_result.num_inliers >= 4:
            is_valid = self.spatial_validator.validate(geo_result.transformation_matrix, model="homography")

        # If homography failed, produced < 4 inliers, or produced a degenerate reflection matrix, fallback to Affine
        if not is_valid or not geo_result or geo_result.num_inliers < 4:
            print("Homography degenerated or < 4 inliers. Attempting robust similarity Affine fallback...")
            geo_result_aff = self.verifier.verify(
                match_result.keypoints_a,
                match_result.keypoints_b,
                match_result.matches,
                model="affine"
            )
            if geo_result_aff and geo_result_aff.num_inliers >= 3:
                if self.spatial_validator.validate(geo_result_aff.transformation_matrix, model="affine"):
                    geo_result = geo_result_aff
                    used_model = "affine"
                    is_valid = True

        if not is_valid or not geo_result or geo_result.num_inliers < 3:
            return AlgorithmResult(
                status="error",
                method_used=selected_method,
                registered_image=None,
                match_result=match_result,
                geo_result=geo_result,
                refined_matrix=None,
                metrics={},
                preprocessing_metadata=processed_pair.preprocessing_metadata,
                failure_reason="Geometric verification failed. Invariant correspondences insufficient to solve transformation."
            )

        # ECC Subpixel Refinement (Only if reliable enough and not extreme strip)
        refined_matrix = geo_result.transformation_matrix
        if geo_result.inlier_ratio > 0.15 and geo_result.num_inliers >= 10:
            try:
                refined_matrix = self.refiner.refine_ecc(
                    prep_a, 
                    prep_b, 
                    geo_result.transformation_matrix, 
                    model=used_model
                )
            except Exception as ecc_err:
                print(f"ECC refinement skipped: {ecc_err}")
                refined_matrix = geo_result.transformation_matrix

        # Registration (Warping original moving image to reference space)
        reg_start = time.time()
        registered_image = self.reg_engine.register(
            original_moving,
            original_reference.shape,
            refined_matrix,
            model=used_model
        )
        reg_time = time.time() - reg_start
        
        # Quality Assessment
        # Calculate coverage (intersection of valid warped pixels)
        h, w = original_reference.shape
        corners = np.array([[0,0,1], [w,0,1], [w,h,1], [0,h,1]]).T
        warped_corners = refined_matrix[:2,:] @ corners
        
        # Simplified coverage calculation (bounding box intersection)
        min_x, max_x = max(0, np.min(warped_corners[0])), min(w, np.max(warped_corners[0]))
        min_y, max_y = max(0, np.min(warped_corners[1])), min(h, np.max(warped_corners[1]))
        overlap_area = max(0, max_x - min_x) * max(0, max_y - min_y)
        coverage = (overlap_area / (w * h)) * 100.0
        
        total_time = time.time() - total_start
        
        return AlgorithmResult(
            status="success",
            method_used=selected_method,
            registered_image=registered_image,
            match_result=match_result,
            geo_result=geo_result,
            refined_matrix=refined_matrix,
            preprocessing_metadata=processed_pair.preprocessing_metadata,
            metrics={
                "inliers": geo_result.num_inliers,
                "inlier_ratio": geo_result.inlier_ratio,
                "rmse": geo_result.rmse,
                "coverage": coverage,
                "runtime": total_time
            }
        )
