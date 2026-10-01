import os
import sys
import time
import subprocess
import threading
import shutil
from collections import deque
import gradio as gr

# Buffer log real-time (100 baris terakhir)
log_buffer = deque(maxlen=100)
bot_process = None
bot_status = "Memulai sistem cloud..."

def log_msg(msg):
    print(msg, flush=True)
    log_buffer.append(f"[{time.strftime('%H:%M:%S')}] {msg}")

def setup_node_and_run_bot():
    global bot_process, bot_status
    try:
        log_msg("🚀 Memeriksa environment Node.js di server Hugging Face...")
        
        # Cek apakah node sistem sudah versi modern (>= 20)
        node_cmd = shutil.which("node")
        has_modern_node = False
        if node_cmd:
            try:
                v = subprocess.check_output([node_cmd, "-v"], text=True).strip()
                log_msg(f"Node.js sistem terdeteksi: {v}")
                major = int(v.replace("v", "").split(".")[0])
                if major >= 20:
                    has_modern_node = True
            except Exception:
                pass

        # Jika belum ada Node.js >= 20, pasang standalone Node.js Linux x64
        if not has_modern_node:
            node_dir = os.path.join(os.getcwd(), ".node_bin")
            node_bin_executable = os.path.join(node_dir, "bin", "node")
            if not os.path.exists(node_bin_executable):
                log_msg("📥 Mengunduh Node.js v20 Standalone untuk Linux x64...")
                os.makedirs(node_dir, exist_ok=True)
                tar_url = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz"
                os.system(f"curl -sL {tar_url} | tar -xJ -C {node_dir} --strip-components=1")

            bin_path = os.path.join(node_dir, "bin")
            os.environ["PATH"] = f"{bin_path}:{os.environ.get('PATH', '')}"
            log_msg(f"✅ Node.js v20 aktif dari: {bin_path}")

        # Jalankan npm install jika node_modules belum ada
        if not os.path.exists("node_modules"):
            log_msg("📦 Menginstall dependensi (npm install --legacy-peer-deps)...")
            os.system("npm install --omit=dev --legacy-peer-deps")

        # Jalankan Baileys Gateway Daemon
        log_msg("🤖 Menjalankan Expedient 43 WhatsApp Gateway Daemon...")
        bot_status = "🟢 ONLINE & MENJAGA SESI 24 JAM"

        cmd = ["npx", "tsx", "scripts/wa-gateway.ts"]
        bot_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env=os.environ.copy()
        )

        for line in iter(bot_process.stdout.readline, ""):
            clean = line.strip()
            if clean:
                log_msg(clean)

    except Exception as e:
        bot_status = f"🔴 ERROR: {str(e)}"
        log_msg(f"Error pada bot runner: {e}")

# Jalankan bot di latar belakang thread otomatis saat server menyala
t = threading.Thread(target=setup_node_and_run_bot, daemon=True)
t.start()

def get_dashboard_data():
    recent_logs = "\n".join(log_buffer) if log_buffer else "Menunggu log bot WhatsApp..."
    return bot_status, recent_logs

# Antarmuka Dashboard Web Gradio
with gr.Blocks(title="Expedient 43 - WhatsApp Cloud Bot") as demo:
    gr.Markdown("# 🤖 EXPEDIENT GENERATION 43")
    gr.Markdown("### Official 24/7 Self-Hosted WhatsApp Cloud Gateway & Multimodal AI (Free Server)")
    
    with gr.Row():
        status_box = gr.Textbox(label="Status Server WhatsApp Bot", value=bot_status, interactive=False)
    
    with gr.Row():
        logs_box = gr.Textbox(label="Live Terminal Logs (Real-time)", lines=18, interactive=False)
    
    with gr.Row():
        refresh_btn = gr.Button("🔄 Refresh Status / Logs", variant="primary")
        refresh_btn.click(fn=get_dashboard_data, outputs=[status_box, logs_box])

    # Timer auto-refresh setiap 5 detik agar web tetap aktif (anti-sleep)
    timer = gr.Timer(5)
    timer.tick(fn=get_dashboard_data, outputs=[status_box, logs_box])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    demo.launch(server_port=port, server_name="0.0.0.0")
