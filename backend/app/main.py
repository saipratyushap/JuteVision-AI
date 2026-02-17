from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
import shutil
import os
import cv2
import uuid
import json
import asyncio
from .tracker import JuteBagTracker
from .zone_tracker import ModularZoneTracker

# Global tracker placeholders
tracker = None
zone_tracker = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model on startup
    global tracker, zone_tracker
    
    use_mock = os.getenv("USE_MOCK_TRACKER", "false").lower() == "true"
    
    if use_mock:
        print("Starting in MOCK / SIMULATION MODE...")
        from .mock_tracker import MockJuteBagTracker
        tracker = MockJuteBagTracker()
    else:
        print("Initializing JuteBagTracker...")
        try:
            tracker = JuteBagTracker()
            zone_tracker = ModularZoneTracker()
        except Exception as e:
            print(f"Failed to initialize Real Tracker: {e}")
            print("Falling back to MOCK MODE due to initialization failure.")
            from .mock_tracker import MockJuteBagTracker
            tracker = MockJuteBagTracker()
            zone_tracker = MockJuteBagTracker() # Reuse for simplicity
            
    yield
    # Clean up on shutdown if needed
    print("Shutting down JuteBagTracker...")
    tracker = None

from fastapi.staticfiles import StaticFiles

# WebSocket Manager with User Scoping
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {} # userId -> [WebSockets]

    async def connect(self, userId: str, websocket: WebSocket):
        await websocket.accept()
        if userId not in self.active_connections:
            self.active_connections[userId] = []
        self.active_connections[userId].append(websocket)

    def disconnect(self, userId: str, websocket: WebSocket):
        if userId in self.active_connections:
            self.active_connections[userId].remove(websocket)
            if not self.active_connections[userId]:
                del self.active_connections[userId]

    async def broadcast(self, message: dict, userId: str = None):
        if userId:
            # Send to specific user
            if userId in self.active_connections:
                for connection in self.active_connections[userId]:
                    try:
                        await connection.send_json(message)
                    except:
                        pass
        else:
            # Global broadcast (system alerts etc)
            for user_conns in self.active_connections.values():
                for connection in user_conns:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()

app = FastAPI(lifespan=lifespan, title="CCTV VisionCount AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        # Send initial state (Optional: reset session count for this user?)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

# --- GLOBAL STATE ---
tasks = {}
# Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DETECTION_DIR = os.path.join(BASE_DIR, "detections")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads") # New upload directory
DATA_DIR = os.path.join(BASE_DIR, "data") # Directory for persistent data

# Physical Camera Control Flag
_camera_active = False

class CameraManager:
    _instance = None
    _cap = None

    @classmethod
    def get_cap(cls):
        if cls._cap is None:
            print("Opening Camera Hardware Singleton...")
            cls._cap = cv2.VideoCapture(0)
        return cls._cap

    @classmethod
    def stop(cls):
        if cls._cap is not None:
            print("Force Releasing Camera Hardware Singleton...")
            cls._cap.release()
            cls._cap = None
        return True

TASK_FILE = os.path.join(DATA_DIR, "tasks.json")

def load_tasks():
    global tasks
    if os.path.exists(TASK_FILE):
        try:
            with open(TASK_FILE, "r") as f:
                tasks = json.load(f)
        except Exception as e:
            print(f"Error loading tasks: {e}")
            tasks = {} # Reset tasks if loading fails

def save_tasks():
    try:
        with open(TASK_FILE, "w") as f:
            json.dump(tasks, f, indent=4)
    except Exception as e:
        print(f"Error saving tasks: {e}")

# Ensure directories exist
os.makedirs(DETECTION_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True) # Ensure data directory exists

load_tasks() # Initialize on startup
TEMP_DIR = "backend/temp_uploads" # Use the correct path relative to root if running from root


# Mount static files for video download (Now points to detections folder)
app.mount("/download", StaticFiles(directory=DETECTION_DIR), name="download")

def process_video_task(task_id: str, video_path: str, mode: str = "static", user_id: str = "anonymous"):
    """
    Background task to process video and update status.
    """
    global tracker, zone_tracker
    if not tracker or ((mode == "zone" or mode == "conveyor") and not zone_tracker):
        print("Tracker(s) not initialized!")
        tasks[task_id] = {"status": "failed", "error": "Tracker not initialized", "user_id": user_id}
        save_tasks()
        return

    print(f"Starting task {task_id} for {video_path} in mode {mode}")
    
    # Callback for real-time updates with persistence
    def safe_broadcast(data: dict):
        # Update persistent task store if progress/count is available
        if task_id in tasks:
            if "progress" in data:
                tasks[task_id]["progress"] = data["progress"]
            if "count" in data:
                tasks[task_id]["results_count"] = data["count"]
            save_tasks()
        
        try:
            asyncio.run(manager.broadcast(data, userId=user_id))
        except:
            pass
        
    try:
        # Save output to detections folder with a clean name
        output_filename = f"detected_{task_id}.mp4"
        output_video_path = os.path.join(DETECTION_DIR, output_filename)
        
        # Run tracking and save video with callback
        # v5: Modular Choice between Tracking types
        if mode == "zone" or mode == "conveyor":
            zone_tracker.reset_state() # v10.6 Fix: Prevent count leakage across videos
            results = zone_tracker.process_video(video_path, output_video_path, on_update=safe_broadcast)
        else:
            tracker.reset_state() # v10.6 Fix: Standardize reset for all modes
            results = tracker.process_video(video_path, output_video_path, mode=mode, on_update=safe_broadcast)
        
        # Results now contains the count directly from the tracker
        final_count = results.get("count", 0)
        cumulative_total = results.get("total_count", 0) if (mode == "zone" or mode == "conveyor") else 0
        
        # v8.6 reporting: Use cumulative total for upload status list
        reported_count = cumulative_total if (mode == "zone" or mode == "conveyor") else final_count
        
        # Force a final broadcast of the global total to ensure UI is in sync
        # v13.0 Precision Fix: Broadcast ONLY the current task's count.
        # This prevents the Summation Bug (6 bag bug)
        safe_broadcast({"count": reported_count})
        
        tasks[task_id] = {
            "status": "completed",
            "count": reported_count,
            "results_count": reported_count,
            "video_url": f"/download/{output_filename}"
        }
        save_tasks()
        
        # Optional: Clean up input file after processing
        # if os.path.exists(video_path):
        #     os.remove(video_path)
        
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        tasks[task_id] = {"status": "failed", "error": str(e)}
        save_tasks()
        
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        tasks[task_id] = {"status": "failed", "error": str(e)}

def process_image_task(task_id: str, image_path: str, user_id: str = "anonymous"):
    """
    Background task to process an image.
    """
    global tracker
    if not tracker:
        tasks[task_id] = {"status": "failed", "error": "Tracker not initialized", "user_id": user_id}
        save_tasks()
        return

    print(f"Starting image task {task_id} for {image_path}")
    
    # Callback for real-time updates
    def safe_broadcast(data: dict):
        asyncio.run(manager.broadcast(data, userId=user_id))
    
    try:
        output_filename = f"detected_{task_id}.jpg"
        output_path = os.path.join(DETECTION_DIR, output_filename)
        
        # Run processing with callback
        results = tracker.process_image(image_path, output_path, on_update=safe_broadcast)
        
        # Add to task results
        results["video_url"] = f"/download/{output_filename}" # Frontend expects video_url for display
        results["is_image"] = True # Flag for frontend
        results["user_id"] = user_id
        tasks[task_id] = results
        save_tasks()
        asyncio.run(manager.broadcast({"count": tracker.total_count}, userId=user_id))
        
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        tasks[task_id] = {"status": "failed", "error": str(e)}
        save_tasks()

@app.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    mode: str = Form("static"),
    user_id: str = Form("anonymous")
):
    """
    Uploads a file (Video or Image) and starts processing.
    """
    # Generate unique ID
    task_id = str(uuid.uuid4())
    filename = file.filename.lower()
    
    # Save file
    file_location = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
    with open(file_location, "wb+") as file_object:
        file_object.write(await file.read())
    
    # Determine type
    is_image = filename.endswith(('.jpg', '.jpeg', '.png', '.webp'))
    
    # Validation based on Mode
    if mode == "static" and not is_image:
        return JSONResponse(status_code=400, content={"message": "Static Mode strictly supports IMAGES only (JPG, PNG). Please upload an image."})
    
    if mode == "scanning" and is_image:
        return JSONResponse(status_code=400, content={"message": "Scanning Mode supports VIDEOS only. Please upload a video."})

    if (mode == "zone" or mode == "conveyor") and is_image:
        return JSONResponse(status_code=400, content={"message": "Zone Mode supports VIDEOS only. Please upload a video."})

    # v13.0 Critical Reset: Standardize clean slate for ALL trackers
    if tracker: tracker.reset_state()
    if zone_tracker: zone_tracker.reset_state()
    
    # Initial task status
    tasks[task_id] = {"status": "processing", "progress": 0, "file": file.filename, "mode": mode, "user_id": user_id}
    save_tasks()
    
    # Start background processing
    if is_image:
        background_tasks.add_task(process_image_task, task_id, file_location, user_id)
    else:
        background_tasks.add_task(process_video_task, task_id, file_location, mode, user_id)
    
    return {"task_id": task_id, "message": "Upload accepted and processing started."}

@app.post("/reset")
async def reset_session():
    """Resets the session count and history."""
    global tracker, zone_tracker
    if tracker:
        tracker.reset_state()
    if zone_tracker:
        try:
            zone_tracker.reset_state()
        except Exception as e:
            print(f"Zone reset failed: {e}")
            
    # Broadcast reset to all clients
    await manager.broadcast({"count": 0, "event": "reset"})
    return {"message": "Session reset successfully", "count": 0}

@app.get("/tasks/{task_id}")
def get_task_status(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

def generate_frames():
    """
    Generator for camera stream using Singleton Manager. 
    """
    global tracker, _camera_active
    if not tracker:
        return

    cap = CameraManager.get_cap()
    
    try:
        while _camera_active:
            success, frame = cap.read()
            if not success:
                # If camera fails during stream, try to reset singleton
                CameraManager.stop()
                break
            
            # Run Live AI Processing
            frame = tracker.process_live_frame(frame)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            # Small sleep to yield control
            import time
            time.sleep(0.01)
    finally:
        # We don't release here anymore, we wait for explicit /camera/off
        print("Stream Generator segment ended.")

@app.get("/stream")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.post("/camera/on")
async def camera_on():
    global _camera_active
    _camera_active = True
    print("UI Requested Camera ON")
    return {"status": "camera_powering_up"}

@app.post("/camera/off")
async def camera_off():
    global _camera_active
    _camera_active = False
    CameraManager.stop() # HARD STOP HARDWARE
    print("UI Requested Camera OFF - HARDWARE KILLED")
    return {"status": "camera_shutting_down"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
