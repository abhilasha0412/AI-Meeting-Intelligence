import json
from collections import Counter
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Meeting, ActionItem, Decision

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("")
def get_analytics_dashboard(db: Session = Depends(get_db)):
    """
    Returns aggregated metrics and charts data for the dashboard & analytics page.
    """
    meetings = db.query(Meeting).all()
    action_items = db.query(ActionItem).all()
    decisions = db.query(Decision).all()

    total_meetings = len(meetings)
    total_seconds = sum(m.duration_seconds for m in meetings)
    total_hours = round(total_seconds / 3600.0, 1)
    avg_duration_minutes = round((total_seconds / total_meetings) / 60.0, 1) if total_meetings > 0 else 0.0

    pending_tasks = sum(1 for a in action_items if a.status == "Pending")
    completed_tasks = sum(1 for a in action_items if a.status == "Completed")
    total_tasks = len(action_items)
    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # 1. Sentiment Breakdown
    sentiment_counts = Counter(m.sentiment or "Neutral" for m in meetings)
    sentiment_colors = {
        "Positive": "#10B981", # Emerald
        "Neutral": "#6366F1",  # Indigo
        "Constructive": "#0EA5E9", # Sky blue
        "Concerned": "#F59E0B" # Amber
    }
    sentiment_data = [
        {"name": k, "value": v, "color": sentiment_colors.get(k, "#8B5CF6")}
        for k, v in sentiment_counts.items()
    ]
    if not sentiment_data:
        sentiment_data = [{"name": "No Data", "value": 1, "color": "#9CA3AF"}]

    # 2. Top Topics
    topic_counter = Counter()
    for m in meetings:
        if m.key_topics_json:
            try:
                topics = json.loads(m.key_topics_json)
                for t in topics:
                    topic_counter[t.strip()] += 1
            except Exception:
                pass

    top_topics = [
        {"topic": topic, "count": count}
        for topic, count in topic_counter.most_common(6)
    ]
    if not top_topics:
        top_topics = [{"topic": "General Discussion", "count": total_meetings or 1}]

    # 3. Meeting Activity by Date (Last 7 meetings or timeline)
    activity_timeline = []
    sorted_meetings = sorted(meetings, key=lambda x: x.created_at or datetime.utcnow())
    
    # Aggregate by date
    date_map = {}
    for m in sorted_meetings:
        d_str = m.created_at.strftime("%b %d") if m.created_at else "Today"
        if d_str not in date_map:
            date_map[d_str] = {"date": d_str, "meetings": 0, "duration": 0.0}
        date_map[d_str]["meetings"] += 1
        date_map[d_str]["duration"] += round(m.duration_seconds / 60.0, 1)

    activity_timeline = list(date_map.values())
    if not activity_timeline:
        activity_timeline = [
            {"date": "Mon", "meetings": 0, "duration": 0},
            {"date": "Tue", "meetings": 0, "duration": 0},
            {"date": "Wed", "meetings": 0, "duration": 0},
            {"date": "Thu", "meetings": 0, "duration": 0},
            {"date": "Fri", "meetings": 0, "duration": 0}
        ]

    # 4. Action Item Status Distribution
    task_distribution = [
        {"name": "Pending", "count": pending_tasks, "color": "#F59E0B"},
        {"name": "Completed", "count": completed_tasks, "color": "#10B981"}
    ]

    # 5. Decisions by Category
    decision_counts = Counter(d.category or "General" for d in decisions)
    decision_data = [
        {"category": cat, "count": count}
        for cat, count in decision_counts.most_common(5)
    ]

    return {
        "summary": {
            "total_meetings": total_meetings,
            "total_hours": total_hours,
            "avg_duration_minutes": avg_duration_minutes,
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": completion_rate,
            "total_decisions": len(decisions)
        },
        "sentiment_distribution": sentiment_data,
        "top_topics": top_topics,
        "activity_timeline": activity_timeline,
        "task_distribution": task_distribution,
        "decision_categories": decision_data
    }
