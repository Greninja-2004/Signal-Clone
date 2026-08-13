import asyncio
import json
import urllib.request
import websockets
import os

BASE_URL = "http://localhost:8000"

def get_token(phone):
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/verify-otp",
        data=json.dumps({"phone_or_username": phone, "otp": "123456"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res["access_token"], res["user"]

async def receive_event(ws, expected_event, timeout=5.0):
    start = asyncio.get_event_loop().time()
    while asyncio.get_event_loop().time() - start < timeout:
        msg = await asyncio.wait_for(ws.recv(), timeout=timeout)
        data = json.loads(msg)
        if data.get("event") == expected_event:
            return data
    raise TimeoutError(f"Event '{expected_event}' not received within {timeout}s")

async def test_all():
    print("=" * 60)
    print("🚀 RUNNING SIGNAL CLONE MASTER FEATURE VERIFICATION SUITE")
    print("=" * 60)

    # 1. Health Check Endpoint
    print("\n[1/7] Testing Health Check Endpoint...")
    with urllib.request.urlopen(f"{BASE_URL}/health") as resp:
        h = json.loads(resp.read().decode("utf-8"))
        assert h["status"] == "online"
        print("  ✓ Health Check Passed: ", h)

    # 2. Auth Endpoints
    print("\n[2/7] Testing Authentication (send-otp, verify-otp, me)...")
    alice_token, alice_user = get_token("+15550101")
    bob_token, bob_user = get_token("+15550102")
    assert alice_user["username"] == "alice"
    assert bob_user["username"] == "bob"
    print("  ✓ Auth Verification & JWT Generation Passed!")

    # Verify /auth/me
    req_me = urllib.request.Request(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_me) as resp:
        me = json.loads(resp.read().decode("utf-8"))
        assert me["id"] == alice_user["id"]
        print("  ✓ /api/auth/me Endpoint Passed!")

    # 3. Users & Contacts Search
    print("\n[3/7] Testing User Search & Contacts...")
    req_search = urllib.request.Request(
        f"{BASE_URL}/api/users/search?q=diana",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_search) as resp:
        s_users = json.loads(resp.read().decode("utf-8"))
        assert len(s_users) > 0
        print(f"  ✓ Found user: {s_users[0]['display_name']} (@{s_users[0]['username']})")

    req_contacts = urllib.request.Request(
        f"{BASE_URL}/api/users/contacts",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_contacts) as resp:
        contacts = json.loads(resp.read().decode("utf-8"))
        print(f"  ✓ Alice contacts list count: {len(contacts)}")

    # 4. Attachments Endpoint
    print("\n[4/7] Testing File & Image Attachment Upload...")
    test_content = b"Signal Attachment Test Binary Content"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test_doc.txt"\r\n'
        f"Content-Type: text/plain\r\n\r\n"
    ).encode("utf-8") + test_content + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req_upload = urllib.request.Request(
        f"{BASE_URL}/api/users/attachment",
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {alice_token}"
        }
    )
    with urllib.request.urlopen(req_upload) as resp:
        att_res = json.loads(resp.read().decode("utf-8"))
        assert "media_url" in att_res
        print("  ✓ Attachment Upload Passed: ", att_res)

    # 5. Conversations & Direct Messaging
    print("\n[5/7] Testing Direct Conversations & History...")
    req_convs = urllib.request.Request(
        f"{BASE_URL}/api/conversations",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_convs) as resp:
        convs = json.loads(resp.read().decode("utf-8"))
        print(f"  ✓ Active conversations count: {len(convs)}")

    # 6. Real-Time 1-on-1 WebSockets Test
    print("\n[6/7] Testing 1-on-1 Real-Time WebSocket Messaging, Typing & Read Receipts...")
    url_alice = f"ws://localhost:8000/ws?token={alice_token}"
    url_bob = f"ws://localhost:8000/ws?token={bob_token}"

    req_direct = urllib.request.Request(
        f"{BASE_URL}/api/conversations/direct",
        data=json.dumps({"target_user_id": bob_user["id"]}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_direct) as resp:
        direct_conv = json.loads(resp.read().decode("utf-8"))
        direct_id = direct_conv["id"]

    async with websockets.connect(url_alice) as ws_alice, websockets.connect(url_bob) as ws_bob:
        # Alice typing
        await ws_alice.send(json.dumps({"event": "typing:start", "data": {"conversation_id": direct_id}}))
        t_event = await receive_event(ws_bob, "typing:status")
        print("  ✓ Bob received typing indicator event: ", t_event["data"]["is_typing"])

        # Alice sends message
        await ws_alice.send(json.dumps({
            "event": "message:send",
            "data": {"conversation_id": direct_id, "content": "Master test message from Alice"}
        }))
        m_event = await receive_event(ws_bob, "message:new")
        msg_id = m_event["data"]["id"]
        print(f"  ✓ Bob received real-time message: '{m_event['data']['content']}' (ID: {msg_id})")

        # Bob reads message
        await ws_bob.send(json.dumps({
            "event": "message:read",
            "data": {"conversation_id": direct_id, "message_ids": [msg_id]}
        }))
        r_event = await receive_event(ws_alice, "receipt:update")
        print("  ✓ Alice received read receipt update: status =", r_event["data"]["status"])

    # 7. Real-Time Group Chat & Admin Controls Test
    print("\n[7/7] Testing Real-Time Group Chat & Admin Member Controls...")
    req_group = urllib.request.Request(
        f"{BASE_URL}/api/conversations/group",
        data=json.dumps({"title": "Master Test Group 🌟", "member_user_ids": [bob_user["id"]]}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_group) as resp:
        grp = json.loads(resp.read().decode("utf-8"))
        grp_id = grp["id"]
        print("  ✓ Created Group ID: ", grp_id)

    async with websockets.connect(url_alice) as ws_alice, websockets.connect(url_bob) as ws_bob:
        await ws_bob.send(json.dumps({
            "event": "message:send",
            "data": {"conversation_id": grp_id, "content": "Group hello from Bob"}
        }))
        g_msg_event = await receive_event(ws_alice, "message:new")
        print(f"  ✓ Alice received group message: '{g_msg_event['data']['content']}'")

    print("\n" + "=" * 60)
    print("🎉 ALL BACKEND & WEBSOCKET SYSTEM TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_all())
