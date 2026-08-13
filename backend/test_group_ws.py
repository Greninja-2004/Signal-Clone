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
        if data.get("event") == expected_event:
            return data
    raise TimeoutError(f"Event {expected_event} not received within {timeout}s")

async def test_group_messaging():
    alice_token, alice_user = get_token("+15550101")
    bob_token, bob_user = get_token("+15550102")
    charlie_token, charlie_user = get_token("+15550103")

    print(f"Alice: {alice_user['display_name']} ({alice_user['id']})")
    print(f"Bob: {bob_user['display_name']} ({bob_user['id']})")
    print(f"Charlie: {charlie_user['display_name']} ({charlie_user['id']})")

    # Alice creates a new group chat
    req_group = urllib.request.Request(
        "http://localhost:8000/api/conversations/group",
        data=json.dumps({
            "title": "Group Realtime Test 🚀",
            "member_user_ids": [bob_user["id"]],
            "description": "Testing real-time group chat"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {alice_token}"}
    )
    with urllib.request.urlopen(req_group) as resp:
        group_conv = json.loads(resp.read().decode("utf-8"))
        conv_id = group_conv["id"]
        print(f"Created group ID: {conv_id}")

    url_alice = f"ws://localhost:8000/ws?token={alice_token}"
    url_bob = f"ws://localhost:8000/ws?token={bob_token}"

    async with websockets.connect(url_alice) as ws_alice, websockets.connect(url_bob) as ws_bob:
        print("Alice and Bob connected to WebSocket!")

        # Bob sends message to group
        await ws_bob.send(json.dumps({
            "event": "message:send",
            "data": {
                "conversation_id": conv_id,
                "content": "Hey team! Group real-time messaging test."
            }
        }))

        # Alice receives group message
        alice_event = await receive_event(ws_alice, "message:new")
        print(f"✅ Alice received group message from {alice_event['data']['sender']['display_name']}: '{alice_event['data']['content']}'")

        # Alice (Admin) adds Charlie to group via REST API
        req_add = urllib.request.Request(
            f"http://localhost:8000/api/conversations/{conv_id}/members",
            data=json.dumps({"user_ids": [charlie_user["id"]]}).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {alice_token}"}
        )
        with urllib.request.urlopen(req_add) as resp:
            add_res = json.loads(resp.read().decode("utf-8"))
            print(f"Admin Add Member response: {add_res}")

        # Bob receives system message for member add
        sys_msg_event = await receive_event(ws_bob, "message:new")
        print(f"✅ Bob received group system message: '{sys_msg_event['data']['content']}'")

        # Alice (Admin) removes Charlie from group
        req_del = urllib.request.Request(
            f"http://localhost:8000/api/conversations/{conv_id}/members/{charlie_user['id']}",
            headers={"Authorization": f"Bearer {alice_token}"},
            method="DELETE"
        )
        with urllib.request.urlopen(req_del) as resp:
            del_res = json.loads(resp.read().decode("utf-8"))
            print(f"Admin Remove Member response: {del_res}")

        # Bob receives system message for member remove
        sys_del_event = await receive_event(ws_bob, "message:new")
        print(f"✅ Bob received group system message: '{sys_del_event['data']['content']}'")

    print("\n🎉 SUCCESS: Real-time Group Messaging, Member Add, and Member Remove controls verified!")

if __name__ == "__main__":
    asyncio.run(test_group_messaging())
