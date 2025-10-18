"""
Cloud Storage Connector
Supports AWS S3, Azure Blob Storage, and Google Cloud Storage
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta
import io

router = APIRouter(prefix="/cloud-storage", tags=["cloud-storage"])
logger = logging.getLogger(__name__)


class StorageConfig(BaseModel):
    provider: str  # 's3' | 'azure' | 'gcs'
    credentials: Dict[str, str]
    bucket_name: str  # bucket (S3), container (Azure), bucket (GCS)
    region: Optional[str] = None
    options: Dict[str, Any] = {}


class UploadRequest(BaseModel):
    company_id: str
    config: StorageConfig
    file_path: str  # Path in cloud storage
    metadata: Optional[Dict[str, str]] = None


class DownloadRequest(BaseModel):
    company_id: str
    config: StorageConfig
    file_path: str


class ListFilesRequest(BaseModel):
    company_id: str
    config: StorageConfig
    prefix: Optional[str] = None
    max_results: int = 100


class CloudStorageConnector:
    """Unified cloud storage connector"""
    
    def __init__(self):
        self.clients = {}
    
    def get_client(self, config: StorageConfig):
        """Get cloud storage client"""
        if config.provider == 's3':
            return self._get_s3_client(config)
        elif config.provider == 'azure':
            return self._get_azure_client(config)
        elif config.provider == 'gcs':
            return self._get_gcs_client(config)
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")
    
    def _get_s3_client(self, config: StorageConfig):
        """Get AWS S3 client"""
        try:
            import boto3
            
            client = boto3.client(
                's3',
                aws_access_key_id=config.credentials.get('access_key_id'),
                aws_secret_access_key=config.credentials.get('secret_access_key'),
                region_name=config.region or 'us-east-1'
            )
            return client
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="AWS SDK not installed. Install with: pip install boto3"
            )
    
    def _get_azure_client(self, config: StorageConfig):
        """Get Azure Blob Storage client"""
        try:
            from azure.storage.blob import BlobServiceClient
            
            connection_string = config.credentials.get('connection_string')
            if connection_string:
                client = BlobServiceClient.from_connection_string(connection_string)
            else:
                account_url = f"https://{config.credentials.get('account_name')}.blob.core.windows.net"
                client = BlobServiceClient(
                    account_url=account_url,
                    credential=config.credentials.get('account_key')
                )
            return client
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="Azure SDK not installed. Install with: pip install azure-storage-blob"
            )
    
    def _get_gcs_client(self, config: StorageConfig):
        """Get Google Cloud Storage client"""
        try:
            from google.cloud import storage
            import json
            
            # Create credentials from service account JSON
            credentials_json = config.credentials.get('service_account_json')
            if credentials_json:
                # Write to temp file and initialize client
                import tempfile
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    f.write(json.dumps(credentials_json))
                    temp_path = f.name
                
                client = storage.Client.from_service_account_json(temp_path)
                import os
                os.unlink(temp_path)  # Clean up temp file
                return client
            else:
                # Use default credentials
                client = storage.Client()
                return client
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="GCS SDK not installed. Install with: pip install google-cloud-storage"
            )
    
    async def upload_file(
        self,
        config: StorageConfig,
        file_content: bytes,
        file_path: str,
        metadata: Optional[Dict[str, str]] = None
    ):
        """Upload file to cloud storage"""
        try:
            if config.provider == 's3':
                return await self._upload_s3(config, file_content, file_path, metadata)
            elif config.provider == 'azure':
                return await self._upload_azure(config, file_content, file_path, metadata)
            elif config.provider == 'gcs':
                return await self._upload_gcs(config, file_content, file_path, metadata)
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _upload_s3(self, config, file_content, file_path, metadata):
        """Upload to S3"""
        client = self.get_client(config)
        
        extra_args = {}
        if metadata:
            extra_args['Metadata'] = metadata
        
        client.put_object(
            Bucket=config.bucket_name,
            Key=file_path,
            Body=file_content,
            **extra_args
        )
        
        return {
            "provider": "s3",
            "bucket": config.bucket_name,
            "key": file_path,
            "size": len(file_content)
        }
    
    async def _upload_azure(self, config, file_content, file_path, metadata):
        """Upload to Azure Blob Storage"""
        client = self.get_client(config)
        container_client = client.get_container_client(config.bucket_name)
        blob_client = container_client.get_blob_client(file_path)
        
        blob_client.upload_blob(
            file_content,
            overwrite=True,
            metadata=metadata or {}
        )
        
        return {
            "provider": "azure",
            "container": config.bucket_name,
            "blob": file_path,
            "size": len(file_content)
        }
    
    async def _upload_gcs(self, config, file_content, file_path, metadata):
        """Upload to Google Cloud Storage"""
        client = self.get_client(config)
        bucket = client.bucket(config.bucket_name)
        blob = bucket.blob(file_path)
        
        if metadata:
            blob.metadata = metadata
        
        blob.upload_from_string(file_content)
        
        return {
            "provider": "gcs",
            "bucket": config.bucket_name,
            "blob": file_path,
            "size": len(file_content)
        }
    
    async def download_file(self, config: StorageConfig, file_path: str):
        """Download file from cloud storage"""
        try:
            if config.provider == 's3':
                return await self._download_s3(config, file_path)
            elif config.provider == 'azure':
                return await self._download_azure(config, file_path)
            elif config.provider == 'gcs':
                return await self._download_gcs(config, file_path)
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _download_s3(self, config, file_path):
        """Download from S3"""
        client = self.get_client(config)
        
        response = client.get_object(
            Bucket=config.bucket_name,
            Key=file_path
        )
        
        return response['Body'].read()
    
    async def _download_azure(self, config, file_path):
        """Download from Azure"""
        client = self.get_client(config)
        container_client = client.get_container_client(config.bucket_name)
        blob_client = container_client.get_blob_client(file_path)
        
        return blob_client.download_blob().readall()
    
    async def _download_gcs(self, config, file_path):
        """Download from GCS"""
        client = self.get_client(config)
        bucket = client.bucket(config.bucket_name)
        blob = bucket.blob(file_path)
        
        return blob.download_as_bytes()
    
    async def list_files(
        self,
        config: StorageConfig,
        prefix: Optional[str] = None,
        max_results: int = 100
    ):
        """List files in cloud storage"""
        try:
            if config.provider == 's3':
                return await self._list_s3(config, prefix, max_results)
            elif config.provider == 'azure':
                return await self._list_azure(config, prefix, max_results)
            elif config.provider == 'gcs':
                return await self._list_gcs(config, prefix, max_results)
        except Exception as e:
            logger.error(f"List files failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _list_s3(self, config, prefix, max_results):
        """List S3 objects"""
        client = self.get_client(config)
        
        params = {
            'Bucket': config.bucket_name,
            'MaxKeys': max_results
        }
        if prefix:
            params['Prefix'] = prefix
        
        response = client.list_objects_v2(**params)
        
        files = []
        for obj in response.get('Contents', []):
            files.append({
                'name': obj['Key'],
                'size': obj['Size'],
                'last_modified': obj['LastModified'].isoformat(),
                'etag': obj['ETag']
            })
        
        return files
    
    async def _list_azure(self, config, prefix, max_results):
        """List Azure blobs"""
        client = self.get_client(config)
        container_client = client.get_container_client(config.bucket_name)
        
        blobs = container_client.list_blobs(name_starts_with=prefix)
        
        files = []
        count = 0
        for blob in blobs:
            if count >= max_results:
                break
            files.append({
                'name': blob.name,
                'size': blob.size,
                'last_modified': blob.last_modified.isoformat(),
                'etag': blob.etag
            })
            count += 1
        
        return files
    
    async def _list_gcs(self, config, prefix, max_results):
        """List GCS objects"""
        client = self.get_client(config)
        bucket = client.bucket(config.bucket_name)
        
        blobs = bucket.list_blobs(prefix=prefix, max_results=max_results)
        
        files = []
        for blob in blobs:
            files.append({
                'name': blob.name,
                'size': blob.size,
                'last_modified': blob.updated.isoformat() if blob.updated else None,
                'etag': blob.etag
            })
        
        return files
    
    async def delete_file(self, config: StorageConfig, file_path: str):
        """Delete file from cloud storage"""
        try:
            if config.provider == 's3':
                client = self.get_client(config)
                client.delete_object(Bucket=config.bucket_name, Key=file_path)
            elif config.provider == 'azure':
                client = self.get_client(config)
                container_client = client.get_container_client(config.bucket_name)
                blob_client = container_client.get_blob_client(file_path)
                blob_client.delete_blob()
            elif config.provider == 'gcs':
                client = self.get_client(config)
                bucket = client.bucket(config.bucket_name)
                blob = bucket.blob(file_path)
                blob.delete()
            
            return {"status": "deleted", "file": file_path}
        except Exception as e:
            logger.error(f"Delete failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))


# Initialize connector
storage_connector = CloudStorageConnector()


@router.post("/test-connection")
async def test_connection(config: StorageConfig):
    """Test cloud storage connection"""
    try:
        # Try to list files to verify connection
        files = await storage_connector.list_files(config, max_results=1)
        
        return {
            "status": "success",
            "message": f"Successfully connected to {config.provider}",
            "bucket": config.bucket_name
        }
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    config_json: str = None  # JSON string of StorageConfig
):
    """Upload file to cloud storage"""
    try:
        import json
        config = StorageConfig(**json.loads(config_json))
        
        # Read file content
        content = await file.read()
        
        result = await storage_connector.upload_file(
            config,
            content,
            file.filename,
            metadata={"uploaded_at": datetime.utcnow().isoformat()}
        )
        
        return {
            "status": "success",
            "upload_result": result
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/download")
async def download_file(request: DownloadRequest):
    """Download file from cloud storage"""
    try:
        content = await storage_connector.download_file(
            request.config,
            request.file_path
        )
        
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={request.file_path.split('/')[-1]}"
            }
        )
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/list")
async def list_files(request: ListFilesRequest):
    """List files in cloud storage"""
    try:
        files = await storage_connector.list_files(
            request.config,
            request.prefix,
            request.max_results
        )
        
        return {
            "status": "success",
            "company_id": request.company_id,
            "files": files,
            "count": len(files)
        }
    except Exception as e:
        logger.error(f"List files failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def cloud_storage_health():
    """Health check for cloud storage connector"""
    return {
        "status": "ok",
        "connector": "cloud-storage",
        "supported_providers": ["s3", "azure", "gcs"]
    }



