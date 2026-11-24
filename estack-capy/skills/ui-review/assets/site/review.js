const $ = (id) => document.getElementById(id);
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
let review, round, comparisons, index, opener;
let feedback = { approved: [], comments: [] };
let feedbackReady = false;
let saving = false;
const drafts = new Map();
const pendingComments = new Map();
const endpoint = '/api/ui-review';
const storageKey = `ui-review:${location.pathname}`;
const viewKey = (item = comparisons[index]) => `${round.id}/${item.id}`;
const isReviewable = (item) => !item.archived && Boolean(item.after?.src);

async function feedbackRequest(method, data) {
  const response = await fetch(endpoint, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Shared feedback is unavailable (${response.status}).`);
  return response.json();
}
async function loadFeedback() {
  try {
    const stored = review.feedbackStorage === 'shared'
      ? await feedbackRequest('GET')
      : JSON.parse(localStorage.getItem(storageKey));
    if (review.feedbackStorage === 'shared' && !Array.isArray(stored?.approved)) {
      throw new Error('Shared approvals are unavailable. Update the review server.');
    }
    feedback = { approved: stored?.approved || [], comments: stored?.comments || [] };
    feedbackReady = true;
    $('feedback-status').textContent = review.feedbackStorage === 'shared'
      ? '' : 'Saved in this browser. Download feedback to share it.';
  } catch (error) {
    $('feedback-status').textContent = error.message;
  }
  updateFeedback();
}
async function saveFeedback(change) {
  saving = true;
  updateFeedback();
  try {
    const result = review.feedbackStorage === 'shared'
      ? await feedbackRequest('POST', change) : null;
    const next = change.type === 'comment'
      ? { ...feedback, comments: [...feedback.comments, result?.comment || change.comment] }
      : { ...feedback, approved: [
        ...feedback.approved.filter((key) => key !== change.view),
        ...(change.checked ? [change.view] : []),
      ] };
    if (review.feedbackStorage !== 'shared') localStorage.setItem(storageKey, JSON.stringify(next));
    feedback = next;
    if (change.type === 'approval') $('approval-status').textContent = '';
    if (change.type === 'comment') {
      pendingComments.delete(change.view);
      if (drafts.get(change.view)?.trim() === change.comment.text) {
        drafts.delete(change.view);
        if (viewKey() === change.view) $('comment-text').value = '';
      }
    }
    $('feedback-status').textContent = review.feedbackStorage === 'shared'
      ? 'Saved to this review.' : 'Saved in this browser. Download feedback to share it.';
    return true;
  } catch (error) {
    const status = change.type === 'approval' ? 'approval-status' : 'feedback-status';
    $(status).textContent = `Could not save. ${error.message}`;
    return false;
  } finally {
    saving = false;
    updateFeedback();
  }
}
function updateFeedback() {
  const available = feedbackReady && !saving;
  for (const input of $('screens').querySelectorAll('input[data-view]')) {
    input.checked = feedback.approved.includes(input.dataset.view);
    input.disabled = !available;
  }
  $('submit-comment').disabled = !available;
  $('export-feedback').disabled = !feedbackReady || !(feedback.comments.length || feedback.approved.length);
  if (!comparisons?.length) return;
  const remaining = comparisons.filter((item) => !feedback.approved.includes(viewKey(item))).length;
  $('approve-current').checked = feedback.approved.includes(viewKey());
  $('approve-current').disabled = !available;
  $('approve-next').disabled = !available || remaining === 0;
  if (!$('approval-status').textContent.startsWith('Could not save.')) {
    $('approval-status').textContent = feedbackReady
      ? (remaining ? `${remaining} left to approve` : 'All comparisons approved in this round')
      : '';
  }
  const comments = feedback.comments.filter((comment) => comment.view === viewKey());
  $('comments').replaceChildren(...comments.map((comment) => {
    const row = element('li');
    const time = element('time', new Date(comment.createdAt).toLocaleString());
    time.dateTime = comment.createdAt;
    row.append(element('p', comment.text), time);
    return row;
  }));
}
function exportFeedback() {
  const reference = (view) => {
    const [roundId, comparisonId] = view.split('/');
    const href = new URL(location.href);
    href.hash = view;
    return { roundId, comparisonId, source: href.href };
  };
  const data = {
    comments: feedback.comments.map(({ view, ...comment }) => ({ ...comment, ...reference(view) })),
    approvals: feedback.approved.map(reference),
  };
  const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = element('a');
  link.href = href;
  link.download = 'ui-review-feedback.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
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
  for (const region of image.regions || []) {
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
    if (node.dataset.comparison === item.id) {
      node.setAttribute('aria-current', 'page');
      node.closest('details').open = true;
    } else node.removeAttribute('aria-current');
  }
  $('comment-text').value = drafts.get(viewKey()) || '';
  updateFeedback();
}
function renderNavigation() {
  $('screens').replaceChildren();
  for (const issue of review.issues) {
    const items = comparisons.filter((item) => item.issueId === issue.id);
    if (!items.length) continue;
    const group = element('details');
    const linear = issue.kind === 'linear' || (!issue.kind && issue.url);
    group.append(element('summary', linear ? `${issue.id} · ${issue.title}` : issue.title));
    if (issue.url) {
      const link = element('a', 'Open issue', 'group-link');
      link.href = issue.url;
      group.append(link);
    }
    for (const item of items) {
      const row = element('div', undefined, 'review-row');
      const link = element('a');
      link.setAttribute('aria-label', `${item.title}, ${item.variant}`);
      link.title = item.variant;
      link.append(deviceIcon(item.variant), element('span', item.title));
      link.href = `#${viewKey(item)}`;
      link.dataset.comparison = item.id;
      const checkbox = element('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.view = viewKey(item);
      checkbox.setAttribute('aria-label', `Looks good to me: ${item.title}, ${item.variant}`);
      checkbox.title = 'Looks good to me';
      checkbox.onchange = () => saveFeedback({
        type: 'approval', view: checkbox.dataset.view, checked: checkbox.checked,
      });
      row.append(link, checkbox);
      group.append(row);
    }
    $('screens').append(group);
  }
}
function route() {
  if (!review) return;
  if ($('enlargement').open) $('enlargement').close();
  const [roundId, comparisonId] = location.hash.slice(1).split('/');
  const previousRound = round;
  round = review.rounds.find((entry) => entry.id === roundId)
    || review.rounds.findLast((entry) => entry.comparisons.some(isReviewable));
  comparisons = round ? review.issues.flatMap((issue) =>
    round.comparisons.filter((item) => item.issueId === issue.id && isReviewable(item))) : [];
  $('feedback').hidden = !comparisons.length;
  $('approval-controls').hidden = !comparisons.length;
  $('approval-status').textContent = '';
  $('round').value = round?.id || '';
  if (round !== previousRound) renderNavigation();
  if (!comparisons.length) {
    $('title').textContent = 'No visual comparisons';
    $('explanation').textContent = '';
    $('pair').replaceChildren();
    $('wording').hidden = true;
    $('gap').hidden = true;
    $('video').replaceChildren();
    $('position').textContent = '';
    $('previous').disabled = $('next').disabled = true;
    return;
  }
  index = Math.max(0, comparisons.findIndex((entry) => entry.id === comparisonId));
  render();
}
$('approve-current').onchange = (event) => {
  saveFeedback({ type: 'approval', view: viewKey(), checked: event.target.checked });
};
$('approve-next').onclick = async () => {
  const view = viewKey();
  if (!feedback.approved.includes(view) &&
      !await saveFeedback({ type: 'approval', view, checked: true })) return;
  if (!comparisons.length || viewKey() !== view) return;
  const next = [...comparisons.slice(index + 1), ...comparisons.slice(0, index)]
    .find((item) => !feedback.approved.includes(viewKey(item)));
  if (next) location.hash = viewKey(next);
};
$('comment-text').oninput = (event) => drafts.set(viewKey(), event.target.value);
$('comment-form').onsubmit = (event) => {
  event.preventDefault();
  const text = $('comment-text').value.trim();
  if (!text || saving || !feedbackReady) return;
  const view = viewKey();
  const pending = pendingComments.get(view);
  const comment = pending?.text === text
    ? pending : { id: crypto.randomUUID(), view, text, createdAt: new Date().toISOString() };
  pendingComments.set(view, comment);
  saveFeedback({ type: 'comment', view, comment });
};
$('export-feedback').onclick = exportFeedback;
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
  for (const entry of review.rounds.filter((round) => round.comparisons.some(isReviewable))) { const option = element('option', entry.label); option.value = entry.id; $('round').append(option); }
  route();
  await loadFeedback();
} catch (error) { $('error').textContent = error.message; }
