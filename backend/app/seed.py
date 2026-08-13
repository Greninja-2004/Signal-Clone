import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import sync_engine, Base, SyncSessionLocal
from app.db.models import User, Contact, Conversation, ConversationMember, Message, MessageReceipt

def seed_database():
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)

    db = SyncSessionLocal()
    try:
        print("Seeding users...")
        now = datetime.now(timezone.utc)
        
        users_data = [
            {
                "phone": "+15550101",
                "username": "alice",
                "display_name": "Alice Smith",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
                "about": "Privacy is key 🔒",
                "is_online": True,
                "last_seen": now
            },
            {
                "phone": "+15550102",
                "username": "bob",
                "display_name": "Bob Johnson",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
                "about": "Hey there! I am using Signal.",
                "is_online": True,
                "last_seen": now
            },
            {
                "phone": "+15550103",
                "username": "charlie",
                "display_name": "Charlie Davis",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
                "about": "At work. Available via text.",
                "is_online": False,
                "last_seen": now - timedelta(minutes=25)
            },
            {
                "phone": "+15550104",
                "username": "diana",
                "display_name": "Diana Prince",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
                "about": "Building awesome fullstack apps 🚀",
                "is_online": True,
                "last_seen": now
            },
            {
                "phone": "+15550105",
                "username": "ethan",
                "display_name": "Ethan Hunt",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan",
                "about": "Mission impossible completed.",
                "is_online": False,
                "last_seen": now - timedelta(hours=2)
            }
        ]

        users = {}
        for u in users_data:
            user_obj = User(**u)
            db.add(user_obj)
            db.flush()
            users[u["username"]] = user_obj

        print("Seeding contacts...")
        contacts_data = [
            (users["alice"], users["bob"], "Bob J."),
            (users["alice"], users["charlie"], "Charlie"),
            (users["alice"], users["diana"], "Diana P."),
            (users["alice"], users["ethan"], "Ethan"),
            (users["bob"], users["alice"], "Alice Smith"),
            (users["bob"], users["charlie"], "Charlie D.")
        ]
        for u, c, alias in contacts_data:
            contact_obj = Contact(user_id=u.id, contact_user_id=c.id, alias=alias)
            db.add(contact_obj)

        print("Seeding 1-on-1 conversations...")
        # 1. Alice & Bob
        conv_alice_bob = Conversation(type="direct", created_by=users["alice"].id, updated_at=now)
        db.add(conv_alice_bob)
        db.flush()
        db.add(ConversationMember(conversation_id=conv_alice_bob.id, user_id=users["alice"].id, role="member"))
        db.add(ConversationMember(conversation_id=conv_alice_bob.id, user_id=users["bob"].id, role="member"))

        # Messages in Alice & Bob chat
        m1 = Message(conversation_id=conv_alice_bob.id, sender_id=users["alice"].id, content="Hey Bob! Are we on for the project review today?", created_at=now - timedelta(minutes=40))
        m2 = Message(conversation_id=conv_alice_bob.id, sender_id=users["bob"].id, content="Yes absolutely! I've set up the FastAPI server.", created_at=now - timedelta(minutes=35))
        m3 = Message(conversation_id=conv_alice_bob.id, sender_id=users["alice"].id, content="Great, is WebSocket working as well?", created_at=now - timedelta(minutes=30))
        m4 = Message(conversation_id=conv_alice_bob.id, sender_id=users["bob"].id, content="Yep! Messages, typing indicators, and receipts are ready.", created_at=now - timedelta(minutes=10))
        
        db.add_all([m1, m2, m3, m4])
        db.flush()

        # Receipts for Alice & Bob msgs (m4 is unread for Alice)
        db.add_all([
            MessageReceipt(message_id=m1.id, user_id=users["bob"].id, status="read", timestamp=now - timedelta(minutes=38)),
            MessageReceipt(message_id=m2.id, user_id=users["alice"].id, status="read", timestamp=now - timedelta(minutes=33)),
            MessageReceipt(message_id=m3.id, user_id=users["bob"].id, status="read", timestamp=now - timedelta(minutes=28)),
            MessageReceipt(message_id=m4.id, user_id=users["alice"].id, status="delivered", timestamp=now - timedelta(minutes=9))
        ])

        # 2. Alice & Charlie
        conv_alice_charlie = Conversation(type="direct", created_by=users["alice"].id, updated_at=now - timedelta(hours=1))
        db.add(conv_alice_charlie)
        db.flush()
        db.add(ConversationMember(conversation_id=conv_alice_charlie.id, user_id=users["alice"].id, role="member"))
        db.add(ConversationMember(conversation_id=conv_alice_charlie.id, user_id=users["charlie"].id, role="member"))

        m_c1 = Message(conversation_id=conv_alice_charlie.id, sender_id=users["charlie"].id, content="Hi Alice, did you test the SQLite seed script?", created_at=now - timedelta(hours=1))
        m_c2 = Message(conversation_id=conv_alice_charlie.id, sender_id=users["alice"].id, content="Testing it right now! Looks solid.", created_at=now - timedelta(minutes=55))
        db.add_all([m_c1, m_c2])
        db.flush()
        db.add_all([
            MessageReceipt(message_id=m_c1.id, user_id=users["alice"].id, status="read", timestamp=now - timedelta(minutes=58)),
            MessageReceipt(message_id=m_c2.id, user_id=users["charlie"].id, status="read", timestamp=now - timedelta(minutes=50))
        ])

        # 3. Alice & Diana
        conv_alice_diana = Conversation(type="direct", created_by=users["diana"].id, updated_at=now - timedelta(minutes=5))
        db.add(conv_alice_diana)
        db.flush()
        db.add(ConversationMember(conversation_id=conv_alice_diana.id, user_id=users["alice"].id, role="member"))
        db.add(ConversationMember(conversation_id=conv_alice_diana.id, user_id=users["diana"].id, role="member"))

        m_d1 = Message(conversation_id=conv_alice_diana.id, sender_id=users["diana"].id, content="Hey Alice, I pushed the updated frontend styles for the chat bubbles! 🎨", created_at=now - timedelta(minutes=5))
        db.add(m_d1)
        db.flush()
        # Unread for Alice
        db.add(MessageReceipt(message_id=m_d1.id, user_id=users["alice"].id, status="delivered", timestamp=now - timedelta(minutes=4)))

        print("Seeding Group Conversation...")
        conv_group = Conversation(
            type="group",
            title="Signal Dev Team 🚀",
            avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=SignalGroup",
            description="Official development channel for Signal Clone",
            created_by=users["alice"].id,
            updated_at=now
        )
        db.add(conv_group)
        db.flush()

        # Members: Alice (admin), Bob (admin), Charlie (member), Diana (member)
        db.add_all([
            ConversationMember(conversation_id=conv_group.id, user_id=users["alice"].id, role="admin"),
            ConversationMember(conversation_id=conv_group.id, user_id=users["bob"].id, role="admin"),
            ConversationMember(conversation_id=conv_group.id, user_id=users["charlie"].id, role="member"),
            ConversationMember(conversation_id=conv_group.id, user_id=users["diana"].id, role="member")
        ])

        # Group messages
        gm1 = Message(conversation_id=conv_group.id, sender_id=users["alice"].id, content="Alice created group 'Signal Dev Team 🚀'", message_type="system", created_at=now - timedelta(hours=3))
        gm2 = Message(conversation_id=conv_group.id, sender_id=users["alice"].id, content="Welcome team! Let's get this messaging app built.", created_at=now - timedelta(hours=2, minutes=55))
        gm3 = Message(conversation_id=conv_group.id, sender_id=users["bob"].id, content="Excited for this! Next.js + FastAPI + WebSockets stack is smooth.", created_at=now - timedelta(hours=2, minutes=30))
        gm4 = Message(conversation_id=conv_group.id, sender_id=users["diana"].id, content="Remember we need Signal dark theme tokens and clean status checkmarks!", created_at=now - timedelta(minutes=15))

        db.add_all([gm1, gm2, gm3, gm4])
        db.flush()

        # Receipts for group message gm4 (delivered/read states)
        db.add_all([
            MessageReceipt(message_id=gm4.id, user_id=users["alice"].id, status="read", timestamp=now - timedelta(minutes=10)),
            MessageReceipt(message_id=gm4.id, user_id=users["bob"].id, status="read", timestamp=now - timedelta(minutes=12)),
            MessageReceipt(message_id=gm4.id, user_id=users["charlie"].id, status="delivered", timestamp=now - timedelta(minutes=14))
        ])

        db.commit()
        print("Database successfully seeded with 5 users, contacts, 3 direct chats, and 1 group chat!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
