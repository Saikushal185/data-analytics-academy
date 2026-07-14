# Deploying Data Analytics Academy

The whole app runs as a single Node process: Express serves the built React client
and the API, with SQLite stored on a persistent disk. No managed database needed.

## Environment variables
| Var | Purpose | Default |
|-----|---------|---------|
| `PORT` | HTTP port | `3001` |
| `JWT_SECRET` | Auth token signing secret — **set a strong value in prod** | dev fallback |
| `DATA_DIR` | Directory for `data.db` (mount a persistent disk here) | server folder |
| `OLLAMA_URL` | AI tutor model host | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Local model name | `qwen3-coder:latest` |

> The AI tutor needs Ollama reachable from the server. On a cloud host without a
> GPU, leave `OLLAMA_URL` unset/unreachable — the tutor UI degrades gracefully and
> everything else works. It shines when self-hosted on a machine running Ollama.

## Option A — Docker (any host)
```bash
docker build -t daa .
docker run -p 3001:3001 -e JWT_SECRET=change-me -v daa-data:/data daa
# open http://localhost:3001
```

## Option B — Render.com (free)
1. Push this repo to GitHub.
2. In Render: New → Blueprint → pick the repo. `render.yaml` provisions a free web
   service + a 1 GB persistent disk at `/data` and generates `JWT_SECRET`.
3. Deploy. The health check hits `/api/health`.

## Option C — bare Node
```bash
npm install
npm run build
JWT_SECRET=change-me DATA_DIR=/var/daa node server/index.js
```
