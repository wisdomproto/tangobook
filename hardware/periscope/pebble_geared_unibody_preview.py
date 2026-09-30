"""Render the integrated-case gear drive from both sides."""
import os
import sys

import pebble as b
import pebble_geared as g
import pebble_geared_unibody as u
import pebble_preview as v


def main():
    v.OUT=u.OUT
    v.COLORS.update(service_lid=(0.96,0.70,0.51),
                    rear_cover=(0.96,0.70,0.51),
                    angle_lever=(0.31,0.23,0.20),
                    height_lever=(0.31,0.23,0.20),
                    mirror_tray=(0.78,0.49,0.31),
                    height_slider=(0.78,0.49,0.31))
    parts={
        "shell_left":u.shell_left(),"shell_right":u.shell_right(),
        "rear_cover":g.fixed.cover(),"mirror_tray":g.mirror_tray(),
        "height_slider":u.height_slider(),
        "angle_pinion":g.pinion(*g.ANGLE_AXIS),
        "height_pinion":g.pinion(*g.HEIGHT_AXIS),
        "angle_lever":g.lever(*g.ANGLE_AXIS),
        "height_lever":g.lever(*g.HEIGHT_AXIS),
        "service_lid":u.service_lid(),"mirror":b.mirror(),
    }
    scene={name:(shape,(0,0,0)) for name,shape in parts.items()}
    v.render("geared_unibody_right",(115,-115,55),scene=scene,scale=42)
    v.render("geared_unibody_left",(-115,-115,55),scene=scene,scale=42)


if __name__=="__main__":
    main()
    sys.stdout.flush();os._exit(0)
