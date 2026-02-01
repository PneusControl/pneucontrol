import xml.etree.ElementTree as ET
from typing import List, Dict, Any
import re

class NFeParser:
    """
    Parser para extrair dados relevantes de XML de Nota Fiscal Eletronica (NFe).
    Focado em dados do emitente, destinatario e itens (pneus).
    """
    
    NAMESPACE = {'ns': 'http://www.portalfiscal.inf.br/nfe'}

    def __init__(self, xml_content: str):
        self.root = ET.fromstring(xml_content)

    def parse(self) -> Dict[str, Any]:
        infNFe = self.root.find('.//ns:infNFe', self.NAMESPACE)
        if infNFe is None:
            raise ValueError("O XML fornecido nao e uma NFe valida.")

        emitente = infNFe.find('ns:emit', self.NAMESPACE)
        destinatario = infNFe.find('ns:dest', self.NAMESPACE)
        ide = infNFe.find('ns:ide', self.NAMESPACE)

        items = []
        for det in infNFe.findall('ns:det', self.NAMESPACE):
            prod = det.find('ns:prod', self.NAMESPACE)
            infAdProd = det.find('ns:infAdProd', self.NAMESPACE)
            
            # Tentar extrair serial number do campo de informacoes adicionais do produto
            # Padrao comum: "SN: 123456789" ou similar
            serial_match = re.search(r'S/N:?\s*(\w+)', infAdProd.text if infAdProd is not None else "")
            serial = serial_match.group(1) if serial_match else None

            items.append({
                "item_number": det.get('nItem'),
                "sku": prod.find('ns:cProd', self.NAMESPACE).text,
                "description": prod.find('ns:xProd', self.NAMESPACE).text,
                "ncm": prod.find('ns:NCM', self.NAMESPACE).text,
                "qty": float(prod.find('ns:qCom', self.NAMESPACE).text),
                "unit_price": float(prod.find('ns:vUnCom', self.NAMESPACE).text),
                "serial_number": serial
            })

        return {
            "nfe_number": ide.find('ns:nNF', self.NAMESPACE).text,
            "series": ide.find('ns:serie', self.NAMESPACE).text,
            "issue_date": ide.find('ns:dhEmi', self.NAMESPACE).text,
            "issuer": {
                "cnpj": emitente.find('ns:CNPJ', self.NAMESPACE).text,
                "name": emitente.find('ns:xNome', self.NAMESPACE).text
            },
            "receiver": {
                "cnpj": destinatario.find('ns:CNPJ', self.NAMESPACE).text if destinatario.find('ns:CNPJ', self.NAMESPACE) is not None else destinatario.find('ns:CPF', self.NAMESPACE).text,
                "name": destinatario.find('ns:xNome', self.NAMESPACE).text
            },
            "items": items,
            "total_value": float(infNFe.find('.//ns:vNF', self.NAMESPACE).text)
        }
