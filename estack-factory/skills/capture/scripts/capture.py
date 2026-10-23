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
from recording import capture
from renderer import Renderer, load_manifest, render
from verify_framing import verify as verify_framing


def preflight(binary):
    result = {}
    for executable, args in [(binary, ['--version']), ('ffmpeg', ['-version']), ('ffprobe', ['-version'])]:
        if not shutil.which(executable):
            raise ValueError('Required executable unavailable: ' + executable)
        output = subprocess.check_output([executable] + args, text=True, stderr=subprocess.STDOUT)
        result[Path(executable).name] = output.splitlines()[0]
    help_text = subprocess.check_output([binary, 'record', '--help'], text=True)
    if '--fps' not in help_text or 'start' not in help_text:
        raise ValueError('Installed recorder does not expose the tested native capture interface')
    encoders = subprocess.check_output(['ffmpeg', '-hide_banner', '-encoders'], text=True, stderr=subprocess.STDOUT)
    if 'libx264' not in encoders:
        raise ValueError('FFmpeg requires libx264')
    import PIL, numpy
    result.update(Pillow=PIL.__version__, numpy=numpy.__version__)
    return result


def source_receipt(data,check_frames=False):
    source = data.get('source_evidence')
    if not source:
        raise ValueError('Manifest needs a sealed raw-evidence receipt')
    receipt = Path(source['receipt']).resolve()
    if evidence.sha256(receipt) != source['sha256']:
        raise ValueError('The raw evidence receipt changed')
    evidence.verify(receipt.parent)
    if check_frames:
        evidence.verify_source_frames(data,receipt.parent)
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p=sub.add_parser('preflight');p.add_argument('--browser',default='agent-browser')
    for action in ('capture','still'):
        p=sub.add_parser(action);p.add_argument('scenario');p.add_argument('take');p.add_argument('--browser',default='agent-browser')
    p=sub.add_parser('seal');p.add_argument('take');p.add_argument('files',nargs='+')
    p=sub.add_parser('prepare');p.add_argument('take');p.add_argument('frames')
    p=sub.add_parser('plan');p.add_argument('manifest');p.add_argument('output');p.add_argument('--alignment-offset',type=float,default=0.);p.add_argument('--preserve-cursor',action='store_true')
    p=sub.add_parser('render');p.add_argument('manifest');p.add_argument('output')
    p=sub.add_parser('verify');p.add_argument('path');p.add_argument('--video')
    args=parser.parse_args()
    if args.command=='preflight':
        result=preflight(args.browser)
    elif args.command in ('capture','still'):
        scenario=json.loads(Path(args.scenario).read_text())
        result={'take':str(capture(scenario,args.take,args.browser,args.command=='still'))}
    elif args.command=='seal':
        result=evidence.seal(args.take,[Path(args.take)/p for p in args.files],{'imported_existing_evidence':True})
    elif args.command=='prepare':
        evidence.verify(args.take)
        target=evidence.derivative_output(args.frames,args.take)
        manifest=prepare(Path(args.take)/'raw.mp4',Path(args.take)/'events.json',target)
        data=json.loads(manifest.read_text())
        receipt=Path(args.take).resolve()/'provenance.json'
        data['source_evidence']={'receipt':str(receipt),'sha256':evidence.sha256(receipt)}
        manifest.write_text(json.dumps(data,indent=2)+'\n')
        result={'manifest':str(manifest)}
    elif args.command=='plan':
        data=load_manifest(args.manifest)
        receipt=source_receipt(data)
        output=evidence.derivative_output(args.output,receipt.parent)
        planned,result=plan(data,args.alignment_offset,args.preserve_cursor)
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
