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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


def take_screenshot() -> str:
    """Takes a screenshot using XDG portal and returns base64 string"""
    screenshots_dir = os.path.expanduser("~/Pictures/Screenshots")

    # Call XDG portal to take screenshot
    subprocess.run([
        "gdbus", "call", "--session",
        "--dest", "org.freedesktop.portal.Desktop",
        "--object-path", "/org/freedesktop/portal/desktop",
        "--method", "org.freedesktop.portal.Screenshot.Screenshot",
        "", "{'interactive': <false>}"
    ], check=True)

    # Wait for file to be written — portal needs a moment
    time.sleep(2)

    # Get the most recently modified png in the folder
    files = glob.glob(f"{screenshots_dir}/*.png")
    if not files:
        raise Exception("No screenshots found in Screenshots folder")

    latest = max(files, key=os.path.getmtime)

    # Only use it if it was created in the last 10 seconds
    if time.time() - os.path.getmtime(latest) > 10:
        raise Exception("Screenshot file too old — portal may have failed")

    try:
        img = Image.open(latest)
        img.thumbnail((1280, 720))

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        base64_image = base64.b64encode(buffer.read()).decode("utf-8")

        return base64_image

    finally:
        # Clean up
        if os.path.exists(latest):
            os.remove(latest)


@app.get("/")
def root():
    return {"status": "onscreen backend is running"}


@app.post("/chat")
def chat(request: ChatRequest):
    screenshot_base64 = take_screenshot()
    return {
        "response": f"Screenshot captured — {len(screenshot_base64)} characters ready to send to AI."
    }
