import boto3
from botocore.config import Config
from app.core.secrets import secrets_manager
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class R2Service:
    """
    Servico para interacao com Cloudflare R2 (S3-compatible).
    Utilizado para armazenamento de fotos de inspecoes e avarias.
    Recupera secrets do SecretsManager.
    """
    
    def __init__(self):
        self._s3_client = None
        self._public_url = None
        self._bucket_name = None

    async def _get_client(self):
        """Inicializacao assincrona do cliente S3 com secrets do banco."""
        if self._s3_client:
            return self._s3_client

        try:
            endpoint_url = await secrets_manager.get_secret("R2_ENDPOINT")
            access_key_id = await secrets_manager.get_secret("R2_ACCESS_KEY_ID")
            secret_access_key = await secrets_manager.get_secret("R2_SECRET_ACCESS_KEY")
            self._bucket_name = await secrets_manager.get_secret("R2_BUCKET_NAME")
            self._public_url = await secrets_manager.get_secret("R2_PUBLIC_URL")

            self._s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                config=Config(signature_version='s3v4'),
                region_name='auto'
            )
            return self._s3_client
        except Exception as e:
            logger.error(f"Erro ao configurar R2Service: {str(e)}")
            raise ValueError(f"Configuracao do R2 incompleta: {str(e)}")

    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> str:
        """
        Upload de arquivo para o bucket R2.
        Retorna a URL publica do arquivo.
        """
        client = await self._get_client()
        
        # boto3.put_object eh sincrono, mas estamos em um contexto async. 
        # Em producao idealmente rodaríamos em um threadpool se o volume fosse alto.
        client.put_object(
            Bucket=self._bucket_name,
            Key=filename,
            Body=file_content,
            ContentType=content_type
        )
        
        return f"{self._public_url}/{filename}"

    async def delete_file(self, filename: str):
        """
        Remove arquivo do bucket R2.
        """
        client = await self._get_client()
        client.delete_object(
            Bucket=self._bucket_name,
            Key=filename
        )
