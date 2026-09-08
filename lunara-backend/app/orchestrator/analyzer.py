import cv2
import numpy as np

class ConditionAnalyzer:
    def analyze(self, image_a_cv: np.ndarray, image_b_cv: np.ndarray) -> dict:
        """
        Analyzes image conditions such as contrast, brightness, and noise.
        """
        conditions = {}
        
        # Simple brightness/contrast metrics
        mean_a, std_a = cv2.meanStdDev(image_a_cv)
        mean_b, std_b = cv2.meanStdDev(image_b_cv)
        
        conditions['mean_brightness'] = float((mean_a[0][0] + mean_b[0][0]) / 2.0)
        conditions['contrast'] = float((std_a[0][0] + std_b[0][0]) / 2.0)
        
        # Check illumination variance
        conditions['illumination_diff'] = float(abs(mean_a[0][0] - mean_b[0][0]))
        
        # High illumination diff might mean heavy shadow shifts
        conditions['high_shadow_shift'] = conditions['illumination_diff'] > 30.0
        
        # Low contrast might require LoFTR
        conditions['low_contrast'] = conditions['contrast'] < 40.0
        
        return conditions

class MethodRecommender:
    def recommend(self, conditions: dict) -> str:
        """
        Recommends a matcher based on analyzed conditions.
        Options: 'lightglue', 'sift', 'loftr', 'rift2'
        """
        # If contrast is very low, LoFTR shines (semi-dense transformer handles low texture)
        if conditions.get('low_contrast', False):
            return 'loftr'
            
        # If there's a heavy shadow shift, Phase Congruency (RIFT2) is best, but LightGlue is primary
        if conditions.get('high_shadow_shift', False):
            return 'rift2' # We will use RIFT2 if requested, else it will fallback
            
        # Default Primary method
        return 'lightglue'
