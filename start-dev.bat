@echo off
REM Script para iniciar Conferente em modo desenvolvimento

echo.
echo ========================================
echo   CONFERENTE - Contador de Perfis
echo   Iniciando em modo desenvolvimento...
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado. Instale Python 3.11+
    pause
    exit /b 1
)

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale Node.js 18+
    pause
    exit /b 1
)

echo [OK] Python e Node.js encontrados

REM Backend
echo.
echo [1/3] Configurando backend...
cd backend
if not exist venv (
    echo Criando ambiente virtual...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo [OK] Backend pronto

REM Frontend
echo.
echo [2/3] Configurando frontend...
cd ..\frontend
if not exist node_modules (
    echo Instalando dependências...
    call npm install -q
)
echo [OK] Frontend pronto

REM Iniciar servidores
echo.
echo [3/3] Iniciando servidores...
echo.
echo ========================================
echo   BACKEND:  http://localhost:8000
echo   FRONTEND: http://localhost:3000
echo   DOCS:     http://localhost:8000/docs
echo ========================================
echo.

REM Abrir em abas separadas
start cmd /k "cd ..\backend && venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak
start cmd /k "npm run dev"

echo.
echo Servidores iniciados! Pressione CTRL+C para parar.
pause
