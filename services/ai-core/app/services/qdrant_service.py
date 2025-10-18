from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List, Dict, Any
from app.core.config import settings
from app.core.logging import app_logger
import uuid


class QdrantService:
    def __init__(self):
        try:
            self.client = QdrantClient(url=settings.QDRANT_URL)
            app_logger.info(f"Connected to Qdrant at {settings.QDRANT_URL}")
        except Exception as e:
            app_logger.warning(f"Could not connect to Qdrant at {settings.QDRANT_URL}: {e}")
            app_logger.warning("Qdrant service will return mock data. Start Qdrant to enable vector search.")
            self.client = None
    
    def create_collection(self, collection_name: str, vector_size: int = 1536):
        """Create a collection for embeddings"""
        if not self.client:
            app_logger.warning(f"Qdrant not available, skipping collection creation for {collection_name}")
            return
        
        try:
            collections = self.client.get_collections().collections
            if collection_name in [c.name for c in collections]:
                app_logger.info(f"Collection {collection_name} already exists")
                return
            
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )
            app_logger.info(f"Created collection: {collection_name}")
        except Exception as e:
            app_logger.error(f"Failed to create collection {collection_name}: {e}")
            raise
    
    def upsert_embeddings(
        self, 
        collection_name: str,
        company_id: str,
        documents: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ):
        """Store embeddings with tenant isolation"""
        if not self.client:
            app_logger.warning("Qdrant not available, skipping upsert")
            return {"status": "skipped", "reason": "Qdrant not available"}
        
        try:
            points = [
                PointStruct(
                    id=str(doc.get("id", str(uuid.uuid4()))),
                    vector=embedding,
                    payload={
                        "company_id": company_id,
                        "content": doc["content"],
                        "metadata": doc.get("metadata", {})
                    }
                )
                for doc, embedding in zip(documents, embeddings)
            ]
            
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            app_logger.info(f"Upserted {len(points)} points to {collection_name}")
        except Exception as e:
            app_logger.error(f"Failed to upsert embeddings: {e}")
            raise
    
    def search(
        self,
        collection_name: str,
        company_id: str,
        query_vector: List[float],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search with tenant filtering"""
        if not self.client:
            app_logger.warning("Qdrant not available, returning empty results")
            return []
        
        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="company_id",
                            match=MatchValue(value=company_id)
                        )
                    ]
                ),
                limit=limit
            )
            
            return [
                {
                    "id": result.id,
                    "score": result.score,
                    "content": result.payload.get("content"),
                    "metadata": result.payload.get("metadata", {})
                }
                for result in results
            ]
        except Exception as e:
            app_logger.error(f"Search failed: {e}")
            raise

