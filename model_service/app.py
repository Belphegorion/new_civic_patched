# model_service/app.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io
import uvicorn
import time

app = FastAPI(title="Model Service (Mock)", version="0.1")

@app.get("/health")
async def health():
    return {"status": "ok", "time": time.time()}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Accepts multipart form upload 'file' and returns a mock analysis.
    Replace the body with real model inference later.
    """
    # Basic validation
    if not file:
        raise HTTPException(status_code=400, detail="file required")

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image files allowed")

    contents = await file.read()
    try:
        # Try to open with PIL to ensure it's a real image
        im = Image.open(io.BytesIO(contents))
        im.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # ---- Insert real model inference here ----
    # For now, return a deterministic mock based on image size hash
    try:
        im = Image.open(io.BytesIO(contents)).convert("RGB")
        width, height = im.size
    except Exception:
        width, height = (0, 0)

    # Mock label & severity - this is placeholder logic
    severity = round(min(1.0, ((width * height) % 1000) / 1000), 3)
    if severity > 0.8:
        label = "severe"
    elif severity > 0.4:
        label = "moderate"
    else:
        label = "minor"

    result = {
        "label": label,
        "severity": severity,
        "confidence": round(0.5 + severity * 0.5, 3),
        "width": width,
        "height": height,
        "source": "mock"
    }

    return JSONResponse(content=result)
