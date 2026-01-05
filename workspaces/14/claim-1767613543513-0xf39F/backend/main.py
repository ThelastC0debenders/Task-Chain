from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Import the agent
from agent.agent import DevAgent

load_dotenv()

app = FastAPI(title="Pathway Agent API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent
print("[API] 🤖 Initializing DevAgent...")
try:
    agent = DevAgent()
except Exception as e:
    print(f"[API] ❌ Failed to initialize agent: {e}")
    agent = None

class QueryRequest(BaseModel):
    query: str

class SourceItem(BaseModel):
    file: str
    lines: str
    text: str

class QueryResponse(BaseModel):
    explanation: str
    code: str
    instruction: str
    confidence: float
    confidence_level: str
    strategy: str
    sources: list[SourceItem]
    trace: list[str]

@app.post("/v1/agent/ask", response_model=QueryResponse)
async def ask_agent(request: QueryRequest):
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    print(f"[API] 📝 Received query: {request.query}")
    try:
        result = agent.answer_question(request.query)
        return result
    except Exception as e:
        print(f"[API] ❌ Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8003))
    print(f"[API] 🚀 Starting Agent API on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
