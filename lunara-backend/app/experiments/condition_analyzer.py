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

        # Resolution Difference
        ref_area = ref_img.shape[0] * ref_img.shape[1]
        src_area = src_img.shape[0] * src_img.shape[1]
        area_ratio = max(ref_area, src_area) / min(ref_area, src_area)
        
        if area_ratio > 2.0:
            res_diff = "HIGH"
        elif area_ratio > 1.2:
            res_diff = "MODERATE"
        else:
            res_diff = "LOW"
            
        res_str = f"{area_ratio:.1f}x"

        # Illumination Difference
        ref_ill = self._get_illumination(ref_img)
        src_ill = self._get_illumination(src_img)
        ill_diff_val = abs(ref_ill - src_ill)

        if ill_diff_val > 60:
            ill_diff = "HIGH"
        elif ill_diff_val > 25:
            ill_diff = "MODERATE"
        else:
            ill_diff = "LOW"

        # Texture Variance
        ref_tex = self._get_texture_variance(ref_img)
        src_tex = self._get_texture_variance(src_img)
        avg_tex = (ref_tex + src_tex) / 2.0

        if avg_tex < 300:
            texture = "LOW"
        elif avg_tex > 1500:
            texture = "HIGH"
        else:
            texture = "MODERATE"

        # Feature Density
        ref_feat = self._get_feature_density(ref_img)
        src_feat = self._get_feature_density(src_img)
        avg_feat = (ref_feat + src_feat) / 2.0

        if avg_feat < 500:
            feat_den = "LOW"
        elif avg_feat > 3000:
            feat_den = "HIGH"
        else:
            feat_den = "MODERATE"
            
        # Recommendation Logic
        reasons = []
        method = "SuperPoint + LightGlue" # Default fallback
        difficulty = "MEDIUM"

        if texture == "LOW" or feat_den == "LOW":
            method = "LoFTR"
            reasons.append("Low texture/feature density detected (LoFTR excels here)")
            difficulty = "HARD"
        elif res_diff == "HIGH":
            method = "SuperPoint + LightGlue"
            reasons.append(f"Significant scale difference ({res_str}) requires scale-invariant features")
            difficulty = "HARD"
        elif ill_diff == "HIGH":
            # In the future, this could recommend RIFT2
            method = "SuperPoint + LightGlue" 
            reasons.append("High illumination difference detected (requires robust descriptors)")
            difficulty = "HARD"
        else:
            reasons.append("Standard matching conditions")
            difficulty = "EASY"

        return {
            "illumination_difference": ill_diff,
            "texture": texture,
            "shadow_coverage": min(int((ill_diff_val / 255.0) * 100), 100), # Rough proxy for now
            "resolution_difference": res_str,
            "feature_density": feat_den,
            "overall_difficulty": difficulty,
            "recommended_method": method,
            "reason": ". ".join(reasons)
        }
