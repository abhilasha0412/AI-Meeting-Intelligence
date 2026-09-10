import logging
import chromadb
from typing import List, Dict, Any, Optional
from backend.config import settings
from backend.services.embedding_service import get_embedding_function

logger = logging.getLogger(__name__)

COLLECTION_NAME = "meeting_transcripts"

class RAGService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=get_embedding_function(),
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"ChromaDB initialized with collection: {COLLECTION_NAME}")

    def index_meeting(self, meeting_id: int, meeting_title: str, segments: List[Dict[str, Any]]):
        """
        Chunks and indexes meeting transcript segments into ChromaDB with rich metadata.
        """
        if not segments:
            return

        # First remove any existing vectors for this meeting
        try:
            self.collection.delete(where={"meeting_id": meeting_id})
        except Exception as e:
            logger.debug(f"Chroma cleanup note: {e}")

        # Group segments into meaningful chunks (~2-4 sentences / 30-60s chunks)
        chunks = []
        metadatas = []
        ids = []

        chunk_buffer = []
        start_t = 0.0
        end_t = 0.0
        speaker_set = set()

        for idx, seg in enumerate(segments):
            text = seg.get("text", "").strip()
            speaker = seg.get("speaker", "Speaker")
            if not text:
                continue

            if not chunk_buffer:
                start_t = seg.get("start", 0.0)

            chunk_buffer.append(f"[{speaker}]: {text}")
            speaker_set.add(speaker)
            end_t = seg.get("end", start_t + 5.0)

            # Flush chunk every ~3 segments or if text length exceeds 250 characters
            if len(chunk_buffer) >= 3 or sum(len(s) for s in chunk_buffer) > 250 or idx == len(segments) - 1:
                chunk_id = f"m_{meeting_id}_chunk_{len(chunks)}"
                chunk_text = "\n".join(chunk_buffer)
                
                chunks.append(chunk_text)
                ids.append(chunk_id)
                metadatas.append({
                    "meeting_id": meeting_id,
                    "meeting_title": meeting_title,
                    "start_time": float(start_t),
                    "end_time": float(end_t),
                    "speakers": ", ".join(speaker_set),
                    "chunk_id": chunk_id
                })

                chunk_buffer = []
                speaker_set = set()

        if chunks:
            self.collection.add(
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Indexed {len(chunks)} transcript chunks for meeting '{meeting_title}' (ID: {meeting_id}) in ChromaDB")

    def delete_meeting(self, meeting_id: int):
        """Deletes all chunks for a given meeting ID."""
        try:
            self.collection.delete(where={"meeting_id": meeting_id})
            logger.info(f"Deleted ChromaDB vectors for meeting ID {meeting_id}")
        except Exception as e:
            logger.warning(f"Error deleting meeting from ChromaDB: {e}")

    def query(self, question: str, meeting_id: Optional[int] = None, n_results: int = 5) -> Dict[str, Any]:
        """
        Executes vector similarity search in ChromaDB and generates a grounded response.
        """
        where_filter = {"meeting_id": meeting_id} if meeting_id is not None else None
        
        try:
            results = self.collection.query(
                query_texts=[question],
                n_results=n_results,
                where=where_filter
            )
        except Exception as e:
            logger.error(f"ChromaDB query error: {e}")
            return {
                "answer": "I couldn't find this information in your meeting records.",
                "sources": [],
                "has_sources": False
            }

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        if not documents:
            return {
                "answer": "I couldn't find this information in your meeting records.",
                "sources": [],
                "has_sources": False
            }

        # Format context for LLM
        context_parts = []
        sources = []
        seen_meetings = set()

        for doc, meta, dist in zip(documents, metadatas, distances):
            # Check similarity threshold (cosine distance < 0.85)
            if dist > 0.85:
                continue

            m_id = meta.get("meeting_id")
            title = meta.get("meeting_title", f"Meeting #{m_id}")
            start_t = meta.get("start_time", 0.0)
            end_t = meta.get("end_time", 0.0)
            
            context_parts.append(
                f"[Source: Meeting '{title}' | Time: {self._format_time(start_t)} - {self._format_time(end_t)}]\n{doc}"
            )
            
            source_key = f"{m_id}_{int(start_t)}"
            if source_key not in seen_meetings:
                seen_meetings.add(source_key)
                sources.append({
                    "meeting_id": m_id,
                    "meeting_title": title,
                    "timestamp_formatted": self._format_time(start_t),
                    "start_time": start_t,
                    "end_time": end_t,
                    "snippet": doc[:160] + "..." if len(doc) > 160 else doc
                })

        if not context_parts:
            return {
                "answer": "I couldn't find this information in your meeting records.",
                "sources": [],
                "has_sources": False
            }

        # Synthesize answer using Groq / Gemini
        context_block = "\n\n---\n\n".join(context_parts)
        answer = self._generate_grounded_answer(question, context_block)

        return {
            "answer": answer,
            "sources": sources,
            "has_sources": len(sources) > 0
        }

    def _generate_grounded_answer(self, question: str, context_block: str) -> str:
        prompt = f"""You are AI Meeting Assistant, an intelligent meeting intelligence agent.
Answer the user's question accurately using ONLY the provided meeting transcripts below.

CRITICAL RULES:
1. Ground your answer strictly in the provided meeting excerpts.
2. If the excerpts do NOT contain the answer, say: "I couldn't find this information in your meeting records."
3. Do NOT invent facts, tasks, or names not present in the transcripts.
4. Keep your answer clear, direct, professional, and well-structured.
5. If referring to people or decisions, cite what was said in the transcript.

MEETING TRANSCRIPTS:
{context_block}

USER QUESTION:
{question}

HELPFUL GROUNDED ANSWER:"""

        # Try Groq AI
        if settings.GROQ_API_KEY:
            try:
                import openai
                client = openai.OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.GROQ_BASE_URL
                )
                response = client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Groq RAG completion error: {e}")

        # Fallback Gemini
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                resp = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                )
                return resp.text.strip()
            except Exception as e:
                logger.error(f"Gemini RAG completion error: {e}")

        # Fallback answer
        return f"Based on your meetings:\n{context_block[:400]}..."

    @staticmethod
    def _format_time(seconds: float) -> str:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}:{secs:02d}"

rag_service = RAGService()
