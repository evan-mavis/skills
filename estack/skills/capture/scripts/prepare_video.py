#!/usr/bin/env python3
import argparse,json,subprocess
from fractions import Fraction
from pathlib import Path

def video_duration(probe):
    frames=probe['frames'];stream=probe['streams'][0];base=Fraction(stream['time_base'])
    last_duration=int(frames[-1].get('duration',frames[-1].get('pkt_duration',0)))
    if last_duration>0:
        return float((int(frames[-1]['best_effort_timestamp'])-int(frames[0]['best_effort_timestamp'])+last_duration)*base)
    if stream.get('duration_ts'):
        return float(int(stream['duration_ts'])*base)
    times=[float(int(f['best_effort_timestamp'])*base) for f in frames]
    return times[-1]-times[0]+(times[-1]-times[-2] if len(times)>1 else 1/30)

def prepare(video,events,out):
    out=Path(out).resolve();out.mkdir(parents=True,exist_ok=False)
    data=json.loads(Path(events).read_text())
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_streams','-show_entries','stream=time_base,duration_ts:frame=best_effort_timestamp,duration,pkt_duration','-of','json',str(video)]))
    time_base=Fraction(probe['streams'][0]['time_base'])
    times=[float(int(f['best_effort_timestamp'])*time_base) for f in probe['frames']]
    if not times: raise ValueError('Video has no decoded frames')
    subprocess.run(['ffmpeg','-v','error','-i',str(video),'-vsync','0',str(out/'frame_%06d.png')],check=True)
    paths=sorted(out.glob('frame_*.png'))
    if len(paths)!=len(times): raise ValueError('Decoded frame/timestamp count differs')
    data['cursor']=[e for e in data.get('events',[]) if e.get('type') in ('move','click')]
    data['frames']=[{'path':p.name,'t':t-times[0],'source_pts':int(frame['best_effort_timestamp'])} for p,t,frame in zip(paths,times,probe['frames'])]
    data['source_time_base']=str(time_base)
    data['duration']=video_duration(probe)
    (out/'manifest.json').write_text(json.dumps(data,indent=2));return out/'manifest.json'
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('events');p.add_argument('out');a=p.parse_args();print(prepare(a.video,a.events,a.out))
