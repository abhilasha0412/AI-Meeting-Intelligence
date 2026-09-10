import logging
from typing import List
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

_embedding_function = None

def get_embedding_function():
    """
    Returns a persistent embedding function for ChromaDB.
    Uses SentenceTransformerEmbeddingFunction or default ONNX mini-LM.
    """
    global _embedding_function
    if _embedding_function is None:
        try:
            logger.info("Initializing SentenceTransformer embedding function (all-MiniLM-L6-v2)...")
            _embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer directly: {e}. Using DefaultEmbeddingFunction.")
            _embedding_function = embedding_functions.DefaultEmbeddingFunction()
            
    return _embedding_function
