import pathway as pw
import threading
import os
from pathway_engine.ingestion.local_source import watch_local_folder
from pathway_engine.ingestion.github_source import create_github_webhook_app, watch_github_repo
from pathway_engine.indexing.embeddings import get_embedder
from pathway.xpacks.llm.vector_store import VectorStoreServer
from pathway.xpacks.llm.splitters import TokenCountSplitter
import uvicorn

# Config
WATCH_FOLDER = "./watched_folder"
PORT_AGENT = 8765  # Person 2 connects here
PORT_WEBHOOK = 8000 # GitHub sends webhooks here

def run_pathway_server(combined_stream):
    """
    Exposes the Live Table to Person 2 via a REST API.
    """
    print(f"[ENGINE] 🧠 Initializing Vector Server on port {PORT_AGENT}...")
    
    # 1. Setup Indexing Components
    embedder = get_embedder()
    splitter = TokenCountSplitter(max_tokens=400)

    # 🔥 CRITICAL FIX: VectorStoreServer expects a table with a 'data' column
    # containing the text to index. Your sources already provide this!
    print("[ENGINE] 📊 Combined stream columns:", combined_stream.schema.column_names())
    
    # 2. Create the Vector Server
    # This automatically creates a /v1/retrieve and /v1/statistics endpoint
    server = VectorStoreServer(
        combined_stream,
        embedder=embedder,
        splitter=splitter
    )

    print(f"[ENGINE] ✅ Vector Server ready for Agent queries.")
    print(f"[ENGINE] 🔗 Endpoints available at http://0.0.0.0:{PORT_AGENT}")
    print(f"[ENGINE]    - POST /v1/retrieve (query for documents)")
    print(f"[ENGINE]    - GET  /v1/statistics (index stats)")
    
    server.run_server(host="0.0.0.0", port=PORT_AGENT, with_cache=True)

if __name__ == "__main__":
    print("🔥 Starting Pathway Core Engine...")

    # 1. Initialize Streams
    print("\n[SETUP] Initializing data sources...")
    github_stream = watch_github_repo(WATCH_FOLDER)
    local_stream = watch_local_folder("./watched_folder")
    
    # Combine the streams
    print("[SETUP] Combining GitHub and local streams...")
    combined_stream = github_stream.concat_reindex(local_stream)
    
    print(f"[SETUP] ✅ Combined stream ready")
    
    # 2. Start GitHub Webhook Server (FastAPI) in a thread
    webhook_app = create_github_webhook_app()
    webhook_thread = threading.Thread(
        target=lambda: uvicorn.run(webhook_app, host="0.0.0.0", port=PORT_WEBHOOK, log_level="warning"),
        daemon=True
    )
    webhook_thread.start()
    print(f"[WEBHOOK] 🛰️ Listening for GitHub events on port {PORT_WEBHOOK}")

    # 3. Start Pathway Engine (This blocks and keeps the process alive)
    print(f"\n{'='*60}")
    print("🚀 PATHWAY ENGINE STARTING")
    print(f"{'='*60}\n")
    
    run_pathway_server(combined_stream)