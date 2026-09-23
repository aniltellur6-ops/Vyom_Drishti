from __future__ import annotations

import os
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Literal, Optional
import json
import uuid

import cv2
import numpy as np

from app.sensors.models import SensorMetadata
from app.sensors.registry import sensor_registry


# =============================================================================
# FROZEN PREPROCESSING PARAMETERS
# =============================================================================

LOW_PERCENTILE = 1.0
HIGH_PERCENTILE = 99.0

ILLUMINATION_SIGMA = 20.0

CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID_SIZE = (
    8,
    8,
)

EPSILON = 1e-6


# =============================================================================
# REPRESENTATIONS
# =============================================================================

RepresentationName = Literal[
    "P0_RAW",
    "P1_ROBUST_NORMALIZED",
    "P2_ILLUMINATION_CORRECTED",
    "P3_GRADIENT",
    "P4_COMBINED",
    "P5_CLAHE",
    "P6_ILLUMINATION_CLAHE",
    "AUTO",
]


ALL_REPRESENTATIONS = [
    "P0_RAW",
    "P1_ROBUST_NORMALIZED",
    "P2_ILLUMINATION_CORRECTED",
    "P3_GRADIENT",
    "P4_COMBINED",
    "P5_CLAHE",
    "P6_ILLUMINATION_CLAHE",
    "AUTO",
]

# =============================================================================
# DATA STRUCTURES
# =============================================================================

@dataclass(frozen=True)
class PreprocessingConfig:
    low_percentile: float = LOW_PERCENTILE
    high_percentile: float = HIGH_PERCENTILE
    illumination_sigma: float = ILLUMINATION_SIGMA
    clahe_clip_limit: float = CLAHE_CLIP_LIMIT
    clahe_tile_grid_size: tuple[int, int] = CLAHE_TILE_GRID_SIZE
    resampling: str = "NONE"

@dataclass
class ProcessedPair:
    pair_id: str
    representation: str
    moving_image: np.ndarray
    reference_image: np.ndarray
    moving_mask: Optional[np.ndarray] = None
    reference_mask: Optional[np.ndarray] = None
    moving_sensor: Optional[SensorMetadata] = None
    reference_sensor: Optional[SensorMetadata] = None
    preprocessing_metadata: dict = field(default_factory=dict)


def validate_gray_uint8(image: np.ndarray, name: str = "image") -> None:
    if not isinstance(image, np.ndarray):
        raise TypeError(f"{name} must be a numpy.ndarray.")
    if image.ndim != 2:
        raise ValueError(f"{name} must be a single-channel grayscale image. Shape: {image.shape}")
    if image.dtype != np.uint8:
        raise ValueError(f"{name} must be uint8. Got: {image.dtype}")

def robust_normalize(image: np.ndarray, config: PreprocessingConfig) -> np.ndarray:
    validate_gray_uint8(image, "image")
    image_f = image.astype(np.float32)
    low = float(np.percentile(image_f, config.low_percentile))
    high = float(np.percentile(image_f, config.high_percentile))
    if high <= low:
        return np.zeros_like(image, dtype=np.uint8)
    normalized = (image_f - low) / (high - low)
    normalized = np.clip(normalized, 0.0, 1.0)
    return np.round(normalized * 255.0).astype(np.uint8)

def illumination_correct(image: np.ndarray, config: PreprocessingConfig) -> np.ndarray:
    validate_gray_uint8(image, "image")
    image_f = image.astype(np.float32) + 1.0
    background = cv2.GaussianBlur(
        image_f, ksize=(0, 0), sigmaX=config.illumination_sigma, sigmaY=config.illumination_sigma, borderType=cv2.BORDER_REFLECT
    )
    corrected = image_f / np.maximum(background, EPSILON)
    low = float(np.percentile(corrected, config.low_percentile))
    high = float(np.percentile(corrected, config.high_percentile))
    if high <= low:
        return np.zeros_like(image, dtype=np.uint8)
    corrected = (corrected - low) / (high - low)
    corrected = np.clip(corrected, 0.0, 1.0)
    return np.round(corrected * 255.0).astype(np.uint8)

def gradient_magnitude(image: np.ndarray, config: PreprocessingConfig) -> np.ndarray:
    validate_gray_uint8(image, "image")
    image_f = image.astype(np.float32)
    gx = cv2.Sobel(image_f, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(image_f, cv2.CV_32F, 0, 1, ksize=3)
    magnitude = cv2.magnitude(gx, gy)
    low = float(np.percentile(magnitude, config.low_percentile))
    high = float(np.percentile(magnitude, config.high_percentile))
    if high <= low:
        return np.zeros_like(image, dtype=np.uint8)
    magnitude = (magnitude - low) / (high - low)
    magnitude = np.clip(magnitude, 0.0, 1.0)
    return np.round(magnitude * 255.0).astype(np.uint8)

def clahe_enhance(image: np.ndarray, config: PreprocessingConfig) -> np.ndarray:
    validate_gray_uint8(image, "image")
    clahe = cv2.createCLAHE(clipLimit=config.clahe_clip_limit, tileGridSize=config.clahe_tile_grid_size)
    return clahe.apply(image)

def image_statistics(image: np.ndarray) -> dict:
    validate_gray_uint8(image, "image")
    image_f = image.astype(np.float32)
    return {
        "shape": [int(image.shape[0]), int(image.shape[1])],
        "min": int(image.min()),
        "max": int(image.max()),
        "mean": float(image_f.mean()),
        "std": float(image_f.std()),
        "dark_fraction": float(np.mean(image <= 5)),
        "high_fraction": float(np.mean(image >= 250)),
    }

def representation_metadata(name: str, config: PreprocessingConfig) -> dict:
    common = {
        "representation": name,
        "resampling": config.resampling,
    }
    if name == "P0_RAW":
        return {**common, "method": "raw"}
    if name == "P1_ROBUST_NORMALIZED":
        return {**common, "method": "percentile_normalization"}
    if name == "P2_ILLUMINATION_CORRECTED":
        return {**common, "method": "division_by_gaussian_background"}
    if name == "P3_GRADIENT":
        return {**common, "method": "gradient_magnitude"}
    if name == "P4_COMBINED":
        return {**common, "method": "normalization+illumination_correction+gradient_magnitude"}
    if name == "P5_CLAHE":
        return {**common, "method": "CLAHE"}
    if name == "P6_ILLUMINATION_CLAHE":
        return {**common, "method": "illumination_correction+CLAHE"}
    raise ValueError(f"Unknown representation: {name}")

def preprocess_image(image: np.ndarray, representation: RepresentationName, config: PreprocessingConfig | None = None) -> np.ndarray:
    validate_gray_uint8(image, "input image")
    if config is None:
        config = PreprocessingConfig()
        
    if representation == "P0_RAW":
        return image.copy()
    if representation == "P1_ROBUST_NORMALIZED":
        return robust_normalize(image, config)
    if representation == "P2_ILLUMINATION_CORRECTED":
        return illumination_correct(image, config)
    if representation == "P3_GRADIENT":
        return gradient_magnitude(image, config)
    if representation == "P4_COMBINED":
        normalized = robust_normalize(image, config)
        corrected = illumination_correct(normalized, config)
        return gradient_magnitude(corrected, config)
    if representation == "P5_CLAHE":
        return clahe_enhance(image, config)
    if representation == "P6_ILLUMINATION_CLAHE":
        corrected = illumination_correct(image, config)
        return clahe_enhance(corrected, config)
        
    raise ValueError(f"Unknown representation: {representation}")

def preprocess_pair(
    moving: np.ndarray, 
    reference: np.ndarray, 
    pair_id: str, 
    representation: str = "AUTO", 
    config: PreprocessingConfig | None = None,
    moving_sensor: Optional[SensorMetadata] = None,
    reference_sensor: Optional[SensorMetadata] = None
) -> ProcessedPair:
    validate_gray_uint8(moving, "moving")
    validate_gray_uint8(reference, "reference")
    
    # Handle AUTO representation based on sensor registry
    actual_representation = representation
    if representation == "AUTO":
        if moving_sensor and moving_sensor.sensor_name:
            actual_representation = sensor_registry.get_default_method(moving_sensor.sensor_name)
        elif reference_sensor and reference_sensor.sensor_name:
            actual_representation = sensor_registry.get_default_method(reference_sensor.sensor_name)
        else:
            actual_representation = "P6_ILLUMINATION_CLAHE"
            
    if config is None:
        config = PreprocessingConfig()

    moving_output = preprocess_image(moving, actual_representation, config)
    reference_output = preprocess_image(reference, actual_representation, config)

    metadata = {
        "pair_id": pair_id,
        "preprocessing": representation_metadata(actual_representation, config),
        "moving_statistics": image_statistics(moving_output),
        "reference_statistics": image_statistics(reference_output),
    }

    return ProcessedPair(
        pair_id=pair_id,
        representation=actual_representation,
        moving_image=moving_output,
        reference_image=reference_output,
        moving_mask=None,
        reference_mask=None,
        moving_sensor=moving_sensor,
        reference_sensor=reference_sensor,
        preprocessing_metadata=metadata,
    )
