from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.embeddings_service import EmbeddingsService
from app.services.qdrant_service import QdrantService
from app.core.multi_tenant import get_company_context
from app.core.logging import app_logger

router = APIRouter(prefix="/embeddings", tags=["embeddings"])


class UpsertRequest(BaseModel):
    collection: str
    documents: List[Dict[str, Any]]


class SearchRequest(BaseModel):
    collection: str
    query: str
    limit: int = 5


@router.post("/upsert")
async def upsert_embeddings(
    request: UpsertRequest,
    context: Dict = Depends(get_company_context)
):
    """Store document embeddings with tenant isolation"""
    try:
        embeddings_svc = EmbeddingsService()
        qdrant_svc = QdrantService()
        
        # Ensure collection exists
        qdrant_svc.create_collection(request.collection)
        
        # Generate embeddings
        texts = [doc["content"] for doc in request.documents]
        embeddings = await embeddings_svc.embed_texts(texts)
        
        # Store in Qdrant
        qdrant_svc.upsert_embeddings(
            collection_name=request.collection,
            company_id=context["company_id"],
            documents=request.documents,
            embeddings=embeddings
        )
        
        app_logger.info(f"Upserted {len(request.documents)} documents for company {context['company_id']}")
        return {"status": "success", "count": len(request.documents)}
        
    except Exception as e:
        app_logger.error(f"Upsert failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_embeddings(
    request: SearchRequest,
    context: Dict = Depends(get_company_context)
):
    """Semantic search with RAG"""
    try:
        embeddings_svc = EmbeddingsService()
        qdrant_svc = QdrantService()
        
        # Embed query
        query_vector = await embeddings_svc.embed_text(request.query)
        
        # Search
        results = qdrant_svc.search(
            collection_name=request.collection,
            company_id=context["company_id"],
            query_vector=query_vector,
            limit=request.limit
        )
        
        app_logger.info(f"Search returned {len(results)} results for company {context['company_id']}")
        return {"results": results}
        
    except Exception as e:
        app_logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections")
async def list_collections(context: Dict = Depends(get_company_context)):
    """List available collections"""
    try:
        qdrant_svc = QdrantService()
        collections = qdrant_svc.client.get_collections().collections
        return {"collections": [c.name for c in collections]}
    except Exception as e:
        app_logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

