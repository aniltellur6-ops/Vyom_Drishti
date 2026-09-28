import subprocess
import re
import requests
import os
import threading
import sys
import time

# Windows flag to hide terminal popup windows for child processes
CREATE_NO_WINDOW = 0x08000000 if os.name == 'nt' else 0

# ==========================================
# CONFIGURATION
# ==========================================
# Update this to your deployed Vercel URL
VERCEL_REGISTER_URL = os.environ.get("VERCEL_REGISTER_URL", "https://vyom-drishti.vercel.app/api/register")
# Update this to your secret token
SECRET = os.environ.get("SECRET", "Sih@26166")

def monitor_tunnel():
    while True:
        try:
            print("[Tunnel] Starting Cloudflare Tunnel...")
            # using npx.cmd for Windows support
            process = subprocess.Popen(
                ["npx.cmd", "-y", "cloudflared", "tunnel", "--url", "http://127.0.0.1:8000"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace',
                creationflags=CREATE_NO_WINDOW
            )
            
            url_found = False
            for line in iter(process.stdout.readline, ''):
                clean_line = line.strip()
                print(f"[Tunnel] {clean_line}")

                # If Cloudflare edge revokes the quick tunnel, terminate so loop provisions a fresh one
                if "Unauthorized: Tunnel not found" in clean_line or "control stream error" in clean_line:
                    print("[Tunnel] Detected revoked tunnel session. Killing dead process to request a new session...")
                    try:
                        process.kill()
                    except Exception:
                        pass
                    break

                if not url_found:
                    match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', clean_line)
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
        except Exception as e:
            print(f"[Tunnel] Monitor error: {e}")

        print("[Tunnel] Cloudflared exited or was terminated. Spawning fresh tunnel in 3 seconds...")
        time.sleep(3)

if __name__ == "__main__":
    # 1. Start the cloudflare tunnel in the background
    t = threading.Thread(target=monitor_tunnel, daemon=True)
    t.start()
    
    # 2. Start the FastAPI backend in the main thread
    print("Starting FastAPI Backend...")
    try:
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
            creationflags=CREATE_NO_WINDOW,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
    except KeyboardInterrupt:
        print("\nShutting down pipeline...")
