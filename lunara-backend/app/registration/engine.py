import cv2
import numpy as np

class RegistrationEngine:
    def register(self, source_image, target_shape, transformation_matrix, model="affine"):
        # source_image is the image to be warped
        # target_shape is (height, width) of the reference image
        h, w = target_shape[:2]
        
        if model == "affine":
            # Extract 2x3 matrix from 3x3
            M = transformation_matrix[:2, :]
            registered = cv2.warpAffine(source_image, M, (w, h))
        elif model == "homography":
            registered = cv2.warpPerspective(source_image, transformation_matrix, (w, h))
        else:
            raise ValueError(f"Unknown transformation model: {model}")
            
        return registered
