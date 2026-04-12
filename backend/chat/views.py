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
    user = request.user
    message_text = request.data.get('message', '').strip()
    conversation_id = request.data.get('conversation_id')

    if not message_text:
        return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

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

    # Get conversation history for context
    history = conversation.messages.order_by('-created_at')[:10:-1]

    # Get AI response
    ai_reply = get_ai_response(message_text, conversation_history=history)

    # Save AI message
    ai_msg = Message.objects.create(
        conversation=conversation,
        sender='ai',
        content=ai_reply
    )

    conversation.save()  # updates updated_at

    return Response({
        'conversation_id': conversation.id,
        'user_message': MessageSerializer(user_msg).data,
        'ai_message': MessageSerializer(ai_msg).data,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    conversations = Conversation.objects.filter(user=request.user)
    serializer = ConversationListSerializer(conversations, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    serializer = ConversationSerializer(conversation)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    conversation.delete()
    return Response({'message': 'Conversation deleted'}, status=status.HTTP_204_NO_CONTENT)