from fastapi import APIRouter
import time

router = APIRouter(prefix="/platform", tags=["Platform & Info"])

@router.get("/info")
async def get_platform_info():
    return {
        "status": "online",
        "name": "Signal Private Messenger",
        "tagline": "A more human way to stay close.",
        "protocol": "Signal Protocol v3",
        "encryption": "End-to-End (Curve25519, AES-256-GCM, HMAC-SHA256)",
        "nonprofit": "Signal Technology Foundation 501(c)(3)",
        "features": {
            "messaging": True,
            "voice_calls": True,
            "video_calls": True,
            "group_chats": True,
            "file_sharing": True,
            "stickers": True,
            "no_ads": True,
            "no_tracking": True
        },
        "version": "1.0.0",
        "timestamp": int(time.time())
    }
