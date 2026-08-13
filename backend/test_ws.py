import asyncio
import json
import urllib.request
import websockets

def get_token(phone):
    req = urllib.request.Request(
        "http://localhost:8000/api/auth/verify-otp",
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
        print(f"Received event: {data.get('event')}")
        if data.get("event") == expected_event:
            return data
    raise TimeoutError(f"Event {expected_event} not received within {timeout}s")

async def test_realtime_messaging():
    alice_token, alice_user = get_token("+15550101")
    bob_token, bob_user = get_token("+15550102")

    print(f"Alice ID: {alice_user['id']}")
    print(f"Bob ID: {bob_user['id']}")

    # Get existing direct conversation between Alice and Bob
    req_conv = urllib.request.Request(
        "http://localhost:8000/api/conversations/direct",
        data=json.dumps({"target_user_id": bob_user["id"]}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_conv) as resp:
        conv_data = json.loads(resp.read().decode("utf-8"))
        conv_id = conv_data["id"]
        print(f"Direct conversation ID: {conv_id}")

    url_alice = f"ws://localhost:8000/ws?token={alice_token}"
    url_bob = f"ws://localhost:8000/ws?token={bob_token}"

    async with websockets.connect(url_alice) as ws_alice, websockets.connect(url_bob) as ws_bob:
        print("Both Alice and Bob WebSocket connections established!")

        # Alice sends typing start
        await ws_alice.send(json.dumps({
            "event": "typing:start",
            "data": {"conversation_id": conv_id}
        }))

        # Bob receives typing status
        typing_event = await receive_event(ws_bob, "typing:status")
        print(f"✅ Bob received typing status: {typing_event['data']}")

        # Alice sends message
        content = "Hello Bob! Testing real-time WebSocket messaging."
        await ws_alice.send(json.dumps({
            "event": "message:send",
            "data": {
                "conversation_id": conv_id,
                "content": content
            }
        }))

        # Bob receives new message
        new_msg_event = await receive_event(ws_bob, "message:new")
        msg_id = new_msg_event["data"]["id"]
        print(f"✅ Bob received message 'id={msg_id}', content='{new_msg_event['data']['content']}'")

        # Bob sends read receipt
        await ws_bob.send(json.dumps({
            "event": "message:read",
            "data": {
                "conversation_id": conv_id,
                "message_ids": [msg_id]
            }
        }))

        # Alice receives read receipt update
        receipt_event = await receive_event(ws_alice, "receipt:update")
        print(f"✅ Alice received read receipt update: {receipt_event['data']}")

    print("\n🎉 SUCCESS: Real-time 1-on-1 WebSocket messaging, typing indicators, and read receipts verified!")

if __name__ == "__main__":
    asyncio.run(test_realtime_messaging())
