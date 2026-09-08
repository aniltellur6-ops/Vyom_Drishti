import numpy as np

class MatchFilter:
    def __init__(self, confidence_threshold=0.0):
        self.confidence_threshold = confidence_threshold

    def filter_matches(self, match_result) -> np.ndarray:
        """
        Returns a boolean mask of valid matches.
        """
        if match_result.num_matches == 0:
            return np.array([], dtype=bool)
            
        # By default, keep all matches since deep matchers already filter internally.
        # But we can apply an explicit threshold if we have confidence scores.
        mask = np.ones(match_result.num_matches, dtype=bool)
        
        # If the matcher provides a way to filter, do it here. 
        # For now, it just passes them through.
        return mask
