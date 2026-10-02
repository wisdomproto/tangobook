"""Build and verify the integrated exterior variant from one cached model."""
import json,os,sys
import pebble_integrated_body as design
import pebble_geared_html as html
import pebble_geared_print as plate
import pebble_wrap_cover_preview as preview

def main():
    design.OUT.mkdir(parents=True,exist_ok=True)
    r=design.report()
    (design.OUT/"integrated_body_report.json").write_text(json.dumps(r,indent=2))
    assert all(n==1 for n in r["solids"].values()),r["solids"]
    assert all(v==0 for group in r["checks_mm3"].values() for v in group.values()),r["checks_mm3"]
    assert all(v==0 for group in r["rear_panel_checks_mm3"].values() for v in group.values()),r["rear_panel_checks_mm3"]
    assert all(v>0 for v in r["rear_panel_backload_contact_mm3"].values())
    rays=design.outgoing_ray_report()
    (design.OUT/"integrated_body_added_rays.json").write_text(json.dumps(rays,indent=2))
    assert all(v==0 for v in rays.values()),rays
    print("Integrated body assembly and added-geometry optical checks passed",flush=True)
    html.main(True,True,True,True)
    plate.main(True,True,True,True)
    preview.main(True)

if __name__=="__main__":
    main();sys.stdout.flush();os._exit(0)
