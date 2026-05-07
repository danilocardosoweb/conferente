# Conferente – Contador de Perfis de Alumínio

Sistema de visão computacional para contagem automática de extremidades de perfis de alumínio em pallets/amarrados, **100% offline**, sem IA paga ou modelos treinados.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 + React 18 + Tailwind CSS |
| Backend | Python 3.11 + FastAPI |
| Visão Computacional | OpenCV 4.9 |
| Banco de Dados | SQLite (via SQLAlchemy async) |
| Container | Docker + docker-compose |

## Pipeline de Detecção (OpenCV)

1. Redimensionamento e desfoque Gaussiano
2. Realce de contraste via **CLAHE**
3. **Morfologia matemática** (abertura + fechamento elípticos)
4. **Canny Edge Detection** (limiares configuráveis)
5. **HoughCircles** – detecta perfis tubulares e circulares
6. **Análise de contornos** – detecta perfis retangulares/hexagonais por circularidade e solidez
7. **Non-Maximum Suppression** – elimina detecções duplicadas
8. Anotação visual com numeração individual de cada perfil

## Início Rápido

### Opção 1 – Docker (recomendado)

```bash
# Clonar e entrar na pasta
cd Conferente

# Criar pasta de dados
mkdir data

# Subir todos os serviços
docker-compose up --build
```

Acesse: http://localhost:3000

### Opção 2 – Desenvolvimento local

#### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000  
API Docs: http://localhost:8000/docs

## Configuração de Parâmetros

Os parâmetros de detecção podem ser ajustados em tempo real pela interface:

| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| `min_radius` | 8px | Raio mínimo dos perfis na imagem |
| `max_radius` | 80px | Raio máximo dos perfis na imagem |
| `canny_low` | 30 | Limiar inferior do Canny |
| `canny_high` | 100 | Limiar superior do Canny |
| `hough_param1` | 50 | Sensibilidade de borda do HoughCircles |
| `hough_param2` | 25 | Acumulador do HoughCircles (menor = mais detecções) |
| `min_dist` | 20px | Distância mínima entre centros |
| `blur_kernel` | 5 | Tamanho do kernel de desfoque |

## Dicas de Uso Industrial

- Fotografe a extremidade do pallet **de frente e nivelado**
- Distância ideal: **30–80cm** da extremidade
- Iluminação difusa é melhor que luz direta (evita reflexos)
- Para perfis pequenos: diminua `min_radius` e `min_dist`
- Para perfis grandes: aumente `max_radius`
- Se houver muitos falsos positivos: aumente `hough_param2`
- Se faltar detecções: diminua `hough_param2`

## Estrutura do Projeto

```
Conferente/
├── backend/
│   ├── app/
│   │   ├── vision/
│   │   │   └── processor.py    ← Pipeline OpenCV principal
│   │   ├── routers/
│   │   │   ├── detect.py       ← Endpoint de detecção
│   │   │   └── readings.py     ← CRUD + dashboard stats
│   │   ├── main.py             ← FastAPI app
│   │   ├── models.py           ← SQLAlchemy models
│   │   ├── schemas.py          ← Pydantic schemas
│   │   ├── database.py         ← Engine SQLite async
│   │   └── config.py           ← Configurações
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        ← Dashboard principal
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── DetectionResult.tsx
│   │   │   ├── DetectionSettings.tsx
│   │   │   ├── ReadingHistory.tsx
│   │   │   └── ui/
│   │   └── lib/
│   │       └── api.ts          ← Funções de API tipadas
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/v1/detect/` | Processar imagem e contar perfis |
| `POST` | `/api/v1/readings/` | Salvar nova leitura |
| `GET` | `/api/v1/readings/` | Listar histórico (paginado) |
| `GET` | `/api/v1/readings/{id}` | Buscar leitura por ID |
| `PATCH` | `/api/v1/readings/{id}` | Atualizar leitura (ajuste manual) |
| `DELETE` | `/api/v1/readings/{id}` | Deletar leitura |
| `GET` | `/api/v1/readings/stats/dashboard` | Estatísticas do dashboard |
| `GET` | `/health` | Health check |

Documentação interativa: http://localhost:8000/docs
