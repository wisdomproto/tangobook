"""Detect visible residual color without altering the generated image."""
import numpy as np
from PIL import Image

def color_report(path):
    pixels = np.asarray(Image.open(path).convert('RGB'), dtype=np.int16)
    maximum = pixels.max(axis=2)
    minimum = pixels.min(axis=2)
    # Ignore near-white JPEG/PNG edge tint; flag colored fill and colored lines.
    colored = (maximum - minimum > 16) & (minimum < 242)
    count = int(colored.sum())
    fraction = count / colored.size
    return {'coloredPixels': count, 'coloredPercent': round(fraction * 100, 4), 'monochromePassed': count < 300 and fraction < 0.0003}
