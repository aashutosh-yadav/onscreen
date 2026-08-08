# Onscreen — Full Project Context

## How to use this file
Paste this entire file at the start of a new AI conversation and say:
> "Here is the complete context for a project I am building called Onscreen. We have finished the MVP and it is fully working. I have new ideas I want to discuss and implement. Continue from where we left off. Discuss every decision with me before implementing anything."

---

## The Idea

A floating AI assistant that lives on your screen as an overlay. Instead of alt-tabbing to YouTube, taking screenshots, and pasting them into ChatGPT every time you get stuck — you press a keyboard shortcut, a chat panel appears on screen, and the AI can already see your screen. You just type your question and get an answer instantly, in context, without leaving what you are doing.

**Origin story:** The idea came from the frustration of installing Ubuntu in dual boot — hitting errors, having to take screenshots, switching to a browser, uploading the screenshot, typing context, waiting for an answer, going back to the terminal, and repeating that whole loop over and over for every single error.

**The real competitor is YouTube** — not other AI tools. People go to YouTube when they are stuck, watch 18 minute videos to find 40 seconds of relevant content, pause and unpause constantly, and still might not find their exact situation. This app replaces that entire habit with one keyboard shortcut.

**What makes it different from Cluely:**
Cluely is built to help people cheat in interviews and meetings. Onscreen is built to genuinely teach people and help them fix problems. Completely different purpose, completely different user, completely different ethics.

**The deeper differentiator:**
Onscreen can guide users through complex multi-step workflows — like navigating a failed CI/CD pipeline on GitHub, clicking through logs, understanding what failed, and fixing it step by step. Cluely gives one-shot answers. Onscreen guides you through a journey.

---

## Current Status

**MVP is complete and fully working.**

- Keyboard shortcut Ctrl+Shift+Space triggers the app
- Screenshot is captured automatically at the moment of trigger
- Chat panel opens with screenshot already loaded in memory
- User types a question and gets a real AI response
- AI can see the screen and describes what is on it accurately
- Conversation history works across multiple messages in a session
- ESC closes the panel and clears the screenshot from memory
- Code is pushed to GitHub on main branch

---

## How It Works — The Full Flow

```
User presses Ctrl+Shift+Space
         ↓
GNOME shortcut calls: curl -X POST http://localhost:8000/trigger
         ↓
Python backend captures screenshot via XDG Desktop Portal (gdbus)
Screenshot saves to ~/Pictures/ or ~/Pictures/Screenshots/
Python finds it, resizes to 1280x720, converts to base64
         ↓
Python calls Electron on port 8001 → POST /show
         ↓
Electron opens the chat panel (650x500px, bottom center of screen)
         ↓
User types question and hits send
         ↓
Electron → POST /chat → FastAPI (localhost:8000)
Sends: message + conversation history
         ↓
Python sends to LiteLLM:
  - Screenshot as base64 image (already captured at trigger time)
  - Full conversation history
  - System prompt
  - User question
         ↓
AI responds
think tags stripped from response before sending to frontend
         ↓
Chat panel displays clean response
         ↓
User presses ESC → panel closes → POST /clear → screenshot cleared from memory
```

---

## Architecture

```
Electron Frontend (TypeScript + React)
  - Floating overlay window
  - Chat panel UI
  - Input bar
  - HTTP server on port 8001 (receives /show from Python)
          ↕ HTTP localhost
Python Backend (FastAPI + uvicorn)
  - Screenshot capture (gdbus)
  - LiteLLM AI integration
  - Conversation management
  - Runs on port 8000
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Electron | 43 | Desktop app shell, always-on-top overlay |
| TypeScript | 6 | Frontend language |
| React | 19 | UI components |
| Vite | 8 | Frontend bundler |
| Node.js | 24 | Runtime |

### Backend
| Library | Purpose |
|---|---|
| Python 3.13 | Backend language |
| FastAPI | Local HTTP server |
| uvicorn | ASGI server |
| LiteLLM | Unified AI model interface |
| Pillow | Screenshot image processing |
| httpx | Async HTTP client |
| python-dotenv | API key management |

### Package Managers
- Frontend: npm
- Backend: uv (always use uv pip install never plain pip)

### Current AI Model
- Provider: Groq (free tier)
- Model: groq/qwen/qwen3.6-27b — supports vision (text + image)
- API key stored in backend/.env as GROQ_API_KEY
- Switching models is one line change in backend/main.py

---

## Project Structure

```
onscreen/
│
├── frontend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── main.js              — Electron main process
│   │   │   │                          HTTP server on port 8001
│   │   │   │                          showWindow() and hideWindow()
│   │   │   └── preload.js           — empty, required by Electron
│   │   ├── overlay/
│   │   │   ├── ChatPanel.tsx        — renders messages (role/content fields)
│   │   │   └── InputBar.tsx         — input bar, + button, send button
│   │   ├── App.tsx                  — state management, fetch to backend
│   │   └── renderer.tsx             — mounts React into #root
│   ├── index.html                   — clean root div, no hardcoded content
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── main.py                      — entire backend in one file
│   └── .env                         — GROQ_API_KEY (never committed)
│
├── .gitignore
└── README.md
```

---

## Current backend/main.py — Full Code

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import base64
import io
import subprocess
import os
import time
import glob
import re
import litellm
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

current_screenshot: str | None = None


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


def take_screenshot() -> str:
    screenshots_dirs = [
        os.path.expanduser("~/Pictures/Screenshots"),
        os.path.expanduser("~/Pictures"),
    ]

    before_time = time.time()

    subprocess.run([
        "gdbus", "call", "--session",
        "--dest", "org.freedesktop.portal.Desktop",
        "--object-path", "/org/freedesktop/portal/desktop",
        "--method", "org.freedesktop.portal.Screenshot.Screenshot",
        "", "{'interactive': <false>}"
    ], check=True)

    screenshot_path = None
    for attempt in range(10):
        time.sleep(1)
        all_files = []
        for d in screenshots_dirs:
            all_files += glob.glob(f"{d}/*.png")
        new_files = [f for f in all_files if os.path.getmtime(f) >= before_time - 1]
        if new_files:
            screenshot_path = max(new_files, key=os.path.getmtime)
            print(f"Found screenshot after {attempt + 1} seconds: {screenshot_path}")
            break

    if not screenshot_path:
        raise Exception("Screenshot file not found after 10 attempts")

    try:
        img = Image.open(screenshot_path)
        img.thumbnail((1280, 720))
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        base64_image = base64.b64encode(buffer.read()).decode("utf-8")
        return base64_image
    finally:
        if os.path.exists(screenshot_path):
            os.remove(screenshot_path)


@app.get("/")
def root():
    return {"status": "onscreen backend is running"}


@app.post("/trigger")
async def trigger():
    global current_screenshot
    try:
        current_screenshot = take_screenshot()
        print("Screenshot captured successfully")
        print(f"Screenshot size: {len(current_screenshot)} chars")
    except Exception as e:
        print(f"Screenshot failed: {e}")
        current_screenshot = None

    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8001/show")
    except Exception as e:
        print(f"Could not reach Electron: {e}")

    return {"status": "triggered"}


@app.post("/clear")
def clear_screenshot():
    global current_screenshot
    current_screenshot = None
    print("Screenshot cleared")
    return {"status": "cleared"}


@app.post("/chat")
def chat(request: ChatRequest):
    global current_screenshot

    print(f"Screenshot available: {current_screenshot is not None}")
    print(f"Screenshot size: {len(current_screenshot) if current_screenshot else 0} chars")

    messages = []

    messages.append({
        "role": "system",
        "content": """You are Onscreen — an AI assistant that can see the user's screen.
You help users understand software, fix errors, and navigate complex workflows.
Give clear, step by step answers. Reference what you can see on screen specifically.
Be concise but thorough. If you can see an error, explain what caused it and how to fix it.
Never show your thinking process. Give direct, clean answers only."""
    })

    for msg in request.history:
        messages.append(msg)

    if current_screenshot:
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{current_screenshot}"
                    }
                },
                {
                    "type": "text",
                    "text": request.message
                }
            ]
        })
    else:
        messages.append({
            "role": "user",
            "content": request.message
        })

    response = litellm.completion(
        model="groq/qwen/qwen3.6-27b",
        messages=messages,
        api_key=os.getenv("GROQ_API_KEY"),
        max_tokens=1000
    )

    raw = response.choices[0].message.content
    clean = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()

    return {"response": clean}
```

---

## Known Issues and Limitations

- Screenshot capture takes 3-10 seconds because gdbus is slow on GNOME 49
- No settings UI yet — model and API key are hardcoded in files
- No system tray — app has no background presence when panel is closed
- No markdown rendering — AI responses with code blocks show raw asterisks
- No active window detection — AI only sees screenshot, not which app is active
- No voice input yet
- App requires two manual terminal commands to start

---

## Environment

- OS: Ubuntu 26.04 LTS (Resolute) — Wayland only
- GNOME 49 — X11 completely removed
- Python: 3.13.13 (managed by uv)
- Node.js: v24.15.0
- Display server: Wayland (wayland-0)
- Screenshot method: XDG Desktop Portal via gdbus
- Cannot use: pynput, mss, grim, gnome-screenshot (all incompatible with GNOME 49 Wayland)

---

## How to Run

Terminal 1 — Backend:
```bash
cd ~/onscreen/backend
uv run uvicorn main:app --reload --port 8000
```

Terminal 2 — Frontend:
```bash
cd ~/onscreen/frontend
npm run dev
```

Trigger: Press Ctrl+Shift+Space anywhere on screen.

---

## GNOME Shortcut Setup

Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts → Add Shortcut
- Name: Onscreen
- Command: curl -X POST http://localhost:8000/trigger
- Shortcut: Ctrl+Shift+Space

---

## GitHub

- Repo: github.com/aashutosh-yadav/onscreen
- Main branch: main — stable working MVP
- Dev branch: dev — active development
- Branch naming: feature/name-of-feature

---

## Deployment Phases

### Phase 1 — Build for yourself (DONE)
Local app, own API key, runs on Ubuntu machine.

### Phase 2 — Share with technical friends
GitHub repo with good README, users provide own API keys. README is done.

### Phase 3 — Public beta
Bundle Python with PyInstaller, build installers with electron-builder.

### Phase 4 — Real product
Own backend, subscription model, auto-updates, non-technical users.

---

## Important Rules for AI Assistant

- Discuss every decision before implementing
- Never install packages without discussing first
- For Python packages always use: uv pip install (never plain pip, never uv add)
- For frontend packages use: npm install
- User is on Ubuntu 26.04 Wayland — never suggest anything requiring X11
- Do NOT use: pynput, mss, grim, gnome-screenshot
- Keep explanations clear — user is learning as they build
- One step at a time — never dump too much at once
- Always explain what a command does before asking user to run it
- User prefers to discuss ideas before any code is written
