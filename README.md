# Screen Assistant — Complete Project Plan

## The Idea

A floating AI assistant that lives on your screen as an overlay. Instead of alt-tabbing to YouTube, taking screenshots, and pasting them into ChatGPT every time you get stuck — you hit a keyboard shortcut, a chat panel appears right where your cursor is, and the AI can already see your screen. You just type your question and get an answer instantly, in context, without leaving what you're doing.

**Origin story:** The idea came from the frustration of installing Ubuntu in dual boot — hitting errors, having to take screenshots, switching to a browser, uploading the screenshot, typing context, waiting for an answer, going back to the terminal, and repeating that whole loop over and over for every single error.

**The real competitor is YouTube** — not other AI tools. People go to YouTube when they're stuck, watch 18-minute videos to find 40 seconds of relevant content, pause and unpause constantly, and still might not find their exact situation. This app replaces that entire habit with one keyboard shortcut.

**What makes it different from Cluely:**
Cluely is built to help people cheat in interviews and meetings. This app is built to genuinely teach people and help them fix problems. Completely different purpose, completely different user, completely different ethics.

---

## All Decisions Made

### Trigger
- **GNOME custom keyboard shortcut** — e.g. `Ctrl + Shift + Space`
- Set once in GNOME Settings → Keyboard → Custom Shortcuts
- Works natively on Wayland, no library issues
- Triple click was considered but dropped due to Ubuntu 26.04 Wayland limitations
- Can revisit triple click later once core app is working

### Panel Position
- Appears **near the cursor** at the point of the trigger
- Stays there until closed
- **Draggable** if it covers something important
- Does NOT follow the cursor around — appears on trigger, stays put

### Visual Style
- **Solid, visible, dark panel** — not transparent or ghost-like
- Rounded corners, clean and minimal
- Inspired by Claude's input bar aesthetic
- Dark theme so it doesn't blind you when it pops up over a bright screen

### Panel Size
- **Compact** — around 600px wide
- Not full width (that feels like it owns your screen)

### Interaction Mode
- **Conversation mode** — full back and forth chat, not single answer
- Panel **starts as a small input bar** at the bottom and **expands upward** as the conversation grows
- Conversation history is maintained within the session

### Input Bar Design
```
┌─────────────────────────────────────┐
│  AI answer appears here             │
│  expanding upward as you chat       │
│                                     │
│  You: what is this error?           │
│  AI: This is a GRUB error...        │
│                                     │
├─────────────────────────────────────┤
│  + │ Write a message...  │ 🎤  ►   │
└─────────────────────────────────────┘
```
- `+` button — manual file or image attachment on top of automatic screenshot
- Text input in the middle with placeholder "Write a message..."
- Microphone button — voice input
- Send button
- Current model name shown in the bar (e.g. "claude-sonnet-4-6")

### What the AI Sees Every Message
- **Screenshot** — taken automatically and silently the moment you hit send
- **Active window name** — so AI knows if you're in VS Code, Terminal, Figma etc.
- **Full conversation history** — AI remembers everything said earlier in the session
- **Custom system prompt** — from user settings
- User never manually takes or attaches a screenshot — it's always automatic

### AI Layer
- **LiteLLM** as the unified AI interface
- Supports Claude, GPT-4o, Gemini, Ollama (local), and anything else
- Write the code once, works with any model
- Each user provides their own API key
- Future proof — new models work without changing any code
- Supports multimodal / vision models for screenshot understanding

### Settings Screen
- Model selection dropdown (Claude, GPT-4o, Gemini, Ollama etc.)
- API key input field
- Keyboard shortcut reminder
- **Custom system prompt** — editable text area, sensible default pre-filled
  - Example default: "You are a helpful assistant that can see my screen. Give short, direct, step-by-step answers. I am currently using {active_window}."
  - User can personalize: "I am a Linux beginner, explain everything simply"
  - User can personalize: "Always give terminal commands, assume I know basic Linux"

### Voice Input
- **Yes** — microphone button in the input bar
- Speak your question instead of typing
- Converts speech to text, drops it in the input field
- User still hits send manually

### System Tray
- App lives in the **system tray** when not in use
- Small icon, always running in background, not stealing focus
- Right click menu: Open Settings, Quit

### Operating System
- **Ubuntu 26.04 LTS (Resolute)** — Wayland session
- GNOME 49 — X11 support completely removed, Wayland only
- This is why we use GNOME keyboard shortcuts instead of pynput for the trigger

---

## Tech Stack

### Frontend — Electron + TypeScript + React
Everything the user sees and interacts with.

| Technology | Purpose |
|---|---|
| **Electron** | Desktop app shell, overlay window, always-on-top, system tray |
| **TypeScript** | Language for all frontend logic |
| **React** | Chat panel UI, input bar, settings screen components |
| **Tailwind CSS** | Styling — dark theme, rounded corners, clean look |

### Backend — Python + FastAPI
The brain. Runs as a local server in the background on the user's machine.

| Library | Purpose |
|---|---|
| **FastAPI** | Local HTTP server — Electron talks to this |
| **uvicorn** | Runs the FastAPI server |
| **litellm** | Unified AI interface — Claude, GPT-4o, Gemini, Ollama |
| **mss** | Fast screenshot capture, multi-monitor support |
| **Pillow** | Image processing, base64 encoding for API |
| **SpeechRecognition** | Voice to text conversion |
| **PyAudio** | Microphone capture for voice input |
| **python-dotenv** | Loads API keys from .env file |
| **json** | Settings storage (built into Python) |
| **base64** | Screenshot encoding (built into Python) |

### Communication Between Frontend and Backend
```
Electron (TypeScript)  ←→  FastAPI (Python)
                           running on localhost:8000
```
Electron sends a POST request with the message to the Python server. Python takes the screenshot, grabs the active window name, calls LiteLLM, streams the response back to Electron. Electron displays it in the chat panel word by word.

---

## Project Structure

```
screen-assistant/
│
├── frontend/                        — Electron + React + TypeScript
│   ├── src/
│   │   ├── main.ts                  — Electron main process
│   │   ├── overlay/
│   │   │   ├── window.ts            — overlay window logic (always-on-top, frameless)
│   │   │   ├── ChatPanel.tsx        — conversation UI (messages, scroll, expand)
│   │   │   ├── InputBar.tsx         — input bar component (text, mic, attach, send)
│   │   │   └── Settings.tsx         — settings screen component
│   │   └── tray/
│   │       └── tray.ts              — system tray icon and right-click menu
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                         — Python + FastAPI
│   ├── main.py                      — starts FastAPI server via uvicorn
│   ├── routes/
│   │   ├── chat.py                  — POST /chat — handles AI requests
│   │   └── settings.py             — GET/POST /settings — handles settings
│   ├── core/
│   │   ├── ai.py                    — LiteLLM integration, streaming
│   │   ├── screenshot.py            — screen capture with mss + Pillow
│   │   ├── window_info.py           — active window name detection
│   │   └── voice.py                 — speech recognition
│   ├── requirements.txt
│   └── .env                         — API keys (never committed to git)
│
└── README.md
```

---

## Data Flow — How One Message Works

```
User hits Ctrl+Shift+Space
          ↓
Electron overlay appears near cursor
          ↓
User types a question and hits send
          ↓
Electron → POST /chat → FastAPI (localhost:8000)
          ↓
Python silently takes a screenshot (mss)
          ↓
Python gets active window name
          ↓
Screenshot converted to base64 (Pillow + base64)
          ↓
LiteLLM sends to AI model:
  - Screenshot as image
  - Active window name
  - Full conversation history
  - Custom system prompt from settings
  - User's question
          ↓
AI response streams back token by token
          ↓
FastAPI streams response → Electron
          ↓
Chat panel displays response word by word
          ↓
Conversation history updated for next message
```

---

## Deployment Phases

### Phase 1 — Build for yourself (current goal)
Local app, your own API key, runs on your Ubuntu machine. No deployment, no other users, just you using it and testing it.

### Phase 2 — Share with technical friends
Package it so someone who knows what they're doing can clone the repo, install dependencies, and run it. GitHub repo with a good README. Users provide their own API keys.

### Phase 3 — Public beta
- Bundle Python backend with **PyInstaller** so users don't need Python installed
- Build Electron installers with **electron-builder** (.deb for Linux, .exe for Windows, .dmg for Mac)
- Host downloads on GitHub Releases
- Users still provide their own API keys

### Phase 4 — Real product
- Your own backend server handling AI calls
- Subscription model to cover API costs
- Auto-updates via electron-updater
- Proper onboarding for non-technical users
- This is where it becomes a business

**Right now we are building Phase 1. We write the code cleanly enough that Phase 3 is not a nightmare later.**

---

## MVP Scope — First Thing to Build

The smallest version that actually works and is useful:

1. Keyboard shortcut triggers the Electron overlay
2. Dark compact panel appears near cursor
3. User types a question and hits send
4. Python backend takes a screenshot automatically
5. Sends screenshot + question to AI via LiteLLM
6. Answer appears in the panel, streams word by word

Everything else — settings screen, system tray, voice input, manual attachments, active window detection — gets layered on top of this working core.

---

## How to Start a New Claude Conversation

Paste this entire file at the start of the new conversation with this message:

> "Here is the complete plan for a project I am building called Screen Assistant. We have finished planning and are ready to start coding. Let's begin with the MVP — setting up the project structure and getting the first Electron window to appear on screen. I am on Ubuntu 26.04 Wayland. We are not using pynput. Frontend is Electron + TypeScript + React + Tailwind. Backend is Python + FastAPI. Discuss every decision with me before implementing."
