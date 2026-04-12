from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg
from django.utils import timezone
from datetime import timedelta
from .models import MoodEntry
from .serializers import MoodEntrySerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_mood(request):
    score = request.data.get('score')
    note = request.data.get('note', '')

    if not score or not (1 <= int(score) <= 10):
        return Response({'error': 'Score must be between 1 and 10'}, status=status.HTTP_400_BAD_REQUEST)

    entry = MoodEntry.objects.create(user=request.user, score=score, note=note)
    serializer = MoodEntrySerializer(entry)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mood_trends(request):
    days = int(request.query_params.get('days', 30))
    cutoff = timezone.now() - timedelta(days=days)
    entries = MoodEntry.objects.filter(user=request.user, created_at__gte=cutoff).order_by('created_at')
    serializer = MoodEntrySerializer(entries, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mood_stats(request):
    user = request.user
    entries = MoodEntry.objects.filter(user=user)
    total = entries.count()

    if total > 0:
        avg = entries.aggregate(Avg('score'))['score__avg']
        latest = entries.first()
        stats = {
            'average': round(avg, 1),
            'total_entries': total,
            'streak_days': calculate_streak(user),
            'latest_score': latest.score,
            'latest_date': latest.created_at,
        }
    else:
        stats = {
            'average': 0,
            'total_entries': 0,
            'streak_days': 0,
            'latest_score': None,
            'latest_date': None,
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