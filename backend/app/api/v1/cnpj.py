"""
Endpoints de busca de CNPJ via BrasilAPI.
"""

from fastapi import APIRouter, HTTPException
from app.services.cnpj.brasilapi import brasilapi_service

router = APIRouter()


@router.get("/cnpj/{cnpj}")
async def buscar_cnpj(cnpj: str):
    """
    Busca dados de um CNPJ na Receita Federal.

    Args:
        cnpj: CNPJ com ou sem formatacao (12.345.678/0001-90 ou 12345678000190)

    Returns:
        Dados do CNPJ (razao social, endereco, etc)

    Raises:
        400: CNPJ invalido
        404: CNPJ nao encontrado
    """
    try:
        data = await brasilapi_service.buscar_cnpj(cnpj)

        if data is None:
            raise HTTPException(status_code=404, detail="CNPJ nao encontrado")

        return {
            "success": True,
            "data": data,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
