from typing import List, Dict
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3:mini"   # or "mistral" if you switch back later

MAX_HITS_FOR_LLM = 2
MAX_CHARS_PER_HIT = 800


def trim_text(text: str, limit: int = MAX_CHARS_PER_HIT) -> str:
    text = " ".join((text or "").split())
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."


def build_context_from_hits(hits: List[Dict]) -> str:
    """
    Build a short grounded context block from retrieved hits.
    Smaller context helps local models avoid timeout and repetition.
    """
    parts = []

    for i, h in enumerate(hits[:MAX_HITS_FOR_LLM], start=1):
        meta = h.get("meta", {}) or {}
        doc_name = meta.get("doc_name", "Unknown")
        page = meta.get("page", "?")
        text = trim_text(h.get("text") or "")

        parts.append(f"[Source {i}] {doc_name} (page {page})\n{text}")

    return "\n\n".join(parts)


def clean_llm_output(text: str) -> str:
    """
    Light cleanup of local model output.
    """
    text = " ".join((text or "").split())

    # collapse obvious repeated commas/spacing
    text = text.replace(" ,", ",").replace(" .", ".")
    return text.strip()


def generate_answer_from_hits(question: str, hits: List[Dict], language: str = "en") -> str:
    """
    Generate a grounded answer using a local Ollama model.
    """
    if not hits:
        if language == "sw":
            return "Sikuweza kupata taarifa zinazolingana kwenye SOP nilizonazo."
        return "I couldn’t find anything relevant in the SOPs I have."

    context = build_context_from_hits(hits)

    if language == "sw":
        system_prompt = """
Wewe ni msaidizi wa afya anayejibu maswali kwa kutumia SOP na miongozo ya afya.

Sheria:
- Tumia tu taarifa zilizopo kwenye muktadha uliotolewa.
- Usibuni taarifa mpya.
- Usitumie maarifa ya nje.
- Jibu kwa Kiswahili rahisi na wazi.
- Usirudie maneno au sentensi.
- Jibu kwa pointi 3 hadi 5 tu.
- Kila pointi iwe fupi.
- Kama taarifa haitoshi, sema hivyo kwa ufupi.
"""
    else:
        system_prompt = """
You are a health policy assistant answering questions using SOP and guideline documents.

Rules:
- Use ONLY the provided context.
- Do NOT invent facts.
- Do NOT use outside knowledge.
- Keep the answer concise.
- Use 3 to 5 short bullet points only.
- Do not repeat ideas.
- If the context is insufficient, say so briefly.
"""

    prompt = f"""
{system_prompt}

Question:
{question}

Context:
{context}

Write the final answer now.
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.85,
                    "repeat_penalty": 1.2,
                    "num_predict": 140
                }
            },
            timeout=180
        )
        response.raise_for_status()
        data = response.json()
        answer = data.get("response", "").strip()

        if not answer:
            return "No answer returned by local LLM."

        return clean_llm_output(answer)

    except requests.RequestException as e:
        return f"Error contacting local LLM: {str(e)}"