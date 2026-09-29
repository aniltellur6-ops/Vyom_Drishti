import subprocess
import re
import requests
import os
import threading
import sys
import time
import socket
import glob
import shutil

# Windows flag to hide terminal popup windows for background child processes
CREATE_NO_WINDOW = 0x08000000 if os.name == 'nt' else 0

# ==========================================
# CONFIGURATION
# ==========================================
VERCEL_REGISTER_URL = os.environ.get("VERCEL_REGISTER_URL", "https://vyom-drishti.vercel.app/api/register")
SECRET = os.environ.get("SECRET", "Sih@26166")
LOCAL_BACKEND_PORT = 8000

CURRENT_TUNNEL_URL = None
SHUTDOWN_REQUESTED = False

def is_port_in_use(port=LOCAL_BACKEND_PORT):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_backend_healthy():
    try:
        r = requests.get(f"http://127.0.0.1:{LOCAL_BACKEND_PORT}/api/v1/system/status", timeout=2)
        return r.status_code == 200
    except Exception:
        return False

def find_cloudflared_binary():
    # 1. Check system PATH
    bin_path = shutil.which("cloudflared")
    if bin_path:
        return [bin_path]

    # 2. Check Windows npm cache
    user_profile = os.environ.get("USERPROFILE", "")
    if user_profile:
        pattern = os.path.join(user_profile, "AppData", "Local", "npm-cache", "_npx", "*", "node_modules", "cloudflared", "bin", "cloudflared.exe")
        matches = glob.glob(pattern)
        if matches and os.path.isfile(matches[0]):
            return [matches[0]]

    # 3. Fallback to npx.cmd on Windows, or npx on Unix
    npx_cmd = "npx.cmd" if os.name == 'nt' else "npx"
    return [npx_cmd, "-y", "cloudflared"]

def kill_tunnel_tree(proc=None):
    if proc:
        try:
            if os.name == 'nt':
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
            else:
                proc.kill()
        except Exception:
            pass
    if os.name == 'nt':
        try:
            subprocess.run(["taskkill", "/F", "/IM", "cloudflared.exe"], capture_output=True)
        except Exception:
            pass

def register_url_with_vercel(url):
    if not url:
        return False
    print(f"[*] Registering tunnel URL with Vercel API: {url}")
    for attempt in range(3):
        try:
            res = requests.post(
                VERCEL_REGISTER_URL,
                json={"url": url},
                headers={"Authorization": f"Bearer {SECRET}"},
                timeout=8
            )
            if res.status_code == 200:
                print(f"[+] Vercel Synced Successfully: {res.json()}")
                return True
            else:
                print(f"[!] Vercel returned status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[!] Attempt {attempt + 1} registration error: {e}")
            time.sleep(1.5)
    return False

def tunnel_heartbeat():
    """Periodically re-registers active tunnel URL with Vercel to prevent cache expiration"""
    global CURRENT_TUNNEL_URL, SHUTDOWN_REQUESTED
    while not SHUTDOWN_REQUESTED:
        time.sleep(30)
        if CURRENT_TUNNEL_URL:
            try:
                # Re-verify that tunnel is still responsive before refreshing
                r = requests.get(f"{CURRENT_TUNNEL_URL}/api/v1/system/status", timeout=8)
                if r.status_code == 200:
                    register_url_with_vercel(CURRENT_TUNNEL_URL)
            except Exception:
                pass

def monitor_tunnel():
    global CURRENT_TUNNEL_URL, SHUTDOWN_REQUESTED
    cmd_prefix = find_cloudflared_binary()
    print(f"[Tunnel] Using cloudflared runner: {' '.join(cmd_prefix)}")

    while not SHUTDOWN_REQUESTED:
        process = None
        try:
            print("[Tunnel] Cleaning any stale tunnel instances...")
            kill_tunnel_tree()
            time.sleep(1)

            # Wait briefly for backend to become responsive
            for _ in range(15):
                if check_backend_healthy():
                    break
                time.sleep(1)

            print("[Tunnel] Starting Cloudflare Tunnel...")
            cmd = cmd_prefix + ["tunnel", "--url", f"http://127.0.0.1:{LOCAL_BACKEND_PORT}"]
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace',
                creationflags=CREATE_NO_WINDOW
            )
            
            url_found = False
            for line in iter(process.stdout.readline, ''):
                if SHUTDOWN_REQUESTED:
                    break
                clean_line = line.strip()
                if clean_line:
                    # Filter noisy logs
                    if any(k in clean_line.lower() for k in ["trycloudflare.com", "registered tunnel", "unauthorized", "error", "created"]):
                        print(f"[Tunnel] {clean_line}")

                if "Unauthorized: Tunnel not found" in clean_line or "control stream error" in clean_line:
                    print("[Tunnel] Detected revoked tunnel session. Re-initiating fresh tunnel...")
                    kill_tunnel_tree(process)
                    break

                if not url_found:
                    match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', clean_line)
                    if match:
                        tunnel_url = match.group(0)
                        CURRENT_TUNNEL_URL = tunnel_url
                        print("\n" + "=" * 55)
                        print(f"[*] NEW CLOUDFLARE TUNNEL LIVE: {tunnel_url}")
                        print("=" * 55 + "\n")
                        url_found = True
                        register_url_with_vercel(tunnel_url)

            process.wait()
        except Exception as e:
            if not SHUTDOWN_REQUESTED:
                print(f"[Tunnel] Monitor error: {e}")
        finally:
            if process:
                kill_tunnel_tree(process)

        if not SHUTDOWN_REQUESTED:
            print("[Tunnel] Tunnel exited. Restarting in 3 seconds...")
            time.sleep(3)

if __name__ == "__main__":
    print("\n========================================================")
    print("      LUNARA / VYOM DRISHTI FULL PIPELINE SERVICE       ")
    print("========================================================\n")

    # 1. Start Tunnel Heartbeat
    hb_thread = threading.Thread(target=tunnel_heartbeat, daemon=True)
    hb_thread.start()

    # 2. Start Cloudflare Tunnel in background
    t_thread = threading.Thread(target=monitor_tunnel, daemon=True)
    t_thread.start()

    # 3. Check if FastAPI backend is already running on port 8000
    if is_port_in_use(LOCAL_BACKEND_PORT):
        if check_backend_healthy():
            print(f"[+] FastAPI Backend is ALREADY running and healthy on port {LOCAL_BACKEND_PORT}!")
            print("[*] Monitoring tunnel & backend health. Press CTRL+C to stop.\n")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                SHUTDOWN_REQUESTED = True
                print("\nShutting down pipeline service...")
                kill_tunnel_tree()
                sys.exit(0)
        else:
            print(f"[!] Port {LOCAL_BACKEND_PORT} is in use by another process. Freeing port...")
            if os.name == 'nt':
                subprocess.run(f'powershell -Command "Get-NetTCPConnection -LocalPort {LOCAL_BACKEND_PORT} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"', shell=True)
            time.sleep(1)

    # 4. Start FastAPI backend
    print(f"[*] Launching FastAPI Backend on http://127.0.0.1:{LOCAL_BACKEND_PORT}...")
    try:
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", str(LOCAL_BACKEND_PORT)],
            stdout=sys.stdout,
            stderr=sys.stderr
        )
    except KeyboardInterrupt:
        SHUTDOWN_REQUESTED = True
        print("\nShutting down pipeline service...")
        kill_tunnel_tree()
