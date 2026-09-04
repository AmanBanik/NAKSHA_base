import os
import json
from celery import Celery
from dotenv import load_dotenv

# Import our database and services
from app.database import SessionLocal
from app import models
from app.services.cv_engine import preprocess_image

from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from openai import AzureOpenAI

load_dotenv()

# Use REDIS_URL from environment variable if present, otherwise default to localhost
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery connected to our local Docker Redis
celery_app = Celery(
    "sih_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# --- CRON JOB SETUP (Celery Beat) ---
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'nightly-national-database-sync': {
        'task': 'nightly_sync_task',
        'schedule': crontab(hour=2, minute=0), # Runs automatically every night at 2:00 AM
    },
}

@celery_app.task(name="nightly_sync_task")
def nightly_sync_task():
    """
    Automated CRON task that scans the PostgreSQL database for newly verified records 
    and securely syncs them to the Central Government Ministry servers.
    """
    # In production, this would make an API call to the Central Govt Servers
    print("CRON JOB EXECUTING: Synchronizing new Land Records to National Database...")
    return {"status": "success", "message": "Nightly Sync Complete"}
# ------------------------------------

# Load Azure Credentials
doc_endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
doc_key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")
aoai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
aoai_key = os.getenv("AZURE_OPENAI_API_KEY")
aoai_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

# Initialize Azure Clients inside the worker
doc_client = DocumentIntelligenceClient(endpoint=doc_endpoint, credential=AzureKeyCredential(doc_key))
aoai_client = AzureOpenAI(azure_endpoint=aoai_endpoint, api_key=aoai_key, api_version="2024-02-01")

SYSTEM_PROMPT = """
You are an expert data extraction assistant specializing in historical land records and property transfers.
Your task is to take messy, error-prone raw OCR text from a historical land record and extract the key entities into a clean JSON object.
Required JSON Schema fields:
- registration_number (string)
- transfer_date (string)
- acres (number)
- price_amount (number)
- currency (string)
- historical_date_note (string)
- primary_parties (list of strings)
- boundaries (list of strings)
- additional_parameters (object)
- ai_confidence (number: A score from 0 to 100 based on how legible the document was and your confidence in the extracted data accuracy)

If a field is completely missing or illegible, return null. Return ONLY a valid JSON object.
"""

@celery_app.task(name="process_document_task")
def process_document_task(b64_file: str, content_type: str):
    """
    This function runs ENTIRELY in the background. 
    It will not freeze the FastAPI server, even if 10,000 files are uploaded.
    """
    try:
        import base64
        # Decode the base64 string back into raw image bytes
        file_bytes = base64.b64decode(b64_file)

        # Step 0: OpenCV Pre-processing
        if content_type.startswith('image/'):
            optimized_bytes = preprocess_image(file_bytes)
        else:
            optimized_bytes = file_bytes

        # Step 1: Azure Document Intelligence
        poller = doc_client.begin_analyze_document("prebuilt-read", body=optimized_bytes, content_type=content_type)
        raw_text = poller.result().content

        # Step 2: Azure OpenAI GPT-4o
        response = aoai_client.chat.completions.create(
            model=aoai_deployment,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Raw OCR Text:\n{raw_text}"}
            ],
            temperature=0.1,
            response_format={ "type": "json_object" }
        )
        structured_data = json.loads(response.choices[0].message.content)

        # Step 3: Save to PostgreSQL
        db = SessionLocal()
        
        # Generate a unique Cryptographic Hash for this document
        import hashlib
        raw_string = f"{structured_data.get('registration_number', 'UNKNOWN')}-{structured_data.get('acres', '0')}-{raw_text[:100]}"
        doc_hash = hashlib.sha256(raw_string.encode()).hexdigest()[:16].upper()
        
        # Auto-Approval Threshold Logic (Confidence > 90)
        confidence = structured_data.get("ai_confidence", 0.0)
        status = "APPROVED" if confidence > 90 else "PENDING_HUMAN_REVIEW"

        try:
            new_record = models.LandRecord(
                registration_number=structured_data.get("registration_number"),
                transfer_date=structured_data.get("transfer_date"),
                acres=structured_data.get("acres"),
                price_amount=structured_data.get("price_amount"),
                currency=structured_data.get("currency"),
                historical_date_note=structured_data.get("historical_date_note"),
                primary_parties=structured_data.get("primary_parties"),
                boundaries=structured_data.get("boundaries"),
                additional_parameters=structured_data.get("additional_parameters"),
                raw_ocr_text=raw_text,
                ai_confidence=confidence,
                document_hash=doc_hash,
                status=status
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            
            # The Celery Backend (Redis) will store this return dict so the UI can fetch the status
            return {
                "status": "success", 
                "record_id": new_record.id,
                "extracted_data": structured_data
            }
            
        except Exception as db_e:
            db.rollback()
            return {"status": "error", "message": f"Database Error: {str(db_e)}"}
        finally:
            db.close()

    except Exception as e:
        return {"status": "error", "message": f"AI Pipeline Error: {str(e)}"}
