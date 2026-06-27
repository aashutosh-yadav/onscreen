from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# This allows the Electron frontend to talk to this server
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {"status": "onscreen backend is running"}


@app.post("/chat")
def chat(request: ChatRequest):
    return {"response": f"You said: {request.message}"}
