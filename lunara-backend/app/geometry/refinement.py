import cv2
import numpy as np

class SpatialValidator:
    def validate(self, transformation_matrix: np.ndarray, model: str = "affine") -> bool:
        """
        Validates if the resulting geometric transformation is physically plausible.
        """
        if transformation_matrix is None:
            return False
            
        if model == "affine":
            # Extract 2x2 linear mapping part
            M = transformation_matrix[:2, :2]
            det = np.linalg.det(M)
            
            # Determinant shouldn't be negative (reflection) or extreme
            if det < 0.1 or det > 10.0:
                return False
                
        elif model == "homography":
            # Just check determinant of top-left 2x2 for homography too
            M = transformation_matrix[:2, :2]
            det = np.linalg.det(M)
            if det < 0.01 or det > 100.0:
                return False
                
        return True

class SubpixelRefiner:
    def refine_ecc(self, image_a_cv: np.ndarray, image_b_cv: np.ndarray, init_matrix: np.ndarray, model: str = "affine"):
        """
        Optimizes the transformation matrix using Enhanced Correlation Coefficient (ECC) Maximization.
        image_a: Reference image (the one we align TO)
        image_b: Source image (the one we align)
        """
        try:
            # Setup ECC criteria
            number_of_iterations = 50
            termination_eps = 1e-4
            criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, number_of_iterations, termination_eps)
            
            if model == "affine":
                warp_mode = cv2.MOTION_AFFINE
                warp_matrix = init_matrix[:2, :].astype(np.float32)
            elif model == "homography":
                warp_mode = cv2.MOTION_HOMOGRAPHY
                warp_matrix = init_matrix.astype(np.float32)
            else:
                return init_matrix

            # Run ECC
            (cc, refined_matrix) = cv2.findTransformECC(
                image_b_cv, 
                image_a_cv, 
                warp_matrix, 
                warp_mode, 
                criteria,
                None,
                1 # Gaussian blur size for smoothing before ECC
            )
            
            if model == "affine":
                # Convert back to 3x3 if affine
                M = np.vstack([refined_matrix, [0, 0, 1]])
                return M
            return refined_matrix
            
        except Exception as e:
            print(f"ECC Refinement failed: {e}")
            return init_matrix
