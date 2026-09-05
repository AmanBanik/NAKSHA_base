import random
import string
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app.auth import get_password_hash

# Drop the tables so we can recreate them with the new PostGIS columns
models.User.__table__.drop(engine, checkfirst=True)
models.LandRecord.__table__.drop(engine, checkfirst=True)
models.Base.metadata.create_all(bind=engine)

STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
]

FIRST_NAMES = ["Amit", "Rahul", "Priya", "Sneha", "Vikram", "Anjali", "Rohan", "Kavita", "Suresh", "Pooja"]

def generate_passkey():
    parts = [''.join(random.choices(string.ascii_uppercase + string.digits, k=5)) for _ in range(3)]
    return "-".join(parts)

def generate_password(state):
    prefix = state[:2].upper()
    digits = ''.join(random.choices(string.digits, k=3))
    letters = ''.join(random.choices(string.ascii_lowercase, k=3))
    return f"{prefix}{digits}{letters}"

def seed():
    db = SessionLocal()
    
    # Clear old mock users
    db.query(models.User).delete()
    db.commit()
    
    markdown_lines = ["# N.A.K.S.H.A. Master Credentials List\n"]
    markdown_lines.append("| State | Username | Password | Passkey |")
    markdown_lines.append("|---|---|---|---|")
    
    generated_usernames = set()
    
    for state in STATES:
        # Generate 1-2 users per state
        num_users = random.randint(1, 2)
        for _ in range(num_users):
            while True:
                fname = random.choice(FIRST_NAMES).lower()
                dob = f"{random.randint(10,28)}{random.randint(10,12)}{random.randint(1980, 2000)}"
                username = f"{fname}{dob}"
                if username not in generated_usernames:
                    generated_usernames.add(username)
                    break
            password = generate_password(state)
            passkey = generate_passkey()
            
            user = models.User(
                username=username,
                hashed_password=get_password_hash(password),
                passkey=passkey,
                state_jurisdiction=state,
                role="Officer"
            )
            db.add(user)
            
            markdown_lines.append(f"| {state} | `{username}` | `{password}` | `{passkey}` |")
            
    db.commit()
    
    # Add a Dummy PostGIS Land Record for Map testing
    dummy_record = models.LandRecord(
        state_jurisdiction="West Bengal",
        registration_number="WB-TEST-2026",
        acres=5.4,
        primary_parties=["Amit Kumar"],
        status="VERIFIED",
        geo_polygon="POLYGON((88.3639 22.5726, 88.3649 22.5726, 88.3649 22.5736, 88.3639 22.5736, 88.3639 22.5726))" # Coordinates near Kolkata
    )
    db.add(dummy_record)
    db.commit()
    
    db.close()
    
    # Save to a markdown file
    with open("credentials.md", "w") as f:
        f.write("\n".join(markdown_lines))
        
    print("Seeding complete! Check credentials.md")

if __name__ == "__main__":
    seed()
