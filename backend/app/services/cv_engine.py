import cv2
import numpy as np

def preprocess_image(image_bytes: bytes) -> bytes:
    """
    Takes raw image bytes, applies OpenCV pre-processing to clean 
    historical documents, and returns the optimized image bytes.
    """
    # 1. Convert bytes to numpy array, then to an OpenCV image
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image for CV processing.")

    # 2. Convert to Grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 3. Denoising (Removes grainy scanner artifacts)
    denoised = cv2.fastNlMeansDenoising(gray, h=10, searchWindowSize=21, templateWindowSize=7)

    # 4. Adaptive Thresholding (Binarization)
    # This is the secret sauce for historical documents. It calculates threshold for small regions,
    # effectively ignoring giant coffee stains or uneven lighting.
    binary = cv2.adaptiveThreshold(
        denoised, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )

    # 5. Deskewing (Auto-Rotate crooked scans)
    # We invert the image (text becomes white, background black) to find the text block angle
    coords = np.column_stack(np.where(binary < 127))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        
        # Adjust angle
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
            
        # Rotate the image to correct the skew
        (h, w) = binary.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        deskewed = cv2.warpAffine(binary, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    else:
        deskewed = binary

    # 6. Encode the processed image back to bytes
    success, encoded_image = cv2.imencode('.jpg', deskewed)
    if not success:
        raise ValueError("Failed to encode processed image.")
        
    return encoded_image.tobytes()
