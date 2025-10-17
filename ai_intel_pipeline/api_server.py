from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .storage.vault import Vault
from .storage.index import Index
from .model.embedder import query_embeddings
from .model.recommend import recommend
from .config import load_profile, load_settings
from .llm import have_llm, llm_complete_json

app = FastAPI(title="AI Intel Pipeline API", version="1.0.0")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict]
    query: str

class ReportResponse(BaseModel):
    counts: Dict
    by_source: Dict
    pillars: Dict
    top_items: List[Dict]

# Initialize storage
VAULT_ROOT = Path("vault/ai-intel")
INDEX_PATH = Path("vault/index.csv")
MODEL_DIR = Path("vault/model")

@app.get("/")
def root():
    return {"message": "AI Intel Pipeline API", "version": "1.0.0"}

@app.get("/health")
def health():
    """Health check endpoint"""
    vault = Vault(root=VAULT_ROOT)
    index = Index(index_path=INDEX_PATH)
    
    # Get basic stats
    try:
        with INDEX_PATH.open("r", encoding="utf-8") as f:
            lines = f.readlines()
            item_count = len(lines) - 1  # Subtract header
    except Exception:
        item_count = 0
    
    return {
        "status": "healthy",
        "vault_exists": VAULT_ROOT.exists(),
        "index_exists": INDEX_PATH.exists(),
        "model_exists": MODEL_DIR.exists(),
        "item_count": item_count,
        "llm_available": have_llm()
    }

@app.get("/report", response_model=ReportResponse)
def get_report():
    """Generate report data for dashboard"""
    index = Index(index_path=INDEX_PATH)
    
    # Load index data
    try:
        with INDEX_PATH.open("r", encoding="utf-8") as f:
            import csv
            reader = csv.DictReader(f)
            rows = list(reader)
    except Exception:
        rows = []
    
    # Compute stats
    counts = {"items": len(rows)}
    by_source = {}
    pillars = {}
    top_items = []
    
    for row in rows:
        # Source stats
        source = row.get("source", "Unknown")
        by_source[source] = by_source.get(source, 0) + 1
        
        # Build top items
        try:
            overall = float(row.get("overall", 0))
            top_items.append({
                "title": row.get("title", ""),
                "url": row.get("url", ""),
                "overall": overall,
                "source": source,
                "date": row.get("date", "")
            })
        except Exception:
            pass
    
    # Sort top items by score
    top_items.sort(key=lambda x: x.get("overall", 0), reverse=True)
    top_items = top_items[:10]
    
    # TODO: Extract pillars from individual items
    # For now, return empty pillars dict
    
    return ReportResponse(
        counts=counts,
        by_source=by_source,
        pillars=pillars,
        top_items=top_items
    )

@app.get("/items")
def get_items(
    limit: int = Query(default=50, ge=1, le=500),
    source: Optional[str] = Query(default=None),
    pillar: Optional[str] = Query(default=None)
):
    """Get filtered list of items"""
    try:
        with INDEX_PATH.open("r", encoding="utf-8") as f:
            import csv
            reader = csv.DictReader(f)
            rows = list(reader)
    except Exception:
        rows = []
    
    # Apply filters
    if source:
        rows = [r for r in rows if r.get("source", "").lower() == source.lower()]
    
    # TODO: Add pillar filtering when pillar data is available
    
    # Sort by overall score
    def get_score(row):
        try:
            return float(row.get("overall", 0))
        except Exception:
            return 0.0
    
    rows.sort(key=get_score, reverse=True)
    rows = rows[:limit]
    
    # Convert to structured format
    items = []
    for row in rows:
        items.append({
            "id": row.get("item_id", ""),
            "title": row.get("title", ""),
            "url": row.get("url", ""),
            "source": row.get("source", ""),
            "source_type": row.get("ctype", ""),
            "date": row.get("date", ""),
            "overall": get_score(row),
            # TODO: Add more fields from vault data
        })
    
    return {"items": items, "total": len(rows)}

@app.post("/query", response_model=QueryResponse)
def query_knowledge_base(request: QueryRequest):
    """Query the knowledge base using RAG"""
    if not have_llm():
        raise HTTPException(status_code=503, detail="LLM not available - set API keys")
    
    if not MODEL_DIR.exists():
        raise HTTPException(status_code=404, detail="Embeddings not built - run 'index-model' command first")
    
    # Get relevant chunks using embeddings
    hits = query_embeddings(MODEL_DIR, query=request.query, top_k=request.top_k * 2)
    
    if not hits:
        return QueryResponse(
            answer="I couldn't find any relevant information in your knowledge base for that query.",
            sources=[],
            query=request.query
        )
    
    # Prepare context for LLM
    context_chunks = []
    sources = []
    
    for hit in hits[:request.top_k]:
        context_chunks.append(hit.get("text", ""))
        sources.append({
            "item_id": hit.get("item_id", ""),
            "title": hit.get("title", ""),
            "url": hit.get("url", ""),
            "score": hit.get("score", 0.0)
        })
    
    context = "\n\n".join(context_chunks)
    
    # Generate answer using LLM
    system_prompt = (
        "You are an AI assistant that answers questions based on a curated knowledge base "
        "of AI development insights. Use only the provided context to answer questions. "
        "If the context doesn't contain enough information, say so. Always cite which "
        "sources support your answer."
    )
    
    user_prompt = f"""Context from knowledge base:
{context}

Question: {request.query}

Please provide a comprehensive answer based on the context above, and indicate which sources support your response."""
    
    try:
        # Use the existing LLM wrapper
        response = llm_complete_json(
            system=system_prompt,
            user={"query": request.query, "context": context},
            max_tokens=800
        )
        
        if isinstance(response, dict) and response.get("answer"):
            answer = response["answer"]
        else:
            # Fallback to basic string response
            answer = "Based on your knowledge base, I found relevant information but couldn't generate a structured response."
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
    
    return QueryResponse(
        answer=answer,
        sources=sources,
        query=request.query
    )

@app.get("/recommendations")
def get_recommendations(top_k: int = Query(default=5, ge=1, le=20)):
    """Get personalized recommendations"""
    profile = load_profile()
    vault = Vault(root=VAULT_ROOT)
    
    try:
        recs = recommend(
            vault_root=VAULT_ROOT.parent,  # Adjust path
            index_csv=INDEX_PATH,
            model_dir=MODEL_DIR,
            profile=profile,
            top_k=top_k
        )
        return {"recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

class IngestUrlRequest(BaseModel):
    url: str
    dry_run: Optional[bool] = False

@app.post("/ingest-url")
def ingest_url_endpoint(request: IngestUrlRequest):
    """Manually ingest a single source URL (YouTube or GitHub)"""
    settings = load_settings()
    vault = Vault(root=VAULT_ROOT)
    index = Index(index_path=INDEX_PATH)
    
    try:
        from .pipeline import run_ingest_url
        item_id = run_ingest_url(
            url=request.url,
            settings=settings,
            vault=vault,
            index=index,
            dry_run=request.dry_run
        )
        
        if item_id:
            return {
                "success": True,
                "item_id": item_id,
                "message": f"Successfully ingested {request.url}"
            }
        else:
            raise HTTPException(status_code=400, detail="URL was already processed or failed validation")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")

# Serve static files for the frontend
if Path("ui").exists():
    app.mount("/ui", StaticFiles(directory="ui", html=True), name="ui")

if Path("web/dist").exists():
    app.mount("/", StaticFiles(directory="web/dist", html=True), name="web")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)