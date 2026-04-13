import os
import re
from anthropic import Anthropic
from django.conf import settings
from .prompts import SYSTEM_PROMPT

client = Anthropic(api_key=settings.CLAUDE_API_KEY)


def detect_crisis(message):
    """
    Check if message contains crisis keywords that require immediate intervention.
    Returns True if high-risk keywords are detected.
    """
    crisis_keywords = [
        'suicide', 'kill myself', 'want to die', 'end my life',
        'don\'t want to live', 'better off dead', 'harm myself',
        'self harm', 'cut myself', 'overdose'
    ]
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in crisis_keywords)


def analyze_risk(message):
    """
    Multi-level risk classification.
    Returns: 'HIGH', 'MEDIUM', 'LOW', or 'NORMAL'
    """
    high = ["kill myself", "suicide", "end my life", "want to die"]
    medium = ["hopeless", "can't go on", "tired of everything", "no point"]
    low = ["stressed", "anxious", "overwhelmed", "worried"]

    msg = message.lower()
    if any(w in msg for w in high):
        return "HIGH"
    elif any(w in msg for w in medium):
        return "MEDIUM"
    elif any(w in msg for w in low):
        return "LOW"
    return "NORMAL"


def analyze_emotion_ai(message):
    """
    Use Claude to classify the emotional state of a message.
    Returns one word: low, stressed, neutral, good
    """
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=20,
            messages=[{
                "role": "user",
                "content": f"Classify the emotional state of this message into one word (low, stressed, neutral, good): {message}"
            }]
        )
        return response.content[0].text.strip().lower()
    except:
        return "neutral"


def build_conversation_context(history):
    """
    Convert conversation history into the format expected by Claude.
    """
    if not history:
        return []
    messages = []
    for msg in history:
        role = 'assistant' if msg.sender == 'ai' else 'user'
        messages.append({'role': role, 'content': msg.content})
    return messages


def get_ai_response(user_message, conversation_history=None):
    """
    Get AI response from Claude with XML parsing for UI commands.
    
    Returns a dictionary with:
        - text: The clean response to display to the user
        - uiAction: The UI command ('activate_breathe', 'suggest_journal', 'suggest_counselor', or 'none')
    """
    # Crisis detection overrides Claude for immediate safety
    if detect_crisis(user_message):
        return {
            "text": (
                "I'm really concerned about what you're sharing. Your safety is the top priority. "
                "Please reach out for immediate support:\n\n"
                "• Makerere University Counseling: +256 414 532 630\n"
                "• National Mental Health Helpline: 0800 21 21 21\n\n"
                "You're not alone. Would you like me to suggest some coping strategies for this moment?"
            ),
            "uiAction": "suggest_counselor"
        }

    # Build conversation context
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
        
        raw_output = response.content[0].text
        
        # --- XML Parsing for UI Commands ---
        ui_command = "none"
        clean_response = raw_output
        
        # Extract the UI Command using regex
        command_match = re.search(r'<ui_command>(.*?)</ui_command>', raw_output, re.DOTALL)
        if command_match:
            ui_command = command_match.group(1).strip()
            
        # Extract the actual text response for the user
        response_match = re.search(r'<response>(.*?)</response>', raw_output, re.DOTALL)
        if response_match:
            clean_response = response_match.group(1).strip()
        else:
            # Fallback: strip all XML tags if Claude forgot the structure
            clean_response = re.sub(r'<.*?>.*?</.*?>', '', raw_output, flags=re.DOTALL).strip()
            if not clean_response:
                clean_response = "I'm here for you. How can I support you right now?"

        return {
            "text": clean_response,
            "uiAction": ui_command
        }
        
    except Exception as e:
        # Fallback response if Claude API fails
        return {
            "text": "I'm having a bit of trouble connecting right now. Take a deep breath—I'm still here with you. Would you like to try a breathing exercise together?",
            "uiAction": "activate_breathe"
        }


def generate_conversation_title(first_message):
    """
    Generate a short title for a new conversation based on the first message.
    """
    clean = first_message.strip()
    if len(clean) > 30:
        return clean[:30] + '...'
    return clean