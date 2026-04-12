from django.urls import path
from . import views

urlpatterns = [
    path('mood/log/', views.log_mood, name='log_mood'),
    path('mood/trends/', views.get_mood_trends, name='mood_trends'),
    path('mood/stats/', views.get_mood_stats, name='mood_stats'),
]