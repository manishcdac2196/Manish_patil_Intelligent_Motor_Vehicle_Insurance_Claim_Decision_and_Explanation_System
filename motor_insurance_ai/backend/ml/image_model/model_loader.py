import os
import torch
import torch.nn as nn
from torchvision import models

# Base directory of image_model/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

BIN_MODEL_PATH = os.path.join(BASE_DIR, "damage_binary.pth")
SEV_MODEL_PATH = os.path.join(BASE_DIR, "damage_severity_type.pth")

_bin_model = None
_sev_model = None


def load_models():
    """
    Loads models once and caches them in memory.
    Safe to call multiple times.
    """
    global _bin_model, _sev_model

    if _bin_model is None:
        bin_model = models.resnet18(pretrained=False)
        bin_model.fc = nn.Linear(bin_model.fc.in_features, 2)
        bin_model.load_state_dict(torch.load(BIN_MODEL_PATH, map_location=DEVICE))
        bin_model.to(DEVICE)
        bin_model.eval()
        _bin_model = bin_model

    if _sev_model is None:
        sev_model = models.resnet18(pretrained=False)
        sev_model.fc = nn.Linear(sev_model.fc.in_features, 6)
        sev_model.load_state_dict(torch.load(SEV_MODEL_PATH, map_location=DEVICE))
        sev_model.to(DEVICE)
        sev_model.eval()
        _sev_model = sev_model

    return _bin_model, _sev_model, DEVICE
