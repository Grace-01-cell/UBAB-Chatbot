from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer

# ------------------
# Config
# ------------------

BASE_DIR = Path(__file__).resolve().parents[2]   # backend/
DATA_DIR = BASE_DIR / "data"
VECTOR_DIR = DATA_DIR / "vectorstore" / "chroma"

COLLECTION_NAME = "sop_chunks_local"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"


# Load embedding model once
_model = SentenceTransformer(EMBED_MODEL_NAME)


def get_collection():
    client = chromadb.PersistentClient(path=str(VECTOR_DIR))
    return client.get_or_create_collection(name=COLLECTION_NAME)


def retrieve(query: str, k: int = 5):
    """
    Retrieve top-k chunks from the SOP vector store.
    """

    if not query.strip():
        return []

    col = get_collection()

    # Embed query using the SAME model used during ingestion
    query_embedding = _model.encode([query], normalize_embeddings=True).tolist()

    res = col.query(
        query_embeddings=query_embedding,
        n_results=k,
        include=["documents", "metadatas", "distances"]
    )

    hits = []

    if not res["ids"]:
        return hits

    for i in range(len(res["ids"][0])):
        hits.append({
            "id": res["ids"][0][i],
            "text": res["documents"][0][i],
            "meta": res["metadatas"][0][i],
            "distance": res["distances"][0][i],
        })

    return hits