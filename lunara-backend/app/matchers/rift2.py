import numpy as np
from app.matchers.base import MatcherInterface
from app.schemas.matching import MatchingResult

class RIFT2Matcher(MatcherInterface):
    """
    Python adapter for the RIFT2 Phase Congruency matcher.
    Currently acts as a placeholder to be connected to the actual RIFT2 python implementation.
    """
    def __init__(self):
        pass

    def match(self, image_a_path: str, image_b_path: str) -> MatchingResult:
        # TODO: Import actual RIFT2 implementation and execute here.
        # import RIFT2
        # kpts1, kpts2, matches = RIFT2.match_images(image_a_path, image_b_path)
        
        # Placeholder returning empty
        print("RIFT2 is selected but the python module is not fully linked. Returning empty.")
        return MatchingResult(
            method="rift2",
            keypoints_a=np.empty((0, 2)),
            keypoints_b=np.empty((0, 2)),
            matches=np.empty((0, 2), dtype=int)
        )
