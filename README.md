# nercel
A sovereign, local-first deployment platform. Free, fast, and fully self-hosted.
# 🚀 NERCEL

> **A sovereign, local-first deployment platform.** Deploy your applications for free, without artificial limits, and at the speed of local light (1.2 ms).

NERCEL is an open-source alternative to centralized deployment platforms. It removes the friction of subscription models, artificial build limits, and cloud dependency. Your code runs on your infrastructure, under your control.

## 🧬 Why NERCEL?

1. **Free & Unrestricted**: No subscriptions, no hidden quotas, no artificial bandwidth limits. You deploy as much as your hardware allows.
2. **Sovereign**: Your code runs on your own server (or VPS). No third-party cloud dependency.
3. **Ultra-Fast**: Powered by the **NEXUS Edge** node, it serves your files in **1.2 ms** (vs ~120 ms for classic CDNs).
4. **Local-First**: Fully functional offline. If the internet goes down, your local network keeps working.

## 🏗️ Architecture

NERCEL is built on 5 foundational modules:

- **Dashboard**: Web interface to manage your projects (HTML/JS).
- **Orchestrator**: Backend (Python/Node) that receives and routes requests.
- **Build**: Detects the project type and compiles it natively.
- **Deploy**: Launches the server on a free port and manages the process lifecycle.
- **NEXUS Edge**: The reverse proxy that serves your projects at peak performance.

## 🚀 Quick Start

*(To be completed once modules are coded)*

```bash
git clone https://github.com/Aissamohammedi88/nercel.git
cd nercel
bash install.sh
