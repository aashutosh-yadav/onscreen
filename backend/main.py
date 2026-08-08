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

# Screenshot stored in memory — lives only during the session
current_screenshot: str | None = None


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

def take_screenshot() -> str:
    # Check both locations where GNOME saves screenshots
    screenshots_dirs = [
        os.path.expanduser("~/Pictures/Screenshots"),
        os.path.expanduser("~/Pictures"),
    ]

    # Record time just before taking screenshot
    before_time = time.time()

    subprocess.run([
        "gdbus", "call", "--session",
        "--dest", "org.freedesktop.portal.Desktop",
        "--object-path", "/org/freedesktop/portal/desktop",
        "--method", "org.freedesktop.portal.Screenshot.Screenshot",
        "", "{'interactive': <false>}"
    ], check=True)

    # Try every second for up to 10 seconds
    screenshot_path = None
    for attempt in range(10):
        time.sleep(1)
        all_files = []
        for d in screenshots_dirs:
            all_files += glob.glob(f"{d}/*.png")
        # Find files created after we started
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
    """Called by GNOME shortcut via curl"""
    global current_screenshot
    try:
        current_screenshot = take_screenshot()
        print("Screenshot captured successfully")
        print(f"Screenshot size: {len(current_screenshot)} chars")
    except Exception as e:
        print(f"Screenshot failed: {e}")
        current_screenshot = None

    # Tell Electron to show the window
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8001/show")
    except Exception as e:
        print(f"Could not reach Electron: {e}")

    return {"status": "triggered"}


@app.post("/clear")
def clear_screenshot():
    """Called when panel closes"""
    global current_screenshot
    current_screenshot = None
    print("Screenshot cleared")
    return {"status": "cleared"}


@app.post("/chat")
def chat(request: ChatRequest):
    global current_screenshot

    # Debug — tells us if screenshot is available
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

    # Strip <think>...</think> tags from response
    clean = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()

    return {"response": clean}
