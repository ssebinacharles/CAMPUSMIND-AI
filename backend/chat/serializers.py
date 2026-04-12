from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages']

class ConversationListSerializer(serializers.ModelSerializer):
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'last_message_preview']

    def get_last_message_preview(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return last_msg.content[:50] + ('...' if len(last_msg.content) > 50 else '')
        return ''