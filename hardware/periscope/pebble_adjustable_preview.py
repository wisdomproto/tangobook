"""Render the adjustable reflector's actual CAD solids for visual review."""
import os
import sys

import pebble as b
import pebble_cover as cover
import pebble_adjustable as a
import pebble_preview as v


def main():
    v.OUT=a.OUT
    v.COLORS.update(mirror_tray=(0.22,0.60,0.43),
                    height_slider=(0.28,0.43,0.80),
                    rear_cover=(0.72,0.28,0.20))
    parts={name:factory() for name,factory in a.PARTS.items()}
    parts["mirror"]=b.mirror()
    parts["foam"]=b.foam()
    assembled={name:(shape,(0,0,0)) for name,shape in parts.items()}
    v.render("adjustable_assembled",(95,-125,75),scene=assembled,scale=44)
    exploded={name:(shape,offset) for name,shape,offset in (
        ("shell_left",parts["shell_left"],(-32,0,0)),
        ("shell_right",parts["shell_right"],(32,0,0)),
        ("mirror_tray",parts["mirror_tray"],(0,-20,0)),
        ("height_slider",parts["height_slider"],(0,20,-10)),
        ("paddle",parts["paddle"],(0,0,-16)),
        ("rear_cover",parts["rear_cover"],(0,28,0)),
        ("mirror",parts["mirror"],(0,-28,0)),
        ("foam",parts["foam"],(0,28,0)))}
    v.render("adjustable_exploded",(95,-125,85),scene=exploded,scale=70)
    inside={"shell_left":(parts["shell_left"],(0,0,0)),
            "mirror_tray":(parts["mirror_tray"],(0,0,0)),
            "height_slider":(parts["height_slider"],(0,0,-10)),
            "paddle":(a.adjustable_paddle().rotate(
                (0,b.old.PIVOT_Y,b.PIVOT_Z),
                (1,b.old.PIVOT_Y,b.PIVOT_Z),b.paddle_angle(9)),(0,0,0)),
            "rear_cover":(parts["rear_cover"],(0,0,0)),
            "mirror":(parts["mirror"],(0,0,0)),
            "foam":(parts["foam"],(0,0,0)),
            "phone":(b.phone(drop=-10),(0,0,0))}
    v.render("adjustable_inside",(115,65,25),scene=inside,scale=46)
    bed={name:(part,(-86,-42,0)) for name,part in a.packed_print_parts().items()}
    v.render("adjustable_print_plate",(110,100,190),scene=bed,scale=104)


if __name__=="__main__":
    main()
    sys.stdout.flush()
    os._exit(0)
