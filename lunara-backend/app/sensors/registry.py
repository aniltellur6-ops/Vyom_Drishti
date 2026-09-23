from typing import Dict, Optional
from app.sensors.models import SensorConfig

class SensorRegistry:
    """Registry to manage supported lunar sensors and their preprocessing configurations."""
    
    def __init__(self):
        self._configs: Dict[str, SensorConfig] = {}
        self._register_defaults()
        
    def _register_defaults(self):
        # OHRC: High-res, often needs strong illumination correction
        self.register(SensorConfig(
            name="OHRC",
            default_preprocessing_method="P6_ILLUMINATION_CLAHE",
            preferred_clahe_clip_limit=3.0,
            preferred_tile_grid_size=(8, 8)
        ))
        
        # TMC-2: Terrain Mapping Camera, moderate illumination correction
        self.register(SensorConfig(
            name="TMC-2",
            default_preprocessing_method="P5_CLAHE",
            preferred_clahe_clip_limit=2.0,
            preferred_tile_grid_size=(8, 8)
        ))
        
        # IIRS: Imaging Infra-Red Spectrometer, needs strong normalization due to spectral nature
        self.register(SensorConfig(
            name="IIRS",
            default_preprocessing_method="P2_PERCENTILE",
            preferred_clahe_clip_limit=1.5,
            preferred_tile_grid_size=(16, 16)
        ))
        
        # LROC NAC: High resolution, similar to OHRC
        self.register(SensorConfig(
            name="LROC_NAC",
            default_preprocessing_method="P6_ILLUMINATION_CLAHE",
            preferred_clahe_clip_limit=2.5,
            preferred_tile_grid_size=(8, 8)
        ))
        
    def register(self, config: SensorConfig):
        self._configs[config.name.upper()] = config
        
    def get(self, sensor_name: str) -> Optional[SensorConfig]:
        if not sensor_name:
            return None
        return self._configs.get(sensor_name.upper())

    def get_default_method(self, sensor_name: str) -> str:
        """Returns the recommended preprocessing string for a given sensor."""
        config = self.get(sensor_name)
        if config:
            return config.default_preprocessing_method
        return "P0_RAW" # Fallback if unknown sensor

# Global singleton instance
sensor_registry = SensorRegistry()
