"""Render the integrated-case gear drive from both sides."""
import os
import sys

import pebble_geared as g
import pebble_wrap_cover as u
from pebble_geared_profile import b
import pebble_preview as v


def main(integrated=False):
    if integrated:
        import pebble_integrated_body as u
    else:
        import pebble_wrap_cover as u
    v.OUT=u.OUT
    v.COLORS.update(service_lid=(0.96,0.70,0.51),
                    rear_cover=(0.96,0.70,0.51),rear_panel=(0.74,0.50,0.34),
                    height_lever=(0.31,0.23,0.20),
                    height_slider=(0.78,0.49,0.31))
    parts={
        "shell_left":u.shell_left(),"shell_right":u.shell_right(),
        "rear_cover":(b.mirror() if integrated else u.rear_cover()),"rear_panel":u.rear_panel(),"foam":b.foam(),"paddle":u.a.adjustable_paddle(),
        "height_slider":u.height_slider(),
        "height_pinion":u.pinion(),
        "height_lever":u.lever(),
        "service_lid":u.service_lid(),"mirror":b.mirror(),
    }
    if integrated: del parts["rear_cover"]
    prefix="integrated_body" if integrated else "wrap_cover"
    scene={name:(shape,(0,0,0)) for name,shape in parts.items()}
    v.render(prefix+"_right",(115,-115,55),scene=scene,scale=51)
    v.render(prefix+"_left",(-115,-115,55),scene=scene,scale=51)
    exploded={name:(shape, (0,0,65) if name=="rear_cover" else ((0,48,0) if name in ("rear_panel","foam") else ((-18,0,0) if name=="shell_left" else (0,0,0)))) for name,shape in parts.items()}
    v.render(prefix+"_exploded",(100,115,75),scene=exploded,scale=110)


if __name__=="__main__":
    main()
    sys.stdout.flush();os._exit(0)
