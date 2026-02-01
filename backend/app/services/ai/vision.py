import httpx
import json
from typing import Dict, Any, Optional
from app.core.secrets import secrets_manager
import logging

logger = logging.getLogger(__name__)

class VisionAnalysisService:
    """
    Servico para analise de imagens utilizando OpenRouter (ex: Claude 3.5 Sonnet ou Gemini 1.5).
    Focado em detectar avarias em pneus (bolhas, cortes, desgaste irregular).
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def _get_api_key(self) -> str:
        if self.api_key:
            return self.api_key
        try:
            return await secrets_manager.get_secret("OPENROUTER_API_KEY")
        except Exception as e:
            logger.error(f"Erro ao buscar OPENROUTER_API_KEY: {str(e)}")
            raise ValueError("Chave do OpenRouter nao configurada.")

    async def analyze_tire_photo(self, photo_url: str) -> Dict[str, Any]:
        api_key = await self._get_api_key()
        
        prompt = """
        Analise esta foto de um pneu de frota pesada (caminhao/onibus). 
        Identifique se existem avarias criticas como: 
        1. Bolhas nas laterais
        2. Cortes profundos que exponham a carcaça/arame
        3. Vulcanizações antigas ou reparos mal feitos
        4. Desgaste irregular acentuado (ex: desgaste em um só ombro)
        5. Corpo estranho encravado (pregos, pedras grandes)

        Retorne EXATAMENTE um JSON no seguinte formato:
        {
            "damages": ["lista de avarias encontradas"],
            "severity": "baixa | media | alta | critica",
            "recommendation": "o que deve ser feito (ex: troca imediata, monitorar, reformar)",
            "safety_score": 0 a 100,
            "observations": "breve descricao técnica do que foi visto"
        }
        """

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pneucontrol.com.br",
            "X-Title": "Pneu Control Vision"
        }

        payload = {
            "model": "anthropic/claude-3.5-sonnet", # Modelo padrao para visao de alta fidelidade
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": photo_url}}
                    ]
                }
            ],
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.base_url, headers=headers, json=payload, timeout=45.0)
                if response.status_code != 200:
                    logger.error(f"Erro OpenRouter Vision: {response.text}")
                    return {"error": "IA indisponivel", "damages": [], "severity": "desconhecida"}
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Tratamento de retorno string vs objeto
                if isinstance(content, str):
                    try:
                        return json.loads(content)
                    except:
                        # Fallback se a IA nao mandou JSON puro
                        return {"error": "Falha no parse da resposta da IA", "raw": content}
                
                return content
            except Exception as e:
                logger.exception("Erro na chamada OpenRouter Vision")
                return {"error": str(e), "damages": [], "severity": "erro"}
