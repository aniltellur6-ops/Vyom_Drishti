import cv2
import numpy as np
import time
from app.matchers.base import MatcherInterface
from app.schemas.matching import MatchingResult

class SIFTMatcher(MatcherInterface):
    def __init__(self):
        self.sift = cv2.SIFT_create()
        # Using Flann-based matcher for SIFT
        index_params = dict(algorithm=1, trees=5) # FLANN_INDEX_KDTREE = 1
        search_params = dict(checks=50)
        self.matcher = cv2.FlannBasedMatcher(index_params, search_params)

    def match(self, image_a_path: str, image_b_path: str) -> MatchingResult:
        start_time = time.time()
        
        image_a = cv2.imread(image_a_path, cv2.IMREAD_GRAYSCALE)
        image_b = cv2.imread(image_b_path, cv2.IMREAD_GRAYSCALE)
        
        # 1. Extract SIFT features
        kp1, des1 = self.sift.detectAndCompute(image_a, None)
        kp2, des2 = self.sift.detectAndCompute(image_b, None)
        
        # Return empty if not enough keypoints
        if not kp1 or not kp2 or len(kp1) < 2 or len(kp2) < 2:
            return MatchingResult(
                method="sift",
                keypoints_a=np.empty((0, 2)),
                keypoints_b=np.empty((0, 2)),
                matches=np.empty((0, 2), dtype=int)
            )

        # 2. FLANN Matching
        matches = self.matcher.knnMatch(des1, des2, k=2)
        
        # 3. Lowe's Ratio Test
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append([m.queryIdx, m.trainIdx])
                
        matches_array = np.array(good_matches)
        
        # Format keypoints
        kpts0 = np.array([kp.pt for kp in kp1])
        kpts1 = np.array([kp.pt for kp in kp2])
        
        return MatchingResult(
            method="sift",
            keypoints_a=kpts0,
            keypoints_b=kpts1,
            matches=matches_array
        )
