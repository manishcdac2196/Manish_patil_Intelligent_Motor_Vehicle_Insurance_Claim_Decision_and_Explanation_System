import os
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_b0
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
import numpy as np
import logging
from typing import Union, List, Dict, Any
from collections import Counter
import uuid

# Configure logger
logger = logging.getLogger(__name__)

# Define constants and paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
YOLO_PATH = os.path.join(MODELS_DIR, "damage_localizer.pt")
BIN_PATH = os.path.join(MODELS_DIR, "damage_binary_effnet.pth")
SEV_PATH = os.path.join(MODELS_DIR, "damage_severity_effnet.pth")

# Calculate path to 'uploads' directory relative to this file
# this file is in backend/ml/image_model/
# uploads is in backend/uploads/
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")
ANNOTATED_DIR = os.path.join(UPLOADS_DIR, "annotated")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class Config:
    CONFIDENCE_THRESHOLD = 0.5
    IOU_THRESHOLD = 0.45
    DAMAGE_CLASSES = [
        "minor_scratch",
        "minor_dent",
        "minor_broken_light",
        "minor_shattered_windshield",
        "major_crushed_body",
        "major_structural_deformation"
    ]

class ImageDamageModel:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ImageDamageModel, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
            
        self.yolo_model = None
        self.bin_model = None
        self.sev_model = None
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])
        self.classes = Config.DAMAGE_CLASSES
        self.initialized = True

    def _load_models(self):
        """Lazy load models only when needed."""
        try:
            if self.yolo_model is None:
                logger.info(f"Loading YOLO model from {YOLO_PATH}...")
                if not os.path.exists(YOLO_PATH):
                    raise FileNotFoundError(f"Model file not found: {YOLO_PATH}")
                self.yolo_model = YOLO(YOLO_PATH)

            if self.bin_model is None:
                logger.info(f"Loading Binary model from {BIN_PATH}...")
                if not os.path.exists(BIN_PATH):
                    raise FileNotFoundError(f"Model file not found: {BIN_PATH}")
                self.bin_model = efficientnet_b0(weights=None)
                self.bin_model.classifier[1] = nn.Linear(self.bin_model.classifier[1].in_features, 2)
                state = torch.load(BIN_PATH, map_location=DEVICE)
                self.bin_model.load_state_dict(state)
                self.bin_model = self.bin_model.to(DEVICE).eval()

            if self.sev_model is None:
                logger.info(f"Loading Severity model from {SEV_PATH}...")
                if not os.path.exists(SEV_PATH):
                    raise FileNotFoundError(f"Model file not found: {SEV_PATH}")
                self.sev_model = efficientnet_b0(weights=None)
                self.sev_model.classifier[1] = nn.Linear(self.sev_model.classifier[1].in_features, 6)
                state = torch.load(SEV_PATH, map_location=DEVICE)
                self.sev_model.load_state_dict(state)
                self.sev_model = self.sev_model.to(DEVICE).eval()
                
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise e

    def _process_single_image(self, image_path: str) -> Dict[str, Any]:
        """Runs inference on a single image, annotates it, and returns findings."""
        if not os.path.exists(image_path):
            logger.warning(f"Image not found: {image_path}")
            return {"findings": [], "annotated_path": None, "error": "file_not_found"}

        damage_findings = []
        
        # Load original image
        try:
            full_img = Image.open(image_path).convert("RGB")
            draw = ImageDraw.Draw(full_img)
        except Exception as e:
            logger.error(f"Failed to open image {image_path}: {e}")
            return {"findings": [], "annotated_path": None, "error": str(e)}

        # 1. Localization (YOLO)
        results = self.yolo_model(image_path, verbose=False, conf=0.25)
        
        has_annotations = False
        
        for r in results:
            for box in r.boxes:
                # Crop
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                
                # Check valid crop
                if x2 <= x1 or y2 <= y1:
                    continue

                crop = full_img.crop((x1, y1, x2, y2))
                
                # Preprocess for EffNet
                img_tensor = self.transform(crop).unsqueeze(0).to(DEVICE)

                # 2. Binary Verification
                with torch.no_grad():
                    out = self.bin_model(img_tensor)
                    probs = torch.softmax(out, dim=1)
                    # Assuming Index 0 is 'damaged' based on probabilistic logic (>0.5)
                    is_damaged = probs[0][0].item() > Config.CONFIDENCE_THRESHOLD
                
                if is_damaged:
                    # 3. Severity
                    with torch.no_grad():
                        out2 = self.sev_model(img_tensor)
                        probs2 = torch.softmax(out2, dim=1)
                        pred_idx = torch.argmax(probs2).item()
                        conf = probs2[0][pred_idx].item()
                        damage_type = self.classes[pred_idx]
                    
                    damage_findings.append({
                        "type": damage_type,
                        "confidence": float(conf),
                        "bbox": [x1, y1, x2, y2]
                    })
                    
                    # Annotate
                    has_annotations = True
                    # Draw Color
                    color = "red" if "major" in damage_type else "yellow"
                    draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
                    
                    # Text
                    text = f"{damage_type.replace('_', ' ')}: {conf:.0%}"
                    # Try to load a font, fall back to default
                    try:
                        # font = ImageFont.truetype("arial.ttf", 15) 
                        font = ImageFont.load_default()
                    except:
                        font = ImageFont.load_default()
                        
                    # Draw text background
                    if hasattr(font, "getbbox"):
                        tx1, ty1, tx2, ty2 = font.getbbox(text)
                        text_w = tx2 - tx1
                        text_h = ty2 - ty1
                    else:
                        text_w, text_h = draw.textsize(text, font)
                        
                    draw.rectangle([x1, y1 - text_h - 4, x1 + text_w + 4, y1], fill=color)
                    draw.text((x1 + 2, y1 - text_h - 2), text, fill="black", font=font)

        annotated_path = None
        if has_annotations:
            # Save annotated image
            os.makedirs(ANNOTATED_DIR, exist_ok=True)
            filename = f"annotated_{uuid.uuid4().hex}.jpg"
            save_path = os.path.join(ANNOTATED_DIR, filename)
            full_img.save(save_path)
            # Return relative path for frontend URL (assuming static mount at /uploads)
            # if we save to backend/uploads/annotated/foo.jpg, and backend/uploads is mounted at /uploads
            # then URL is /uploads/annotated/foo.jpg
            annotated_path = f"/uploads/annotated/{filename}"

        return {
            "findings": damage_findings,
            "annotated_path": annotated_path
        }

    def predict(self, image_paths: List[str]) -> Dict[str, Any]:
        """
        Main entry point for list of images.
        """
        self._load_models()
        
        all_findings = []
        annotated_images = []
        damaged_images_count = 0
        
        for path in image_paths:
            result = self._process_single_image(path)
            findings = result.get("findings", [])
            
            if findings:
                damaged_images_count += 1
                all_findings.extend(findings)
                if result.get("annotated_path"):
                    annotated_images.append(result["annotated_path"])
        
        # ---------------- Aggregation & Logic (Ported from inference_pipeline.py) ----------------
        
        if not all_findings:
            return {
                "damage_detected": False,
                "severity": "none",
                "confidence": 0.0,
                "evidence_strength": "NONE",
                "damage_types": [],
                "claimability": "Not Claimable",
                "reasoning": ["No visual damage detected"],
                "annotated_images": []
            }

        # Extract Types and Confidences
        damage_types = [f['type'] for f in all_findings]
        confidences = [f['confidence'] for f in all_findings]
        type_counts = Counter(damage_types)
        unique_types = list(type_counts.keys())
        
        avg_conf = np.mean(confidences) if confidences else 0.0
        
        # Severity
        has_major = any("major" in t for t in damage_types)
        severity = "MAJOR" if has_major else "MINOR"
        
        # Worst Damage
        # Sort by (is_major, confidence)
        # We need to map types to their original objects to find max confidence if needed, 
        # or just pick the type that is major with highest confidence.
        # Simple heuristic:
        if has_major:
            # Pick the major damage with highest confidence or priority
            majors = [t for t in damage_types if "major" in t]
            worst_damage = majors[0] # Simply first occurrence for now
        else:
             worst_damage = damage_types[0]

        
        # Evidence strength
        num_regions = len(all_findings)
        if num_regions == 1:
            evidence = "WEAK"
        elif num_regions <= 4:
            evidence = "MEDIUM"
        else:
            evidence = "STRONG"

        # Prediction consistency
        if len(unique_types) == 1:
            consistency = "HIGH"
        elif len(unique_types) <= 3:
            consistency = "MEDIUM"
        else:
            consistency = "LOW"

        # Claimability Logic
        has_scratch = any("scratch" in t for t in damage_types)
        has_dent = any("dent" in t for t in damage_types)
        only_minor = all("minor" in t for t in damage_types)

        claimable = True
        claim_reason = "Mixed damage types detected"

        if has_major:
            claimable = True
            claim_reason = "Major structural damage detected"
        elif only_minor:
            if has_scratch and has_dent:
                claimable = True
                claim_reason = "Multiple minor damage types detected"
            else:
                claimable = False
                claim_reason = "Only small scratches/dents detected"
        
        # Reasoning Layer
        reasoning = []
        if has_major:
            reasoning.append("Major damage detected")
        if len(unique_types) > 1:
            reasoning.append("Multiple damage types observed")
        if avg_conf > 0.75:
            reasoning.append("High confidence predictions")
        elif avg_conf > 0.5:
            reasoning.append("Moderate confidence predictions")
        else:
            reasoning.append("Low confidence predictions")

        if evidence in ["MEDIUM", "STRONG"]:
            reasoning.append("Sufficient visual evidence")
        else:
            reasoning.append("Limited visual evidence")

        clean_types = list(set([t.replace("minor_", "").replace("major_", "") for t in damage_types]))

        return {
            "damage_detected": True,
            "severity": severity,
            "worst_damage": worst_damage,
            "damage_types": clean_types,
            "confidence": round(float(avg_conf), 3),
            "evidence_strength": evidence,
            "prediction_consistency": consistency,
            "claimability": "Claimable" if claimable else "Not Claimable",
            "claimability_bool": claimable,
            "final_insurance_reason": claim_reason,
            "reasoning": reasoning,
            "annotated_images": annotated_images, # URL paths
            "details": {
                 "total_images": len(image_paths),
                 "damaged_regions": num_regions,
                 "distribution": dict(type_counts)
            }
        }

# Singleton instance access
model_instance = ImageDamageModel()

def run_image_inference(image_in: Union[str, List[str]]) -> Dict[str, Any]:
    """
    Public Interface.
    Accepts a single image path or a list of image paths.
    Returns a unified dictionary result.
    """
    if isinstance(image_in, str):
        paths = [image_in]
    else:
        paths = image_in
        
    # Safe validation
    valid_paths = [p for p in paths if p and isinstance(p, str)]
    
    if not valid_paths:
         return {
            "damage_detected": False,
            "severity": "none",
            "confidence": 0.0,
            "evidence_strength": "NONE",
            "damage_types": [],
            "error": "No valid image paths provided"
        }

    try:
        return model_instance.predict(valid_paths)
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        return {
            "damage_detected": False,
            "severity": "none",
            "confidence": 0.0,
            "evidence_strength": "NONE",
            "damage_types": [],
            "error": str(e)
        }
