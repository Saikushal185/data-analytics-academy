# Data Analytics Academy 🎓

Data Analytics Academy is a comprehensive, open-source full-stack platform designed to teach data analytics concepts—such as SQL, Python, Excel, data modeling, and business intelligence—through interactive courses, gamified mechanics, spaced repetition (SRS), and an AI-powered tutor.

---

## 🚀 Features

*   **Custom Curriculum & Topics**: Modules covering SQL, Python, Data Modeling, Excel, Data Visualization, and Git.
*   **SQL Playground**: Run live queries directly inside the browser against pre-loaded SQLite datasets.
*   **Python Playground**: Execute Python scripts in-browser for interactive learning.
*   **Spaced Repetition System (SRS)**: Powered by the SuperMemo-2 (SM-2) algorithm to optimize review times for vocabulary and concepts.
*   **Gamified Learning**: Level up, earn experience points (XP), keep daily streaks alive, and unlock badges as you complete topics and quizzes.
*   **AI Tutor**: Integration with local LLM hosts via Ollama (configured with `qwen3-coder` by default) to assist you with difficult topics.
*   **Progress Dashboard**: Git-style contribution heatmap and progress analytics to monitor your learning.

---

## 🛠️ Technology Stack

### Frontend Client
*   **Framework**: React 18
*   **Routing**: React Router DOM (v6)
*   **Build Tool**: Vite
*   **Styling**: Vanilla CSS (including Theme Toggle: Light, Dark, System)

### Backend Server
*   **Framework**: Node.js & Express
*   **Database**: SQLite (via `better-sqlite3`)
*   **Authentication**: JSON Web Tokens (JWT) & bcryptjs
*   **AI Integration**: Ollama API Client

---

## 📂 Project Structure

```text
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Contexts, Playgrounds, Tutor, and Quizzes
│   │   ├── pages/          # Dashboard, SRS Review, Topic Views, etc.
│   │   ├── data/           # Course item definitions & static resources
│   │   └── main.jsx
│   └── vite.config.js
│
├── server/                 # Express Backend API
│   ├── content/            # Lessons & Badge definition models
│   ├── routes/             # API routes (auth, reviews, SQL validation)
│   ├── services/           # Spaced repetition, tutor, and achievements logic
│   ├── test/               # Server testing suite
│   ├── db.js               # Database schema initialization
│   └── index.js            # Express app entrypoint
│
├── Dockerfile              # Docker deployment configuration
└── render.yaml             # Render blueprint configuration
```

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)
*   *(Optional)* [Ollama](https://ollama.com/) running locally for the AI tutor

### Installation & Run

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Saikushal185/data-analytics-academy.git
    cd data-analytics-academy
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```
    *(This runs a postinstall script that installs dependencies in both client and server subdirectories)*

3.  **Start development server**:
    ```bash
    npm run dev
    ```
    This launches both the Express server (port `3001`) and the Vite React client (port `5173`) concurrently.

---

## 🐳 Docker Deployment

To build and run the application locally using Docker:

```bash
# Build the image
docker build -t daa .

# Run the container
docker run -p 3001:3001 -e JWT_SECRET=your-strong-secret-here -v daa-data:/data daa
```

---

## 📝 Environment Variables

The server behaves based on the following environment variables:

| Variable | Description | Default |
|---|---|---|
| `PORT` | The port the Express API listens on | `3001` |
| `JWT_SECRET` | Secret token to sign auth tokens | (Development secret) |
| `DATA_DIR` | Directory where `data.db` is stored | (Server folder) |
| `OLLAMA_URL` | Base URL of local Ollama instance | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | AI tutor model name | `qwen3-coder:latest` |
| `TRACK_GENERATION_PROVIDER` | Track generator provider: `auto`, `ollama`, `gemini`, or `grok`. In `auto`, it tries Ollama, then Gemini, then Grok. | `auto` |
| `OLLAMA_MODELS` | Comma-separated Ollama models for track generation fallback | `phi4-mini:3.8b,gemma3:4b,qwen3:8b` |
| `GEMINI_API_KEY` | Gemini key for deployed track generation fallback | unset |
| `GEMINI_MODEL` | Gemini model for track generation | `gemini-2.0-flash` |
| `GROK_API_KEY` / `XAI_API_KEY` | Grok/xAI key for final track generation fallback | unset |
| `GROK_MODEL` | Grok model for track generation | `grok-4` |
