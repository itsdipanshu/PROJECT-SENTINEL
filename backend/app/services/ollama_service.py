import subprocess
import shutil
import logging
import time
import re
from typing import Dict, Any, List
from backend.app.services.ai_prompts import SENTINEL_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def is_ollama_installed() -> bool:
    """Check if the Ollama CLI executable is on PATH."""
    return shutil.which("ollama") is not None


def get_ollama_status() -> Dict[str, Any]:
    """Inspect local Ollama installation, version, and running process."""
    if not is_ollama_installed():
        return {
            "installed": False,
            "running": False,
            "version": None,
            "active_model": None,
            "processor": None,
            "installed_models_count": 0,
            "available_models": [],
            "error": "Ollama CLI is not found on system PATH."
        }

    version = None
    try:
        proc = subprocess.run(
            ["ollama", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if proc.returncode == 0:
            version = proc.stdout.strip()
    except Exception as e:
        logger.warning(f"Failed to check ollama version: {e}")

    running = False
    active_model = None
    processor = None
    try:
        proc = subprocess.run(
            ["ollama", "ps"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if proc.returncode == 0:
            running = True
            lines = proc.stdout.strip().split("\n")
            if len(lines) > 1:
                parts = lines[1].split()
                if len(parts) >= 1:
                    active_model = parts[0]
                if len(parts) >= 4:
                    processor = parts[3]
    except Exception as e:
        logger.warning(f"Failed to query ollama ps: {e}")

    models = list_installed_models()

    # If no active model currently running, default to the first installed model
    default_model = active_model or (models[0]["name"] if models else "gemma4:e4b")

    return {
        "installed": True,
        "running": running,
        "version": version,
        "active_model": default_model,
        "processor": processor or "GPU",
        "installed_models_count": len(models),
        "available_models": models
    }


def list_installed_models() -> List[Dict[str, str]]:
    """List installed models dynamically using 'ollama list'."""
    if not is_ollama_installed():
        return []

    try:
        proc = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if proc.returncode != 0:
            return []

        models = []
        lines = proc.stdout.strip().split("\n")
        for line in lines[1:]:
            parts = line.split()
            if len(parts) >= 3:
                size_str = parts[2]
                if len(parts) > 3 and ("GB" in parts[3] or "MB" in parts[3]):
                    size_str = f"{parts[2]} {parts[3]}"
                models.append({
                    "name": parts[0],
                    "id": parts[1],
                    "size": size_str
                })
        return models
    except Exception as e:
        logger.error(f"Error querying ollama list: {e}")
        return []


def clean_ollama_output(raw_text: str) -> str:
    """Clean terminal artifacts, spinners, and isolate response."""
    # Remove spinner braille characters (⠙ ⠹ etc.)
    text = re.sub(r'[\u2800-\u28FF\s]{5,}', '', raw_text)

    # Check for "Thinking...\n...done thinking." pattern
    if "...done thinking." in text:
        parts = text.split("...done thinking.", 1)
        return parts[1].strip()

    # Check for </thought> tag
    if "</thought>" in text:
        parts = text.split("</thought>", 1)
        return parts[1].strip()

    return text.strip()


def query_ollama_chat(
    prompt: str,
    history: List[Dict[str, str]] = None,
    model_name: str = "gemma4:e4b",
    timeout_seconds: int = 120
) -> Dict[str, Any]:
    """
    Execute chat conversation against local Ollama model via safe subprocess stdin pipe.
    Constructs full prompt including system instructions and recent conversation turns.
    """
    if not is_ollama_installed():
        return {
            "success": False,
            "error": "Ollama CLI is not installed.",
            "response": "",
            "execution_time": 0.0
        }

    # Verify if model is installed, or fallback to first installed model
    available_models = [m["name"] for m in list_installed_models()]
    if model_name not in available_models and available_models:
        model_name = available_models[0]

    # Build context prompt
    conversation_text = f"{SENTINEL_SYSTEM_PROMPT}\n\n"
    if history:
        # Keep last 6 exchanges to avoid overflowing context window
        recent_history = history[-6:]
        for msg in recent_history:
            role_label = "Human Operator" if msg.get("role") == "user" else "Sentinel AI"
            conversation_text += f"{role_label}: {msg.get('content', '')}\n\n"

    conversation_text += f"Human Operator: {prompt}\n\nSentinel AI:"

    start_time = time.time()
    try:
        proc = subprocess.run(
            ["ollama", "run", model_name],
            input=conversation_text,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=timeout_seconds
        )
        elapsed = round(time.time() - start_time, 2)

        if proc.returncode != 0:
            return {
                "success": False,
                "error": proc.stderr.strip() or f"Process exited with code {proc.returncode}",
                "response": "",
                "execution_time": elapsed
            }

        cleaned = clean_ollama_output(proc.stdout)
        if not cleaned:
            cleaned = proc.stdout.strip()

        return {
            "success": True,
            "response": cleaned,
            "error": None,
            "execution_time": elapsed,
            "model_used": model_name
        }
    except subprocess.TimeoutExpired:
        elapsed = round(time.time() - start_time, 2)
        return {
            "success": False,
            "error": f"Local AI model timed out after {timeout_seconds} seconds.",
            "response": "",
            "execution_time": elapsed
        }
    except Exception as e:
        elapsed = round(time.time() - start_time, 2)
        return {
            "success": False,
            "error": str(e),
            "response": "",
            "execution_time": elapsed
        }
