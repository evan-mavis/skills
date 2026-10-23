import json
import math
from pathlib import Path
import subprocess
import time
from urllib.parse import urlsplit, urljoin

from evidence import seal, write_json

ACTIONS = {'click', 'fill', 'wait', 'assert_text', 'scroll', 'still', 'focus'}


def validate(scenario):
    if any(key in scenario for key in ('mobile','is_mobile','device','touch','user_agent','userAgent','device_scale_factor')):
        raise ValueError('Capture supports desktop browsers only; mobile evidence is a manual handoff')
    origin = urlsplit(scenario['origin'])
    if origin.scheme not in ('http', 'https') or not origin.hostname or origin.username or origin.password or origin.query or origin.fragment or origin.path not in ('', '/'):
        raise ValueError('Supply an exact origin without credentials, path, query or fragment')
    if origin.scheme == 'http' and origin.hostname not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Non-loopback scenarios require HTTPS')
    if not isinstance(scenario.get('session'), str) or not scenario['session'].strip():
        raise ValueError('A run-owned named browser session is required')
    for key in ('width', 'height'):
        value = scenario[key]
        if isinstance(value, bool) or not isinstance(value, int) or value < 200 or value > 4096 or value % 2:
            raise ValueError('Viewport dimensions must be even integers in [200,4096]')
    if scenario.get('fps', 60) not in range(1, 61):
        raise ValueError('fps must be in [1,60]')
    if not isinstance(scenario.get('steps'), list) or not scenario['steps']:
        raise ValueError('A scenario needs reviewed actions and assertions')
    initial=scenario.get('initial_cursor',[scenario['width']/2,scenario['height']/2])
    if len(initial)!=2 or any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) for v in initial) or not (0<=initial[0]<=scenario['width'] and 0<=initial[1]<=scenario['height']):
        raise ValueError('Initial cursor must be a finite viewport point')
    for step in scenario['steps']:
        if step.get('action') not in ACTIONS or not isinstance(step.get('label'), str):
            raise ValueError('Each step needs a supported action and label')
        if step['action'] in ('click', 'fill', 'assert_text', 'focus') and not step.get('selector'):
            raise ValueError('Targeted actions require an observed CSS selector')
        if step['action'] in ('fill', 'assert_text') and not isinstance(step.get('text'), str):
            raise ValueError('Text actions require literal non-secret text')
        for key in ('seconds', 'y', 'milliseconds'):
            if key in step and (isinstance(step[key], bool) or not isinstance(step[key], (int, float)) or not math.isfinite(step[key])):
                raise ValueError('Action timing and scroll coordinates must be finite')
        if step['action'] == 'wait' and not 0 <= step.get('seconds', -1) <= 30:
            raise ValueError('Waits must be in [0,30] seconds')
        if step['action'] == 'focus' and not 0 <= step.get('seconds', .6) <= 10:
            raise ValueError('Reading holds must be in [0,10] seconds')
        if step['action'] == 'scroll' and (step.get('y', -1) < 0 or not 100 <= step.get('milliseconds', 850) <= 5000):
            raise ValueError('Scroll needs a nonnegative destination and duration in [100,5000]ms')


class Browser:
    def __init__(self, binary, session):
        self.prefix = [binary, '--session', session]

    def run(self, args, timeout=60):
        result = subprocess.run(self.prefix + args, text=True, capture_output=True, timeout=timeout)
        if result.returncode:
            raise RuntimeError('Browser command failed; reconcile the observed outcome before retrying')
        return result.stdout.strip()

    def evaluate(self, expression):
        result = json.loads(self.run(['--json', 'eval', expression]))
        if not result.get('success'):
            raise RuntimeError('Browser observation failed')
        return result['data']['result']


def describe(browser, selector):
    expression = '''(() => {const e=document.querySelector(SELECTOR);if(!e)return null;
const r=e.getBoundingClientRect(),s=getComputedStyle(e);
return {rect:[r.x,r.y,r.right,r.bottom],tag:e.tagName,type:e.type||null,
autocomplete:e.autocomplete||null,target:e.target||null,href:e.getAttribute('href'),
visible:r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none',
covered:!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),
epoch_ms:Date.now()}})()'''.replace('SELECTOR', json.dumps(selector))
    return browser.evaluate(expression)


def capture(scenario, take, binary='agent-browser', still_only=False):
    validate(scenario)
    take = Path(take).resolve()
    take.mkdir(parents=True, exist_ok=False)
    browser = Browser(binary, scenario['session'])
    expected = urlsplit(scenario['origin'])
    files = []
    events = []
    started = time.monotonic()
    stamp = lambda: round(time.monotonic() - started, 6)
    recording = False
    status, error = 'incomplete', None
    position = scenario.get('initial_cursor', [scenario['width'] / 2, scenario['height'] / 2])

    def check_origin():
        actual = urlsplit(browser.run(['get', 'url']))
        normalized=lambda url:(url.scheme,url.hostname,url.port or (443 if url.scheme=='https' else 80))
        if normalized(actual) != normalized(expected):
            raise ValueError('The active tab left the authorized origin')
        if browser.evaluate('!!document.querySelector(\'input[type="password"]\')'):
            raise ValueError('Authentication UI must stay outside capture')
        if browser.evaluate("Boolean(navigator.userAgentData?.mobile)||/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)"):
            raise ValueError('Mobile capture stays with the user; prepare a desktop session')

    def observe(selector):
        info = describe(browser, selector)
        if not info or not info['visible']:
            raise ValueError('Reviewed target is absent or hidden')
        if info['type'] == 'password' or (info['autocomplete'] or '').startswith(('current-password', 'new-password', 'cc-')):
            raise ValueError('Credential and payment controls must stay outside capture')
        return info

    try:
        check_origin()
        viewport = browser.evaluate('({width:innerWidth,height:innerHeight,epoch_ms:Date.now()})')
        if (viewport['width'], viewport['height']) != (scenario['width'], scenario['height']):
            raise ValueError('Active viewport differs from the scenario; prepare it before recording')
        clock_before = browser.evaluate('Date.now()')
        if not still_only:
            recording = True
            browser.run(['record', 'start', str(take / 'raw.mp4'), '--fps', str(scenario.get('fps', 60))])
        started = time.monotonic()
        clock_after = browser.evaluate('Date.now()')
        events.append({'t': 0, 'type': 'move', 'x': position[0], 'y': position[1]})
        for step in scenario['steps']:
            check_origin()
            action, label = step['action'], step['label']
            if action == 'wait':
                time.sleep(step['seconds'])
            elif action == 'assert_text':
                before = stamp()
                observed = browser.run(['get', 'text', step['selector']])
                verified = step['text'] in observed
                events.append({'t': before, 'completed_t': stamp(), 'type': 'assertion', 'label': label, 'verified': verified})
                if not verified:
                    raise ValueError('Visible result assertion failed')
            elif action == 'still':
                path = take / ('screenshot_%03d.png' % len(files))
                browser.run(['screenshot', str(path)])
                files.append(path)
                events.append({'t': stamp(), 'type': 'screenshot', 'label': label, 'path': path.name})
            elif action == 'scroll':
                before_y = browser.evaluate('scrollY')
                events.append({'t': stamp(), 'type': 'scroll_start', 'label': label, 'from_y': before_y, 'to_y': step['y']})
                browser.evaluate('new Promise(resolve=>{const start=scrollY,end=END,began=performance.now();function tick(now){const p=Math.min(1,(now-began)/MS),q=p*p*(3-2*p);scrollTo(0,start+(end-start)*q);if(p<1)requestAnimationFrame(tick);else resolve(scrollY)}requestAnimationFrame(tick)})'.replace('END', str(step['y'])).replace('MS', str(step.get('milliseconds', 850))))
                events.append({'t': stamp(), 'type': 'scroll_end', 'label': label, 'actual_y': browser.evaluate('scrollY')})
            else:
                info = observe(step['selector'])
                observed_t = stamp()
                x0, y0, x1, y1 = info['rect']
                x, y = (x0 + x1) / 2, (y0 + y1) / 2
                if not (0 <= x0 < x1 <= scenario['width'] and 0 <= y0 < y1 <= scenario['height']) or info['covered']:
                    raise ValueError('Target must be fully visible and unobstructed before input')
                if action == 'focus':
                    event={'t': stamp(), 'type': 'focus', 'x': x, 'y': y, 'rect': info['rect'], 'label': label}
                    events.append(event)
                    time.sleep(step.get('seconds', .6))
                    event['completed_t']=stamp()
                    continue
                if action == 'click':
                    if info['href']:
                        destination=urlsplit(urljoin(browser.run(['get','url']),info['href']))
                        if (destination.scheme,destination.hostname,destination.port or (443 if destination.scheme=='https' else 80)) != (expected.scheme,expected.hostname,expected.port or (443 if expected.scheme=='https' else 80)):
                            raise ValueError('Navigation target leaves the authorized origin; no click executed')
                    if info['target'] == '_blank':
                        raise ValueError('Prepare same-tab navigation explicitly before capture')
                    events.append({'t': stamp(), 'type': 'move', 'x': position[0], 'y': position[1]})
                    browser.run(['mouse', 'move', str(round(x)), str(round(y)), '--duration', '330', '--steps', '20'])
                    current = observe(step['selector'])
                    if max(abs(a-b) for a,b in zip(current['rect'], info['rect'])) > 1:
                        raise ValueError('Target moved during approach; no click executed')
                    position = [x, y]
                    events.append({'t': stamp(), 'type': 'move', 'x': x, 'y': y})
                event = {'t': stamp(), 'type': action, 'x': x, 'y': y, 'rect': info['rect'], 'selector':step['selector'], 'target_tag':info['tag'], 'label': label, 'observed_t': observed_t, 'outcome': 'uncertain'}
                events.append(event)
                browser.run([action, step['selector']] + ([step['text']] if action == 'fill' else []))
                event.update(completed_t=stamp(), outcome='command_succeeded')
        check_origin()
        status = 'completed'
    except Exception as exc:
        error = type(exc).__name__ + ': ' + str(exc)
    finally:
        duration = stamp()
        if recording:
            try:
                browser.run(['record', 'stop'])
            except Exception:
                status, error = 'incomplete', 'Recorder stop failed; raw file outcome requires reconciliation'
        if (take / 'raw.mp4').exists():
            files.append(take / 'raw.mp4')
        data = {'schema': 1, 'source': 'agent-browser native recording without cursor overlay', 'status': status, 'error': error, 'duration': duration, 'source_width': scenario['width'], 'source_height': scenario['height'], 'fps_requested': scenario.get('fps', 60), 'events': events, 'raw': 'raw.mp4' if recording else None, 'capture_clock': {'before_record_epoch_ms': locals().get('clock_before'), 'after_record_epoch_ms': locals().get('clock_after')}, 'timing_note': 'Command times bound input delivery. Source startup alignment needs visible review; acquisition timestamps are unavailable. Never infer acquisition fps from export fps.'}
        write_json(take / 'events.json', data)
        files.append(take / 'events.json')
        seal(take, files, {'status': status, 'session': scenario['session'], 'origin': scenario['origin']})
    if error:
        raise RuntimeError(error)
    return take
