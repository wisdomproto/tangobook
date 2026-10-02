"""Render the integrated-case gear drive from both sides."""
import os
import sys

import pebble_geared as g
import pebble_height_only as u
from pebble_geared_profile import b
import pebble_preview as v


def main():
    v.OUT=u.OUT
    v.COLORS.update(service_lid=(0.96,0.70,0.51),
                    rear_cover=(0.96,0.70,0.51),
                    height_lever=(0.31,0.23,0.20),
                    height_slider=(0.78,0.49,0.31))
    parts={
        "shell_left":u.shell_left(),"shell_right":u.shell_right(),
        "rear_cover":u.rear_cover(),
        "height_slider":u.height_slider(),
        "height_pinion":g.pinion(*g.HEIGHT_AXIS),
        "height_lever":g.lever(*g.HEIGHT_AXIS),
        "service_lid":u.service_lid(),"mirror":b.mirror(),
    }
    scene={name:(shape,(0,0,0)) for name,shape in parts.items()}
    v.render("height_only_right",(115,-115,55),scene=scene,scale=42)
    v.render("height_only_left",(-115,-115,55),scene=scene,scale=42)


if __name__=="__main__":
    main()
    sys.stdout.flush();os._exit(0)
