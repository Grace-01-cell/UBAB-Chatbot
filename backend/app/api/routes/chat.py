import re
import uuid
from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.rag.retrieve import retrieve
from app.services.llm_service import generate_answer_from_hits

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    language: Optional[Literal["en", "sw"]] = None
    k: int = 5


def detect_lang(text: str) -> str:
    t = text.lower()
    sw_markers = [
        "je", "na", "kwa", "nini", "vipi", "lini", "wapi", "habari", "mambo",
        "niaje", "hujambo", "salama", "mtoto", "mama", "kujifungua", "mimba",
        "kipimo", "dawa", "wagonjwa", "hospitali"
    ]
    hits = sum(1 for w in sw_markers if re.search(rf"\b{re.escape(w)}\b", t))
    return "sw" if hits >= 2 else "en"


def is_greeting(text: str) -> bool:
    t = text.strip().lower()
    greetings = [
        "hi", "hello", "hey",
        "habari", "mambo", "niaje", "hujambo", "salama",
        "good morning", "good afternoon", "good evening"
    ]
    return t in greetings or any(t.startswith(g + " ") for g in greetings)


def greeting_reply(lang: str) -> str:
    if lang == "sw":
        return "Habari! 👋 Naweza kukusaidia nini kuhusu SOP au miongozo uliyonayo?"
    return "Hi! 👋 What can I help you with from the SOPs or guidelines you have?"


def clean_text(text: str) -> str:
    t = text or ""
    t = re.sub(r"(\w)\s*-\s+(\w)", r"\1\2", t)
    t = " ".join(t.split())
    return t


def looks_corrupt(text: str) -> bool:
    if not text:
        return True

    t = clean_text(text)

    if "........" in t:
        return True

    letters = sum(ch.isalpha() for ch in t)
    if letters / max(len(t), 1) < 0.35:
        return True

    if re.search(r"\b(?:latoT|rebmun|snoitces|detpme)\b", t):
        return True

    return False


def excerpt(text: str, limit: int = 240) -> str:
    t = clean_text(text)
    if len(t) <= limit:
        return t
    return t[:limit].rstrip() + "…"


def dedupe_hits(hits: list[dict]) -> list[dict]:
    seen = set()
    deduped = []

    for h in hits:
        text = clean_text(h.get("text", ""))
        key = text[:180].lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(h)

    return deduped


def build_citations(hits: list[dict]) -> list[dict]:
    citations = []
    seen = set()

    for h in hits[:5]:
        meta = h.get("meta", {}) or {}
        doc_name = meta.get("doc_name", "Unknown")
        page = int(meta.get("page", 0) or 0)
        chunk_index = int(meta.get("chunk_index", 0) or 0)
        text = clean_text(h.get("text", ""))

        key = (doc_name, page)
        if key in seen:
            continue
        seen.add(key)

        citations.append({
            "id": h.get("id"),
            "doc_name": doc_name,
            "page": page,
            "chunk_index": chunk_index,
            "label": f"{doc_name} — page {page}",
            "snippet": excerpt(text, limit=240),
            "file_url": f"/files/{doc_name}"
        })

    return citations


@router.post("/chat")
def chat(req: ChatRequest):
    user_msg = (req.message or "").strip()
    if not user_msg:
        return {
            "answer_id": "empty-1",
            "answer": "Please type a question.",
            "citations": [],
            "language": "en"
        }

    lang = req.language or detect_lang(user_msg)

    if is_greeting(user_msg):
        return {
            "answer_id": "greet-1",
            "answer": greeting_reply(lang),
            "citations": [],
            "language": lang
        }

    retrieval_query = user_msg
    hits = retrieve(retrieval_query, k=req.k)

    hits = [h for h in hits if not looks_corrupt(h.get("text", ""))]
    hits = [h for h in hits if len(clean_text(h.get("text", ""))) >= 120]
    hits = dedupe_hits(hits)

    if not hits:
        answer = (
            "Sikuweza kupata taarifa zinazolingana kwenye SOP nilizonazo."
            if lang == "sw"
            else "I couldn’t find anything relevant in the SOPs I have."
        )
        return {
            "answer_id": "nohit-1",
            "answer": answer,
            "citations": [],
            "language": lang
        }

    final_answer = generate_answer_from_hits(
        question=user_msg,
        hits=hits,
        language=lang
    )
    citations = build_citations(hits)

    return {
        "answer_id": f"offline-{uuid.uuid4().hex[:10]}",
        "answer": final_answer,
        "citations": citations,
        "language": lang
    }