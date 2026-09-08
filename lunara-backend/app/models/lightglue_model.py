import torch
from lightglue import LightGlue, SuperPoint, DISK, SIFT, ALIKED

class LightGlueModel:
    def __init__(self, config: dict):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Determine extractor type from config
        extractor_type = config.get("extractor", "superpoint").lower()
        max_num_keypoints = config.get("max_num_keypoints", 2048)
        filter_threshold = config.get("filter_threshold", 0.1)
        
        if extractor_type == "superpoint":
            self.extractor = SuperPoint(max_num_keypoints=max_num_keypoints).eval().to(self.device)
        elif extractor_type == "sift":
            self.extractor = SIFT(max_num_keypoints=max_num_keypoints).eval().to(self.device)
        elif extractor_type == "disk":
            self.extractor = DISK(max_num_keypoints=max_num_keypoints).eval().to(self.device)
        elif extractor_type == "aliked":
            self.extractor = ALIKED(max_num_keypoints=max_num_keypoints).eval().to(self.device)
        else:
            raise ValueError(f"Unknown extractor: {extractor_type}")
            
        self.matcher = LightGlue(features=extractor_type, filter_threshold=filter_threshold).eval().to(self.device)

    def extract(self, image: torch.Tensor):
        # image should be a tensor [1, C, H, W] or [C, H, W]
        if image.dim() == 3:
            image = image.unsqueeze(0)
        return self.extractor.extract(image.to(self.device))

    def match(self, features_a, features_b):
        return self.matcher({"image0": features_a, "image1": features_b})
        
    def match_images(self, image_a: torch.Tensor, image_b: torch.Tensor):
        features_a = self.extract(image_a)
        features_b = self.extract(image_b)
        matches = self.match(features_a, features_b)
        return features_a, features_b, matches
