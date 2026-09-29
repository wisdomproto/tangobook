"""Render the actual rear-cover STL design for a quick assembly review."""
import os
import sys

import pebble as b
import pebble_cover as c
import pebble_preview as v


def main():
    v.OUT=c.OUT
    v.COLORS["rear_cover"]=(0.72,0.28,0.20)
    shapes={"shell_left":c.left(),"shell_right":c.right(),
            "paddle":b.paddle(),"rear_cover":c.cover(),
            "mirror":b.mirror(),"foam":b.foam()}
    assembled={name:(shape,(0,0,0)) for name,shape in shapes.items()}
    v.render("cover_assembled",(95,-125,75),scene=assembled)
    exploded={name:(shape,offset) for name,shape,offset in (
        ("shell_left",shapes["shell_left"],(-29,0,0)),
        ("shell_right",shapes["shell_right"],(29,0,0)),
        ("paddle",shapes["paddle"],(0,0,-17)),
        ("rear_cover",shapes["rear_cover"],(0,20,0)),
        ("mirror",shapes["mirror"],(0,-17,0)),
        ("foam",shapes["foam"],(0,20,0)))}
    v.render("cover_exploded",(95,-125,80),scene=exploded,scale=58)
    inside={"shell_left":(c.left(),(0,0,0)),
            "rear_cover":(c.cover(),(0,0,0)),
            "paddle":(b.installed_paddle(),(0,0,0)),
            "foam":(b.foam(),(0,0,0)),
            "phone":(b.phone(),(0,0,0))}
    v.render("cover_inside",(115,65,25),scene=inside,scale=40)


if __name__=="__main__":
    main()
    sys.stdout.flush()
    os._exit(0)
