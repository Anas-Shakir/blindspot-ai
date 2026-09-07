"""
backend/ai/_llm.py

Owner: Hashim (AI/Planning)

Shared LLM client adapter for all AI/Planning modules. Uses the OpenAI
Python SDK under the hood, which works with any OpenAI-compatible API
endpoint — Groq (free tier, used now), OpenAI, Alibaba DashScope (Qwen
family, swapped in later once credits arrive), DeepSeek, Together AI, etc.

The adapter pattern from blueprint §7.3 applies here too: one function
(`chat_completion`) with a stable signature. When the provider changes,
only the env vars (LLM_BASE_URL, LM_MODEL, LLM_API_KEY) change — nothing
that calls this module elsewhere has to be touched.

Environment variables:
    LLM_API_KEY   — API key for the LLM provider (required, no default)
    LLM_BASE_URL  — API endpoint URL (default: Groq)
    LLM_MODEL     — Model identifier (default: llama-3.3-70b-versatile)

Requires: openai
    pip install openai
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional, Type, TypeVar

from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Provider configuration — env vars with Groq free-tier defaults
# ---------------------------------------------------------------------------

_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
_DEFAULT_MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")

# Loaded once per process, not per call — connection setup is the expensive part.
_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    """Returns a process-cached OpenAI client pointed at the configured provider."""
    global _client
    if _client is None:
        api_key = os.getenv("LLM_API_KEY", "")
        base_url = os.getenv("LLM_BASE_URL", _DEFAULT_BASE_URL)
        _client = OpenAI(api_key=api_key, base_url=base_url)
    return _client


_active_model: Optional[str] = None


def set_active_model(model_name: str) -> None:
    """Sets the active LLM model identifier at runtime."""
    global _active_model
    _active_model = model_name


def get_active_model() -> str:
    """Returns the currently active model identifier (or env/default fallback)."""
    global _active_model
    if _active_model:
        return _active_model
    return os.getenv("LLM_MODEL", _DEFAULT_MODEL)


def _get_model() -> str:
    """Returns the configured model identifier."""
    return get_active_model()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

T = TypeVar("T", bound=BaseModel)


def chat_completion(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    response_model: Optional[Type[T]] = None,
    model: Optional[str] = None,
) -> str | T:
    """Sends a chat completion request and returns the response.

    Args:
        system_prompt: The system message that sets the LLM's role and
            output format instructions.
        user_prompt: The user message containing the actual content to
            process (transcript, plan context, etc.).
        temperature: Sampling temperature. Lower = more deterministic,
            which is what we want for structured extraction tasks.
        max_tokens: Maximum tokens in the response.
        response_model: If provided, the response text is parsed as JSON
            and validated against this Pydantic model. If None, returns
            the raw response text.
        model: Optional model override. If None, uses get_active_model().

    Returns:
        The raw response string if response_model is None, or a validated
        instance of response_model if one was provided.

    Raises:
        ValueError: If response_model is provided but the LLM's response
            cannot be parsed as valid JSON matching that model.
    """
    client = _get_client()
    target_model = model or get_active_model()

    # When we need structured output, instruct the LLM in the system prompt
    extra_kwargs = {}
    if response_model is not None:
        system_prompt += (
            "\n\nYou MUST respond with valid JSON only. No markdown, "
            "no code fences, no explanation outside the JSON."
        )
        extra_kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.completions.create(
        model=target_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        **extra_kwargs,
    )

    raw_text = response.choices[0].message.content or ""

    if response_model is None:
        return raw_text

    # Parse structured output — strip markdown code fences if wrapped
    text = raw_text.strip()
    if "```" in text:
        import re
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
        else:
            lines = [l for l in text.split("\n") if not l.startswith("```")]
            text = "\n".join(lines).strip()

    try:
        parsed = json.loads(text)
        return response_model.model_validate(parsed)
    except Exception as exc:
        # Fallback regex search for outer JSON object if extra text surrounded it
        import re
        obj_match = re.search(r"(\{[\s\S]*\})", text)
        if obj_match:
            try:
                parsed = json.loads(obj_match.group(1))
                return response_model.model_validate(parsed)
            except Exception:
                pass
        raise ValueError(
            f"LLM response could not be parsed as {response_model.__name__}: {exc}\n\n"
            f"Raw response:\n{raw_text}"
        ) from exc


def chat_completion_messages(
    messages: List[Dict[str, str]],
    *,
    temperature: float = 0.6,
    max_tokens: int = 1024,
    model: Optional[str] = None,
) -> str:
    """Sends a chat completion request with a full list of conversational messages."""
    client = _get_client()
    target_model = model or get_active_model()

    response = client.chat.completions.create(
        model=target_model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""
