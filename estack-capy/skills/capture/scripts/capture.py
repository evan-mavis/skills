#!/usr/bin/env python3
"""One native capture tool for raw evidence and deterministic derivatives."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess

import evidence
from planning import plan
from prepare_video import prepare
from renderer import Renderer, load_manifest, render
from verify_framing import verify as verify_framing


def preflight():
    result = {}
    for executable, args in [('ffmpeg', ['-version']), ('ffprobe', ['-version'])]:
        if not shutil.which(executable):
            raise ValueError('Required executable unavailable: ' + executable)
        output = subprocess.check_output([executable] + args, text=True, stderr=subprocess.STDOUT)
        result[Path(executable).name] = output.splitlines()[0]
    encoders = subprocess.check_output(['ffmpeg', '-hide_banner', '-encoders'], text=True, stderr=subprocess.STDOUT)
    if 'libx264' not in encoders:
        raise ValueError('FFmpeg requires libx264')
    import PIL, numpy
    result.update(Pillow=PIL.__version__, numpy=numpy.__version__)
    return result


def import_native(video, metadata, take, stills=()):
    video = Path(video).resolve()
    details = json.loads(Path(metadata).read_text())
    if details.get('status') not in ('completed', 'failed', 'incomplete'):
        raise ValueError('Explicit completed, failed, or incomplete status required')
    for key in ('tool', 'build', 'scenario', 'surface'):
        if not isinstance(details.get(key), str) or not details[key].strip():
            raise ValueError('Nonempty provenance field required: ' + key)
    for key in ('assertions', 'limitations'):
        if not isinstance(details.get(key), list):
            raise ValueError('Provenance array required: ' + key)
    if video.suffix.lower() not in ('.mp4', '.mov', '.webm'):
        raise ValueError('Expected native MP4, MOV, or WebM video')
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', str(video)]))
    stream = probe['streams'][0]
    take = Path(take).resolve()
    take.mkdir(parents=True, exist_ok=False)
    raw = take / ('raw' + video.suffix.lower())
    shutil.copyfile(video, raw)
    shutil.copyfile(metadata, take / 'metadata.json')
    files = [raw, take / 'metadata.json']
    for index, source in enumerate(stills):
        source = Path(source).resolve()
        from PIL import Image
        with Image.open(source) as image:
            image.verify()
        target = take / ('still-' + str(index + 1) + source.suffix.lower())
        shutil.copyfile(source, target)
        files.append(target)
    data = {'schema': 1, 'status': details['status'], 'raw': raw.name,
            'source_width': stream['width'], 'source_height': stream['height'],
            'events': [], 'native_provenance': details, 'acquisition_fps': None,
            'cursor_telemetry': 'unavailable; preserve source pixels'}
    evidence.write_json(take / 'events.json', data)
    files.append(take / 'events.json')
    return evidence.seal(take, files, {'adapter': 'capy-native', 'acquisition_fps': None})


def source_receipt(data,check_frames=False):
    source = data.get('source_evidence')
    if not source:
        raise ValueError('Manifest needs a sealed raw-evidence receipt')
    receipt = Path(source['receipt']).resolve()
    if evidence.sha256(receipt) != source['sha256']:
        raise ValueError('The raw evidence receipt changed')
    sealed = evidence.verify(receipt.parent)
    if sealed.get('metadata', {}).get('adapter') == 'capy-native':
        recorded = json.loads((receipt.parent / 'events.json').read_text())
        if data.get('native_provenance') != recorded['native_provenance']:
            raise ValueError('Native provenance must match the sealed take')
        if data.get('cursor'):
            raise ValueError('Native capture has no cursor telemetry; preserve source cursor pixels')
    if check_frames:
        evidence.verify_source_frames(data,receipt.parent)
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('preflight')
    p=sub.add_parser('import-native');p.add_argument('video');p.add_argument('metadata');p.add_argument('take');p.add_argument('--still',action='append',default=[])
    p=sub.add_parser('seal');p.add_argument('take');p.add_argument('files',nargs='+')
    p=sub.add_parser('prepare');p.add_argument('take');p.add_argument('frames')
    p=sub.add_parser('plan');p.add_argument('manifest');p.add_argument('output')
    p=sub.add_parser('render');p.add_argument('manifest');p.add_argument('output')
    p=sub.add_parser('verify');p.add_argument('path');p.add_argument('--video')
    args=parser.parse_args()
    if args.command=='preflight':
        result=preflight()
    elif args.command=='import-native':
        result=import_native(args.video,args.metadata,args.take,args.still)
    elif args.command=='seal':
        result=evidence.seal(args.take,[Path(args.take)/p for p in args.files],{'imported_existing_evidence':True})
    elif args.command=='prepare':
        evidence.verify(args.take)
        target=evidence.derivative_output(args.frames,args.take)
        recorded=json.loads((Path(args.take)/'events.json').read_text())
        manifest=prepare(Path(args.take)/recorded['raw'],Path(args.take)/'events.json',target)
        data=json.loads(manifest.read_text())
        receipt=Path(args.take).resolve()/'provenance.json'
        data['source_evidence']={'receipt':str(receipt),'sha256':evidence.sha256(receipt)}
        manifest.write_text(json.dumps(data,indent=2)+'\n')
        result={'manifest':str(manifest)}
    elif args.command=='plan':
        data=load_manifest(args.manifest)
        receipt=source_receipt(data)
        output=evidence.derivative_output(args.output,receipt.parent)
        planned,result=plan(data,preserve_cursor=True)
        evidence.write_json(output,planned)
        result['manifest']=str(output)
    elif args.command=='render':
        data=load_manifest(args.manifest)
        receipt=source_receipt(data,True)
        output=evidence.derivative_output(args.output,receipt.parent)
        for sidecar in (output.with_suffix('.render.json'),output.with_suffix('.provenance.json')):
            evidence.derivative_output(sidecar,receipt.parent)
        result=render(data,output)
        source_receipt(data,True)
        evidence.write_json(output.with_suffix('.provenance.json'),{'schema':1,'kind':'polished_derivative','raw_receipt':str(receipt),'raw_receipt_sha256':evidence.sha256(receipt),'manifest_sha256':evidence.sha256(args.manifest),'output_sha256':evidence.sha256(output),'export_fps':60,'acquisition_fps':None,'render':result})
    elif Path(args.path).is_dir():
        result=evidence.verify(args.path)
    else:
        data=load_manifest(args.path)
        source_receipt(data,True)
        renderer=Renderer(data)
        result=verify_framing(renderer)
        for start,end in data.get('scroll_guards',[]):
            import numpy as np
            states=[renderer.camera_at(float(t)) for t in np.linspace(start,end,101)]
            if any(s!=(0.,0.,data['source_width'],data['source_height']) for s in states):
                raise ValueError('Camera moves during a source scroll guard')
        if args.video:
            result.update(evidence.verify_derivative(args.video,args.path,data))
    print(json.dumps(result,indent=2))


if __name__=='__main__':
    main()
