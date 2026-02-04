FROM python:3.12-slim

WORKDIR /app

# Instala dependencias com retry para evitar falhas de rede
COPY requirements.txt .
RUN pip install --no-cache-dir --retries 3 --timeout 60 -r requirements.txt

# Copia codigo
COPY . .

# Expoe porta 8000
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
