"""
BrasilAPI Service - Busca dados de CNPJ via API publica gratuita.
API: https://brasilapi.com.br/docs#tag/CNPJ
"""

import httpx
from typing import Dict, Optional


class BrasilAPIService:
    """Cliente para a API Brasil API (busca de CNPJ)."""

    BASE_URL = "https://brasilapi.com.br/api"

    async def buscar_cnpj(self, cnpj: str) -> Optional[Dict]:
        """
        Busca dados de um CNPJ na Receita Federal via BrasilAPI.

        Args:
            cnpj: CNPJ com ou sem formatacao (aceita 12.345.678/0001-90 ou 12345678000190)

        Returns:
            Dict com dados do CNPJ ou None se nao encontrado.

        Exemplo de retorno:
            {
                "cnpj": "12345678000190",
                "razao_social": "EMPRESA EXEMPLO LTDA",
                "nome_fantasia": "EMPRESA EXEMPLO",
                "porte": "MICRO EMPRESA",
                "natureza_juridica": "206-2 - Sociedade Empresária Limitada",
                "logradouro": "RUA EXEMPLO",
                "numero": "123",
                "complemento": "SALA 1",
                "bairro": "CENTRO",
                "municipio": "SAO PAULO",
                "uf": "SP",
                "cep": "01310-100",
                "telefone": "(11) 1234-5678",
                "email": "contato@exemplo.com.br",
                "situacao_cadastral": "ATIVA",
                "data_situacao_cadastral": "2020-01-01",
                "cnae_fiscal": 4711301,
                "cnae_fiscal_descricao": "Comércio varejista de mercadorias em geral"
            }
        """
        # Remove formatacao do CNPJ
        cnpj_limpo = "".join(filter(str.isdigit, cnpj))

        if len(cnpj_limpo) != 14:
            raise ValueError(f"CNPJ invalido: {cnpj}. Deve ter 14 digitos.")

        url = f"{self.BASE_URL}/cnpj/v1/{cnpj_limpo}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url)

                if response.status_code == 200:
                    data = response.json()
                    # Normaliza campos para snake_case
                    return self._normalize_response(data)

                if response.status_code == 404:
                    return None

                # Outro erro
                response.raise_for_status()

            except httpx.HTTPError as e:
                print(f"Erro ao buscar CNPJ {cnpj}: {e}")
                return None

    def _normalize_response(self, data: Dict) -> Dict:
        """Normaliza resposta da API para snake_case."""
        return {
            "cnpj": data.get("cnpj"),
            "razao_social": data.get("razao_social"),
            "nome_fantasia": data.get("nome_fantasia"),
            "porte": data.get("porte"),
            "natureza_juridica": data.get("natureza_juridica"),
            "endereco": {
                "logradouro": data.get("logradouro"),
                "numero": data.get("numero"),
                "complemento": data.get("complemento"),
                "bairro": data.get("bairro"),
                "municipio": data.get("municipio"),
                "uf": data.get("uf"),
                "cep": data.get("cep"),
            },
            "telefone": data.get("ddd_telefone_1"),
            "email": data.get("email"),
            "situacao_cadastral": data.get("descricao_situacao_cadastral"),
            "data_situacao_cadastral": data.get("data_situacao_cadastral"),
            "cnae_fiscal": data.get("cnae_fiscal"),
            "cnae_fiscal_descricao": data.get("cnae_fiscal_descricao"),
        }


# Singleton
brasilapi_service = BrasilAPIService()
