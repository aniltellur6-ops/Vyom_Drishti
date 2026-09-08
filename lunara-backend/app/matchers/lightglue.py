import time
import numpy as np
from app.matchers.base import MatcherInterface
from app.schemas.matching import MatchingResult

class LightGlueMatcher(MatcherInterface):
    def __init__(self, model):
        self.model = model

    def match(self, image_a_path: str, image_b_path: str) -> MatchingResult:
        import time
        from lightglue.utils import load_image, rbd
        start_time = time.time()
        
        # 1. Extract features and match
        image_a = load_image(image_a_path)
        image_b = load_image(image_b_path)
        
        # If model expects it on device, move it
        device = next(self.model.parameters()).device
        image_a = image_a.to(device)
        image_b = image_b.to(device)
        
        features_a, features_b, matches_output = self.model.match_images(image_a, image_b)
        
        # Remove batch dimension using rbd (remove batch dimension)
        features_a, features_b, matches_output = [rbd(x) for x in [features_a, features_b, matches_output]]
        
        kpts0 = features_a["keypoints"].detach().cpu().numpy()
        kpts1 = features_b["keypoints"].detach().cpu().numpy()
        
        matches_array = matches_output['matches'].detach().cpu().numpy()
        confidence = matches_output['scores'].detach().cpu().numpy()
        
        runtime = time.time() - start_time
        
        # 3. Convert to common MatchingResult
        return MatchingResult(
            method="lightglue",
            keypoints_a=kpts0,
            keypoints_b=kpts1,
            matches=matches_array,
            confidence=confidence,
            num_keypoints_a=len(kpts0),
            num_keypoints_b=len(kpts1),
            num_matches=len(matches_array),
            runtime_seconds=runtime
        )
