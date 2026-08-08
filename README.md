# Onscreen

> A screen-aware AI assistant that lives on your desktop. Press a keyboard shortcut, and an AI that can see your screen appears instantly — ready to help you fix errors, navigate software, or walk you through complex workflows.

![Demo](./assets/demo.gif)

---

## The Problem

When you get stuck on an error, the current workflow is painful:

1. Take a screenshot
2. Open a browser
3. Go to ChatGPT or Claude
4. Upload the screenshot
5. Type context around it
6. Wait for an answer
7. Go back to your terminal
8. If it breaks again — repeat everything

**Onscreen eliminates this entire loop.** One keyboard shortcut captures your screen and opens a chat panel right where you are. The AI already sees what you are looking at. You just ask.

---

## Demo

```
Press Ctrl+Shift+Space anywhere on your screen
         ↓
Screenshot captured automatically and silently
         ↓
Chat panel appears near your cursor
         ↓
Type your question — "what is this error?" or "how do I fix this?"
         ↓
AI responds with full context of what is on your screen
         ↓
Press ESC to close — app stays running in background
```

---

## Features

- **Screen aware** — automatically captures your screen when triggered, no manual screenshot needed
- **Any software** — works on top of any app, terminal, browser, or tool
- **Conversation mode** — full back and forth chat, not just single answers. Ask follow up questions
- **Multi-model support** — works with Claude, GPT-4o, Gemini, Groq, or any local Ollama model via LiteLLM
- **Bring your own key** — uses your own API key, no subscription, no middleman
- **Privacy first** — screenshots are never stored. They live in memory for the duration of the session and are discarded when you close the panel
- **Wayland native** — built for modern Ubuntu (26.04) with full Wayland support

---

## Architecture

Onscreen is split into two layers that communicate over localhost:

```
┌─────────────────────────────────┐
│     Electron Frontend           │
│     TypeScript + React          │
│                                 │
│  - Floating overlay window      │
│  - Chat panel UI                │
│  - Input bar                    │
│  - Listens on port 8001         │
└──────────────┬──────────────────┘
               │ HTTP (localhost)
               │
┌──────────────▼──────────────────┐
│     Python Backend              │
│     FastAPI + uvicorn           │
│                                 │
│  - Screenshot capture           │
│  - LiteLLM AI integration       │
│  - Conversation management      │
│  - Runs on port 8000            │
└─────────────────────────────────┘
```

### How one request flows

```
User presses Ctrl+Shift+Space
         ↓
GNOME shortcut calls: curl -X POST http://localhost:8000/trigger
         ↓
Python backend captures screenshot via XDG Desktop Portal
         ↓
Python calls Electron on port 8001 → /show
         ↓
Electron opens the chat panel
         ↓
User types question and hits send
         ↓
Electron → POST /chat → FastAPI
         ↓
Python sends to LiteLLM:
  - Screenshot as base64 image
  - Conversation history
  - System prompt
  - User question
         ↓
AI response streams back
         ↓
Chat panel displays response
         ↓
User presses ESC → panel closes → screenshot cleared from memory
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Electron 43 | Desktop app shell, always-on-top overlay window |
| TypeScript | Type-safe frontend logic |
| React 19 | Chat panel UI components |
| Vite 8 | Frontend bundler and dev server |

### Backend
| Library | Purpose |
|---|---|
| Python 3.13 | Backend language |
| FastAPI | Local HTTP server |
| uvicorn | ASGI server runner |
| LiteLLM | Unified AI model interface |
| Pillow | Screenshot image processing |
| httpx | Async HTTP client |
| python-dotenv | Environment variable management |

### Package Managers
- Frontend: `npm`
- Backend: `uv`

---

## Prerequisites

- Ubuntu 26.04 LTS (Wayland)
- Node.js v18+
- Python 3.11+
- uv (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- A Groq API key (free at console.groq.com) or any LiteLLM supported provider

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/aashutosh-yadav/onscreen.git
cd onscreen
```

### 2. Set up the Python backend

```bash
cd backend
uv pip install fastapi uvicorn litellm pillow httpx python-dotenv
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
GROQ_API_KEY=your_key_here
```

### 3. Set up the Electron frontend

```bash
cd ../frontend
npm install
```

### 4. Set up the GNOME keyboard shortcut

Go to **Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts → Add Shortcut**

Fill in:
- **Name:** `Onscreen`
- **Command:** `curl -X POST http://localhost:8000/trigger`
- **Shortcut:** `Ctrl+Shift+Space`

---

## Running the App

You need two terminals running simultaneously:

**Terminal 1 — Start the Python backend:**
```bash
cd backend
uv run uvicorn main:app --reload --port 8000
```

**Terminal 2 — Start the Electron frontend:**
```bash
cd frontend
npm run dev
```

Once both are running, press `Ctrl+Shift+Space` anywhere on your screen to trigger Onscreen.

---

## Usage

| Action | How |
|---|---|
| Trigger Onscreen | `Ctrl+Shift+Space` |
| Ask a question | Type in the input bar and press Enter or click Send |
| Close the panel | Press `Escape` or click "ESC to close" |
| Trigger again | Press `Ctrl+Shift+Space` again — takes a fresh screenshot |

### Tips

- Trigger Onscreen right when you see an error — the screenshot captures that exact moment
- You can have a full conversation — ask follow up questions and the AI remembers context
- The AI can see everything on your screen — error messages, code, UI elements, terminal output

---

## Configuration

### Changing the AI model

Open `backend/main.py` and find this line:

```python
model="groq/qwen/qwen3.6-27b",
```

Replace with any LiteLLM supported model:

```python
# Claude (requires Anthropic API key)
model="claude-opus-4-6"

# GPT-4o (requires OpenAI API key)
model="gpt-4o"

# Local Ollama model (free, no API key)
model="ollama/llava"
```

Update your `.env` file with the corresponding API key.

### Customizing the system prompt

Open `backend/main.py` and find the system prompt in the `chat` function. Edit it to change how the AI behaves:

```python
messages.append({
    "role": "system",
    "content": """Your custom prompt here.
    For example: I am a senior Linux engineer. Skip basic explanations."""
})
```

---

## Project Structure

```
onscreen/
│
├── frontend/                        
│   ├── src/
│   │   ├── main/
│   │   │   ├── main.js              # Electron main process
│   │   │   └── preload.js           # Electron preload script
│   │   ├── overlay/
│   │   │   ├── ChatPanel.tsx        # Chat messages UI
│   │   │   └── InputBar.tsx         # Input bar component
│   │   ├── App.tsx                  # Root React component
│   │   └── renderer.tsx             # React DOM mount
│   ├── index.html                   
│   ├── package.json                 
│   └── vite.config.ts               
│
├── backend/                         
│   ├── main.py                      # FastAPI server — all backend logic
│   ├── .env                         # API keys (never committed)
│   └── .env.example                 # Template for .env
│
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/trigger` | Called by GNOME shortcut — captures screenshot and signals Electron to open |
| `POST` | `/chat` | Sends message + screenshot to AI and returns response |
| `POST` | `/clear` | Clears screenshot from memory when panel closes |

---

## Privacy

- Screenshots are captured only when you press `Ctrl+Shift+Space`
- Screenshots are stored in Python memory only — never written to disk by the app
- Screenshots are sent directly to your chosen AI provider API and nowhere else
- When you close the panel, the screenshot is immediately cleared from memory
- Your `.env` file containing API keys is in `.gitignore` and never committed

---

## Roadmap

- [ ] Active window detection — tell AI which app you are in
- [ ] Markdown rendering in chat panel
- [ ] Auto start on login
- [ ] System tray icon
- [ ] Voice input
- [ ] Custom system prompt via settings UI
- [ ] RAG — load software documentation for deeper knowledge
- [ ] Multi-monitor support

---

## Why Onscreen

Most AI tools make you go to them. You see a problem, you leave your work, you open a browser, you describe the problem from memory, you get an answer, you go back to your work.

Onscreen comes to you. It sees exactly what you see, right when you need it, without breaking your flow.

---

## Contributing

This project is in active development. Issues and pull requests are welcome.

---

## License

MIT
