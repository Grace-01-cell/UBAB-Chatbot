import glob
import json
import shutil
from pathlib import Path

import chromadb
import pdfplumber
from sentence_transformers import SentenceTransformer

# ------------------
# Config
# ------------------
BASE_DIR = Path(__file__).resolve().parents[2]   # backend/
DATA_DIR = BASE_DIR / "data"

RAW_DIR = DATA_DIR / "raw_pdfs"
PROCESSED_DIR = DATA_DIR / "processed"
VECTOR_DIR = DATA_DIR / "vectorstore" / "chroma"

COLLECTION_NAME = "sop_chunks_local"
#EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
EMBED_MODEL_NAME = str(BASE_DIR / "models" / "all-MiniLM-L6-v2")

CHUNK_CHARS = 1400
OVERLAP_CHARS = 200
BATCH_SIZE = 64
RESET_COLLECTION = False   # Rebuild cleanly for MVP


def chunk_text(text: str, chunk_chars: int = CHUNK_CHARS, overlap_chars: int = OVERLAP_CHARS):
    text = " ".join((text or "").split())
    if not text:
        return []

    chunks = []
    start = 0
    n = len(text)

    while start < n:
        end = min(n, start + chunk_chars)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end == n:
            break

        start = max(0, end - overlap_chars)

    return chunks


def extract_pdf_pages(pdf_path: Path):
    """Return list of dicts: {page, text} with 1-indexed pages."""
    pages = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            txt = (page.extract_text() or "").strip()
            if txt:
                pages.append({"page": i, "text": txt})

    return pages


def reset_vector_store():
    if VECTOR_DIR.exists():
        shutil.rmtree(VECTOR_DIR)
    VECTOR_DIR.mkdir(parents=True, exist_ok=True)


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    if RESET_COLLECTION:
        reset_vector_store()
    else:
        VECTOR_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(glob.glob(str(RAW_DIR / "*.pdf")))
    if not pdf_files:
        raise RuntimeError(f"No PDFs found in {RAW_DIR.resolve()}")

    print(f"Using PDFs from: {RAW_DIR.resolve()}")
    print(f"Vector store: {VECTOR_DIR.resolve()}")
    print(f"Embedding model: {EMBED_MODEL_NAME}")

    model = SentenceTransformer(EMBED_MODEL_NAME)
    ch_client = chromadb.PersistentClient(path=str(VECTOR_DIR))

    collection = ch_client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"embedding_model": EMBED_MODEL_NAME}
    )

    all_records = []

    for pdf_fp in pdf_files:
        pdf_path = Path(pdf_fp)
        doc_name = pdf_path.name
        print(f"\nProcessing: {doc_name}")

        pages = extract_pdf_pages(pdf_path)

        for p in pages:
            page_num = p["page"]
            page_text = p["text"]

            chunks = chunk_text(page_text)

            for idx, chunk in enumerate(chunks):
                chunk_id = f"{doc_name}::p{page_num}::c{idx}"
                all_records.append({
                    "id": chunk_id,
                    "doc_name": doc_name,
                    "page": page_num,
                    "chunk_index": idx,
                    "text": chunk
                })

    if not all_records:
        raise RuntimeError("No text chunks were created from the PDFs.")

    out_jsonl = PROCESSED_DIR / "chunks.jsonl"
    with out_jsonl.open("w", encoding="utf-8") as f:
        for record in all_records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"\nSaved chunks to: {out_jsonl}")
    print(f"Total chunks: {len(all_records)}")

    for i in range(0, len(all_records), BATCH_SIZE):
        batch = all_records[i:i + BATCH_SIZE]
        texts = [b["text"] for b in batch]

        embeddings = model.encode(texts, normalize_embeddings=True).tolist()

        ids = [b["id"] for b in batch]
        metadatas = [
            {
                "doc_name": b["doc_name"],
                "page": b["page"],
                "chunk_index": b["chunk_index"]
            }
            for b in batch
        ]

        collection.upsert(
            ids=ids,
            documents=texts,
            metadatas=metadatas,
            embeddings=embeddings
        )

        print(f"Indexed {min(i + BATCH_SIZE, len(all_records))}/{len(all_records)}")

    print("\nDone indexing SOPs.")
    print(f"Collection: {COLLECTION_NAME}")


if __name__ == "__main__":
    main()