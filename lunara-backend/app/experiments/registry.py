import os
import json
from typing import Dict, List, Any
from datetime import datetime

class ExperimentRegistry:
    def __init__(self, jobs_dir: str = "jobs"):
        self.jobs_dir = jobs_dir
        self.registry_file = os.path.join(jobs_dir, "registry.json")
        os.makedirs(jobs_dir, exist_ok=True)
        self._ensure_registry_exists()

    def _ensure_registry_exists(self):
        if not os.path.exists(self.registry_file):
            with open(self.registry_file, 'w') as f:
                json.dump({"experiments": []}, f)

    def _read_registry(self) -> Dict[str, Any]:
        with open(self.registry_file, 'r') as f:
            return json.load(f)

    def _write_registry(self, data: Dict[str, Any]):
        with open(self.registry_file, 'w') as f:
            json.dump(data, f, indent=4)

    def record_experiment(self, job_id: str, method: str, status: str, metrics: Dict[str, Any]):
        data = self._read_registry()
        
        experiment = {
            "id": job_id,
            "name": f"EXP-{datetime.now().strftime('%Y-%m%d')}-{job_id[:4]}",
            "method": method,
            "status": status,
            "created_at": datetime.now().isoformat(),
            "metrics": {
                "inliers": metrics.get("inliers", 0),
                "inlier_ratio": metrics.get("inlier_ratio", 0.0),
                "rmse": metrics.get("rmse", 0.0),
                "coverage": metrics.get("coverage", 0.0),
                "runtime": metrics.get("runtime", 0.0)
            }
        }
        
        data["experiments"].append(experiment)
        self._write_registry(data)
        return experiment

    def get_experiments(self) -> List[Dict[str, Any]]:
        data = self._read_registry()
        # Return sorted by created_at descending
        return sorted(data["experiments"], key=lambda x: x["created_at"], reverse=True)
