"""Unit tests for Ollama local LLM integration and unprompted advisory assistant."""

import pytest
from app.services import ollama_llm, hf_llm
from app.services.base import LiveResponse


class TestOllamaModelSelection:
    def test_model_selection_prioritizes_qwen25(self):
        models = ["llama3.2:latest", "qwen2.5:0.5b", "mistral:latest"]
        selected = ollama_llm.select_best_model(models)
        assert selected == "qwen2.5:0.5b"

    def test_model_selection_fallback_to_llama_if_no_qwen(self):
        models = ["phi3:latest", "llama3.2:latest"]
        selected = ollama_llm.select_best_model(models)
        assert selected == "llama3.2:latest"

    def test_model_selection_prefers_user_explicit_model(self):
        models = ["llama3.2:latest", "qwen2.5:0.5b"]
        selected = ollama_llm.select_best_model(models, preferred="llama3.2:latest")
        assert selected == "llama3.2:latest"

    def test_empty_models_returns_none(self):
        selected = ollama_llm.select_best_model([])
        assert selected is None


@pytest.mark.asyncio
class TestOllamaHealthCheck:
    async def test_health_check_detects_models_or_gracefully_reports(self):
        health = await ollama_llm.check_ollama_health()
        assert "connected" in health
        assert "host" in health
        assert "available_models" in health
        assert isinstance(health["available_models"], list)


@pytest.mark.asyncio
class TestUnpromptedAdvisorQueries:
    async def test_unprompted_natural_language_query(self):
        """Test asking an arbitrary unprompted farming query not in static keywords."""
        query = "What are good practices for drip irrigation maintenance?"
        resp = await hf_llm.ask(query, language="en")
        assert isinstance(resp, LiveResponse)
        assert resp.data is not None
        assert len(resp.data.strip()) > 20
        # If Ollama is running, provider is ollama:*, else fallback to agrin_expert_kb
        assert resp.provider.startswith("ollama:") or resp.provider == "agrin_expert_kb"

    async def test_general_greeting_or_unprompted_question(self):
        """Test asking a general greeting or untagged question."""
        query = "Hello, who are you and how can you help me?"
        resp = await hf_llm.ask(query, language="en")
        assert len(resp.data.strip()) > 15

    async def test_offline_fallback_when_ollama_unreachable(self, monkeypatch):
        """Verify seamless fallback to expert knowledge engine when Ollama is offline."""
        async def mock_ask_ollama(*args, **kwargs):
            return None

        monkeypatch.setattr(ollama_llm, "ask_ollama", mock_ask_ollama)
        monkeypatch.setattr(hf_llm, "HF_TOKEN", "")

        resp = await hf_llm.ask("How do I improve soil pH naturally?", language="en")
        assert resp.provider == "agrin_expert_kb"
        assert "pH" in resp.data or "Soil" in resp.data
