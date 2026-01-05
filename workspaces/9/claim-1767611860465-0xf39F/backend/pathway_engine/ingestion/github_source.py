import pathway as pw
import os
from fastapi import FastAPI, Request
from git import Repo
from pathway_engine.ingestion.loader import load_file
from dotenv import load_dotenv

load_dotenv(dotenv_path=(os.path.join(os.getcwd() , ".env")))

# Configuration (Ensure these match your actual paths/env)
WATCH_FOLDER = "./data/repo"
GITHUB_REPO_URL = os.getenv("GITHUB_REPO_URL")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

def _ensure_repo_initialized():
    """Clone the repo if it doesn't exist yet."""
    if not os.path.exists(os.path.join(WATCH_FOLDER, ".git")):
        print(f"[GITHUB] 🚀 Cloning {GITHUB_REPO_URL}...")
        Repo.clone_from(GITHUB_REPO_URL, WATCH_FOLDER, branch=GITHUB_BRANCH)
    else:
        print("[GITHUB] ✅ Repo already exists.")

def create_github_webhook_app() -> FastAPI:
    """
    Creates a FastAPI app that listens to GitHub webhooks.
    When a push happens, it pulls the latest code.
    """
    app = FastAPI()

    @app.post("/github-webhook")
    async def github_webhook(req: Request):
        print("\n🔥 GitHub webhook received")
        try:
            _ensure_repo_initialized()
            repo = Repo(WATCH_FOLDER)
            origin = repo.remotes.origin
            origin.pull()
            print("✅ Repository pulled successfully")
            return {"status": "success"}
        except Exception as e:
            print(f"❌ Git operation failed: {e}")
            return {"error": str(e)}, 500

    @app.get("/health")
    async def health():
        return {"status": "healthy", "service": "github-webhook"}

    return app

def watch_github_repo(repo_path: str):
    """
    Watch a GitHub repo folder for file changes.
    
    Returns a Pathway table with a 'data' column containing formatted text.
    """
    print(f"[GITHUB] 🛰️ Starting live watch on: {repo_path}")
    
    # Read files with metadata
    table = pw.io.fs.read(
        repo_path,
        format="binary",
        mode="streaming",
        with_metadata=True
    )

    print(f"[GITHUB] 📊 Raw table columns: {table.schema.column_names()}")

    # Filter out .git folder
    def is_not_git_folder(path: str) -> bool:
        return ".git" not in str(path)

    is_not_git = pw.apply(is_not_git_folder, pw.this._metadata["path"])
    filtered_table = table.filter(is_not_git)

    # Transform: Load file content and format it
    processed_table = filtered_table.select(
        data=pw.apply(load_file, pw.this.data, pw.this._metadata["path"]),
        _metadata=pw.this._metadata
    )
    
    print(f"[GITHUB] ✅ Processed table columns: {processed_table.schema.column_names()}")
    print(f"[GITHUB] ✅ GitHub repo watch configured")
    
    return processed_table