import smtplib
from email.message import EmailMessage
import os

def send_approval_email(owner_name: str, registration_number: str, doc_hash: str):
    """
    Phase 2 Notification Engine: Sends an official Government Email to the citizen 
    once the Magistrate approves their digitized land record.
    """
    sender_email = os.getenv("GMAIL_ADDRESS")
    app_password = os.getenv("GMAIL_APP_PASSWORD")
    
    # Fallback to test mode if credentials are missing
    if not sender_email or not app_password:
        print(f"\n[MOCK EMAIL SENT] To: {owner_name} | Subj: Property {registration_number} Approved! (Configure .env to send real email)\n")
        return

    # In a real system, you would query the citizen's email from the DB.
    # For the SIH Demo, we'll send it back to the sender_email so the judges can see it arrive on the presenter's phone.
    target_email = sender_email 

    msg = EmailMessage()
    msg['Subject'] = f"GOVT OF INDIA: Your Property Record ({registration_number}) is now Digitized"
    msg['From'] = sender_email
    msg['To'] = target_email

    body = f"""
    Dear {owner_name},
    
    This is an official notification from the Ministry of Rural Development.
    
    Your historical land record ({registration_number}) has been successfully verified, digitized, and cryptographically secured by the Magistrate.
    
    Unique Cryptographic Hash: {doc_hash}
    
    You may now download your Digital Property Card or the Legacy PDF Renewal Deed from the N.A.K.S.H.A. portal.
    
    Regards,
    N.A.K.S.H.A. Automated Notification System
    """
    
    msg.set_content(body)

    try:
        # Connect to Gmail's secure SMTP server
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, app_password)
            smtp.send_message(msg)
            print(f"[EMAIL SUCCESS] Notification dispatched for {registration_number}")
    except Exception as e:
        print(f"[EMAIL FAILED] Could not send email: {e}")
