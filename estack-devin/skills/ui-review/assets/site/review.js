const $ = (id) => document.getElementById(id);
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
let review, round, comparisons, index, opener;
function deviceIcon(variant) {
  const mobile = /mobile|phone|compact/i.test(variant);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'device-icon');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', mobile ? 'M7 2h10v20H7z M10 18h4' : 'M2 3h20v14H2z M12 17v4 M7 21h10');
  svg.append(path);
  return svg;
}
function picture(image, side) {
  const wrapper = element('div', undefined, `image ${side}`);
  const img = element('img');
  img.src = image.src;
  img.alt = `${side === 'before' ? 'Before' : 'After'}: ${comparisons[index].title}`;
  img.width = image.width;
  img.height = image.height;
  wrapper.append(img);
  for (const region of image.regions) {
    const box = element('span', undefined, 'region');
    box.title = region.label;
    box.style.cssText = `left:${region.x / image.width * 100}%;top:${region.y / image.height * 100}%;width:${region.width / image.width * 100}%;height:${region.height / image.height * 100}%`;
    wrapper.append(box);
  }
  return wrapper;
}
function card(image, side) {
  const name = side === 'before' ? 'Before' : 'After';
  const figure = element('figure');
  const caption = element('figcaption', name);
  figure.append(caption);
  if (!image) { figure.append(element('p', 'Capture unavailable. See the verification gap.', 'missing')); return figure; }
  if (image.capture.kind === 'component-preview') caption.append(element('span', 'Component preview', 'evidence-label'));
  const button = element('button', undefined, 'image-button');
  button.setAttribute('aria-label', `Enlarge ${name} screenshot`);
  button.append(picture(image, side), element('span', 'Click to enlarge ↗', 'enlarge-hint'));
  button.onclick = () => {
    opener = button;
    $('enlarged-label').textContent = name;
    $('enlarged-image').replaceChildren(picture(image, side));
    $('enlargement').showModal();
  };
  figure.append(button);
  return figure;
}
function setRoute(i) { location.hash = `${round.id}/${comparisons[i].id}`; }
function render() {
  const item = comparisons[index];
  $('title').textContent = item.title;
  $('explanation').textContent = item.explanation;
  $('gap').hidden = !item.gap;
  $('gap').textContent = item.gap || '';
  $('position').textContent = `${index + 1} / ${comparisons.length}`;
  $('previous').disabled = index === 0;
  $('next').disabled = index === comparisons.length - 1;
  $('pair').replaceChildren(card(item.before, 'before'), card(item.after, 'after'));
  $('wording').hidden = !item.copyDiff?.length;
  $('diff').replaceChildren(...(item.copyDiff || []).map(({ type, text }) => element(type === 'remove' ? 'del' : type === 'add' ? 'ins' : 'span', text)));
  $('video').replaceChildren();
  if (item.video) { const video = element('video'); video.controls = true; video.src = item.video; $('video').append(video); }
  for (const node of $('screens').querySelectorAll('[data-comparison]')) {
    if (node.dataset.comparison === item.id) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current');
  }
}
function route() {
  if ($('enlargement').open) $('enlargement').close();
  const [roundId, comparisonId] = location.hash.slice(1).split('/');
  round = review.rounds.find((entry) => entry.id === roundId) || review.rounds.at(-1);
  comparisons = review.issues.flatMap((issue) => round.comparisons.filter((item) => item.issueId === issue.id));
  index = Math.max(0, comparisons.findIndex((entry) => entry.id === comparisonId));
  $('round').value = round.id;
  $('screens').replaceChildren();
  for (const issue of review.issues) {
    const items = comparisons.filter((item) => item.issueId === issue.id);
    if (!items.length) continue;
    const heading = element('h3'); const issueLink = element('a', `${issue.id} · ${issue.title}`); issueLink.href = issue.url; heading.append(issueLink); $('screens').append(heading);
    for (const item of items) {
      const link = element('a');
      link.setAttribute('aria-label', `${item.title}, ${item.variant}`);
      link.title = item.variant;
      link.append(deviceIcon(item.variant), element('span', item.title));
      link.href = `#${round.id}/${item.id}`;
      link.dataset.comparison = item.id;
      $('screens').append(link);
    }
  }
  render();
}
$('highlights').onchange = (event) => document.body.classList.toggle('hide-highlights', !event.target.checked);
$('previous').onclick = () => setRoute(index - 1);
$('next').onclick = () => setRoute(index + 1);
$('close').onclick = () => $('enlargement').close();
$('enlargement').addEventListener('close', () => opener?.focus());
$('round').onchange = (event) => { location.hash = event.target.value; };
window.addEventListener('hashchange', route);
try {
  const response = await fetch('review.json');
  if (!response.ok) throw new Error(`Review data unavailable (${response.status})`);
  review = await response.json();
  document.title = review.title;
  for (const entry of review.rounds) { const option = element('option', entry.label); option.value = entry.id; $('round').append(option); }
  route();
} catch (error) { $('error').textContent = error.message; }
