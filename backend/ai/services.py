import os
from anthropic import Anthropic
from django.conf import settings
from .prompts import SYSTEM_PROMPT

client = Anthropic(api_key=settings.CLAUDE_API_KEY)

def detect_crisis(message):
    crisis_keywords = [
        'suicide', 'kill myself', 'want to die', 'end my life',
        'don\'t want to live', 'better off dead', 'harm myself',
        'self harm', 'cut myself', 'overdose'
    ]
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in crisis_keywords)

def build_conversation_context(history):
    if not history:
        return []
    messages = []
    for msg in history:
        role = 'assistant' if msg.sender == 'ai' else 'user'
        messages.append({'role': role, 'content': msg.content})
    return messages

def get_ai_response(user_message, conversation_history=None):
    if detect_crisis(user_message):
        return (
            "I'm really concerned about what you're sharing. Your safety is the top priority. "
            "Please reach out for immediate support:\n\n"
            "• Makerere University Counseling: +256 414 532 630\n"
            "• Talk to a trusted friend, family member, or faculty\n"
            "• National Mental Health Helpline: 0800 21 21 21\n\n"
            "You're not alone. Would you like me to suggest some coping strategies for this moment?"
        )

    messages = []
    if conversation_history:
        messages = build_conversation_context(conversation_history)
    messages.append({'role': 'user', 'content': user_message})

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=messages,
            temperature=0.7,
        )
        return response.content[0].text
    except Exception as e:
        return (
            "I'm having a bit of trouble connecting right now. But I'm still here for you. "
            "Would you like to try again in a moment, or perhaps try a breathing exercise together?"
        )

def generate_conversation_title(first_message):
    clean = first_message.strip()
    if len(clean) > 30:
        return clean[:30] + '...'
    return clean