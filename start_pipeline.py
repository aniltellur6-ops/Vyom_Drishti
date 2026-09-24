import subprocess
import re
import requests
import os
import threading
import sys

# ==========================================
# CONFIGURATION
# ==========================================
# Update this to your deployed Vercel URL
VERCEL_REGISTER_URL = os.environ.get("VERCEL_REGISTER_URL", "https://your-vercel-project.vercel.app/api/register")
# Update this to your secret token
SECRET = os.environ.get("SECRET", "my-super-secret-token")

def monitor_tunnel():
    print("Starting Cloudflare Tunnel...")
    # using npx.cmd for Windows support
    process = subprocess.Popen(
        ["npx.cmd", "-y", "cloudflared", "tunnel", "--url", "http://127.0.0.1:8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    
    url_found = False
    for line in iter(process.stdout.readline, ''):
        print(f"[Tunnel] {line.strip()}")
        if not url_found:
            match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
            if match:
                tunnel_url = match.group(0)
                print(f"\n=============================================")
                print(f"[*] NEW CLOUDFLARE URL GENERATED: {tunnel_url}")
                print(f"=============================================\n")
                url_found = True
                
                # Register with Vercel (Step 3 workaround)
                if "your-vercel-project" not in VERCEL_REGISTER_URL:
                    try:
                        print(f"[*] Registering URL with Vercel API...")
                        res = requests.post(
                            VERCEL_REGISTER_URL,
                            json={"url": tunnel_url},
                            headers={"Authorization": f"Bearer {SECRET}"},
                            timeout=10
                        )
                        print(f"[*] Vercel Response: {res.status_code} - {res.text}")
                    except Exception as e:
                        print(f"[*] Failed to register URL: {e}")

    process.wait()

if __name__ == "__main__":
    # 1. Start the cloudflare tunnel in the background
    t = threading.Thread(target=monitor_tunnel, daemon=True)
    t.start()
    
    # 2. Start the FastAPI backend in the main thread
    print("Starting FastAPI Backend...")
    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])
    except KeyboardInterrupt:
        print("\nShutting down pipeline...")
