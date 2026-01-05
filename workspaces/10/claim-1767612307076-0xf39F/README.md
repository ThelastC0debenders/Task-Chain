# CodeFlux: Live Code Intelligence Agent

> A real-time code intelligence system powered by Pathway and LangGraph, providing live codebase awareness with agentic reasoning capabilities.

## 🌟 Overview

CodeFlux is an intelligent developer assistant that combines **Pathway's live data processing** with **LangGraph's agentic framework** to provide real-time code intelligence. The system watches your codebase, maintains a live index, and answers questions about your code with confidence scoring and multi-step reasoning.

### Key Features

- 🔥 **Live Code Indexing**: Real-time monitoring of code changes using Pathway
- 🧠 **Agentic Reasoning**: Multi-step reasoning powered by LangGraph
- 🎯 **Confidence Scoring**: Every answer comes with confidence levels and reasoning
- 📊 **Change Intelligence**: Track what changed, detect breaking changes, and analyze impact
- 💬 **Interactive UI**: Modern React-based frontend for seamless interaction
- 🔍 **Context-Aware Retrieval**: Smart context building from live codebase state
- 🤖 **Gemini Integration**: Powered by Google's Gemini 2.5 Flash model

## 🏗️ Architecture

The project consists of two main components:

### Backend (FastAPI + Pathway + LangGraph)
```
backend/
├── main.py                     # 🚀 FastAPI entry point
├── pathway_engine/             # 🔥 CORE LIVE ENGINE (Pathway)
│   ├── ingestion/              # Code and GitHub repo watching
│   ├── indexing/               # Live incremental indexing
│   ├── query/                  # Context retrieval and building
│   └── state/                  # Version tracking
├── agent/                      # 🧠 AGENTIC REASONING
│   ├── agent.py                # LangGraph-based agent
│   ├── planner.py              # Multi-step reasoning
│   ├── tools.py                # Agent tools (diff, search, etc.)
│   └── confidence.py           # Confidence assessment
└── llm/                        # 🤖 LLM CLIENT
    └── gemini_client.py        # Gemini API wrapper
```

### Frontend (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── components/             # Reusable UI components
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── AskTheAgentPage.tsx # Query interface
│   │   ├── ChangeIntelligence.tsx
│   │   └── ReasoningConfidence.tsx
│   └── App.tsx                 # Main app component
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 18+** and npm (for frontend)
- **Google API Key** (for Gemini)
- **Git** (for version control)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/ThelastC0debenders/Pathway-Hack.git
cd Pathway-Hack
```

#### 2. Backend Setup

```bash
cd backend

# Install Python dependencies (recommended: use virtual environment)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install fastapi uvicorn pathway-io langgraph langchain-core google-generativeai python-dotenv

# Create .env file
cat > .env << EOL
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8003
EOL
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Backend will start on http://localhost:8003
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:5173
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional
PORT=8003
```

### Pathway Engine Configuration

Configure the watched repository/folder in `backend/pathway_engine/config.py`:

```python
WATCH_FOLDER = "./watched_folder"
GITHUB_REPO_URL = "https://github.com/ThelastC0debenders/Pathway-Hack.git"
GITHUB_BRANCH = "main"
```

## 📖 Usage

1. **Access the UI**: Open your browser to `http://localhost:5173`

2. **Navigate to "Ask the Agent"**: Use the sidebar to access different features

3. **Ask Questions**: Type questions about your codebase:
   - "How is file loading handled?"
   - "What are the main components?"
   - "Explain the agent architecture"

4. **View Responses**: Get detailed answers with:
   - Explanation
   - Relevant code snippets
   - Confidence score and level
   - Reasoning strategy used
   - Source file references

## 🎯 API Endpoints

### POST `/v1/agent/ask`

Ask questions to the agent.

**Request:**
```json
{
  "query": "How is the file loading handled?"
}
```

**Response:**
```json
{
  "explanation": "Detailed explanation...",
  "code": "Relevant code snippets...",
  "instruction": "How to use...",
  "confidence": 0.85,
  "confidence_level": "HIGH",
  "strategy": "Direct retrieval",
  "sources": [
    {
      "file": "path/to/file.py",
      "lines": "10-25",
      "text": "Code content..."
    }
  ],
  "trace": ["step1", "step2", "..."]
}
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
python test_agent.py
```

The test runner provides an interactive prompt to test the agent:
```
❓ Ask a question (or type 'exit'): How does the agent work?
```

### Frontend Testing
```bash
cd frontend
npm run build    # Build for production
npm run lint     # Run ESLint
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Pathway**: Real-time data processing and live indexing
- **LangGraph**: Agentic workflow framework
- **LangChain**: LLM integration utilities
- **Google Gemini**: AI model for code understanding

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Lucide React**: Icon library
- **React Markdown**: Markdown rendering with syntax highlighting

## 📝 Project Structure

```
Pathway-Hack/
├── backend/                    # Python backend
│   ├── agent/                 # Agentic reasoning system
│   ├── llm/                   # LLM client wrapper
│   ├── pathway_engine/        # Pathway-based live indexing
│   ├── main.py                # FastAPI server
│   └── test_agent.py          # Agent testing
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/            # Application pages
│   │   └── App.tsx           # Main app
│   └── package.json
└── README.md                   # This file
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of a hackathon submission. Please check with the team for licensing details.

## 👥 Team

**ThelastC0debenders** - Pathway Hackathon Participants

## 🙏 Acknowledgments

- **Pathway** for the amazing live data processing framework
- **LangChain/LangGraph** for the agentic framework
- **Google** for the Gemini API
- **FastAPI** and **React** communities

---

**Built with ❤️ for the Pathway Hackathon**
