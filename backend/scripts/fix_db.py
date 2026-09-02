import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# We know the credentials from docker-compose.yml
DB_URL = "postgresql://sih_user:sih_password@localhost:5432/land_records_db"

def fix_db():
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='land_records' and column_name='document_hash';
        """)
        
        if cursor.fetchone() is None:
            print("Adding document_hash column...")
            cursor.execute("ALTER TABLE land_records ADD COLUMN document_hash VARCHAR;")
            cursor.execute("CREATE UNIQUE INDEX ix_land_records_document_hash ON land_records (document_hash);")
        # Check for state_jurisdiction column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='land_records' and column_name='state_jurisdiction';
        """)
        
        if cursor.fetchone() is None:
            print("Adding state_jurisdiction column...")
            cursor.execute("ALTER TABLE land_records ADD COLUMN state_jurisdiction VARCHAR DEFAULT 'West Bengal';")
            cursor.execute("CREATE INDEX ix_land_records_state_jurisdiction ON land_records (state_jurisdiction);")
            print("Successfully added state_jurisdiction!")
        else:
            print("Column state_jurisdiction already exists.")
            
        # Check for ai_confidence column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='land_records' and column_name='ai_confidence';
        """)
        
        if cursor.fetchone() is None:
            print("Adding ai_confidence column...")
            cursor.execute("ALTER TABLE land_records ADD COLUMN ai_confidence FLOAT;")
            print("Successfully added ai_confidence!")
        else:
            print("Column ai_confidence already exists.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_db()
