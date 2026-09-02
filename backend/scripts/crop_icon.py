import sys
from PIL import Image

def process_icon(input_path, output_path):
    # Open the image
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # Tolerance for "white"
    threshold = 240
    
    # 1. Make white background transparent
    for item in data:
        # Check if the pixel is white-ish
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0)) # Transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # 2. Crop to the non-transparent bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Save as PNG
    img.save(output_path, "PNG")
    print("Icon successfully cropped and background removed!")

if __name__ == "__main__":
    process_icon(sys.argv[1], sys.argv[2])
