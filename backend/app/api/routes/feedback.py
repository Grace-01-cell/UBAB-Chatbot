import json
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

FEEDBACK_DIR = Path("data/feedback")
FEEDBACK_FILE = FEEDBACK_DIR / "feedback.jsonl"


class FeedbackRequest(BaseModel):
    answer_id: str
    vote: str = Field(..., pattern="^(up|down)$")  # "up" or "down"
    question: str | None = None
    answer: str | None = None
    reason: str | None = None


@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)

    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "answer_id": req.answer_id,
        "vote": req.vote,
        "question": req.question,
        "answer": req.answer,
        "reason": req.reason,
    }

    with FEEDBACK_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

    return {"status": "ok"}
