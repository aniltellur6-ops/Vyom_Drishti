from abc import ABC, abstractmethod
from typing import Any
from app.schemas.matching import MatchingResult

class MatcherInterface(ABC):
    @abstractmethod
    def match(self, image_a: Any, image_b: Any) -> MatchingResult:
        pass
