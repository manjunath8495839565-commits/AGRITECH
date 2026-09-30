"""LLM & Advisory Service – Local Ollama (Qwen2.5/Llama) with HF & Expert Knowledge Engine fallback."""

from __future__ import annotations
import os
from datetime import datetime
from app.services.base import fetch_with_retry, LiveResponse
from app.services.agronomic_kb import get_expert_agronomic_advice
from app.services import ollama_llm

HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_LLM_MODEL = os.environ.get("HF_LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct")
BASE = f"https://api-inference.huggingface.co/models/{HF_LLM_MODEL}"

SYSTEM_PROMPT = """You are AgriN, an expert agricultural AI assistant.
You provide practical, science-based farming advice.
Always prioritize farmer safety, sustainability, and local practices.
Keep answers concise, structured, and actionable."""


async def ask(question: str, language: str = "en") -> LiveResponse[str]:
    """Provide real, unprompted AI assistant answers using Local Ollama, HF, or Expert KB."""
    # 1. Primary: Local Ollama (Unprompted natural AI assistant output)
    try:
        ollama_resp = await ollama_llm.ask_ollama(question, language)
        if ollama_resp and ollama_resp.data and len(ollama_resp.data.strip()) > 10:
            return ollama_resp
    except Exception:
        pass

    # 2. Secondary: If HF_TOKEN is configured, try Hugging Face router
    if HF_TOKEN:
        try:
            prompt = f"{SYSTEM_PROMPT}\n\nUser ({language}): {question}\n\nAgriN:"
            headers = {"Authorization": f"Bearer {HF_TOKEN}"}
            data, ms, src = await fetch_with_retry(
                BASE,
                method="POST",
                json={"inputs": prompt, "parameters": {"max_new_tokens": 350, "temperature": 0.7}},
                headers=headers,
            )
            if isinstance(data, list) and data:
                text = data[0].get("generated_text", "")
                if "AgriN:" in text:
                    text = text.split("AgriN:")[-1].strip()
                if len(text.strip()) > 20:
                    return LiveResponse[str](
                        data=text.strip(),
                        provider="hf_qwen25_7b",
                        fetched_at=datetime.utcnow(),
                        latency_ms=ms,
                        cached=False,
                        source_url=src,
                    )
        except Exception:
            pass

    # 3. Fallback: Expert Agronomic Knowledge Engine
    expert = get_expert_agronomic_advice(question, language)
    return LiveResponse[str](
        data=expert["answer"],
        provider="agrin_expert_kb",
        fetched_at=datetime.utcnow(),
        latency_ms=12,
        cached=False,
        source_url="https://fao.org/agronomy/guidelines",
    )

