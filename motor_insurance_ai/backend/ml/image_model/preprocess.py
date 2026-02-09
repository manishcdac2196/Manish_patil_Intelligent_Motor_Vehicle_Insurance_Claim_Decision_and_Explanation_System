import os
import cv2
import uuid
import warnings

# Try to import ultralytics; provide a fallback when not installed
try:
    from ultralytics import YOLO
    _HAS_YOLO = True
except Exception:
    YOLO = None
    _HAS_YOLO = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

YOLO_MODEL_PATH = os.path.join(BASE_DIR, "yolov8n.pt")

UPLOAD_DIR = os.path.join(BASE_DIR, "temp_uploads")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Load YOLO once if available
yolo_model = None
if _HAS_YOLO:
    try:
        yolo_model = YOLO(YOLO_MODEL_PATH)
    except Exception:
        warnings.warn("Failed to load YOLO model; falling back to simplified preprocessing.")
        yolo_model = None

def is_blurry(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var() < 60

def is_dark(img):
    return img.mean() < 40

def _simple_crop_and_save(img, out_path, size=(224,224)):
    """Center-crop + resize fallback when YOLO is not available."""
    h, w = img.shape[:2]
    min_side = min(h, w)
    start_y = (h - min_side) // 2
    start_x = (w - min_side) // 2
    crop = img[start_y:start_y+min_side, start_x:start_x+min_side]
    resized = cv2.resize(crop, size)
    cv2.imwrite(out_path, resized)


def preprocess_images(image_paths):
    """
    Takes list of image file paths
    Returns list of processed (cropped) image paths
    """
    processed_images = []

    for path in image_paths:
        img = cv2.imread(path)
        if img is None:
            continue

        if is_blurry(img) or is_dark(img):
            continue

        # If YOLO is available and loaded, use it to find the car and crop
        if yolo_model is not None:
            try:
                results = yolo_model(img)
                car_boxes = []

                for r in results:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        if yolo_model.names[cls] == "car":
                            car_boxes.append(box.xyxy[0].cpu().numpy())

                if not car_boxes:
                    # If no car detected, fall back to a simple crop
                    filename = f"{uuid.uuid4().hex}.jpg"
                    out_path = os.path.join(PROCESSED_DIR, filename)
                    _simple_crop_and_save(img, out_path)
                    processed_images.append(out_path)
                    continue

                x1, y1, x2, y2 = map(int, car_boxes[0])
                crop = img[y1:y2, x1:x2]

                filename = f"{uuid.uuid4().hex}.jpg"
                out_path = os.path.join(PROCESSED_DIR, filename)
                cv2.imwrite(out_path, crop)
                processed_images.append(out_path)
            except Exception:
                # If YOLO inference fails for any reason, do a simple crop
                filename = f"{uuid.uuid4().hex}.jpg"
                out_path = os.path.join(PROCESSED_DIR, filename)
                _simple_crop_and_save(img, out_path)
                processed_images.append(out_path)
        else:
            # YOLO not available: simple center crop + resize fallback
            filename = f"{uuid.uuid4().hex}.jpg"
            out_path = os.path.join(PROCESSED_DIR, filename)
            _simple_crop_and_save(img, out_path)
            processed_images.append(out_path)

    return processed_images
