from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.chat import router as chat_router
from app.api.routes.files import router as files_router
# (later) from app.api.routes.feedback import router as feedback_router
# (later) from app.api.routes.regenerate import router as regenerate_router

app = FastAPI(title="SOP Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(files_router)
# app.include_router(feedback_router)
# app.include_router(regenerate_router)

@app.get("/health")
def health():
    return {"status": "ok"}
