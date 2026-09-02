import io
import datetime
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch

def generate_modern_title(record) -> io.BytesIO:
    """
    Takes a LandRecord SQLAlchemy model and generates a sleek, modern
    PDF document (in memory) using ReportLab.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # 1. Header (Government Vibe)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2.0, height - 50, "GOVERNMENT OF INDIA")
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2.0, height - 70, "DEPARTMENT OF LAND RESOURCES")
    
    c.setStrokeColor(colors.black)
    c.setLineWidth(2)
    c.line(50, height - 85, width - 50, height - 85)
    
    # 2. Title
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2.0, height - 120, "DIGITAL RECORD OF RIGHTS (RoR)")
    
    # 3. Core Data Table
    c.setFont("Helvetica-Bold", 12)
    y_position = height - 170
    
    # Helper to draw rows
    def draw_row(label, value, y):
        c.setFont("Helvetica-Bold", 11)
        c.drawString(70, y, label)
        c.setFont("Helvetica", 11)
        c.drawString(220, y, str(value) if value else "N/A")
        c.setStrokeColor(colors.lightgrey)
        c.setLineWidth(0.5)
        c.line(70, y - 5, width - 70, y - 5)
        return y - 25

    y_position = draw_row("Database ID:", f"IND-LR-{record.id}", y_position)
    y_position = draw_row("Registration No:", record.registration_number, y_position)
    y_position = draw_row("Date of Transfer:", record.transfer_date, y_position)
    y_position = draw_row("Area (Acres):", record.acres, y_position)
    
    if record.price_amount:
        currency = record.currency if record.currency else "INR"
        y_position = draw_row("Transaction Value:", f"{record.price_amount} {currency}", y_position)

    # 4. Primary Parties
    y_position -= 15
    c.setFont("Helvetica-Bold", 12)
    c.drawString(70, y_position, "Registered Parties:")
    y_position -= 20
    c.setFont("Helvetica", 11)
    if record.primary_parties:
        for party in record.primary_parties:
            c.drawString(90, y_position, f"• {party}")
            y_position -= 20
    else:
        c.drawString(90, y_position, "No parties extracted.")
        y_position -= 20

    # 5. Dynamic Additional Parameters
    if record.additional_parameters:
        y_position -= 10
        c.setFont("Helvetica-Bold", 12)
        c.drawString(70, y_position, "Additional Extracted Details:")
        y_position -= 20
        c.setFont("Helvetica", 10)
        for key, value in record.additional_parameters.items():
            clean_key = str(key).replace("_", " ").title()
            c.drawString(90, y_position, f"• {clean_key}: {value}")
            y_position -= 15

    # 6. Cryptographic QR Code for Offline Verification
    # We generate a SHA-256 hash and masked owner name for secure offline validation
    import hashlib
    
    # Masking the first owner's name (e.g., "Soumen Mondal" -> "S****n M****l")
    masked_owner = "Unknown"
    if record.primary_parties and len(record.primary_parties) > 0:
        name_parts = record.primary_parties[0].split()
        masked_parts = [f"{p[0]}{'*' * (len(p)-2)}{p[-1]}" if len(p) > 2 else p for p in name_parts]
        masked_owner = " ".join(masked_parts)
        
    # Create a unique SHA-256 hash if it wasn't saved in DB (for old records)
    if hasattr(record, 'document_hash') and record.document_hash:
        doc_hash = record.document_hash
    else:
        raw_string = f"{record.id}-{record.registration_number}-{record.acres}"
        doc_hash = hashlib.sha256(raw_string.encode()).hexdigest()[:16].upper()
    
    # The payload embedded inside the QR Code is now a URL to our Next.js portal
    qr_payload = f"https://naksha.gov.in/verify?hash={doc_hash}"
    
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(qr_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code to a temporary bytes buffer so ReportLab can read it
    qr_buffer = io.BytesIO()
    img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    # Draw QR code in the bottom right corner
    from reportlab.lib.utils import ImageReader
    qr_image = ImageReader(qr_buffer)
    c.drawImage(qr_image, width - 150, 50, width=80, height=80)
    
    # Print the Hash directly on the document for manual lookups
    c.setFont("Helvetica-Bold", 8)
    c.drawString(width - 150, 35, f"HASH: {doc_hash}")
    
    # 7. Footer
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(70, 70, "This is a computer-generated digital twin.")
    c.drawString(70, 55, f"AI Extraction Timestamp: {record.created_at.strftime('%Y-%m-%d %H:%M') if record.created_at else 'Unknown'}")
    c.drawString(70, 40, "Scan the QR code to verify authenticity.")

    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer
