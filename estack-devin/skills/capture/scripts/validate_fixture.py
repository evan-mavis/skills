#!/usr/bin/env python3
import argparse
import functools
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
import sys
import threading
import uuid

from PIL import Image,ImageDraw

import evidence
from recording import Browser,capture
from renderer import render


def deterministic(output):
    output=Path(output).resolve();output.mkdir(parents=True,exist_ok=False)
    frames=[]
    for i in range(24):
        image=Image.new('RGB',(640,480),(250,250,250));draw=ImageDraw.Draw(image)
        draw.rectangle((90+i*2,150,210+i*2,240),fill=(90,50,150))
        draw.text((40,40),'LOCAL CAPTURE FIXTURE',fill='black')
        path=output/f'frame_{i:03d}.png';image.save(path);frames.append({'t':i/60,'path':str(path)})
    data={'schema':1,'status':'completed','duration':.4,'source_width':640,'source_height':480,'width':640,'height':480,'frames':frames,'events':[],'cursor':[{'t':0,'type':'move','x':300,'y':260},{'t':.4,'type':'move','x':360,'y':290}],'cursor_height':38,'cursor_hotspot':[.2,.15],'cursor_safe_margin':12,'camera':[{'t':0,'zoom':1,'x':.5,'y':.5}],'background_image':str(Path(__file__).resolve().parents[1]/'assets/airgoods.png')}
    first=render(data,output/'fixture-a.mp4');second=render(data,output/'fixture-b.mp4')
    assert first['raw_frames_sha256']==second['raw_frames_sha256']
    assert evidence.sha256(output/'fixture-a.mp4')==evidence.sha256(output/'fixture-b.mp4')
    return {'raw_frame_hash':first['raw_frames_sha256'],'identical_mp4_sha256':evidence.sha256(output/'fixture-a.mp4'),'frames':24,'full_decode':'passed'}


def native(output,binary):
    page=output/'page';page.mkdir()
    (page/'index.html').write_text('''<!doctype html><meta charset="utf-8"><title>Capture fixture</title>
<style>body{margin:0;font:24px sans-serif}header{height:80px;background:#eee}button{margin:20px;width:180px;height:60px}section{height:1000px;background:linear-gradient(white,#cdbbe8)}</style>
<header>Local capture fixture</header><button id="action" onclick="document.querySelector('#result').textContent='DONE'">Inspect details</button><p id="result">READY</p><section>Read-only fixture content</section>''')
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(page)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    origin='http://127.0.0.1:'+str(server.server_port)
    session='capture-fixture-'+uuid.uuid4().hex[:10]
    browser=Browser(binary,session)
    try:
        browser.run(['open',origin]);browser.run(['set','viewport','640','480'])
        scenario={'origin':origin,'session':session,'width':640,'height':480,'fps':60,'steps':[{'action':'wait','seconds':.6,'label':'Read fixture'},{'action':'click','selector':'#action','label':'Inspect fixture details'},{'action':'assert_text','selector':'#result','text':'DONE','label':'Verify visible click result'},{'action':'still','label':'Preserve exact raw screenshot'},{'action':'wait','seconds':.4,'label':'Read result'},{'action':'scroll','y':500,'milliseconds':700,'label':'Explore fixture'},{'action':'wait','seconds':.6,'label':'Read lower content'}]}
        take=capture(scenario,output/'native-raw',binary)
        evidence.verify(take)
        entry=Path(__file__).with_name('capture.py')
        def invoke(*args):
            return json.loads(subprocess.check_output([sys.executable,str(entry),*map(str,args)],text=True))
        path=Path(invoke('prepare',take,output/'native-frames')['manifest'])
        framing=invoke('plan',path,output/'native-plan.json')
        result=invoke('render',output/'native-plan.json',output/'native-polished.mp4')
        invoke('verify',output/'native-plan.json','--video',output/'native-polished.mp4')
        evidence.verify(take)
        receipt=json.loads((take/'provenance.json').read_text())
        assert any(f['path'].endswith('.png') for f in receipt['files'])
        return {'native_capture':'passed','visible_result_assertion':'DONE','raw_receipt_files':len(receipt['files']),'render':result,'framing':framing,'acquisition_fps':None,'alignment':'command-bounded; inspect source before publishing'}
    finally:
        browser.run(['close']);server.shutdown();server.server_close()


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--browser')
    args=parser.parse_args();output=Path(args.output).resolve()
    result={'deterministic':deterministic(output)}
    if args.browser:result['native']=native(output,args.browser)
    evidence.write_json(output/'validation.json',result)
    print(json.dumps(result,indent=2))
