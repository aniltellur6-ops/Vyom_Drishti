from dataclasses import dataclass, field
from typing import Optional, Dict, Any

@dataclass
class SensorMetadata:
    sensor_name: str
    mission: Optional[str] = None
    resolution: Optional[float] = None
    projection: Optional[str] = None
    acquisition_time: Optional[str] = None
    sun_angle: Optional[float] = None
    scale: Optional[float] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    valid_data: Optional[bool] = None

@dataclass
class SensorConfig:
    """Base configuration for a sensor's preferred preprocessing profile."""
    name: str
    default_preprocessing_method: str = "P6_ILLUMINATION_CLAHE"
    preferred_clahe_clip_limit: float = 2.0
    preferred_tile_grid_size: tuple[int, int] = (8, 8)
    # Any other sensor specific parameters can be added here
    extra_params: Dict[str, Any] = field(default_factory=dict)
