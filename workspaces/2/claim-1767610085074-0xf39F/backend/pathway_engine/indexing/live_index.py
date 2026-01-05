import pathway as pw
from pathway.xpacks.llm.vector_store import VectorStoreServer
from pathway.xpacks.llm.splitters import TokenCountSplitter
from pathway_engine.indexing.embeddings import get_embedder

class LiveIndex:
    """
    Handles the real-time indexing of data streams.
    Replaces the old dictionary-based 'store'.
    """
    def __init__(self, data_sources: list):
        self.data_sources = data_sources # List of PW tables (GitHub, Local)
        self.embedder = get_embedder()
        
        # Split code into chunks of 400 tokens so Gemini doesn't get confused
        self.splitter = TokenCountSplitter(max_tokens=400)

    def run(self, host="127.0.0.1", port=8765):
        """
        Starts the Pathway Vector Server.
        This server will automatically update the index whenever
        your local files or GitHub repo changes.
        """
        print(f"🚀 Pathway Engine starting on {host}:{port}...")
        
        server = VectorStoreServer(
            *self.data_sources,
            embedder=self.embedder,
            splitter=self.splitter
        )
        
        # threaded=True allows the rest of your app to stay responsive
        server.run_server(
            host=host,
            port=port,
            threaded=True,
            with_cache=True # Caches embeddings to save CPU
        )

# EXPLANATION:
# You no longer call .update() manually. 
# Pathway 'listens' to the data_sources and updates the index automatically.