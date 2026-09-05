import cv2
import numpy as np
import io

def preprocess_document_for_ocr(file_bytes: bytes) -> bytes:
    """
    OpenCV Native Preprocessing Pipeline for Legacy Land Records.
    Removes noise, yellowing, and binarizes the image to pure black/white
    to dramatically increase Azure AI OCR accuracy.
    """
    # 1. Decode bytes to OpenCV Mat
    np_arr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        # If it's a PDF or unreadable, just return original bytes
        return file_bytes

    # 2. Convert to Grayscale (Removes yellow paper aging)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 3. Apply Gaussian Blur to remove scanner noise and dust
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # 4. Adaptive Thresholding (Binarization)
    # This acts like a dynamic scanner, adjusting for dark corners vs bright centers
    binarized = cv2.adaptiveThreshold(
        blurred, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 
        11, 2
    )

    # 5. Encode back to bytes
    success, encoded_image = cv2.imencode('.png', binarized)
    if success:
        return encoded_image.tobytes()
    else:
        return file_bytes
