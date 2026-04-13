# backend/mood/views.py

import math
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg
from django.utils import timezone
from datetime import timedelta
from .models import MoodEntry
from .serializers import MoodEntrySerializer

# ---------- Stress Volatility Calculator ----------
def calculate_stress_volatility(mood_scores):
    """
    Takes a list of mood scores (1-10) and calculates the Stress Volatility Index.
    Returns a dict with volatility, needs_intervention, and insight.
    """
    if len(mood_scores) < 3:
        return {
            "volatility": 0,
            "needs_intervention": False,
            "insight": "Need at least 3 mood entries to calculate volatility."
        }

    mean_mood = sum(mood_scores) / len(mood_scores)
    variance = sum((x - mean_mood) ** 2 for x in mood_scores) / len(mood_scores)
    volatility = math.sqrt(variance)

    needs_intervention = volatility > 2.5

    if needs_intervention:
        insight = f"⚠️ High Volatility Alert ({volatility:.2f}). Your mood is fluctuating rapidly—a strong indicator of burnout. Let's stabilize with grounding techniques."
    elif volatility < 0.5 and mean_mood < 4:
        insight = f"📉 Low Volatility, Low Mood ({volatility:.2f}). You've been stuck in a continuous rut. Try a new coping strategy today."
    else:
        insight = f"✅ Stable Baseline ({volatility:.2f}). Your emotional state is well-regulated. Keep up your current routines."

    return {
        "volatility": round(volatility, 2),
        "needs_intervention": needs_intervention,
        "insight": insight
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mood_stats(request):
    user = request.user
    entries = MoodEntry.objects.filter(user=user)
    total = entries.count()

    # Get last 7 days scores for volatility
    cutoff = timezone.now() - timedelta(days=7)
    recent_entries = entries.filter(created_at__gte=cutoff).order_by('created_at')
    recent_scores = [entry.score for entry in recent_entries]

    volatility_data = calculate_stress_volatility(recent_scores)

    if total > 0:
        avg = entries.aggregate(Avg('score'))['score__avg']
        latest = entries.first()
        stats = {
            'average': round(avg, 1),
            'total_entries': total,
            'streak_days': calculate_streak(user),
            'latest_score': latest.score,
            'latest_date': latest.created_at,
            'volatility': volatility_data['volatility'],
            'needs_intervention': volatility_data['needs_intervention'],
            'volatility_insight': volatility_data['insight'],
        }
    else:
        stats = {
            'average': 0,
            'total_entries': 0,
            'streak_days': 0,
            'latest_score': None,
            'latest_date': None,
            'volatility': 0,
            'needs_intervention': False,
            'volatility_insight': 'No mood data yet.',
        }
    return Response(stats)


def calculate_streak(user):
    entries = MoodEntry.objects.filter(user=user).dates('created_at', 'day').order_by('-created_at')
    if not entries:
        return 0
    streak = 1
    today = timezone.now().date()
    last_date = entries[0]
    if last_date != today:
        return 0
    for i in range(1, len(entries)):
        if (last_date - entries[i]).days == 1:
            streak += 1
            last_date = entries[i]
        else:
            break
    return streak