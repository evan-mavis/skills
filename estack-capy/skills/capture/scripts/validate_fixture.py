#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import subprocess
import sys

import evidence


def validate(output):
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=False)
    video = output / 'synthetic.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=12:duration=0.5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(video)], check=True)
    metadata = output / 'metadata.json'
    evidence.write_json(metadata, {'status': 'completed', 'tool': 'synthetic ffmpeg fixture, not live capture', 'build': 'capture fixture', 'scenario': 'animated test pattern', 'surface': 'synthetic 320x240', 'assertions': ['synthetic input generated'], 'limitations': ['Not application or native recording proof']})
    entry = Path(__file__).with_name('capture.py')
    def invoke(*args):
        return json.loads(subprocess.check_output([sys.executable, str(entry), *map(str, args)], text=True))
    take = output / 'raw'
    invoke('import-native', video, metadata, take)
    assert evidence.sha256(video) == evidence.sha256(take / 'raw.mp4')
    invoke('prepare', take, output / 'frames')
    invoke('plan', output / 'frames/manifest.json', output / 'plan.json')
    planned = json.loads((output / 'plan.json').read_text())
    assert planned['cursor'] == []
    assert all(key['zoom'] == 1 for key in planned['camera'])
    invoke('render', output / 'plan.json', output / 'polished.mp4')
    result = invoke('verify', output / 'plan.json', '--video', output / 'polished.mp4')
    invoke('verify', take)
    result['live_native_capture'] = 'not exercised by synthetic fixture'
    evidence.write_json(output / 'validation.json', result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    print(json.dumps(validate(parser.parse_args().output), indent=2))
