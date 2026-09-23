from dataclasses import dataclass
import numpy as np
from typing import Optional, Any

@dataclass
class MatchingResult:
    method: str

    keypoints_a: np.ndarray
    keypoints_b: np.ndarray

    matches: np.ndarray

    confidence: Optional[np.ndarray]

    num_keypoints_a: int
    num_keypoints_b: int

    num_matches: int
    runtime_seconds: float

@dataclass
class AlgorithmResult:
    status: str
    method_used: str
    registered_image: Optional[np.ndarray]
    match_result: Optional[MatchingResult]
    geo_result: Optional[Any]
    refined_matrix: Optional[np.ndarray]
    metrics: dict
    preprocessing_metadata: dict
    failure_reason: Optional[str] = None
