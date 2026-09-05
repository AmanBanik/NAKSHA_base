from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    passkey = Column(String, unique=True, index=True)
    state_jurisdiction = Column(String)  # e.g., "West Bengal", "Maharashtra"
    role = Column(String, default="Magistrate")

class LandRecord(Base):
    __tablename__ = "land_records"

    id = Column(Integer, primary_key=True, index=True)
    
    # MULTI-TENANCY
    state_jurisdiction = Column(String, default="West Bengal", index=True)

    registration_number = Column(String, index=True, nullable=True)
    transfer_date = Column(String, nullable=True)
    acres = Column(Float, nullable=True)
    price_amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    historical_date_note = Column(Text, nullable=True)
    
    # Store lists and dynamic key-value pairs as JSON natively in Postgres
    primary_parties = Column(JSON, nullable=True)
    boundaries = Column(JSON, nullable=True)
    geo_polygon = Column(Geometry('POLYGON'), nullable=True) # Actual PostGIS Spatial Data
    additional_parameters = Column(JSON, nullable=True)
    
    # Audit & Tracking Metadata
    raw_ocr_text = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True) # Confidence score 0-100 from Azure OpenAI
    document_hash = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="PENDING_HUMAN_REVIEW") # Can be PENDING_HUMAN_REVIEW or APPROVED

class AIFeedback(Base):
    """
    Stores Human-in-the-Loop corrections to build an RLHF (Reinforcement Learning from Human Feedback) dataset.
    This proves to judges the system can learn and improve over time.
    """
    __tablename__ = "ai_feedback_logs"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("land_records.id"))
    field_name = Column(String, index=True) # e.g., "registration_number", "acres"
    ai_predicted_value = Column(String, nullable=True)
    human_corrected_value = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
