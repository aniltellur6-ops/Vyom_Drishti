import cv2
import numpy as np
from typing import Dict, Any, Tuple

class ConditionAnalyzer:
    """
    Analyzes an image pair (reference and source) to determine condition characteristics
    like illumination differences, texture/focus quality, resolution mismatch, and 
    feature density. It uses these heuristics to recommend an optimal matching method.
    """

    @staticmethod
    def _get_illumination(image: np.ndarray) -> float:
        """Returns the mean brightness of the image (0-255)."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        return float(np.mean(gray))

    @staticmethod
    def _get_texture_variance(image: np.ndarray) -> float:
        """Uses the Variance of Laplacian to measure texture/focus."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    @staticmethod
    def _get_feature_density(image: np.ndarray) -> int:
        """Counts raw fast features to estimate density."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        # Use FAST as it's computationally cheap for analysis phase
        fast = cv2.FastFeatureDetector_create(threshold=20)
        keypoints = fast.detect(gray, None)
        return len(keypoints)

    def analyze(self, ref_path: str, src_path: str) -> Dict[str, Any]:
        ref_img = cv2.imread(ref_path)
        src_img = cv2.imread(src_path)

        if ref_img is None or src_img is None:
            raise ValueError("Could not read one or both images for analysis.")

        ref_gray = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY) if len(ref_img.shape) == 3 else ref_img
        src_gray = cv2.cvtColor(src_img, cv2.COLOR_BGR2GRAY) if len(src_img.shape) == 3 else src_img

        # Resolution Difference
        ref_area = ref_img.shape[0] * ref_img.shape[1]
        src_area = src_img.shape[0] * src_img.shape[1]
        area_ratio = max(ref_area, src_area) / max(min(ref_area, src_area), 1)
        
        if area_ratio > 2.0:
            res_diff = "HIGH"
        elif area_ratio > 1.2:
            res_diff = "MODERATE"
        else:
            res_diff = "LOW"
            
        res_str = f"{area_ratio:.1f}x"

        # Illumination & Shadow Analysis
        ref_ill = self._get_illumination(ref_img)
        src_ill = self._get_illumination(src_img)
        ill_diff_val = abs(ref_ill - src_ill)

        if ill_diff_val > 55:
            ill_diff = "HIGH"
        elif ill_diff_val > 22:
            ill_diff = "MODERATE"
        else:
            ill_diff = "LOW"

        # Real shadow pixel coverage (< 35 intensity in 8-bit space)
        ref_shadow_pct = float(np.mean(ref_gray < 35) * 100.0)
        src_shadow_pct = float(np.mean(src_gray < 35) * 100.0)
        shadow_coverage = round(max(ref_shadow_pct, src_shadow_pct), 1)

        # Dynamic Range / Contrast Analysis (95th - 5th percentile)
        ref_contrast = float(np.percentile(ref_gray, 95) - np.percentile(ref_gray, 5))
        src_contrast = float(np.percentile(src_gray, 95) - np.percentile(src_gray, 5))
        min_contrast = min(ref_contrast, src_contrast)

        # Texture Variance (Laplacian variance)
        ref_tex = self._get_texture_variance(ref_img)
        src_tex = self._get_texture_variance(src_img)
        avg_tex = (ref_tex + src_tex) / 2.0

        if avg_tex < 300:
            texture = "LOW"
        elif avg_tex > 1500:
            texture = "HIGH"
        else:
            texture = "MODERATE"

        # Feature Density (FAST keypoints)
        ref_feat = self._get_feature_density(ref_img)
        src_feat = self._get_feature_density(src_img)
        avg_feat = (ref_feat + src_feat) / 2.0

        if avg_feat < 500:
            feat_den = "LOW"
        elif avg_feat > 3000:
            feat_den = "HIGH"
        else:
            feat_den = "MODERATE"

        # Dynamic Preprocessing Recommendation
        if shadow_coverage > 20.0 or ill_diff_val > 45.0:
            recommended_prep = "P6_ILLUMINATION_CLAHE"
            prep_name = "P6 - Illumination + CLAHE"
            prep_reason = f"High illumination offset (Δ={ill_diff_val:.1f} DN) and deep crater shadows ({shadow_coverage:.1f}%). Homomorphic division + CLAHE normalizes steep shadows while preserving crater rim relief."
        elif area_ratio > 1.35 or (ill_diff_val > 25.0 and avg_tex > 700):
            recommended_prep = "P4_HYBRID"
            prep_name = "P4 - HYBRID (NORM + GRADIENT + ILLU + CLAHE)"
            prep_reason = f"Multi-sensor / cross-resolution pair ({res_str}) with strong structural features. Sequential 4-stage hybrid preprocessing (Norm + Gradient + Illumination + CLAHE) ensures maximum invariant keypoint repeatability."
        elif min_contrast < 65.0 or avg_tex < 300:
            recommended_prep = "P5_CLAHE"
            prep_name = "P5 - CLAHE Enhanced"
            prep_reason = f"Low dynamic contrast (range={min_contrast:.1f}) in smooth lunar mare. Contrast Limited Adaptive Histogram Equalization sharpens subtle surface topography."
        elif ill_diff_val > 15.0:
            recommended_prep = "P2_ILLUMINATION_CORRECTED"
            prep_name = "P2 - Illumination Corrected"
            prep_reason = f"Uneven solar incidence gradient detected across frame (Δ={ill_diff_val:.1f} DN). Gaussian background division equalizes regional albedo."
        else:
            recommended_prep = "P1_ROBUST_NORMALIZED"
            prep_name = "P1 - Robust Normalized"
            prep_reason = "Even illumination and well-defined lunar crater landmarks. 1st-99th percentile normalization eliminates detector spikes without distorting natural geometry."

        # Dynamic Matching Method Recommendation
        difficulty = "MEDIUM"
        if texture == "LOW" or feat_den == "LOW":
            method = "LoFTR"
            method_reason = "Low crater texture/sparse features detected. LoFTR semi-dense transformer resolves correspondences across smooth lunar mare without explicit keypoint detection."
            difficulty = "HARD"
        elif res_diff == "HIGH":
            method = "SuperPoint + LightGlue"
            method_reason = f"Significant scale/resolution difference ({res_str}). SuperPoint + LightGlue graph neural network achieves optimal scale invariance."
            difficulty = "HARD"
        elif ill_diff == "HIGH" or shadow_coverage > 35.0:
            method = "RIFT2 (Phase Congruency)"
            method_reason = "Extreme illumination angle disparity (>35% shadow shift). Log-Gabor phase congruency frequency analysis is invariant to solar illumination changes."
            difficulty = "HARD"
        else:
            method = "SuperPoint + LightGlue"
            method_reason = "Standard lunar lighting with distinct crater landmarks; deep learned LightGlue provides high inlier precision."
            difficulty = "EASY"

        return {
            "illumination_difference": ill_diff,
            "illumination_delta": round(ill_diff_val, 1),
            "texture": texture,
            "texture_variance": round(avg_tex, 1),
            "shadow_coverage": shadow_coverage,
            "resolution_difference": res_str,
            "feature_density": feat_den,
            "overall_difficulty": difficulty,
            "recommended_method": method,
            "recommended_preprocessing": recommended_prep,
            "recommended_preprocessing_name": prep_name,
            "preprocessing_reason": prep_reason,
            "reason": f"{method_reason} Preprocessing: {prep_reason}"
        }
