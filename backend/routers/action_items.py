from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ActionItem, Meeting

router = APIRouter(prefix="/api/action-items", tags=["Action Items"])

@router.get("")
def list_action_items(
    status: Optional[str] = None,
    search: Optional[str] = None,
    meeting_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Lists action items across all meetings with optional filters."""
    query = db.query(ActionItem).join(Meeting)

    if status and status != "All":
        query = query.filter(ActionItem.status == status)
    if meeting_id:
        query = query.filter(ActionItem.meeting_id == meeting_id)
    if search:
        query = query.filter(
            ActionItem.task.ilike(f"%{search}%") | 
            ActionItem.assignee.ilike(f"%{search}%") |
            Meeting.title.ilike(f"%{search}%")
        )

    items = query.order_by(ActionItem.status.desc(), ActionItem.id.desc()).all()

    result = []
    for item in items:
        result.append({
            "id": item.id,
            "meeting_id": item.meeting_id,
            "meeting_title": item.meeting.title if item.meeting else f"Meeting #{item.meeting_id}",
            "task": item.task,
            "assignee": item.assignee,
            "deadline": item.deadline,
            "status": item.status,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "completed_at": item.completed_at.isoformat() if item.completed_at else None
        })

    pending_count = sum(1 for i in result if i["status"] == "Pending")
    completed_count = sum(1 for i in result if i["status"] == "Completed")

    return {
        "action_items": result,
        "total": len(result),
        "pending_count": pending_count,
        "completed_count": completed_count
    }

@router.put("/{item_id}")
def update_action_item(
    item_id: int,
    status: Optional[str] = Body(None, embed=True),
    task: Optional[str] = Body(None, embed=True),
    assignee: Optional[str] = Body(None, embed=True),
    deadline: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    """Updates action item status (Pending <-> Completed) or task details."""
    item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    if status is not None:
        item.status = status
        if status == "Completed":
            item.completed_at = datetime.utcnow()
        else:
            item.completed_at = None

    if task is not None:
        item.task = task
    if assignee is not None:
        item.assignee = assignee
    if deadline is not None:
        item.deadline = deadline

    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "action_item": {
            "id": item.id,
            "meeting_id": item.meeting_id,
            "task": item.task,
            "assignee": item.assignee,
            "deadline": item.deadline,
            "status": item.status,
            "completed_at": item.completed_at.isoformat() if item.completed_at else None
        }
    }

@router.delete("/{item_id}")
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    """Deletes an action item."""
    item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Action item deleted successfully"}
