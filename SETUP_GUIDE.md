# Conferente – Guia de Setup Completo

## Status: ✅ Pronto para Uso

O projeto foi construído com sucesso. Ambos os servidores (backend e frontend) estão rodando e prontos para uso.

---

## 🚀 Início Rápido (Desenvolvimento Local)

### 1. Backend (FastAPI + OpenCV)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Endpoints:**
- API: http://localhost:8000
- Docs interativa: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 2. Frontend (Next.js)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

**Acesso:**
- App: http://localhost:3000

---

## 🐳 Docker (Produção)

```bash
# Criar pasta de dados
mkdir data

# Subir tudo com docker-compose
docker-compose up --build
```

Acesse: http://localhost:3000

---

## 📁 Estrutura do Projeto

```
Conferente/
├── backend/
│   ├── app/
│   │   ├── vision/
│   │   │   └── processor.py         ← Pipeline OpenCV (HoughCircles + contornos)
│   │   ├── routers/
│   │   │   ├── detect.py            ← POST /detect/ (processa imagem)
│   │   │   └── readings.py          ← CRUD + stats dashboard
│   │   ├── models.py                ← SQLAlchemy (Reading table)
│   │   ├── schemas.py               ← Pydantic (tipos de request/response)
│   │   ├── database.py              ← SQLite async setup
│   │   ├── config.py                ← Configurações
│   │   └── main.py                  ← FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── conferente.db                ← Banco SQLite (criado automaticamente)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             ← Dashboard principal (3 abas)
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── CameraCapture.tsx    ← Câmera em tempo real
│   │   │   ├── DetectionResult.tsx  ← Resultado + ajuste manual
│   │   │   ├── DetectionSettings.tsx ← Sliders de parâmetros
│   │   │   ├── ReadingHistory.tsx   ← Histórico paginado
│   │   │   └── ui/
│   │   │       ├── Card.tsx
│   │   │       └── Badge.tsx
│   │   └── lib/
│   │       └── api.ts               ← Cliente HTTP tipado
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .next/                       ← Build Next.js (gerado)
│
├── docker-compose.yml
├── README.md
├── SETUP_GUIDE.md                   ← Este arquivo
└── data/                            ← Volume Docker (banco persistente)
```

---

## 🔧 Tecnologias

| Camada | Stack |
|--------|-------|
| **Frontend** | Next.js 14 + React 18 + Tailwind CSS + Lucide Icons |
| **Backend** | Python 3.11+ + FastAPI + Uvicorn |
| **Visão Computacional** | OpenCV 4.8+ (sem IA paga) |
| **Banco de Dados** | SQLite + SQLAlchemy async |
| **Container** | Docker + docker-compose |

---

## 🎯 Funcionalidades Implementadas

### Scanner (Aba 1)
- ✅ Câmera em tempo real (front/back)
- ✅ Captura de frame com flash visual
- ✅ Upload de arquivo de imagem
- ✅ Processamento OpenCV com 8 técnicas:
  - CLAHE (realce de contraste)
  - Canny Edge Detection
  - HoughCircles (perfis tubulares)
  - Análise de contornos (perfis complexos)
  - Morfologia matemática
  - Non-Maximum Suppression
  - Anotação visual com numeração
- ✅ Ajuste manual de contagem (±)
- ✅ Metadados: operador, ID pallet, observações
- ✅ Parâmetros ajustáveis em tempo real

### Histórico (Aba 2)
- ✅ Lista paginada de leituras
- ✅ Thumbnail da imagem processada
- ✅ Filtros por pallet_id
- ✅ Deleção de registros
- ✅ Timestamps formatados (pt-BR)

### Dashboard (Aba 3)
- ✅ Total de leituras
- ✅ Total de perfis contados
- ✅ Média por leitura
- ✅ Confiança média
- ✅ Leituras e perfis de hoje
- ✅ Indicadores visuais (barras de progresso)

---

## 📊 Pipeline OpenCV Detalhado

### Entrada
Imagem JPEG/PNG do celular ou câmera

### Processamento (8 etapas)

1. **Redimensionamento** → máx 1280px (performance)
2. **Desfoque Gaussiano** → kernel configurável (padrão: 5)
3. **CLAHE** → realce de contraste adaptativo (clipLimit=2.5)
4. **Morfologia** → abertura + fechamento elípticos
5. **Canny Edge Detection** → limiares configuráveis
6. **HoughCircles** → detecta perfis tubulares/circulares
7. **Análise de Contornos** → detecta perfis retangulares/hexagonais
   - Filtra por área, circularidade (>0.3), solidez (>0.5)
8. **Non-Maximum Suppression** → elimina duplicatas (overlap_thresh=0.4)

### Saída
- Contagem de perfis
- Score de confiança (0–1)
- Imagem anotada com círculos numerados
- Tempo de processamento (ms)
- Debug steps (log do pipeline)

---

## ⚙️ Parâmetros Ajustáveis

| Parâmetro | Padrão | Range | Descrição |
|-----------|--------|-------|-----------|
| `min_radius` | 8 | 1–500 | Raio mínimo em pixels |
| `max_radius` | 80 | 1–1000 | Raio máximo em pixels |
| `canny_low` | 30 | 1–255 | Limiar inferior Canny |
| `canny_high` | 100 | 1–255 | Limiar superior Canny |
| `hough_param1` | 50 | 1–300 | Sensibilidade de borda |
| `hough_param2` | 25 | 1–300 | Acumulador (↓ = mais detecções) |
| `min_dist` | 20 | 1–500 | Distância mínima entre centros |
| `blur_kernel` | 5 | 1–31 | Tamanho do kernel de desfoque |
| `use_contours` | true | — | Ativar análise de contornos |
| `use_morphology` | true | — | Ativar morfologia matemática |

---

## 🎨 Design Industrial

- **Tema:** Escuro (surface-900 a surface-700)
- **Cores de Destaque:** Verde brand (#22c55e)
- **Tipografia:** Inter sans-serif
- **Ícones:** Lucide React (18–24px)
- **Responsividade:** Mobile-first (Tailwind grid)
- **Animações:** Fade-in, slide-up, glow, scanline

---

## 📱 Compatibilidade

- **Navegadores:** Chrome, Firefox, Safari, Edge (moderno)
- **Câmera:** Qualquer dispositivo com MediaDevices API
- **Resolução:** Responsivo (mobile até 4K)
- **Offline:** Sim (após primeira carga)

---

## 🔐 Segurança

- ✅ CORS configurado (localhost:3000)
- ✅ Validação Pydantic em todas as rotas
- ✅ Sem API keys hardcoded
- ✅ Banco SQLite local (sem cloud)
- ✅ Sem modelos IA (sem dependências externas)

---

## 📈 Performance

- **Processamento:** ~50–200ms (depende da resolução)
- **Banco:** Queries otimizadas com índices
- **Frontend:** Next.js com SSG + ISR
- **Imagens:** Compressão JPEG 85% (base64)

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verificar porta 8000
netstat -ano | findstr :8000

# Limpar banco (se corrompido)
rm backend/conferente.db
```

### Frontend não conecta ao backend
```bash
# Verificar NEXT_PUBLIC_API_URL
echo $env:NEXT_PUBLIC_API_URL  # Windows
# Deve ser: http://localhost:8000
```

### Câmera não funciona
- Verificar permissões do navegador
- Usar HTTPS em produção (MediaDevices requer)
- Testar em localhost (não funciona em IP direto)

### Detecção imprecisa
1. Ajustar `min_radius` e `max_radius` pelo tamanho real
2. Aumentar `hough_param2` para menos falsos positivos
3. Melhorar iluminação (evitar sombras e reflexos)
4. Usar ajuste manual como fallback

---

## 📚 Documentação API

### POST /api/v1/detect/

Processa imagem e retorna contagem.

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/detect/ \
  -F "file=@image.jpg" \
  -F "params={\"min_radius\": 8, \"max_radius\": 80}"
```

**Response:**
```json
{
  "detected_count": 42,
  "confidence_score": 0.87,
  "processing_time_ms": 125.5,
  "annotated_image_base64": "...",
  "debug_steps": ["Imagem: 1920x1080px", "..."],
  "params_used": { ... }
}
```

### POST /api/v1/readings/

Salva leitura no banco.

**Request:**
```json
{
  "detected_count": 42,
  "final_count": 42,
  "manual_adjustment": 0,
  "operator": "João Silva",
  "pallet_id": "PLT-2024-001",
  "notes": "Contagem confirmada",
  "confidence_score": 0.87,
  "processing_time_ms": 125.5
}
```

### GET /api/v1/readings/stats/dashboard

Retorna estatísticas agregadas.

**Response:**
```json
{
  "total_readings": 156,
  "total_profiles_counted": 6234,
  "avg_per_reading": 39.9,
  "avg_confidence": 0.82,
  "readings_today": 12,
  "profiles_today": 487
}
```

---

## 🚢 Deploy em Produção

### Docker Swarm / Kubernetes

```yaml
# docker-compose.yml já está pronto
# Apenas ajustar:
# - NEXT_PUBLIC_API_URL para domínio real
# - DATABASE_URL para PostgreSQL (opcional)
# - Certificados SSL/TLS
```

### Variáveis de Ambiente

```bash
# Backend (.env)
DATABASE_URL=sqlite+aiosqlite:////app/data/conferente.db
DEBUG=false

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.conferente.com
```

---

## 📝 Próximas Melhorias (Roadmap)

- [ ] Exportar histórico em CSV/PDF
- [ ] Gráficos de tendência (Chart.js)
- [ ] Autenticação de usuários
- [ ] Suporte a múltiplas câmeras
- [ ] Detecção de anomalias (ML)
- [ ] Integração com ERP
- [ ] App mobile nativa (React Native)
- [ ] Sincronização em nuvem (opcional)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs: `docker-compose logs backend`
2. Testar API docs: http://localhost:8000/docs
3. Verificar console do navegador (F12)

---

**Conferente v1.0** | Visão Computacional Industrial | OpenCV + FastAPI + Next.js
