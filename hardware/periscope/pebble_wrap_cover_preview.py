"""Render the integrated-case gear drive from both sides."""
import os
import sys

import pebble_geared as g
import pebble_wrap_cover as u
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
        "height_pinion":u.pinion(),
        "height_lever":u.lever(),
        "service_lid":u.service_lid(),"mirror":b.mirror(),
    }
    scene={name:(shape,(0,0,0)) for name,shape in parts.items()}
    v.render("wrap_cover_right",(115,-115,55),scene=scene,scale=51)
    v.render("wrap_cover_left",(-115,-115,55),scene=scene,scale=51)
    exploded={name:(shape, (0,0,65) if name=="rear_cover" else ((-18,0,0) if name=="shell_left" else (0,0,0))) for name,shape in parts.items()}
    v.render("wrap_cover_exploded",(100,115,75),scene=exploded,scale=90)


if __name__=="__main__":
    main()
    sys.stdout.flush();os._exit(0)
