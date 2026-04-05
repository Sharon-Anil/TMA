from fastapi import FastAPI, File, UploadFile, HTTPException, Form
import uvicorn
import face_recognition
import numpy as np
import cv2
import io
import json

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Face Auth Service API"}

@app.post("/register-face")
async def register_face(file: UploadFile = File(...)):
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to RGB (face_recognition uses RGB)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        face_locations = face_recognition.face_locations(rgb_img)
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face found in the image")
        if len(face_locations) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces found. Please provide an image with only one face.")
            
        # Get face encoding
        face_encoding = face_recognition.face_encodings(rgb_img, face_locations)[0]
        
        # Return encoding as JSON string (to be saved in MongoDB)
        encoding_list = face_encoding.tolist()
        
        return {"faceEncodingId": json.dumps(encoding_list), "message": "Face registered successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-face")
async def verify_face(file: UploadFile = File(...), registered_encoding: str = Form(...)):
    try:
        if not registered_encoding:
            raise HTTPException(status_code=400, detail="Missing registered_encoding parameter")
            
        # Parse registered encoding
        known_encoding = np.array(json.loads(registered_encoding))
        
        # Read uploaded image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Get face encodings
        face_locations = face_recognition.face_locations(rgb_img)
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face found in the image")
            
        unknown_encoding = face_recognition.face_encodings(rgb_img, face_locations)[0]
        
        # Compare faces
        results = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.6)
        
        if results[0]:
            return {"match": True, "message": "Face match successful"}
        else:
            return {"match": False, "message": "Face does not match"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
