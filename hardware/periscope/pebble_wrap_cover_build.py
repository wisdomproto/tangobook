"""Validate and export the wrap variant from one cached CAD model."""
import json,os,sys
import pebble_wrap_cover as w
import pebble_geared_html as html
import pebble_geared_print as plate
import pebble_wrap_cover_preview as preview

def main():
    w.OUT.mkdir(parents=True,exist_ok=True)
    r=w.report()
    assert all(n==1 for n in r["solids"].values()),r["solids"]
    assert all(v==0 for group in r["checks_mm3"].values() for v in group.values()),r["checks_mm3"]
    assert all(v>0 for v in r["front_capture_backward_shift_mm3"].values())
    assert all(v==0 for group in r["rear_panel_checks_mm3"].values() for v in group.values()),r["rear_panel_checks_mm3"]
    assert all(v>0 for v in r["rear_panel_backload_contact_mm3"].values())
    rays=w.outgoing_ray_report()
    assert all(v==0 for v in rays.values()),rays
    (w.OUT/"wrap_cover_report.json").write_text(json.dumps(r,indent=2))
    (w.OUT/"front_wrap_outgoing_rays.json").write_text(json.dumps(rays,indent=2))
    print("CAD, front capture and added-cover ray tests passed",flush=True)
    html.main(True,True,True)
    plate.main(True,True,True)
    preview.main()

if __name__=="__main__":
    main();sys.stdout.flush();os._exit(0)
