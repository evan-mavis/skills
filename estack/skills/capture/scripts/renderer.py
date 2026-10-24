#!/usr/bin/env python3
"""Deterministic screenshot-driven, 60 fps demo-video compositor."""
import argparse
import bisect
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

FPS = 60


def smoothstep(v):
    v = max(0.0, min(1.0, v))
    return v * v * (3 - 2 * v)


def smootherstep(v):
    v = max(0.0, min(1.0, v))
    return v * v * v * (v * (v * 6 - 15) + 10)


def finite(value, label):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{label} must be a finite number')
    return float(value)


def load_manifest(path):
    path = Path(path).resolve()
    data = json.loads(path.read_text())
    data['duration'] = finite(data.get('duration'), 'duration')
    if data['duration'] <= 0:
        raise ValueError('duration must be positive')
    for key, default in [('width', data.get('source_width', 1920)), ('height', data.get('source_height', 1200))]:
        value = data.get(key, default)
        if not isinstance(value, int) or isinstance(value, bool) or value < 64 or value % 2:
            raise ValueError(f'{key} must be an even integer >=64')
        data[key] = value
    frames = data.get('frames')
    if not isinstance(frames, list) or not frames:
        raise ValueError('frames must be a nonempty array')
    previous = -1
    for frame in frames:
        frame['t'] = finite(frame.get('t'), 'frame t')
        if frame['t'] < 0 or frame['t'] <= previous or frame['t'] >= data['duration']:
            raise ValueError('frame times must be strictly increasing in [0,duration)')
        previous = frame['t']
        image_path = (path.parent / frame['path']).resolve()
        with Image.open(image_path) as image:
            image.verify()
        frame['path'] = str(image_path)
    if frames[0]['t'] != 0:
        raise ValueError('first frame must start at t=0')
    for key in ('source_width', 'source_height'):
        if key in data:
            value = finite(data[key], key)
            if value <= 0:
                raise ValueError(f'{key} must be positive')
            data[key] = value
    data['cursor_height']=finite(data.get('cursor_height',max(36,min(96,round(data['height']*.08)))),'cursor_height')
    data.setdefault('cursor_hotspot',[.2,.15])
    if not 12<=data['cursor_height']<=160: raise ValueError('cursor_height must be in [12,160]')
    events = data.setdefault('cursor', data.get('events', []))
    previous = -1
    for event in events:
        event['t'] = finite(event.get('t'), 'cursor t')
        if not 0 <= event['t'] <= data['duration'] or event['t'] < previous:
            raise ValueError('cursor times must be nondecreasing in [0,duration]')
        previous = event['t']
        if event.get('type') not in ('move', 'click'):
            raise ValueError('cursor type must be move or click')
        for key in ('x', 'y'):
            event[key] = finite(event.get(key), 'cursor ' + key)
            if event[key] < 0:
                raise ValueError('cursor coordinates must be nonnegative source-image pixels')
    if 'cursor_hidden_after' in data:
        data['cursor_hidden_after']=finite(data['cursor_hidden_after'],'cursor_hidden_after')
        if data['cursor_hidden_after']<0: raise ValueError('cursor_hidden_after must be nonnegative')
    keys = data.setdefault('camera', [])
    previous = -1
    for key in keys:
        key['t'] = finite(key.get('t'), 'camera t')
        if not 0 <= key['t'] <= data['duration'] or key['t'] <= previous:
            raise ValueError('camera times must be strictly increasing in [0,duration]')
        previous = key['t']
        key['zoom'] = finite(key.get('zoom', 1), 'camera zoom')
        if not 1 <= key['zoom'] <= 1.22:
            raise ValueError('camera zoom must be in [1,1.22]')
        for axis in ('x', 'y'):
            key[axis] = finite(key.get(axis, .5), 'camera focus')
            if not 0 <= key[axis] <= 1:
                raise ValueError('camera x/y focus must be normalized in [0,1]')
    if data.get('background_image'):
        data['background_image'] = str((path.parent / data['background_image']).resolve())
    return data


def interpolate(events, t, fields, easing=smoothstep):
    if not events:
        return None
    times = [e['t'] for e in events]
    index = bisect.bisect_right(times, t) - 1
    if index < 0:
        return tuple(events[0][field] for field in fields)
    if index == len(events) - 1:
        return tuple(events[-1][field] for field in fields)
    left, right = events[index:index + 2]
    weight = easing((t - left['t']) / (right['t'] - left['t']))
    return tuple(left[field] + weight * (right[field] - left[field]) for field in fields)


class Renderer:
    def __init__(self, manifest):
        self.data = manifest
        self.size = manifest['width'], manifest['height']
        self.frames = manifest['frames']
        self.times = [frame['t'] for frame in self.frames]
        self.cached_index = None
        self.base = None
        w, h = self.size
        yy, xx = np.mgrid[0:h, 0:w]
        blend = np.clip(.65 * yy / max(1, h - 1) + .35 * xx / max(1, w - 1), 0, 1)[..., None]
        a, b = [np.array(color) for color in manifest.get('background_colors', [[226,217,250],[166,153,216]])]
        self.background = Image.fromarray(np.rint(a * (1 - blend) + b * blend).astype('uint8'), 'RGB')
        if manifest.get('background_image'):
            with Image.open(manifest['background_image']) as wallpaper:
                self.background=ImageOps.fit(wallpaper.convert('RGB'),self.size,method=Image.Resampling.LANCZOS,centering=(.5,.5))
        self.click_times = [e['t'] for e in manifest['cursor'] if e['type'] == 'click']
        self.pointer_cache = {}
        sw,sh=manifest['source_width'],manifest['source_height']
        padding=round(min(w,h)*.07);scale=min((w-2*padding)/sw,(h-2*padding)/sh)
        fw,fh=round(sw*scale),round(sh*scale);x,y=(w-fw)//2,(h-fh)//2
        self.frame_geometry=x,y,fw,fh
        mask=Image.new('L',(fw,fh));ImageDraw.Draw(mask).rounded_rectangle((0,0,fw-1,fh-1),radius=round(fh*.035),fill=255)
        shadow=Image.new('L',self.size);shadow.paste(mask,(x,y+round(h*.014)))
        shadow=shadow.filter(ImageFilter.GaussianBlur(h*.018)).point(lambda a:round(a*.5))
        self.frame_mask=mask;self.framed_background=self.background.copy()
        self.framed_background.paste((0,0,0),(0,0,w,h),shadow)

    def source_index(self, t):
        return max(0, bisect.bisect_right(self.times, t) - 1)

    def compose_source(self, index):
        if index == self.cached_index:
            return
        image = Image.open(self.frames[index]['path']).convert('RGB')
        source_w, source_h = image.size
        w, h = self.size
        padding = round(min(w, h) * .07)
        scale = min((w - 2 * padding) / source_w, (h - 2 * padding) / source_h)
        fw, fh = round(source_w * scale), round(source_h * scale)
        x, y = (w - fw) // 2, (h - fh) // 2
        mask = Image.new('L', (fw, fh))
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, fw - 1, fh - 1), radius=round(fh * .05), fill=255)
        shadow_mask = Image.new('L', self.size)
        shadow_mask.paste(mask, (x, y + round(h * .014)))
        shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(max(2, h * .018))).point(lambda alpha: round(alpha * .5))
        base = self.background.copy()
        base.paste((0, 0, 0), (0, 0, w, h), shadow_mask)
        base.paste(image.resize((fw, fh), Image.Resampling.LANCZOS), (x, y), mask)
        self.base, self.cached_index = base, index
        self.window = x, y, fw / self.data.get('source_width', source_w), fh / self.data.get('source_height', source_h)

    def pointer(self, height):
        if height not in self.pointer_cache:
            factor=4
            mask=Image.new('L',(height*factor,height*factor))
            vertices=[(20, 15), (64.5, 48.5), (46.8, 54.8), (58, 75.7), (46.3, 82), (35.8, 59.4), (20, 73)]
            vertices=[np.array([x*height*factor/100,y*height*factor/100]) for x,y in vertices]
            rounded=[];radii=[.055,.055,.020,.080,.080,.020,.055]
            for i,vertex in enumerate(vertices):
                before,after=vertices[i-1],vertices[(i+1)%len(vertices)]
                da,db=np.linalg.norm(before-vertex),np.linalg.norm(after-vertex)
                distance=min(height*factor*radii[i],da*.48,db*.48)
                incoming=vertex+(before-vertex)*distance/da;outgoing=vertex+(after-vertex)*distance/db
                for u in np.linspace(0,1,14):rounded.append(tuple((1-u)**2*incoming+2*(1-u)*u*vertex+u*u*outgoing))
            ImageDraw.Draw(mask).polygon(rounded,fill=255)
            mask=mask.resize((height,height),Image.Resampling.LANCZOS)
            img=Image.new('RGBA',(height,height),(0,0,0,0))
            img.putalpha(mask)
            self.pointer_cache[height]=img
        return self.pointer_cache[height]

    def cursor_at(self,t):
        moves=[e for e in self.data['cursor'] if e['type']=='move']
        if not moves:return None
        i=max(0,bisect.bisect_right([e['t'] for e in moves],t)-1)
        if i>=len(moves)-1:return moves[-1]['x'],moves[-1]['y']
        a,b=moves[i:i+2];u=smootherstep((t-a['t'])/(b['t']-a['t']))
        dx,dy=b['x']-a['x'],b['y']-a['y'];distance=math.hypot(dx,dy)
        bend=min(82,distance*.13)*math.sin(math.pi*u) if distance else 0
        return a['x']+dx*u-dy/max(distance,1)*bend,a['y']+dy*u+dx/max(distance,1)*bend

    def camera_at(self,t):
        sw,sh=self.data['source_width'],self.data['source_height']
        crops=[]
        for key in self.data['camera'] or [{'t':0,'zoom':1,'x':.5,'y':.5}]:
            cw,ch=sw/key['zoom'],sh/key['zoom']
            crops.append({'t':key['t'],'left':max(0,min(sw-cw,key['x']*sw-cw/2)),
                          'top':max(0,min(sh-ch,key['y']*sh-ch/2)),'cw':cw,'ch':ch})
        return interpolate(crops,t,('left','top','cw','ch'),smootherstep)

    def frame(self, t):
        index=self.source_index(t)
        if index!=self.cached_index:
            self.source_image=Image.open(self.frames[index]['path']).convert('RGB')
            self.cached_index=index
        w,h=self.size;sw,sh=self.data['source_width'],self.data['source_height']
        x,y,fw,fh=self.frame_geometry
        left,top,cw,ch=self.camera_at(t)
        content=self.source_image.transform((fw,fh),Image.Transform.EXTENT,(left,top,left+cw,top+ch),Image.Resampling.BICUBIC)
        previous=self.camera_at(max(0,t-1/60));speed=math.hypot((left-previous[0])*fw/cw,(top-previous[1])*fh/ch)+abs(cw-previous[2])*fw/cw
        if speed>.3:content=content.filter(ImageFilter.GaussianBlur(min(.55,speed*.045)))
        cursor=self.cursor_at(t)
        if cursor:
            press=max((math.sin(math.pi*(t-click)/.16) for click in self.click_times if 0<=t-click<=.16),default=0)
            height=round(self.data.get('cursor_height',64)*(1-.18*press));pointer=self.pointer(height)
            px,py=(cursor[0]-left)*fw/cw,(cursor[1]-top)*fh/ch
            hx,hy=self.data.get('cursor_hotspot',[2/36,1/36])
            content.paste(pointer,(round(px-height*hx),round(py-height*hy)),pointer)
        out=self.framed_background.copy();out.paste(content,(x,y),self.frame_mask)
        return out


def render(manifest, output):
    renderer = Renderer(manifest)
    if 'cursor_safe_margin' in manifest:
        from verify_framing import verify
        verify(renderer)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    w, h = renderer.size
    command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', f'{w}x{h}', '-framerate', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-threads', '4', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-map_metadata', '-1', str(output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    digest = hashlib.sha256()
    count = math.ceil(manifest['duration'] * FPS - .0001)
    try:
        for number in range(count):
            raw = renderer.frame(number / FPS).tobytes()
            digest.update(raw)
            process.stdin.write(raw)
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError('FFmpeg encoding failed')
    except BaseException:
        process.kill()
        process.wait()
        raise
    subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(output), '-f', 'null', '-'], check=True)
    result = {'output': str(output.resolve()), 'frames': count, 'fps': FPS, 'width': w, 'height': h, 'raw_frames_sha256': digest.hexdigest(), 'full_decode': 'passed'}
    output.with_suffix('.render.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest')
    parser.add_argument('output')
    args = parser.parse_args()
    try:
        print(json.dumps(render(load_manifest(args.manifest), args.output), indent=2))
    except (ValueError, OSError, subprocess.CalledProcessError, RuntimeError) as exc:
        parser.exit(1, f'render failed: {exc}\n')


if __name__ == '__main__':
    main()
