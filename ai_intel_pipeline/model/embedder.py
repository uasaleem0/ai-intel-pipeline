from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict, Tuple
import numpy as np


def _iter_export_chunks(export_path: Path):
    with export_path.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                yield json.loads(line)
            except Exception:
                continue


def build_embeddings(export_jsonl: Path, out_dir: Path, model: str = "text-embedding-3-small", batch: int = 64) -> Tuple[Path, Path]:
    """Embed chunks.jsonl and store vectors + meta for retrieval.

    Outputs:
    - out_dir/embeddings.npy (float32, shape [N, D])
    - out_dir/meta.jsonl (one line per vector with item metadata)
    """
    from openai import OpenAI

    out_dir.mkdir(parents=True, exist_ok=True)
    meta_path = out_dir / "meta.jsonl"
    emb_path = out_dir / "embeddings.npy"
    client = OpenAI()

    chunks = list(_iter_export_chunks(export_jsonl))
    texts = [c.get("text", "")[:3000] for c in chunks]
    metas = chunks
    vectors: List[np.ndarray] = []
    # batch process
    for i in range(0, len(texts), batch):
        batch_texts = texts[i : i + batch]
        if not batch_texts:
            continue
        resp = client.embeddings.create(model=model, input=batch_texts)
        # openai>=2 returns data list with embedding
        vecs = [np.array(d.embedding, dtype=np.float32) for d in resp.data]
        vectors.extend(vecs)

    if not vectors:
        # empty fallback
        np.save(emb_path, np.zeros((0, 1), dtype=np.float32))
        meta_path.write_text("", encoding="utf-8")
        return emb_path, meta_path

    mat = np.vstack(vectors)
    np.save(emb_path, mat)
    with meta_path.open("w", encoding="utf-8") as f:
        for m in metas:
            f.write(json.dumps(m, ensure_ascii=False) + "\n")
    return emb_path, meta_path


def cosine_sim(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-9)
    b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-9)
    return np.dot(a_norm, b_norm.T)


def query_embeddings(index_dir: Path, query: str, top_k: int = 10, model: str = "text-embedding-3-small") -> List[Dict]:
    from openai import OpenAI

    emb_path = index_dir / "embeddings.npy"
    meta_path = index_dir / "meta.jsonl"
    if not emb_path.exists() or not meta_path.exists():
        return []
    mat = np.load(emb_path)
    metas = [json.loads(line) for line in meta_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if mat.shape[0] == 0 or not metas:
        return []
    client = OpenAI()
    qv = np.array(client.embeddings.create(model=model, input=[query]).data[0].embedding, dtype=np.float32)[None, :]
    sims = cosine_sim(qv, mat)[0]
    idx = np.argsort(-sims)[:top_k]
    out = []
    for i in idx:
        m = metas[int(i)]
        m["score"] = float(sims[int(i)])
        out.append(m)
    return out



def create_embedding(text: str, model: str = "text-embedding-3-small") -> np.ndarray:
    """
    Create a single embedding vector for given text.
    Returns numpy array of shape (D,) where D is embedding dimension.
    """
    from openai import OpenAI
    
    if not text or not text.strip():
        # Return zero vector for empty text
        return np.zeros(1536, dtype=np.float32)
    
    client = OpenAI()
    resp = client.embeddings.create(model=model, input=[text[:3000]])
    return np.array(resp.data[0].embedding, dtype=np.float32)
