import hashlib
import json
import math
from pathlib import Path
from fractions import Fraction
import subprocess

from PIL import Image
from prepare_video import video_duration


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')


def seal(take, files, metadata=None):
    take = Path(take).resolve()
    receipt = take / 'provenance.json'
    if receipt.exists():
        return verify(take)
    entries = []
    for file in files:
        file = Path(file).resolve()
        relative = file.relative_to(take)
        if file.is_symlink() or not file.is_file():
            raise ValueError('Evidence must be a regular file inside the take')
        entries.append({'path': str(relative), 'bytes': file.stat().st_size, 'sha256': sha256(file)})
    if not entries:
        raise ValueError('Cannot seal an empty take')
    data = {'schema': 1, 'kind': 'raw_evidence', 'files': entries, 'metadata': metadata or {}}
    write_json(receipt, data)
    for entry in entries:
        (take / entry['path']).chmod(0o444)
    receipt.chmod(0o444)
    return data


def verify(take):
    take = Path(take).resolve()
    data = json.loads((take / 'provenance.json').read_text())
    if data.get('schema') != 1 or data.get('kind') != 'raw_evidence' or not data.get('files'):
        raise ValueError('Invalid evidence receipt')
    for entry in data['files']:
        file = (take / entry['path']).resolve()
        file.relative_to(take)
        if file.stat().st_size != entry['bytes'] or sha256(file) != entry['sha256']:
            raise ValueError('Raw evidence changed: ' + entry['path'])
    return data


def derivative_output(path, take):
    path = Path(path).resolve()
    take = Path(take).resolve()
    if path == take or take in path.parents:
        raise ValueError('Write derivatives outside the raw evidence directory')
    if path.exists():
        raise FileExistsError('Use a new derivative path instead of overwriting an artifact')
    return path


def verify_source_frames(data, take):
    take=Path(take).resolve()
    receipt=verify(take)
    sealed={e['path'] for e in receipt['files']}
    if 'events.json' not in sealed:
        raise ValueError('The recorded action log must be sealed evidence')
    recorded=json.loads((take/'events.json').read_text())
    if recorded['status']!='completed' or data.get('status')!='completed' or data.get('events')!=recorded['events']:
        raise ValueError('Render only completed, unchanged recorded action evidence')
    if any(e.get('verified') is False or e.get('outcome') not in (None,'command_succeeded') for e in recorded['events']):
        raise ValueError('Failed assertions or uncertain inputs require reconciliation')
    raw=take/recorded['raw']
    raw.resolve().relative_to(take)
    if str(raw.relative_to(take)) not in sealed:
        raise ValueError('Source video is not sealed evidence')
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_streams','-show_entries','stream=width,height,time_base,duration_ts:frame=best_effort_timestamp,duration,pkt_duration','-of','json',str(raw)]))
    stream=probe['streams'][0];base=Fraction(stream['time_base'])
    pts=[float(int(f['best_effort_timestamp'])*base) for f in probe['frames']]
    times=[t-pts[0] for t in pts]
    if (stream['width'],stream['height'])!=(data['source_width'],data['source_height']) or len(times)!=len(data['frames']):
        raise ValueError('Finishing source dimensions or frame count differ from raw evidence')
    if any(abs(t-frame['t'])>1e-8 for t,frame in zip(times,data['frames'])):
        raise ValueError('Source timestamps changed; retain raw presentation timing')
    if data.get('source_time_base',str(base))!=str(base) or any(frame.get('source_pts',int(raw_frame['best_effort_timestamp']))!=int(raw_frame['best_effort_timestamp']) for frame,raw_frame in zip(data['frames'],probe['frames'])):
        raise ValueError('Original source timestamp ticks changed')
    duration=video_duration(probe)
    if abs(data['duration']-duration)>1e-6:
        raise ValueError('Source duration changed')
    clicks=[e for e in recorded['events'] if e['type']=='click']
    overlay=[e for e in data['cursor'] if e['type']=='click']
    if len(clicks)!=len(overlay):raise ValueError('Cursor must preserve the recorded click count')
    offsets=[]
    for a,b in zip(clicks,overlay):
        if (a['x'],a['y'],a.get('rect'))!=(b['x'],b['y'],b.get('rect')) or b.get('original_capture_t',b['t'])!=a['t']:
            raise ValueError('Cursor click differs from the recorded action target')
        offsets.append(b['t']-a['t'])
    if offsets and max(offsets)-min(offsets)>1e-7:
        raise ValueError('Use one inspected source alignment offset; retain click intervals')
    command=['ffmpeg','-v','error','-i',str(raw),'-vsync','0','-f','rawvideo','-pix_fmt','rgb24','-']
    process=subprocess.Popen(command,stdout=subprocess.PIPE)
    size=stream['width']*stream['height']*3
    digest=hashlib.sha256()
    try:
        for frame in data['frames']:
            blob=process.stdout.read(size)
            with Image.open(frame['path']) as image:actual=image.convert('RGB').tobytes()
            if len(blob)!=size or hashlib.sha256(blob).digest()!=hashlib.sha256(actual).digest():
                raise ValueError('A finishing frame differs from the decoded raw video')
            digest.update(blob)
        if process.stdout.read(1) or process.wait()!=0:
            raise ValueError('Raw decoder frame count or status differs')
    finally:
        process.stdout.close()
        if process.poll() is None:process.kill();process.wait()
    return {'frames':len(times),'raw_decoded_rgb_sha256':digest.hexdigest(),'click_alignment_offset':offsets[0] if offsets else None}


def verify_derivative(video, manifest, data):
    video=Path(video).resolve()
    sidecar=json.loads(video.with_suffix('.provenance.json').read_text())
    receipt=data['source_evidence']
    if sidecar.get('kind')!='polished_derivative' or sidecar.get('output_sha256')!=sha256(video) or sidecar.get('manifest_sha256')!=sha256(manifest) or sidecar.get('raw_receipt_sha256')!=receipt['sha256']:
        raise ValueError('Video, manifest, and raw evidence do not match derivative provenance')
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=width,height,avg_frame_rate,nb_read_frames','-of','json',str(video)]))
    stream=probe['streams'][0];frames=math.ceil(data['duration']*60-.0001)
    if (stream['width'],stream['height'],int(stream['nb_read_frames']),Fraction(stream['avg_frame_rate']))!=(data['width'],data['height'],frames,Fraction(60)):
        raise ValueError('Encoded video dimensions, cadence, or frame count differ from the manifest')
    subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(video),'-f','null','-'],check=True)
    return {'decoded_video_frames':frames,'output_sha256':sidecar['output_sha256'],'full_decode':'passed'}
