import copy
import math
from pathlib import Path

import numpy as np

from renderer import Renderer
from verify_framing import verify


def cursor_plan(data, offset):
    sw, sh, duration = data['source_width'], data['source_height'], data['duration']
    initial = next((e for e in data['events'] if e['type'] == 'move'), {'x': sw/2, 'y': sh/2})
    points = [{'t': 0., 'type': 'move', 'x': initial['x'], 'y': initial['y']}]
    clicks = []
    previous_t = 0.
    previous = [initial['x'], initial['y']]
    for event in data['events']:
        if event['type'] != 'click':
            continue
        if event.get('outcome') not in ('command_succeeded',):
            raise ValueError('Reconcile uncertain actions before planning a polished take')
        t = event['t'] + offset
        if not 0 < t < duration:
            raise ValueError('Click time is outside recorded source; inspect startup alignment')
        target = [event['x'], event['y']]
        settle = max(previous_t, t-.055)
        observed = min(settle, max(previous_t, event.get('observed_t', event['t']-.35)+offset))
        gap = observed-previous_t
        start = max(previous_t, observed-min(1.5, max(.32, gap*.55)))
        staging = [min(sw-80, max(80, target[0]+(sw*.06 if target[0]<sw/2 else -sw*.06))), min(sh-80, max(80, target[1]+sh*.08))]
        if start > points[-1]['t']:
            points.append({'t': start, 'type': 'move', 'x': previous[0], 'y': previous[1]})
        if observed > start+.2:
            points.append({'t': observed, 'type': 'move', 'x': staging[0], 'y': staging[1]})
        if settle > points[-1]['t']:
            points.append({'t': settle, 'type': 'move', 'x': target[0], 'y': target[1]})
        points.append({'t': t, 'type': 'move', 'x': target[0], 'y': target[1]})
        click = copy.deepcopy(event)
        click['original_capture_t'] = event['t']
        click['t'] = t
        clicks.append(click)
        previous_t, previous = min(duration, t+.2), target
        if previous_t < duration:
            points.append({'t': previous_t, 'type': 'move', 'x': target[0], 'y': target[1]})
    if points[-1]['t'] < duration:
        points.append({'t': duration, 'type': 'move', 'x': previous[0], 'y': previous[1]})
    return sorted(points+clicks, key=lambda e:e['t'])


def scroll_guards(data, offset):
    guards = []
    for event in data['events']:
        if event['type'] == 'scroll_start':
            end = next((e['t'] for e in data['events'] if e['type']=='scroll_end' and e['t']>event['t']), data['duration'])
            guards.append((max(0, event['t']+offset-.2), min(data['duration'], end+offset+.55)))
    return guards


def safe_focus(renderer, start, end, zoom, target, regions):
    sw, sh = renderer.data['source_width'], renderer.data['source_height']
    _, _, fw, fh = renderer.frame_geometry
    cw, ch = sw/zoom, sh/zoom
    height = renderer.data['cursor_height']
    hx, hy = renderer.data['cursor_hotspot']
    ink = renderer.pointer(round(height)).getbbox()
    xs, ys = [], []
    for t in np.linspace(start, end, max(3, math.ceil((end-start)*60)+1)):
        x, y = renderer.cursor_at(float(t))
        xs.extend([x+(ink[0]-height*hx-12)*cw/fw, x+(ink[2]-height*hx+12)*cw/fw])
        ys.extend([y+(ink[1]-height*hy-12)*ch/fh, y+(ink[3]-height*hy+12)*ch/fh])
    for region in regions:
        if region['end'] >= start and region['start'] <= end:
            x0,y0,x1,y1=region['rect']
            xs.extend([x0-region['margin']*cw/fw,x1+region['margin']*cw/fw])
            ys.extend([y0-region['margin']*ch/fh,y1+region['margin']*ch/fh])
    lower_x, upper_x=max(0,max(xs)-cw), min(sw-cw,min(xs))
    lower_y, upper_y=max(0,max(ys)-ch), min(sh-ch,min(ys))
    if lower_x>upper_x or lower_y>upper_y:
        return None
    left=min(upper_x,max(lower_x,target[0]-cw/2))
    top=min(upper_y,max(lower_y,target[1]-ch/2))
    return (left+cw/2)/sw,(top+ch/2)/sh


def plan(manifest, offset=0., preserve_cursor=False, max_zoom=1.22):
    if not math.isfinite(offset) or not 1 <= max_zoom <= 1.22:
        raise ValueError('Finite alignment offset and maximum zoom in [1,1.22] required')
    data=copy.deepcopy(manifest)
    if data.get('status') != 'completed':
        raise ValueError('Failed takes remain raw evidence; do not polish as a successful demo')
    sw,sh,duration=data['source_width'],data['source_height'],data['duration']
    data.setdefault('width',round(sw/2)*2);data.setdefault('height',round(sh/2)*2)
    data.setdefault('cursor_height',max(36,min(96,round(data['height']*.08))))
    data.setdefault('cursor_hotspot',[.2,.15]);data['cursor_safe_margin']=12
    data.setdefault('background_image',str(Path(__file__).resolve().parents[1]/'assets/airgoods.png'))
    if not preserve_cursor:
        data['cursor']=cursor_plan(data,offset)
    data['interaction_regions']=[{'label':e['label'],'start':max(0,e['t']-.1),'end':min(duration,e['t']+.1),'rect':e['rect'],'margin':4} for e in data['cursor'] if e['type']=='click' and e.get('rect')]
    padding=round(min(data['width'],data['height'])*.07)
    frame_scale=min((data['width']-2*padding)/sw,(data['height']-2*padding)/sh)
    for event in data['events']:
        if event['type']=='focus':
            x0,y0,x1,y1=event['rect']
            margin=max(0,min(4,x0*frame_scale,y0*frame_scale,(sw-x1)*frame_scale,(sh-y1)*frame_scale))
            data['interaction_regions'].append({'label':event['label'],'start':max(0,event['t']+offset-.1),'end':min(duration,event.get('completed_t',event['t']+.6)+offset),'rect':event['rect'],'margin':margin})
    guards=scroll_guards(data,offset)
    data['camera']=[{'t':0.,'zoom':1.,'x':.5,'y':.5}]
    renderer=Renderer(data)
    candidates=[e for e in data['cursor'] if e['type']=='click']
    candidates += [dict(e,t=e['t']+offset) for e in data['events'] if e['type']=='focus']
    candidates.sort(key=lambda e:e['t'])
    moments=[];previous_end=0.
    for event in candidates:
        t=event['t']
        if moments and t-moments[-1]['interaction_t']<3.8:
            continue
        start=max(previous_end+.25,t-1.15,0.)
        end=min(duration-.001,t+1.35)
        for a,b in guards:
            if a <= t <= b:
                end=start
                break
            if b<t:start=max(start,b)
            if a>t:end=min(end,a)
        if end-start<1.1 or t-start<.25 or end-t<.2:
            continue
        target=[event['x'],event['y']]
        focus=None
        rect=event.get('rect',[0,0,0,0])
        preferred=1.12 if rect[2]-rect[0]>sw*.3 and rect[3]-rect[1]<sh*.12 else (1.18 if rect[3]-rect[1]>sh*.1 else 1.22)
        for zoom in sorted({min(max_zoom,preferred,z) for z in (1.22,1.18,1.12)},reverse=True):
            focus=safe_focus(renderer,start,end,zoom,target,data['interaction_regions'])
            if focus:break
        if not focus or zoom<=1:
            continue
        ramp=min(.7,(end-start)*.28)
        keys=[{'t':start,'zoom':1.,'x':.5,'y':.5}, {'t':start+ramp,'zoom':zoom,'x':focus[0],'y':focus[1]}, {'t':end-ramp,'zoom':zoom,'x':focus[0],'y':focus[1]}, {'t':end,'zoom':1.,'x':.5,'y':.5}]
        data['camera'].extend(keys)
        moments.append({'label':event['label'],'interaction_t':t,'start':start,'end':end,'maximum_zoom':zoom})
        previous_end=end
    data['zoom_moments']=moments
    data['scroll_guards']=guards
    data['timing_note']='Original source timing and all click times retained. Cursor drift anticipates observed target regions; final approach settles at the recorded action. Camera windows derive from interactions and stop through source scroll settling. Acquisition cadence is not inferred from the 60fps export.'
    report=verify(Renderer(data))
    report.update({'focus_moments':len(moments),'maximum_zoom':max(k['zoom'] for k in data['camera']),'scroll_guard_count':len(guards),'source_speed':1,'cuts':0})
    return data,report
