import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import time
import base64

class AIProcessor:
    def __init__(self):
        # MediaPipe Solutions
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose()
        
        # Load YOLOv8 for mobile phone detection
        try:
            self.yolo_model = YOLO('yolov8n.pt') 
        except Exception as e:
            print(f"Error loading YOLO: {e}")
            self.yolo_model = None

    def process_base64_frame(self, base64_str):
        """Processes a base64 encoded frame."""
        try:
            encoded_data = base64_str.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return self.process_frame(frame)
        except Exception as e:
            return {"error": str(e)}

    def process_frame(self, frame):
        if frame is None:
            return {"error": "Invalid frame"}

        results = {
            "face_detected": False,
            "distraction_score": 0,
            "alerts": [],
            "status": "Attentive"
        }

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, _ = frame.shape
        
        # 1. Face Analysis
        mesh_results = self.face_mesh.process(rgb_frame)
        
        if mesh_results.multi_face_landmarks:
            results["face_detected"] = True
            landmarks = mesh_results.multi_face_landmarks[0]
            
            # Simplified Gaze Tracking
            gaze = self._analyze_gaze(landmarks)
            if gaze != "Center":
                results["alerts"].append(f"Looking {gaze}")
                results["distraction_score"] += 20
        else:
            results["distraction_score"] += 40
            results["alerts"].append("Student absent")

        # 2. Object Detection (Phone)
        if self.yolo_model:
            yolo_results = self.yolo_model(frame, verbose=False)[0]
            for box in yolo_results.boxes:
                if int(box.cls[0]) == 67: # 'cell phone' class in COCO
                    results["alerts"].append("Mobile phone detected")
                    results["distraction_score"] += 30

        results["distraction_score"] = min(results["distraction_score"], 100)
        results["status"] = self._get_status(results["distraction_score"])
        
        return results

    def _analyze_gaze(self, landmarks):
        # Simplified gaze logic using nose tip and face orientation
        # Placeholder for actual landmark math
        return "Center"

    def _get_status(self, score):
        if score < 30: return "Attentive"
        if score < 60: return "Mild Distraction"
        return "High Distraction"
