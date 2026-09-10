from backend.routers.meetings import router as meetings_router
from backend.routers.action_items import router as action_items_router
from backend.routers.chat import router as chat_router
from backend.routers.analytics import router as analytics_router
from backend.routers.settings import router as settings_router

__all__ = [
    "meetings_router",
    "action_items_router",
    "chat_router",
    "analytics_router",
    "settings_router"
]
