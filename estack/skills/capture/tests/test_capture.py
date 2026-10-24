import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image
import numpy as np

SCRIPTS=Path(__file__).resolve().parents[1]/'scripts'
sys.path.insert(0,str(SCRIPTS))
import evidence
import recording
from planning import plan
from renderer import Renderer,load_manifest,render
from verify_framing import verify


class CaptureTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def manifest(self,width=640,height=480,duration=16):
        image=self.root/'source.png'
        Image.new('RGB',(width,height),(240,242,245)).save(image)
        events=[{'t':0,'type':'move','x':width*.5,'y':height*.5}]
        for i,t in enumerate([1.2,5.4,10.2,14.4]):
            x,y=[(.2,.3),(.75,.25),(.3,.7),(.65,.5)][i]
            events.append({'t':t,'type':'click','x':x*width,'y':y*height,'observed_t':t-.4,'rect':[x*width-10,y*height-10,x*width+10,y*height+10],'label':'Observed button '+str(i),'outcome':'command_succeeded'})
        events.extend([{'t':7.2,'type':'scroll_start'},{'t':8.2,'type':'scroll_end'}]);events.sort(key=lambda e:e['t'])
        return {'schema':1,'status':'completed','duration':duration,'source_width':width,'source_height':height,'width':width,'height':height,'frames':[{'t':0,'path':str(image)}],'events':events,'cursor':[]}

    def test_scene_plans_generalize_without_pixel_or_time_constants(self):
        for width,height in [(640,480),(1000,700),(1600,1000)]:
            source=self.manifest(width,height)
            planned,result=plan(source)
            self.assertGreaterEqual(result['focus_moments'],3)
            self.assertLessEqual(result['maximum_zoom'],1.22)
            self.assertEqual(planned['frames'],source['frames'])
            actual=[(e['t'],e['x'],e['y']) for e in source['events'] if e['type']=='click']
            self.assertEqual(actual,[(e['t'],e['x'],e['y']) for e in planned['cursor'] if e['type']=='click'])
            renderer=Renderer(planned)
            for t in np.linspace(7.,8.75,100):self.assertEqual(renderer.camera_at(float(t)),(0.,0.,float(width),float(height)))
            self.assertEqual(verify(renderer)['cursor_outside_frames'],0)
            for event in actual:
                self.assertTrue(np.allclose(renderer.cursor_at(event[0]),event[1:]))
            first=actual[0][0]
            self.assertNotEqual(renderer.cursor_at(first-.7),renderer.cursor_at(first-.5))

    def test_failed_or_unaligned_takes_cannot_be_presented_as_success(self):
        source=self.manifest();source['status']='incomplete'
        with self.assertRaises(ValueError):plan(source)
        source['status']='completed';source['events'][1]['outcome']='uncertain'
        with self.assertRaises(ValueError):plan(source)
        with self.assertRaises(ValueError):plan(self.manifest(),offset=20)

    def test_raw_hashes_and_derivative_paths(self):
        take=self.root/'raw';take.mkdir();raw=take/'raw.mp4';raw.write_bytes(b'untouched evidence')
        evidence.seal(take,[raw]);self.assertEqual(evidence.verify(take)['files'][0]['sha256'],evidence.sha256(raw))
        with self.assertRaises(ValueError):evidence.derivative_output(take/'overwrite.mp4',take)
        with self.assertRaises(FileExistsError):evidence.write_json(take/'provenance.json',{})
        raw.chmod(0o644);raw.write_bytes(b'changed evidence')
        with self.assertRaises(ValueError):evidence.verify(take)

    def test_uncertain_click_is_never_retried_and_recording_stops(self):
        take=self.root/'take';calls=[]
        class FakeBrowser:
            def __init__(self,*args):pass
            def run(self,args,**kwargs):
                calls.append(args)
                if args==['get','url']:return 'https://example.test/page'
                if args[:2]==['record','start']:Path(args[2]).write_bytes(b'failed-take-pixels')
                if args[0]=='click':raise RuntimeError('uncertain input delivery')
                return ''
            def evaluate(self,expression):
                if 'innerWidth' in expression:return {'width':640,'height':480,'epoch_ms':1}
                if 'getBoundingClientRect' in expression:return {'rect':[200,100,300,140],'tag':'BUTTON','type':'button','autocomplete':'','target':'','href':None,'visible':True,'covered':False,'epoch_ms':1}
                if 'password' in expression or 'navigator.userAgent' in expression:return False
                return 1
        scenario={'origin':'https://example.test','session':'unique-run','width':640,'height':480,'steps':[{'action':'click','selector':'#real','label':'Observed button'}]}
        with patch.object(recording,'Browser',FakeBrowser):
            with self.assertRaises(RuntimeError):recording.capture(scenario,take)
        self.assertEqual(sum(args[0]=='click' for args in calls),1)
        self.assertIn(['record','stop'],calls)
        events=json.loads((take/'events.json').read_text())
        self.assertEqual(events['status'],'incomplete')
        self.assertEqual(next(e for e in events['events'] if e['type']=='click')['outcome'],'uncertain')
        evidence.verify(take)

    def test_native_captures_have_no_baked_cursor_switch(self):
        source=(SCRIPTS/'recording.py').read_text()
        self.assertNotIn("'--cursor'",source)

    def test_desktop_only_and_wide_focus_visibility(self):
        scenario={'origin':'https://example.test','session':'run','width':640,'height':480,'mobile':False,'steps':[{'action':'still','label':'Evidence'}]}
        with self.assertRaises(ValueError):recording.validate(scenario)
        source=self.manifest();source['events']=[{'t':0,'type':'move','x':320,'y':240},{'t':2,'completed_t':3,'type':'focus','x':320,'y':240,'rect':[0,0,640,480],'label':'Whole reading region'}]
        planned,result=plan(source)
        self.assertEqual(result['maximum_zoom'],1)
        self.assertGreater(result['target_frame_checks_passed'],0)

    def test_render_source_binding_rejects_changed_pixels_and_failed_status(self):
        take=self.root/'take';take.mkdir()
        subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','color=c=blue:s=640x480:r=60:d=0.1','-c:v','libx264','-pix_fmt','yuv420p',str(take/'raw.mp4')],check=True)
        recorded={'schema':1,'status':'completed','events':[],'duration':.1,'source_width':640,'source_height':480,'raw':'raw.mp4'}
        (take/'events.json').write_text(json.dumps(recorded));evidence.seal(take,[take/'raw.mp4',take/'events.json'])
        from prepare_video import prepare
        manifest=prepare(take/'raw.mp4',take/'events.json',self.root/'frames')
        data=load_manifest(manifest);data['cursor']=[]
        evidence.verify_source_frames(data,take)
        failed=copy.deepcopy(data);failed['status']='incomplete'
        with self.assertRaises(ValueError):evidence.verify_source_frames(failed,take)
        reordered=copy.deepcopy(data);reordered['frames'][1]['t']+=.01
        with self.assertRaises(ValueError):evidence.verify_source_frames(reordered,take)
        Image.new('RGB',(640,480),'red').save(data['frames'][0]['path'])
        with self.assertRaises(ValueError):evidence.verify_source_frames(data,take)

    def test_variable_rate_source_pixels_and_final_frame_duration_are_preserved(self):
        take=self.root/'vfr';take.mkdir()
        expression='setpts=if(eq(N\\,0)\\,0\\,if(eq(N\\,1)\\,0.1/TB\\,if(eq(N\\,2)\\,0.5/TB\\,0.9/TB)))'
        subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','testsrc=size=640x480:rate=10:duration=0.4','-vf',expression,'-vsync','vfr','-c:v','libx264','-bf','0','-pix_fmt','yuv420p','-use_editlist','0',str(take/'raw.mp4')],check=True)
        recorded={'status':'completed','events':[],'duration':1,'source_width':640,'source_height':480,'raw':'raw.mp4'}
        (take/'events.json').write_text(json.dumps(recorded));evidence.seal(take,[take/'raw.mp4',take/'events.json'])
        from prepare_video import prepare
        data=load_manifest(prepare(take/'raw.mp4',take/'events.json',self.root/'vfr-frames'))
        self.assertEqual(len(data['frames']),4)
        self.assertGreater(data['frames'][2]['t']-data['frames'][1]['t'],data['frames'][1]['t']-data['frames'][0]['t'])
        self.assertLessEqual(data['duration'],1.01)
        self.assertEqual(evidence.verify_source_frames(data,take)['frames'],4)

    def test_slim_pointer_has_only_black_pixels_and_transparent_exterior(self):
        source=self.manifest();source['cursor_height']=80;source['cursor_hotspot']=[.2,.15]
        renderer=Renderer(source)
        for size in [66,70,80]:
            pointer=np.array(renderer.pointer(size))
            self.assertFalse(pointer[:,:,:3].any())
            self.assertEqual(pointer[0,0,3],0)
            self.assertLess(np.count_nonzero(pointer[:,:,3]),size*size/2)

    def test_deterministic_encode_and_relative_assets(self):
        source=self.manifest(640,480,.4);source['events']=[];source['cursor']=[{'t':0,'type':'move','x':300,'y':200}]
        source['camera']=[{'t':0,'zoom':1.,'x':.5,'y':.5}];source['background_image']='source.png'
        path=self.root/'manifest.json';path.write_text(json.dumps(source));data=load_manifest(path)
        a=render(data,self.root/'a.mp4');b=render(data,self.root/'b.mp4')
        self.assertEqual(a['raw_frames_sha256'],b['raw_frames_sha256'])
        self.assertEqual((self.root/'a.mp4').read_bytes(),(self.root/'b.mp4').read_bytes())
        self.assertEqual(a['frames'],24)
        data['source_evidence']={'sha256':'fixture-receipt'}
        evidence.write_json(self.root/'a.provenance.json',{'kind':'polished_derivative','output_sha256':evidence.sha256(self.root/'a.mp4'),'manifest_sha256':evidence.sha256(path),'raw_receipt_sha256':'fixture-receipt'})
        self.assertEqual(evidence.verify_derivative(self.root/'a.mp4',path,data)['decoded_video_frames'],24)
        with self.assertRaises(FileNotFoundError):evidence.verify_derivative(self.root/'b.mp4',path,data)
        sidecar=json.loads((self.root/'a.provenance.json').read_text());sidecar['output_sha256']='wrong';(self.root/'a.provenance.json').write_text(json.dumps(sidecar))
        with self.assertRaises(ValueError):evidence.verify_derivative(self.root/'a.mp4',path,data)
        source['camera'][0]['zoom']=1.23;path.write_text(json.dumps(source))
        with self.assertRaises(ValueError):load_manifest(path)


if __name__=='__main__':unittest.main()
