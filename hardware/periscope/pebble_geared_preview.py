"""Render the actual geared CAD with its two transmission paths exposed."""
import os
import sys

import pebble as b
import pebble_adjustable as a
import pebble_geared as g
import pebble_preview as v


def main():
    v.OUT = g.OUT
    v.COLORS.update(mirror_tray=(0.16, 0.60, 0.45),
                    height_slider=(0.28, 0.47, 0.81),
                    angle_pinion=(0.47, 0.32, 0.70),
                    height_pinion=(0.79, 0.29, 0.24),
                    angle_lever=(0.47, 0.32, 0.70),
                    height_lever=(0.79, 0.29, 0.24),
                    gear_cover=(0.83, 0.54, 0.34))
    parts = {
        "shell_left": a.shell_left(), "shell_right": g.shell_right(),
        "mirror_tray": g.mirror_tray(), "height_slider": g.height_slider(),
        "angle_pinion": g.pinion(*g.ANGLE_AXIS),
        "height_pinion": g.pinion(*g.HEIGHT_AXIS),
        "angle_lever": g.lever(*g.ANGLE_AXIS),
        "height_lever": g.lever(*g.HEIGHT_AXIS),
        "gear_cover": g.gear_cover(),
        "mirror": b.mirror(),
    }
    inside = {name: (shape, (0, 0, 0)) for name, shape in parts.items()
              if name not in ("shell_right", "gear_cover")}
    v.render("geared_inside", (115, 60, 34), scene=inside, scale=43)
    assembled = {name: (shape, (0, 0, 0)) for name, shape in parts.items()}
    v.render("geared_assembled", (115, -115, 55), scene=assembled, scale=42)


if __name__ == "__main__":
    main()
    sys.stdout.flush()
    os._exit(0)
