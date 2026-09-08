import requests
import os

API_URL = "http://localhost:8000/api/v1/match"
PAIRS_DIR = "d:/PROJECT/ALL PROJECTS/SIH 2k26/SIH_DL_Pair001/SIH_DL_Pair001"

experiments = [
    {
        "name": "01_normalized",
        "ref": "01_normalized/reference_lroc.png",
        "src": "01_normalized/moving_ohrc_normalized.png",
        "prefix": "norm"
    },
    {
        "name": "02_clahe",
        "ref": "02_clahe/reference_lroc_clahe.png",
        "src": "02_clahe/moving_ohrc_clahe.png",
        "prefix": "clahe"
    },
    {
        "name": "03_structure_gradient",
        "ref": "03_structure_gradient/reference_lroc_gradient.png",
        "src": "03_structure_gradient/moving_ohrc_structural.png",
        "prefix": "struct"
    }
]

def run_tests():
    for exp in experiments:
        print(f"Running pipeline test for: {exp['name']}")
        
        ref_path = os.path.join(PAIRS_DIR, exp['ref'])
        src_path = os.path.join(PAIRS_DIR, exp['src'])
        
        if not os.path.exists(ref_path) or not os.path.exists(src_path):
            print(f"Error: Could not find images for {exp['name']}")
            print(f"Ref: {ref_path}")
            print(f"Src: {src_path}")
            continue
            
        with open(ref_path, 'rb') as ref_f, open(src_path, 'rb') as src_f:
            files = {
                'reference_img': ref_f,
                'source_img': src_f
            }
            data = {
                'prefix': exp['prefix'],
                'conf_thresh': 0.0
            }
            
            try:
                response = requests.post(API_URL, files=files, data=data)
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"Success! Job ID: {result['job_id']}")
                    print(f"Metrics: {result.get('metrics')}")
                else:
                    print(f"Failed with status {response.status_code}: {response.text}")
            except Exception as e:
                print(f"Request failed: {e}")
                
if __name__ == '__main__':
    run_tests()
