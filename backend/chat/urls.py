from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.send_message, name='send_message'),
    path('conversations/', views.list_conversations, name='list_conversations'),
    path('conversations/<int:conversation_id>/', views.get_conversation, name='get_conversation'),
    path('conversations/<int:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),
]