import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any
from backend.config import settings

logger = logging.getLogger(__name__)

# Ensure imageio_ffmpeg is in PATH for local whisper audio decoding
try:
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_dir = os.path.dirname(ffmpeg_exe)
    if ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
    logger.info(f"Using bundled ffmpeg binary at: {ffmpeg_exe}")
except Exception as e:
    logger.warning(f"Could not load imageio_ffmpeg binary: {e}")

_local_whisper_model = None

def get_local_whisper_model():
    global _local_whisper_model
    if _local_whisper_model is None:
        import whisper
        model_name = settings.WHISPER_MODEL or "base"
        logger.info(f"Loading local Whisper model: {model_name}...")
        _local_whisper_model = whisper.load_model(model_name)
    return _local_whisper_model

class WhisperService:
    @staticmethod
    def transcribe_audio(file_path: str) -> Dict[str, Any]:
        """
        Transcribes audio file using Groq Whisper (ultra-fast cloud) or local OpenAI-Whisper.
        Returns:
            {
                "text": str,
                "duration": float,
                "segments": [
                    {
                        "start": float,
                        "end": float,
                        "speaker": str,
                        "text": str
                    }
                ]
            }
        """
        path_obj = Path(file_path)
        if not path_obj.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        # Try Groq Whisper if key is provided and enabled
        if settings.GROQ_API_KEY and settings.USE_GROQ_WHISPER:
            try:
                import openai
                client = openai.OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.GROQ_BASE_URL
                )
                logger.info(f"Transcribing {path_obj.name} with Groq Whisper...")
                with open(file_path, "rb") as audio_file:
                    transcript_resp = client.audio.transcriptions.create(
                        file=audio_file,
                        model="whisper-large-v3-turbo",
                        response_format="verbose_json",
                    )
                
                # Parse verbose json response
                full_text = getattr(transcript_resp, "text", "") or ""
                duration = float(getattr(transcript_resp, "duration", 0.0) or 0.0)
                raw_segments = getattr(transcript_resp, "segments", []) or []
                
                formatted_segments = []
                speaker_turn = 1
                for idx, seg in enumerate(raw_segments):
                    # Estimate or assign speaker turns alternating naturally
                    seg_dict = seg if isinstance(seg, dict) else seg.__dict__
                    start_t = float(seg_dict.get("start", 0.0))
                    end_t = float(seg_dict.get("end", start_t + 3.0))
                    seg_text = seg_dict.get("text", "").strip()
                    
                    # Alternate speakers when pause > 2.0s
                    if idx > 0:
                        prev_seg = raw_segments[idx - 1]
                        prev_end = float(prev_seg.get("end", 0.0) if isinstance(prev_seg, dict) else getattr(prev_seg, "end", 0.0))
                        if (start_t - prev_end) > 1.8:
                            speaker_turn = 2 if speaker_turn == 1 else 1
                    
                    speaker_name = f"Speaker {speaker_turn}"
                    if seg_text:
                        formatted_segments.append({
                            "chunk_index": idx,
                            "start": round(start_t, 2),
                            "end": round(end_t, 2),
                            "speaker": speaker_name,
                            "text": seg_text
                        })

                if not formatted_segments and full_text:
                    formatted_segments.append({
                        "chunk_index": 0,
                        "start": 0.0,
                        "end": max(duration, 10.0),
                        "speaker": "Speaker 1",
                        "text": full_text
                    })

                if duration == 0.0 and formatted_segments:
                    duration = formatted_segments[-1]["end"]

                logger.info(f"Groq Whisper transcription complete! {len(formatted_segments)} segments, duration: {duration}s")
                return {
                    "text": full_text,
                    "duration": duration,
                    "segments": formatted_segments
                }
            except Exception as e:
                logger.warning(f"Groq Whisper failed, falling back to local Whisper: {e}")

        # Fallback to local Whisper
        try:
            logger.info(f"Transcribing {path_obj.name} with local Whisper model ({settings.WHISPER_MODEL})...")
            model = get_local_whisper_model()
            result = model.transcribe(str(file_path), verbose=False)
            
            full_text = result.get("text", "").strip()
            raw_segments = result.get("segments", [])
            formatted_segments = []
            speaker_turn = 1
            max_duration = 0.0

            for idx, seg in enumerate(raw_segments):
                start_t = float(seg.get("start", 0.0))
                end_t = float(seg.get("end", start_t + 2.0))
                seg_text = seg.get("text", "").strip()
                max_duration = max(max_duration, end_t)

                if idx > 0:
                    prev_end = float(raw_segments[idx - 1].get("end", 0.0))
                    if (start_t - prev_end) > 1.8:
                        speaker_turn = 2 if speaker_turn == 1 else 1

                if seg_text:
                    formatted_segments.append({
                        "chunk_index": idx,
                        "start": round(start_t, 2),
                        "end": round(end_t, 2),
                        "speaker": f"Speaker {speaker_turn}",
                        "text": seg_text
                    })

            if not formatted_segments and full_text:
                formatted_segments.append({
                    "chunk_index": 0,
                    "start": 0.0,
                    "end": max(max_duration, 10.0),
                    "speaker": "Speaker 1",
                    "text": full_text
                })

            return {
                "text": full_text,
                "duration": max_duration,
                "segments": formatted_segments
            }
        except Exception as e:
            logger.error(f"Local Whisper transcription error: {e}")
            raise RuntimeError(f"Transcription failed: {str(e)}")

whisper_service = WhisperService()
