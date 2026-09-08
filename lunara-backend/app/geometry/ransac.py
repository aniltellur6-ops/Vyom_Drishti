import cv2
import numpy as np
from dataclasses import dataclass

@dataclass
class GeometryResult:
    transformation_matrix: np.ndarray
    inlier_mask: np.ndarray
    num_inliers: int
    num_outliers: int
    inlier_ratio: float
    rmse: float
    median_error: float

class GeometricVerifier:
    def verify(self, keypoints_a, keypoints_b, matches, model="affine"):
        if len(matches) < 4:
            raise ValueError("Not enough matches to compute transformation")
            
        src_pts = keypoints_a[matches[:, 0]].astype(np.float32)
        dst_pts = keypoints_b[matches[:, 1]].astype(np.float32)
        
        if model == "homography":
            M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 3.0)
        elif model == "affine":
            M, mask = cv2.estimateAffinePartial2D(src_pts, dst_pts, method=cv2.RANSAC, ransacReprojThreshold=3.0)
            if M is not None:
                # Convert 2x3 to 3x3 for consistency
                M = np.vstack([M, [0, 0, 1]])
        else:
            raise ValueError(f"Unknown transformation model: {model}")
            
        if M is None:
            return None
            
        inlier_mask = mask.ravel().astype(bool)
        num_inliers = np.sum(inlier_mask)
        num_outliers = len(inlier_mask) - num_inliers
        inlier_ratio = num_inliers / len(matches) if len(matches) > 0 else 0
        
        # Calculate RMSE on inliers
        src_inliers = src_pts[inlier_mask]
        dst_inliers = dst_pts[inlier_mask]
        
        if len(src_inliers) > 0:
            if model == "affine":
                src_inliers_hom = np.hstack([src_inliers, np.ones((len(src_inliers), 1))])
                transformed = (M[:2, :] @ src_inliers_hom.T).T
            else:
                # Homography
                src_inliers_hom = np.hstack([src_inliers, np.ones((len(src_inliers), 1))])
                transformed_hom = (M @ src_inliers_hom.T).T
                transformed = transformed_hom[:, :2] / transformed_hom[:, 2:]
                
            errors = np.linalg.norm(transformed - dst_inliers, axis=1)
            rmse = float(np.sqrt(np.mean(errors**2)))
            median_error = float(np.median(errors))
        else:
            rmse = 0.0
            median_error = 0.0
            
        return GeometryResult(
            transformation_matrix=M,
            inlier_mask=inlier_mask,
            num_inliers=int(num_inliers),
            num_outliers=int(num_outliers),
            inlier_ratio=float(inlier_ratio),
            rmse=rmse,
            median_error=median_error
        )
