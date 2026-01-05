import pathway as pw
from pathway.xpacks.llm.embedders import SentenceTransformerEmbedder

# 🛠️ GLOBAL EMBEDDER (Free & Local)
# This uses 'all-MiniLM-L6-v2', a fast model from Hugging Face.
# It converts text into 384-dimensional vectors.
def get_embedder():
    # The first argument must be the model name string
    return SentenceTransformerEmbedder(
        "all-MiniLM-L6-v2",  # Pass as positional argument
        device="cpu"
    )

# Note: You no longer need the manual content_hash for searching!
# Pathway handles indexing and uniqueness internally using its own engine.