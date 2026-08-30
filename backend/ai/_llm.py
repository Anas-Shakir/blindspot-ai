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
_DEFAULT_MODEL = "llama-3.3-70b-versatile"

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


def _get_model() -> str:
    """Returns the configured model identifier."""
    return os.getenv("LLM_MODEL", _DEFAULT_MODEL)


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

    Returns:
        The raw response string if response_model is None, or a validated
        instance of response_model if one was provided.

    Raises:
        ValueError: If response_model is provided but the LLM's response
            cannot be parsed as valid JSON matching that model.
    """
    client = _get_client()
    model = _get_model()

    # When we need structured output, instruct the LLM in the system prompt
    extra_kwargs = {}
    if response_model is not None:
        system_prompt += (
            "\n\nYou MUST respond with valid JSON only. No markdown, "
            "no code fences, no explanation outside the JSON."
        )
        extra_kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.completions.create(
        model=model,
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
