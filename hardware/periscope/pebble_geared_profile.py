"""Isolated 4–14 mm phone-camera profile; fixed 8 mm designs stay intact."""
import importlib.util
from pathlib import Path
import sys

MIN_CAMERA_TOP_MARGIN = 4.0
HEIGHT_TRAVEL = 10.0
MAX_CAMERA_TOP_MARGIN = MIN_CAMERA_TOP_MARGIN + HEIGHT_TRAVEL


def load_profile(name, filename, **parameters):
    spec = importlib.util.spec_from_file_location(
        name, Path(__file__).resolve().parent / filename)
    module = importlib.util.module_from_spec(spec)
    module.__dict__.update(parameters)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


b = load_profile("_geared_pebble_base", "pebble.py",
                 DESIGN_PHONE_INSERT_DEPTH=MAX_CAMERA_TOP_MARGIN)
fixed = load_profile("_geared_pebble_cover", "pebble_cover.py", DESIGN_BASE=b)
a = load_profile("_geared_pebble_adjustable", "pebble_adjustable.py",
                 DESIGN_BASE=b, DESIGN_COVER=fixed)
