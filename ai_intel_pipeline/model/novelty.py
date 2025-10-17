"""
Semantic novelty detection using embeddings.
Compares new items against vault history to determine true novelty.
"""
from __future__ import annotations

from typing import Dict, List, Optional
from pathlib import Path
import json
import numpy as np

from .embedder import create_embedding


def load_vault_embeddings(vault_path: Path) -> Optional[Dict]:
    """
    Load existing embeddings from vault/export/embeddings.npz
    Returns dict with 'embeddings' (np.array) and 'metadata' (list)
    """
    emb_file = vault_path / "export" / "embeddings.npz"
    meta_file = vault_path / "export" / "metadata.json"

    if not emb_file.exists() or not meta_file.exists():
        return None

    try:
        data = np.load(emb_file)
        embeddings = data["embeddings"]
        with open(meta_file, encoding="utf-8") as f:
            metadata = json.load(f)
        return {"embeddings": embeddings, "metadata": metadata}
    except Exception:
        return None


def compute_semantic_novelty(candidate: Dict, highlights: Dict, vault_path: Path, threshold: float = 0.7) -> Dict:
    """
    Compute semantic novelty by comparing candidate against vault history.

    Returns:
        {
            "novelty_score": float (0-1, higher = more novel),
            "similar_items": List[Dict] (top 3 most similar items),
            "reasoning": str
        }
    """
    # Create embedding for new item
    text_parts = [
        candidate.get("title", ""),
        candidate.get("description", ""),
        " ".join(highlights.get("keyphrases", [])),
        " ".join(highlights.get("key_claims", []))
    ]
    new_text = " ".join(part for part in text_parts if part).strip()

    if not new_text:
        return {
            "novelty_score": 0.5,
            "similar_items": [],
            "reasoning": "Insufficient text for embedding"
        }

    try:
        new_embedding = create_embedding(new_text)
    except Exception as e:
        return {
            "novelty_score": 0.5,
            "similar_items": [],
            "reasoning": f"Embedding creation failed: {str(e)}"
        }

    # Load vault embeddings
    vault_data = load_vault_embeddings(vault_path)
    if not vault_data or len(vault_data["embeddings"]) == 0:
        return {
            "novelty_score": 0.9,  # High novelty if no history
            "similar_items": [],
            "reasoning": "No vault history to compare against"
        }

    # Compute cosine similarity with all vault items
    vault_embeddings = vault_data["embeddings"]
    vault_metadata = vault_data["metadata"]

    # Normalize embeddings
    new_emb_norm = new_embedding / (np.linalg.norm(new_embedding) + 1e-10)
    vault_embs_norm = vault_embeddings / (np.linalg.norm(vault_embeddings, axis=1, keepdims=True) + 1e-10)

    # Compute similarities
    similarities = np.dot(vault_embs_norm, new_emb_norm)

    # Find top 3 most similar
    top_indices = np.argsort(similarities)[::-1][:3]
    top_similarities = similarities[top_indices]

    similar_items = []
    for idx, sim in zip(top_indices, top_similarities):
        if idx < len(vault_metadata):
            meta = vault_metadata[idx]
            similar_items.append({
                "item_id": meta.get("item_id"),
                "title": meta.get("title"),
                "similarity": float(sim),
                "url": meta.get("url")
            })

    # Compute novelty score: inverse of max similarity
    max_similarity = float(top_similarities[0]) if len(top_similarities) > 0 else 0.0
    novelty_score = 1.0 - max_similarity

    # Determine reasoning
    if max_similarity > threshold:
        reasoning = f"Very similar to existing item (similarity: {max_similarity:.2f})"
    elif max_similarity > 0.5:
        reasoning = f"Moderately similar to existing items (similarity: {max_similarity:.2f})"
    else:
        reasoning = f"Novel content, low similarity to vault (max: {max_similarity:.2f})"

    return {
        "novelty_score": novelty_score,
        "similar_items": similar_items,
        "reasoning": reasoning
    }


def detect_new_keyphrases(highlights: Dict, vault_path: Path) -> Dict:
    """
    Detect keyphrases that haven't been seen before in the vault.

    Returns:
        {
            "new_keyphrases": List[str],
            "known_keyphrases": List[str],
            "novelty_ratio": float (0-1)
        }
    """
    keyphrases = set(highlights.get("keyphrases", []))

    if not keyphrases:
        return {
            "new_keyphrases": [],
            "known_keyphrases": [],
            "novelty_ratio": 0.0
        }

    # Load all existing keyphrases from vault
    known_keyphrases = set()
    items_dir = vault_path / "ai-intel" / "items"

    if items_dir.exists():
        for month_dir in items_dir.iterdir():
            if not month_dir.is_dir():
                continue
            for item_dir in month_dir.iterdir():
                highlights_file = item_dir / "highlights.json"
                if highlights_file.exists():
                    try:
                        with open(highlights_file, encoding="utf-8") as f:
                            item_highlights = json.load(f)
                            item_kp = item_highlights.get("keyphrases", [])
                            known_keyphrases.update(item_kp)
                    except Exception:
                        continue

    new_kp = list(keyphrases - known_keyphrases)
    known_kp = list(keyphrases & known_keyphrases)
    novelty_ratio = len(new_kp) / len(keyphrases) if keyphrases else 0.0

    return {
        "new_keyphrases": new_kp,
        "known_keyphrases": known_kp,
        "novelty_ratio": novelty_ratio
    }
