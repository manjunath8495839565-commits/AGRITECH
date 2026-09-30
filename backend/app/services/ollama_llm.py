"""Local Ollama LLM integration for AgriN Connect.

Provides unprompted, general-purpose and specialized agricultural AI assistance
using local Ollama inference models (Qwen2.5, Llama3.2, etc.).
"""

from __future__ import annotations
import os
import time
from datetime import datetime
from typing import Optional, Any
import httpx
from app.services.base import LiveResponse

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "")  # if empty, auto-detects
OLLAMA_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "45.0"))

SYSTEM_PROMPT = """You are AgriN, an advanced agronomic and precision farming AI assistant.
You provide clear, practical, scientifically-grounded, and actionable agricultural advice.
Help farmers with crops, soil health, pest and disease management, irrigation, fertilizers, weather adaptation, and markets.
For greetings or general inquiries, converse helpfully and naturally.
Keep answers concise, clear, and well-structured using bullet points when appropriate."""


async def get_available_models(host: str = OLLAMA_HOST) -> list[str]:
    """Retrieve list of available model tags from local Ollama server."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{host}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", []) if m.get("name")]
                return models
    except Exception:
        pass
    return []


def select_best_model(models: list[str], preferred: Optional[str] = None) -> Optional[str]:
    """Select best local model prioritizing configured model, Qwen2.5, then Llama."""
    if preferred and preferred in models:
        return preferred
    if OLLAMA_MODEL and OLLAMA_MODEL in models:
        return OLLAMA_MODEL

    # Priority 1: Any Qwen2.5 model (e.g. qwen2.5:7b, qwen2.5:0.5b, etc.)
    for m in models:
        if m.startswith("qwen2.5"):
            return m
    # Priority 2: Any Qwen model
    for m in models:
        if "qwen" in m.lower():
            return m
    # Priority 3: Any Llama3 model
    for m in models:
        if "llama3" in m.lower():
            return m
    # Priority 4: First available
    return models[0] if models else None


async def check_ollama_health(host: str = OLLAMA_HOST) -> dict:
    """Check health and model readiness of local Ollama server."""
    models = await get_available_models(host)
    active = select_best_model(models)
    return {
        "connected": len(models) > 0,
        "host": host,
        "active_model": active,
        "available_models": models,
    }


async def ask_ollama(
    question: str,
    language: str = "en",
    model: Optional[str] = None,
    host: str = OLLAMA_HOST,
    timeout: float = OLLAMA_TIMEOUT,
) -> Optional[LiveResponse[str]]:
    """Query local Ollama server with full unprompted conversational capability."""
    models = await get_available_models(host)
    selected_model = model or select_best_model(models, preferred=OLLAMA_MODEL)
    if not selected_model:
        return None

    # Construct multilingual system prompt
    lang_note = f"Respond in {language}." if language and language != "en" else "Respond in English."
    sys_prompt = f"{SYSTEM_PROMPT}\n{lang_note}"

    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": question},
    ]

    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{host}/api/chat",
                json={
                    "model": selected_model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.6,
                        "num_predict": 450,
                    },
                },
            )
            if resp.status_code == 200:
                body = resp.json()
                content = body.get("message", {}).get("content", "").strip()
                if content:
                    latency = int((time.time() - t0) * 1000)
                    return LiveResponse[str](
                        data=content,
                        provider=f"ollama:{selected_model}",
                        fetched_at=datetime.utcnow(),
                        latency_ms=latency,
                        cached=False,
                        source_url=f"http://localhost:11434 ({selected_model})",
                    )
    except Exception:
        pass
    return None
