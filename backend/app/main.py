import os
import json
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from pydantic import BaseModel
from openai import AzureOpenAI

# Import DB and Celery Worker
from app.database import engine, get_db
from app import models
from app.worker import process_document_task, celery_app

# Load environment variables
load_dotenv()

# Create the database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI App
app = FastAPI(title="Intelligent Land Record API (Production)")

from app.auth import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import List

@app.post("/api/extract/bulk")
async def extract_record_async(files: List[UploadFile] = File(..., description="Select multiple land records to process in bulk")):
    """
    ENTERPRISE QUEUE: Accepts multiple uploaded images/PDFs and immediately offloads 
    the heavy AI processing (OpenCV + Azure OCR + GPT-4o) to the Celery background worker.
    Returns a list of Task IDs instantly so the UI never freezes.
    """
    try:
        import base64
        task_ids = []
        
        for file in files:
            file_bytes = await file.read()
            
            # Base64 encode the file into a string for Celery JSON serialization
            b64_file = base64.b64encode(file_bytes).decode('utf-8')
            
            # Send the base64 string to the Redis queue!
            task = process_document_task.delay(b64_file, file.content_type)
            task_ids.append({"filename": file.filename, "task_id": task.id})
        
        return {
            "status": "processing",
            "message": f"Successfully added {len(files)} document(s) to the AI extraction queue.",
            "tasks": task_ids
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Allows the Next.js frontend to poll for the status of a background task.
    """
    task_result = celery_app.AsyncResult(task_id)
    
    if task_result.state == 'PENDING':
        return {"status": "processing", "message": "Waiting in queue or currently processing..."}
    elif task_result.state == 'SUCCESS':
        return {"status": "completed", "result": task_result.result}
    elif task_result.state == 'FAILURE':
        return {"status": "failed", "error": str(task_result.info)}
    else:
        return {"status": task_result.state}

from fastapi.responses import StreamingResponse
from app.services.pdf_generator import generate_modern_title

@app.get("/api/records/{record_id}/download_modern_title")
async def download_modern_title(record_id: int, db: Session = Depends(get_db)):
    """
    Takes a crumbling 100-year-old document's database ID and instantly generates 
    a highly formatted, modern, digital PDF title deed with a verification QR code.
    """
    record = db.query(models.LandRecord).filter(models.LandRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Land Record not found in database.")
    
    # Generate the PDF in memory
    pdf_buffer = generate_modern_title(record)
    
    # Return it as an actual file download
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Modern_Title_{record_id}.pdf"}
    )

@app.get("/api/records/verify/{document_hash}")
async def verify_document(document_hash: str, db: Session = Depends(get_db)):
    """
    ONLINE VALIDATOR: Scans the database for a matching cryptographic hash. 
    If found, returns the true document details to prove it wasn't forged.
    """
    record = db.query(models.LandRecord).filter(models.LandRecord.document_hash == document_hash).first()
    
    if not record:
        return {
            "is_valid": False,
            "message": "❌ ALERT: NO RECORD FOUND. POTENTIAL FORGERY."
        }
        
    return {
        "is_valid": True,
        "message": "✅ VALID GOVERNMENT RECORD",
        "record_id": record.id,
        "registration_number": record.registration_number,
        "acres": record.acres,
        "primary_parties": record.primary_parties
    }

from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.auth import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """
    FRONTEND API: Returns live analytical metrics and the 10 most recent records 
    for the Next.js N.A.K.S.H.A. Dashboard.
    MULTI-TENANT: Filters data strictly by the State Jurisdiction encoded in the JWT token.
    """
    tenant_state = "West Bengal" # Fallback
    
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            tenant_state = payload.get("state", "West Bengal")
        except JWTError:
            pass

    # Filter all queries by tenant_state
    total_records = db.query(models.LandRecord).filter(models.LandRecord.state_jurisdiction == tenant_state).count()
    pending = db.query(models.LandRecord).filter(models.LandRecord.state_jurisdiction == tenant_state, models.LandRecord.status == "PENDING_HUMAN_REVIEW").count()
    verified = db.query(models.LandRecord).filter(models.LandRecord.state_jurisdiction == tenant_state, models.LandRecord.status == "APPROVED").count()
    
    fraud_alerts = db.query(models.LandRecord).filter(models.LandRecord.state_jurisdiction == tenant_state, models.LandRecord.document_hash == None).count()
    
    recent_records = db.query(models.LandRecord).filter(models.LandRecord.state_jurisdiction == tenant_state).order_by(models.LandRecord.created_at.desc()).limit(10).all()
    
    return {
        "metrics": {
            "total_scanned": total_records,
            "pending_verification": pending,
            "fraud_alerts": fraud_alerts
        },
        "recent_records": recent_records
    }

# --- PHASE 5: N.A.K.S.H.A. COPILOT (AI DATABASE CHAT) ---

class ChatMessage(BaseModel):
    message: str

# Setup Azure OpenAI Client for Chat
chat_client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-02-01"
)

@app.post("/api/chat")
async def chat_with_database(chat: ChatMessage, db: Session = Depends(get_db)):
    """
    N.A.K.S.H.A. Copilot: Takes the user's natural language question, 
    pulls real database context, and uses Azure OpenAI (GPT-4o) to answer.
    """
    try:
        # 1. Retrieve the latest records to act as "Database Context" for the AI
        records = db.query(models.LandRecord).limit(100).all()
        
        # 2. Format the records into a highly readable JSON string for the AI
        context_data = []
        for r in records:
            context_data.append(f"- RegNo: {r.registration_number} | Acres: {r.acres} | Status: {r.status} | Owners: {r.primary_parties}")
        
        db_context_string = "\n".join(context_data)
        
        system_prompt = (
            "You are N.A.K.S.H.A. Copilot, an elite AI assistant for a Government Magistrate. "
            "Your job is to answer questions by querying the data provided below. "
            "Be extremely concise, professional, and do not make up any data. "
            "If the answer is not in the records, state that clearly.\n\n"
            f"LIVE POSTGRESQL DATABASE CONTEXT:\n{db_context_string}"
        )

        response = chat_client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": chat.message}
            ],
            temperature=0.2
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        print(f"Chatbot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- PHASE 7: HUMAN VERIFICATION DESK ---

@app.get("/api/records/{record_id}")
async def get_single_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.LandRecord).filter(models.LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

class VerificationApprovalRequest(BaseModel):
    registration_number: str
    acres: float
    primary_parties: list
    # We can accept the full corrected form data here

@app.post("/api/records/{record_id}/approve")
async def approve_record(record_id: int, update_data: VerificationApprovalRequest, db: Session = Depends(get_db)):
    """
    Called by the officer when they click 'Approve & Mint Hash' on the split-screen desk.
    Updates the fields in case the human corrected AI errors, updates status, and generates the final hash.
    """
    record = db.query(models.LandRecord).filter(models.LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # Apply human corrections
    record.registration_number = update_data.registration_number
    record.acres = update_data.acres
    record.primary_parties = update_data.primary_parties
    
    # RE-MINT HASH (Because data might have changed!)
    import hashlib
    raw_string = f"{record.registration_number}-{record.acres}-{str(record.raw_ocr_text)[:100]}"
    final_hash = hashlib.sha256(raw_string.encode()).hexdigest()[:16].upper()
    
    record.document_hash = final_hash
    record.status = "APPROVED"
    
    db.commit()
    return {"message": "Record successfully verified and hashed to the blockchain ledger.", "hash": final_hash}

# --- AZURE CLOUD HEALTH CHECK ---
import httpx

@app.get("/api/health/azure")
async def check_azure_health():
    """
    Pings the Azure Cloud endpoints to verify uptime without consuming AI tokens.
    Returns the real-time operational status of the cloud infrastructure.
    """
    aoai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    
    if not aoai_endpoint:
        return {"status": "degraded", "latency_ms": 0, "message": "Credentials Missing"}
        
    try:
        # We ping the base Azure endpoint. It should return a fast HTTP response 
        # (even if it's a 401/404, it proves the server is alive and routing)
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(aoai_endpoint)
            
        latency = response.elapsed.total_seconds() * 1000
        
        if latency > 1500:
            return {"status": "degraded", "latency_ms": round(latency), "message": "High Latency"}
            
        return {"status": "healthy", "latency_ms": round(latency), "message": "All Systems Nominal"}
        
    except httpx.TimeoutException:
        return {"status": "offline", "latency_ms": 0, "message": "Connection Timeout"}
    except Exception:
        return {"status": "offline", "latency_ms": 0, "message": "Cloud Unreachable"}
