import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.db.session import async_engine, Base
from app.api.router import api_router
from app.websocket.handler import router as ws_router

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Clean up engine connection on shutdown
    await async_engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI Backend for Signal-Clone Real-Time Messaging App",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="static_uploads")

# Include master API router and WebSocket router
app.include_router(api_router)
app.include_router(ws_router)

@app.get("/health", tags=["Health Check"])
@app.get("/api/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": "sqlite",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
