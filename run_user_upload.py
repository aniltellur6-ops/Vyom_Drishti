import requests
import os

API_URL = "http://localhost:8000/api/v1/match"
UPLOAD_DIR = r"C:\Users\SHRIYASH\.gemini\antigravity-ide\brain\0aea8478-3b48-439a-992b-f9950fa7af5a\.user_uploaded"

ref_path = os.path.join(UPLOAD_DIR, "media_1788759326739.jpg")
src_path = os.path.join(UPLOAD_DIR, "media_1788759308143.jpg")

def run():
    print("Running pipeline test for user uploaded images...")
    
    with open(ref_path, 'rb') as ref_f, open(src_path, 'rb') as src_f:
        files = {
            'reference_img': ('reference.png', ref_f, 'image/png'),
            'source_img': ('source.png', src_f, 'image/png')
        }
        data = {
            'prefix': 'user_upload',
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
    run()
