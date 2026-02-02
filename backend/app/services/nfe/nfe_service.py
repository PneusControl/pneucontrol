import base64
import httpx
import json
from typing import Dict, Any, List, Optional
from app.services.nfe.parser import NFeParser
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
        Processa XML utilizando o NFeParser nativo e normaliza as chaves.
        """
        parser = NFeParser(xml_content)
        raw_data = parser.parse()
        
        # Normalizar chaves para consistencia com OCR e Backend
        data = {
            "nfe_number": raw_data["nfe_number"],
            "series": raw_data["series"],
            "issue_date": raw_data["issue_date"][:10], # Pega apenas YYYY-MM-DD
            "total_amount": raw_data["total_value"],
            "supplier": raw_data["issuer"], # NFeParser usa 'issuer'
            "items": [],
            "source": "xml"
        }
        
        for item in raw_data["items"]:
            data["items"].append({
                "description": item["description"],
                "quantity": item["qty"],
                "unit_price": item["unit_price"],
                "brand": "N/D", # XML nem sempre tem marca/modelo explicito por item
                "model": "N/D",
                "size": "N/D",
                "serial_number": item.get("serial_number")
            })
            
        return data

    async def process_pdf_ocr(self, pdf_content: bytes) -> Dict[str, Any]:
        """
        Processa PDF enviando para o Gemini via OpenRouter.
        """
        if not self.openrouter_key:
            raise ValueError("Chave do OpenRouter nao configurada para OCR.")

        # Converter PDF para base64
        encoded_pdf = base64.b64encode(pdf_content).decode('utf-8')

        prompt = """
        Extraia os dados desta Nota Fiscal (DANFE) e retorne EXATAMENTE um JSON no seguinte formato:
        {
            "nfe_number": "numero da nota",
            "series": "serie",
            "issue_date": "YYYY-MM-DD",
            "total_amount": 0.0,
            "supplier": {
                "cnpj": "CNPJ apenas numeros",
                "name": "Razao Social / Nome Fantasia",
                "email": "email se houver",
                "phone": "telefone se houver"
            },
            "items": [
                {
                    "description": "descricao completa do pneu",
                    "quantity": 1,
                    "unit_price": 0.0,
                    "brand": "Marca (ex: Michelin, Bridgestone)",
                    "model": "Modelo (ex: XZA, R268)",
                    "size": "Medida (ex: 295/80R22.5)"
                }
            ]
        }
        
        Importante: 
        1. Foque apenas nos itens que sao PNEUS. Ignore fretes ou taxas.
        2. Certifique-se de que o CNPJ contenha apenas numeros.
        3. Tente deduzir Marca, Modelo e Medida a partir da descricao se nao houver campos especificos.
        """

        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pneucontrol.com.br",
            "X-Title": "Pneu Control AI"
        }

        payload = {
            "model": "google/gemini-pro-vision", # Usando modelo vision adequado
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
                content_str = result["choices"][0]["message"]["content"]
                
                # Parsing resiliente
                try:
                    content = json.loads(content_str)
                except:
                    # Tentar limpar markdown se houver
                    import re
                    json_match = re.search(r'\{.*\}', content_str, re.DOTALL)
                    if json_match:
                        content = json.loads(json_match.group())
                    else:
                        raise ValueError("IA nao retornou um JSON valido")
                
                content["source"] = "pdf_ocr"
                return content

            except Exception as e:
                logger.exception("Erro ao processar PDF via OCR")
                raise Exception(f"Erro no processamento de OCR: {str(e)}")
