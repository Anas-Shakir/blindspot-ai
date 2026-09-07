"""
backend/app/integrations/whatsapp/handlers/text.py

Text message interaction handler (STEP 6 & STEP 7).
Connects incoming text messages to Blindspot AI educational intelligence and multi-turn context.
"""

from __future__ import annotations

import logging
from typing import List
from backend.app.services.ai.llm import chat_completion_messages
from ..context import conversation_manager
from ..schemas import MessageType, NormalizedMessage, OutgoingMessage

logger = logging.getLogger(__name__)

_WHATSAPP_SYSTEM_PROMPT = """\
You are Blindspot AI, an intelligent, warm, and highly engaging educational tutor on WhatsApp.
Your mission is to help students truly understand complex concepts through clear intuitions, memorable analogies, and structured step-by-step breakdowns.

GUIDELINES FOR WHATSAPP RESPONSES:
1. Format your responses beautifully for WhatsApp:
   - Use *bold* for key terms and headers.
   - Use bullet points (•) or numbered lists for steps.
   - Use emojis tastefully (💡, 📌, 🎯, 🚀, 🔍).
2. Keep explanations concise, crystal clear, and easy to read on mobile screens (2-4 short paragraphs maximum).
3. If the student asks a conceptual question, provide:
   - *Core Concept*: 1-2 sentence simple definition.
   - *Intuition / Real-world Analogy*: A relatable mental model.
   - *Quick Example*: A mini concrete example or code snippet if relevant.
4. Maintain conversational context across follow-up questions (e.g. "explain simpler", "give an example", "what about the second point?").
5. Stay friendly, encouraging, and supportive.
"""


async def handle_text_message(msg: NormalizedMessage) -> OutgoingMessage:
    """Processes an incoming text message through Blindspot AI with conversation context."""
    user_id = msg.user_identifier
    student_text = (msg.text_content or "").strip()

    if not student_text:
        return OutgoingMessage(
            recipient=user_id,
            message_type=MessageType.TEXT,
            text_content="👋 I received an empty text message. How can I help you learn today?",
        )

    # 1. Update conversation context with student's turn
    conversation_manager.add_user_turn(user_id, student_text)
    ctx = conversation_manager.get_context(user_id)

    # 2. Build message list for LLM
    messages = [{"role": "system", "content": _WHATSAPP_SYSTEM_PROMPT}]
    messages.extend(ctx.get_messages_for_llm())

    # 3. Call Blindspot AI LLM
    try:
        logger.info("[Blindspot AI] Generating response for %s: %s", user_id, student_text)
        ai_reply = chat_completion_messages(
            messages=messages,
            temperature=0.6,
            max_tokens=600,
        )
        ai_reply = (ai_reply or "").strip()

        if not ai_reply:
            ai_reply = "I'm thinking about that! Could you rephrase or ask your question in another way?"

        # 4. Save AI turn to conversation history
        conversation_manager.add_assistant_turn(user_id, ai_reply)

        return OutgoingMessage(
            recipient=user_id,
            message_type=MessageType.TEXT,
            text_content=ai_reply,
        )

    except Exception as e:
        logger.error("[Blindspot AI Error] Failed to generate response for %s: %s", user_id, e, exc_info=True)
        fallback_msg = (
            "⚠️ *Blindspot AI Tutor Notice*\n\n"
            "I ran into an issue while generating the explanation. Please try asking again in a moment!"
        )
        return OutgoingMessage(
            recipient=user_id,
            message_type=MessageType.TEXT,
            text_content=fallback_msg,
        )
