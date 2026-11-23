import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import capture
import evidence
from planning import plan
from renderer import load_manifest
from validate_fixture import validate


class NativeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.video = self.root / 'source.mov'
        subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=12:duration=0.5', '-c:v', 'libx264', str(self.video)], check=True)
        self.metadata = self.root / 'metadata.json'
        self.details = {'status': 'completed', 'tool': 'test fixture', 'build': 'fixture', 'scenario': 'synthetic animation', 'surface': 'synthetic', 'assertions': ['fixture generated'], 'limitations': ['not live proof']}
        self.metadata.write_text(json.dumps(self.details))

    def tearDown(self):
        self.temp.cleanup()

    def test_import_preserves_original_bytes_and_still(self):
        still = self.root / 'original.png'
        Image.new('RGB', (320, 240), 'white').save(still)
        take = self.root / 'take'
        capture.import_native(self.video, self.metadata, take, [still])
        self.assertEqual(evidence.sha256(self.video), evidence.sha256(take / 'raw.mov'))
        self.assertEqual(evidence.sha256(still), evidence.sha256(take / 'still-1.png'))
        events = json.loads((take / 'events.json').read_text())
        self.assertEqual(events['events'], [])
        self.assertIsNone(events['acquisition_fps'])
        self.assertEqual(events['native_provenance'], self.details)
        with self.assertRaises(FileExistsError):
            capture.import_native(self.video, self.metadata, take)
        raw = take / 'raw.mov'
        raw.chmod(0o644)
        raw.write_bytes(b'changed')
        with self.assertRaises(ValueError):
            evidence.verify(take)

    def test_failed_take_is_retained_but_not_planned(self):
        self.details['status'] = 'failed'
        self.metadata.write_text(json.dumps(self.details))
        take = self.root / 'failed'
        capture.import_native(self.video, self.metadata, take)
        evidence.verify(take)
        with self.assertRaises(ValueError):
            plan({'status': 'failed'})

    def test_missing_provenance_rejected_before_take_creation(self):
        self.metadata.write_text('{}')
        with self.assertRaises(ValueError):
            capture.import_native(self.video, self.metadata, self.root / 'take')
        self.assertFalse((self.root / 'take').exists())

    def test_synthetic_end_to_end_and_source_binding(self):
        output = self.root / 'pipeline'
        result = validate(output)
        self.assertEqual(result['full_decode'], 'passed')
        self.assertEqual(result['pointer_ink_checks_passed'], 0)
        data = load_manifest(output / 'plan.json')
        capture.source_receipt(data, True)
        data['cursor'] = [{'type': 'move', 't': 0, 'x': 10, 'y': 10}]
        with self.assertRaises(ValueError):
            capture.source_receipt(data)
        data['cursor'] = []
        original = data['native_provenance']
        for changed in (None, {}, dict(original, build='invented build'), dict(original, assertions=['invented assertion'])):
            if changed is None:
                del data['native_provenance']
            else:
                data['native_provenance'] = changed
            with self.assertRaises(ValueError):
                capture.source_receipt(data)
        data['native_provenance'] = original
        source = Path(data['frames'][0]['path'])
        Image.new('RGB', (320, 240), 'black').save(source)
        with self.assertRaises(ValueError):
            capture.source_receipt(data, True)


if __name__ == '__main__':
    unittest.main()
