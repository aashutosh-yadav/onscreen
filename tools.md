Here is the complete list of everything in the project:

---

## Frontend

| Tool | What it is |
|---|---|
| **Electron** | Makes web tech run as a desktop app |
| **TypeScript** | JavaScript but with types, safer and cleaner |
| **React** | Builds the UI components |
| **Tailwind CSS** | Utility CSS classes for styling |
| **Vite** | Bundles and builds the frontend fast |
| **Node.js** | Runtime that Electron runs on top of |
| **npm** | Package manager for all frontend libraries |

---

## Backend

| Tool | What it is |
|---|---|
| **Python** | Main backend language |
| **FastAPI** | Creates the local HTTP server |
| **uvicorn** | Runs the FastAPI server |
| **LiteLLM** | Talks to any AI model with one unified interface |
| **mss** | Takes screenshots |
| **Pillow** | Processes and encodes screenshots |
| **SpeechRecognition** | Converts voice to text |
| **PyAudio** | Captures microphone audio |
| **python-dotenv** | Loads API keys from .env file |
| **pip** | Package manager for all Python libraries |

---

## AI Models — via LiteLLM

| Model | Provider |
|---|---|
| **claude-sonnet-4-6** | Anthropic |
| **gpt-4o** | OpenAI |
| **gemini-pro-vision** | Google |
| **ollama (local)** | Runs locally on your machine, free |

---

## Dev Tools

| Tool | What it is |
|---|---|
| **Git** | Version control |
| **GitHub** | Hosts your code remotely |
| **ZED** | Code editor |
| **electron-builder** | Packages app into installer later in Phase 3 |
| **PyInstaller** | Bundles Python backend into executable later in Phase 3 |
| **eslint** | Catches TypeScript/React code errors |
| **prettier** | Formats your code automatically |

---

## Built into Python — no install needed

| Tool | What it is |
|---|---|
| **json** | Saves and loads settings |
| **base64** | Encodes screenshots for the API |
| **asyncio** | Handles async operations in FastAPI |

---

## Operating System Layer

| Tool | What it is |
|---|---|
| **Ubuntu 26.04 LTS** | Your OS |
| **Wayland** | Display server — affects how the overlay window works |
| **GNOME** | Desktop environment — provides the keyboard shortcut trigger |
| **GNOME Custom Shortcuts** | How the app gets triggered — set in Settings |

---

That is every single tool, library, framework, and technology in the entire project. Nothing hidden, nothing assumed.

Research them in this order — Node.js → TypeScript → React → Electron → Tailwind → Python → FastAPI → LiteLLM → the smaller Python libraries. That order follows the layers of the project from outside in.
