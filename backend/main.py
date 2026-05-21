import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from datetime import datetime

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.io setup with room support
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to Vision AI Classroom Monitoring API"}

# --- Socket.IO Events ---

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.on("toggle_camera")
async def handle_camera_toggle(sid, data):
    room = await sio.get_rooms(sid)
    for r in room:
        if r != sid:
            await sio.emit("toggle_camera", {"sid": sid, "enabled": data.get("enabled")}, room=r, skip_sid=sid)

@sio.on("toggle_mic")
async def handle_mic_toggle(sid, data):
    room = await sio.get_rooms(sid)
    for r in room:
        if r != sid:
            await sio.emit("toggle_mic", {"sid": sid, "enabled": data.get("enabled")}, room=r, skip_sid=sid)

@sio.on("request_presence")
async def handle_request_presence(sid, data):
    room = data.get("room")
    # Broadcast to room to ask students to send their metadata
    await sio.emit("request_presence", room=room, skip_sid=sid)

@sio.on("student_presence")
async def handle_student_presence(sid, data):
    room = data.get("room")
    target = data.get("target")
    # Send presence info either to a specific target or broadcast to room
    if target:
        await sio.emit("student_presence", data, room=target)
    else:
        await sio.emit("student_presence", data, room=room, skip_sid=sid)

@sio.event
async def disconnect(sid):
    rooms = await sio.get_rooms(sid)
    for room in rooms:
        if room != sid:
            await sio.emit("user_left", sid, room=room)
    print(f"Client disconnected: {sid}")

@sio.on("join_room")
async def handle_join_room(sid, data):
    room = data.get("room")
    role = data.get("role")
    metadata = data.get("metadata", {})
    await sio.enter_room(sid, room)
    print(f"Client {sid} ({role}) joined room: {room}")
    
    # Notify others that someone joined
    await sio.emit("user_joined", {"sid": sid, "role": role, "metadata": metadata}, room=room, skip_sid=sid)
    
    # If a teacher joined, students should re-broadcast their presence to the teacher
    # or the teacher should request participants. 
    # For now, let's just make sure metadata is passed.

@sio.on("signal")
async def handle_signal(sid, data):
    target_sid = data.get("target")
    signal_data = data.get("signal")
    # Relay signal to specific target
    await sio.emit("signal", {"from": sid, "signal": signal_data}, room=target_sid)

@sio.on("broadcast_signal")
async def handle_broadcast_signal(sid, data):
    room = data.get("room")
    signal_data = data.get("signal")
    # Broadcast to everyone in room except sender
    await sio.emit("signal", {"from": sid, "signal": signal_data}, room=room, skip_sid=sid)

@sio.on("distraction_alert")
async def handle_distraction(sid, data):
    room = data.get("room")
    # Add a timestamp if missing
    if "timestamp" not in data:
        data["timestamp"] = datetime.utcnow().isoformat()
    await sio.emit("new_alert", data, room=room)

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
