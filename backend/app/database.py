from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Use DATABASE_URL from environment variable if present, otherwise default to localhost (for local dev)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sih_user:sih_password@localhost:5432/land_records_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
