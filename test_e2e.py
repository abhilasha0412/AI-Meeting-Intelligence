import sys
import os
import urllib.request
import json
import urllib.parse

# Set UTF-8 encoding for Windows stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def test_full_stack():
    print("=== Testing Full-Stack AI Meeting Intelligence ===")
    
    # 1. Test Frontend Server (Port 3000)
    print("\n1. Testing Frontend HTTP Server (http://localhost:3000)...")
    req = urllib.request.Request("http://localhost:3000")
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        assert resp.status == 200
        assert "AI Meeting Intelligence" in html or "root" in html
        print("[OK] Frontend loaded HTML successfully (200 OK)")

    # 2. Test Backend Health (Port 8000)
    print("\n2. Testing Backend Health (http://127.0.0.1:8000/api/health)...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/health")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        assert data["status"] == "healthy"
        print("[OK] Backend is healthy:", data)

    # 3. Test Meetings List API
    print("\n3. Testing Meetings API (/api/meetings)...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/meetings")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        assert "meetings" in data
        print(f"[OK] Retrieved {data['total']} meetings from SQLite")
        first_meeting_id = data["meetings"][0]["id"] if data["meetings"] else None

    # 4. Test Meeting Details API
    if first_meeting_id:
        print(f"\n4. Testing Meeting Details API (/api/meetings/{first_meeting_id})...")
        req = urllib.request.Request(f"http://127.0.0.1:8000/api/meetings/{first_meeting_id}")
        with urllib.request.urlopen(req) as resp:
            details = json.loads(resp.read().decode('utf-8'))
            assert details["id"] == first_meeting_id
            print(f"[OK] Retrieved meeting '{details['title']}' with {len(details['transcripts'])} transcript chunks, {len(details['action_items'])} tasks, {len(details['decisions'])} decisions.")

    # 5. Test Action Items API & Status Toggle
    print("\n5. Testing Action Items API (/api/action-items)...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/action-items")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Retrieved {data['total']} action items ({data['pending_count']} pending, {data['completed_count']} completed)")
        if data["action_items"]:
            first_item = data["action_items"][0]
            item_id = first_item["id"]
            # Toggle
            put_data = json.dumps({"status": "Completed"}).encode('utf-8')
            put_req = urllib.request.Request(
                f"http://127.0.0.1:8000/api/action-items/{item_id}",
                data=put_data,
                headers={"Content-Type": "application/json"},
                method="PUT"
            )
            with urllib.request.urlopen(put_req) as put_resp:
                res = json.loads(put_resp.read().decode('utf-8'))
                assert res["success"] is True
                print(f"[OK] Updated task status for ID {item_id}: {res['action_item']['status']}")

    # 6. Test RAG Chat API with Groq AI
    print("\n6. Testing RAG AI Assistant (/api/chat) with Grounded Citations...")
    chat_payload = json.dumps({
        "message": "What decisions were made about Groq and the frontend?"
    }).encode('utf-8')
    chat_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/chat",
        data=chat_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(chat_req) as chat_resp:
        chat_data = json.loads(chat_resp.read().decode('utf-8'))
        print("\n--- AI Grounded Answer ---")
        print(chat_data["answer"])
        print("--------------------------")
        print(f"[OK] Sources cited: {len(chat_data['sources'])}")
        for src in chat_data["sources"]:
            print(f"  * [{src['timestamp_formatted']}] {src['meeting_title']}: \"{src['snippet']}\"")

    # 7. Test Analytics API
    print("\n7. Testing Analytics Aggregations (/api/analytics)...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/analytics")
    with urllib.request.urlopen(req) as resp:
        analytics = json.loads(resp.read().decode('utf-8'))
        print("[OK] Analytics Summary:", analytics["summary"])
        print(f"[OK] Sentiment segments: {len(analytics['sentiment_distribution'])}, Top topics: {len(analytics['top_topics'])}")

    # 8. Test Settings & Groq API Live Verification
    print("\n8. Testing Settings & Groq API Live Verification (/api/settings/test-key)...")
    test_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/settings/test-key",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(test_req) as test_resp:
        test_data = json.loads(test_resp.read().decode('utf-8'))
        assert test_data["success"] is True
        print(f"[OK] Groq API Key Verified: {test_data['message']} (Available models: {test_data['models_count']})")

    print("\nALL FULL-STACK END-TO-END TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_full_stack()
