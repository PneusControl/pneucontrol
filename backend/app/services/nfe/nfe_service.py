import base64
import httpx
import json
from typing import Dict, Any, List, Optional
from backend.app.services.nfe.parser import NFeParser
import logging

logger = logging.getLogger(__name__)

class NFeService:
    """
    Servico para processamento de Notas Fiscais (XML e PDF).
    Utiliza NFeParser para XML e OpenRouter para OCR de PDF.
    """

    def __init__(self, openrouter_key: Optional[str] = None):
        self.openrouter_key = openrouter_key
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"

    async def process_file(self, content: bytes, filename: str) -> Dict[str, Any]:
        """
        Detecta o tipo de arquivo e processa adequadamente.
        """
        if filename.lower().endswith('.xml'):
            return self.process_xml(content.decode('utf-8'))
        elif filename.lower().endswith('.pdf'):
            return await self.process_pdf_ocr(content)
        else:
            raise ValueError("Formato de arquivo nao suportado. Use XML ou PDF.")

    def process_xml(self, xml_content: str) -> Dict[str, Any]:
        """
        Processa XML utilizando o NFeParser nativo.
        """
        parser = NFeParser(xml_content)
        data = parser.parse()
        data["source"] = "xml"
        return data

    async def process_pdf_ocr(self, pdf_content: bytes) -> Dict[str, Any]:
        """
        Processa PDF enviando para o Gemini via OpenRouter.
        """
        if not self.openrouter_key:
            raise ValueError("Chave do OpenRouter nao configurada para OCR.")

        # Converter PDF para base64
        encoded_pdf = base64.b64encode(pdf_content).decode('base-content')

        prompt = """
        Extraia os dados desta Nota Fiscal (DANFE) e retorne EXATAMENTE um JSON no seguinte formato:
        {
            "nfe_number": "numero da nota",
            "series": "serie",
            "issue_date": "YYYY-MM-DD",
            "issuer": {
                "cnpj": "CNPJ sem pontos",
                "name": "Nome da empresa"
            },
            "total_value": 0.0,
            "items": [
                {
                    "sku": "codigo",
                    "description": "descricao completa do pneu",
                    "qty": 1,
                    "unit_price": 0.0,
                    "ncm": "ncm"
                }
            ]
        }
        
        Importante: Foque apenas nos itens que sao PNEUS. Ignore fretes ou taxas.
        """

        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pneucontrol.com.br", # Requisito OpenRouter
            "X-Title": "Pneu Control AI"
        }

        payload = {
            "model": "google/gemini-1.5-flash",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:application/pdf;base64,{encoded_pdf}"
                            }
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.openrouter_url, headers=headers, json=payload, timeout=60.0)
                if response.status_code != 200:
                    logger.error(f"Erro OpenRouter: {response.text}")
                    raise Exception(f"Falha na comunicacao com IA (Status {response.status_code})")

                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Caso a IA retorne como string markdown
                if isinstance(content, str):
                    content = json.loads(content.replace('```json', '').replace('```', ''))
                
                content["source"] = "pdf_ocr"
                return content

            except Exception as e:
                logger.exception("Erro ao processar PDF via OCR")
                raise Exception(f"Erro no processamento de OCR: {str(e)}")
