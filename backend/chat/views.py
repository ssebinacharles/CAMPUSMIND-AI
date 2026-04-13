from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import MessageSerializer, ConversationSerializer, ConversationListSerializer
from ai.services import get_ai_response, generate_conversation_title


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """
    Send a user message, get AI response, and store both.
    Returns conversation_id, user_message, and ai_message with uiAction.
    """
    user = request.user
    message_text = request.data.get('message', '').strip()
    conversation_id = request.data.get('conversation_id')

    if not message_text:
        return Response(
            {'error': 'Message cannot be empty'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get or create conversation
    if conversation_id:
        conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
    else:
        conversation = Conversation.objects.create(user=user)
        conversation.title = generate_conversation_title(message_text)
        conversation.save()

    # Save user message
    user_msg = Message.objects.create(
        conversation=conversation,
        sender='user',
        content=message_text
    )

    # Get conversation history for context (last 10 messages in chronological order)
    history = conversation.messages.order_by('-created_at')[:10]
    history = list(history)[::-1]  # Reverse to get chronological order

    # Get structured AI response
    ai_result = get_ai_response(message_text, conversation_history=history)

    # Save AI message with clean text
    ai_msg = Message.objects.create(
        conversation=conversation,
        sender='ai',
        content=ai_result["text"]
    )

    # Update conversation timestamp
    conversation.save()  # auto-updates updated_at

    # Serialize messages
    user_message_data = MessageSerializer(user_msg).data
    ai_message_data = MessageSerializer(ai_msg).data

    # Add uiAction to AI message response
    ai_message_data['uiAction'] = ai_result["uiAction"]

    return Response({
        'conversation_id': conversation.id,
        'user_message': user_message_data,
        'ai_message': ai_message_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    """
    Get all conversations for the current user (for sidebar).
    """
    conversations = Conversation.objects.filter(user=request.user)
    serializer = ConversationListSerializer(conversations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation(request, conversation_id):
    """
    Get a single conversation with all messages.
    """
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    serializer = ConversationSerializer(conversation)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    """
    Delete a conversation.
    """
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    conversation.delete()
    return Response({'message': 'Conversation deleted'}, status=status.HTTP_204_NO_CONTENT)