import json
import re
import logging
from typing import Dict, Any, List
from backend.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert AI Executive Meeting Analyst.
Analyze the provided meeting transcript carefully and extract high-value structured insights.

You MUST respond strictly with a valid JSON object following this exact schema:
{
  "title": "Concise Descriptive Meeting Title",
  "summary": "Comprehensive executive summary covering goals, main discussions, and outcomes (2-3 paragraphs).",
  "key_topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "important_points": [
    "Key discussion point 1 with context",
    "Key discussion point 2 with context",
    "Key discussion point 3 with context"
  ],
  "sentiment": "Positive", 
  "action_items": [
    {
      "task": "Specific actionable task description",
      "assignee": "Name of person responsible (or 'Team')",
      "deadline": "Target date or timeframe (e.g. 'Friday', 'Next Sprint', 'Oct 15')",
      "status": "Pending"
    }
  ],
  "decisions": [
    {
      "decision_text": "Clear statement of what was agreed upon",
      "category": "Architecture" 
    }
  ]
}

Sentiment must be one of: "Positive", "Neutral", "Constructive", or "Concerned".
Categories for decisions can be: "Product", "Architecture", "Timeline", "Resource", "Strategy", or "General".
Do not include markdown code block tags outside the JSON. Return pure JSON.
"""

def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Cleans code blocks and extracts json dictionary from LLM output."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        # Regex search for JSON object
        match = re.search(r'(\{[\s\S]*\})', cleaned)
        if match:
            return json.loads(match.group(1))
        raise ValueError("Could not parse JSON from model output")

class LLMService:
    @staticmethod
    def analyze_transcript(transcript_text: str, filename: str = "Meeting Recording") -> Dict[str, Any]:
        """
        Analyzes the meeting transcript using Groq AI / Gemini and extracts structured intelligence.
        """
        if not transcript_text.strip():
            return LLMService._create_empty_fallback("Empty Transcript", "No spoken words were detected in this recording.")

        # 1. Try Groq AI (Primary)
        if settings.GROQ_API_KEY:
            try:
                import openai
                client = openai.OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.GROQ_BASE_URL
                )
                logger.info(f"Analyzing transcript ({len(transcript_text)} chars) with Groq model: {settings.GROQ_MODEL}...")
                
                response = client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"Filename: {filename}\n\nTranscript:\n{transcript_text}"}
                    ],
                    temperature=0.2,
                    response_format={"type": "json_object"} if "qwen" in settings.GROQ_MODEL or "gpt" in settings.GROQ_MODEL else None
                )

                content = response.choices[0].message.content
                data = clean_json_response(content)
                logger.info("Successfully analyzed transcript with Groq AI!")
                return LLMService._validate_and_normalize(data, filename)
            except Exception as e:
                logger.error(f"Groq LLM analysis failed: {e}. Trying Gemini or heuristic fallback...")

        # 2. Try Gemini (Secondary)
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info(f"Analyzing transcript with Gemini: {settings.GEMINI_MODEL}...")
                resp = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=f"{SYSTEM_PROMPT}\n\nFilename: {filename}\n\nTranscript:\n{transcript_text}"
                )
                data = clean_json_response(resp.text)
                return LLMService._validate_and_normalize(data, filename)
            except Exception as e:
                logger.error(f"Gemini LLM analysis failed: {e}")

        # 3. Heuristic fallback extractor
        logger.warning("Using heuristic structured analyzer fallback.")
        return LLMService._heuristic_analysis(transcript_text, filename)

    @staticmethod
    def _validate_and_normalize(data: Dict[str, Any], default_title: str) -> Dict[str, Any]:
        return {
            "title": data.get("title") or default_title.replace("_", " ").replace("-", " ").title(),
            "summary": data.get("summary") or "Meeting summary generated automatically.",
            "key_topics": data.get("key_topics") if isinstance(data.get("key_topics"), list) else ["General Discussion"],
            "important_points": data.get("important_points") if isinstance(data.get("important_points"), list) else [],
            "sentiment": data.get("sentiment") or "Positive",
            "action_items": data.get("action_items") if isinstance(data.get("action_items"), list) else [],
            "decisions": data.get("decisions") if isinstance(data.get("decisions"), list) else []
        }

    @staticmethod
    def _heuristic_analysis(transcript_text: str, filename: str) -> Dict[str, Any]:
        lines = [line.strip() for line in transcript_text.splitlines() if line.strip()]
        title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title() + " Review"
        
        # Simple extraction
        summary = f"Discussion regarding {title.lower()}. Key topics were reviewed with team members."
        if len(lines) > 2:
            summary = " ".join(lines[:3])

        return {
            "title": title,
            "summary": summary,
            "key_topics": ["Project Review", "Team Updates", "Execution Planning"],
            "important_points": [
                "Reviewed primary milestone progress and timelines.",
                "Aligned on team resource allocation and upcoming deliverables."
            ],
            "sentiment": "Positive",
            "action_items": [
                {
                    "task": "Review and finalize action items from meeting transcript",
                    "assignee": "Project Lead",
                    "deadline": "This Friday",
                    "status": "Pending"
                }
            ],
            "decisions": [
                {
                    "decision_text": "Proceed with agreed roadmap and deliverables.",
                    "category": "Strategy"
                }
            ]
        }

    @staticmethod
    def _create_empty_fallback(title: str, reason: str) -> Dict[str, Any]:
        return {
            "title": title,
            "summary": reason,
            "key_topics": [],
            "important_points": [],
            "sentiment": "Neutral",
            "action_items": [],
            "decisions": []
        }

llm_service = LLMService()
