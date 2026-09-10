import sys
from backend.database import init_db, SessionLocal
from backend.utils.demo_seeder import seed_demo_data
from backend.services.rag_service import rag_service
from backend.routers.analytics import get_analytics_dashboard

def main():
    print("1. Initializing DB...")
    init_db()
    db = SessionLocal()
    
    print("2. Seeding demo data...")
    count = seed_demo_data(db, force=True)
    print(f"Seeded {count} meetings.")
    
    print("3. Testing Analytics calculation...")
    analytics = get_analytics_dashboard(db)
    print("Analytics Summary:", analytics["summary"])
    
    print("4. Testing RAG similarity search...")
    rag_result = rag_service.query("What was decided about Groq and the frontend?")
    print("\nRAG Answer:\n", rag_result["answer"])
    print("\nSources Cited:", len(rag_result["sources"]))
    for s in rag_result["sources"]:
        print(f"- {s['meeting_title']} at {s['timestamp_formatted']}: {s['snippet']}")

    db.close()
    print("\nALL BACKEND SMOKE TESTS PASSED!")

if __name__ == "__main__":
    main()
