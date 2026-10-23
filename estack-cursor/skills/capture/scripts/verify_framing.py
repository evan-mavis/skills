import json,math,sys
from pathlib import Path
import numpy as np

def camera_boundary_velocity_difference(renderer):
    epsilon=.0001;maximum=0.
    for key in renderer.data['camera'][1:-1]:
        t=key['t'];a=np.array(renderer.camera_at(t-epsilon));b=np.array(renderer.camera_at(t));c=np.array(renderer.camera_at(t+epsilon))
        maximum=max(maximum,float(np.linalg.norm((b-a)/epsilon-(c-b)/epsilon)))
    return maximum

def verify(renderer):
    m=renderer.data;w,h=renderer.size;sw,sh=m['source_width'],m['source_height']
    padding=round(min(w,h)*.07);scale=min((w-2*padding)/sw,(h-2*padding)/sh)
    fw,fh=round(sw*scale),round(sh*scale);count=math.ceil(m['duration']*60-.0001)
    minimum=float('inf');target_checks=0;outside=0;violations=[];crops=[];positions=[]
    for i in range(count):
        t=i/60;left,top,cw,ch=renderer.camera_at(t);crops.append([left,top,cw,ch])
        assert 0<=left and 0<=top and left+cw<=sw+1e-8 and top+ch<=sh+1e-8,('Crop exceeds source',i)
        cx,cy=renderer.cursor_at(t);px,py=(cx-left)*fw/cw,(cy-top)*fh/ch;positions.append([px,py])
        margin=min(px,py,fw-px,fh-py);minimum=min(minimum,margin)
        if margin<0:outside+=1
        if margin<m['cursor_safe_margin']-1e-7:violations.append({'frame':i,'t':t,'cursor_margin':margin})
        height=round(m['cursor_height']);ink=renderer.pointer(height).getbbox()
        hx,hy=m.get('cursor_hotspot',[2/36,1/36]);dx,dy=round(px-height*hx),round(py-height*hy)
        assert dx+ink[0]>=0 and dy+ink[1]>=0 and dx+ink[2]<=fw and dy+ink[3]<=fh,('Pointer ink clipped',i)
        for region in m.get('interaction_regions',[]):
            if region['start']<=t<=region['end']:
                x0,y0,x1,y1=region['rect'];edges=[(x0-left)*fw/cw,(y0-top)*fh/ch,fw-(x1-left)*fw/cw,fh-(y1-top)*fh/ch]
                assert min(edges)>=region['margin']-1e-7,('Interaction target clipped',i,region['label'],edges)
                target_checks+=1
    assert not violations,{'safe_margin_violations':violations[:5],'count':len(violations)}
    max_velocity_discontinuity=camera_boundary_velocity_difference(renderer)
    assert max_velocity_discontinuity<.1,('Camera velocity discontinuity',max_velocity_discontinuity)
    result={'frames_checked':count,'cursor_safe_margin_px':m['cursor_safe_margin'],'minimum_cursor_margin_px':minimum,
            'cursor_outside_frames':outside,'pointer_ink_checks_passed':count,'target_frame_checks_passed':target_checks,
            'source_crop_bounds_checks_passed':count,'camera_velocity_continuity_check_passed':True,
            'max_numeric_boundary_velocity_difference_source_px_per_second':max_velocity_discontinuity}
    return result

if __name__=='__main__':
    from renderer import Renderer,load_manifest
    result=verify(Renderer(load_manifest(sys.argv[1])))
    print(json.dumps(result,indent=2))
    if len(sys.argv)>2:Path(sys.argv[2]).write_text(json.dumps(result,indent=2))
