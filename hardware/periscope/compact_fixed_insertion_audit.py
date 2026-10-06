"""Rigid CAD insertion samples from the foam-preloaded forward stop."""
import json, os, sys
import pebble_compact_fixed as d
b=d.b

def main():
    paddle=d.paddle()
    rotations={}
    def rotated(angle):
        key=round(angle,5)
        if key not in rotations:
            rotations[key]=paddle.rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),key)
        return rotations[key]
    result={}
    for thickness in (7,9,11):
        samples=[]
        for drop in range(-18,1):
            phone=b.phone(thickness,drop)
            def volume(angle):
                return b.volume(phone.intersect(rotated(angle)))
            if volume(0)<1e-6:
                angle=0.0
            else:
                lower=0.0
                upper=next((float(a) for a in range(1,29) if volume(a)<1e-6),None)
                assert upper is not None,(thickness,drop,"no feasible angle")
                lower=upper-1
                for _ in range(5):
                    middle=(lower+upper)/2
                    if volume(middle)<1e-6:upper=middle
                    else:lower=middle
                angle=upper
            samples.append({"phone_drop_mm":drop,"minimum_clear_angle_deg":round(angle,5),"phone_tongue_intersection_mm3":round(volume(angle),6)})
        assert samples[0]["minimum_clear_angle_deg"]==0,samples
        assert all(q["minimum_clear_angle_deg"]+.04>=p["minimum_clear_angle_deg"] for p,q in zip(samples,samples[1:])),samples
        assert samples[-1]["minimum_clear_angle_deg"]<=b.paddle_angle(thickness)+.1,samples
        result[str(thickness)]=samples
        print("insertion thickness",thickness,"passes",flush=True)
    report={"start_state":"angle zero, foam preload against forward stop","phone_thicknesses_mm":[7,9,11],"drop_sample_step_mm":1,"angular_search_resolution_deg":.03125,"continuous_physical_insertion_test":False,"samples":result}
    (d.OUT/"preloaded_insertion_report.json").write_text(json.dumps(report,indent=2))

if __name__=="__main__":
    try:main()
    except BaseException:
        import traceback
        traceback.print_exc();sys.stdout.flush();os._exit(1)
    sys.stdout.flush();os._exit(0)
