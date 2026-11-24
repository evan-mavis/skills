const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

export async function reviewFeedback(request, db, review) {
  const user = request.headers.get('oai-authenticated-user-id');
  if (!user) return json({ error: 'Sign in to review.' }, 401);
  if (request.method === 'GET') {
    const [checked, comments] = await db.batch([
      db.prepare('SELECT view FROM ui_review_approvals WHERE reviewer = ?').bind(user),
      db.prepare('SELECT id, view, text, created_at AS createdAt FROM ui_review_comments ORDER BY created_at, id'),
    ]);
    return json({ approved: checked.results.map(({ view }) => view), comments: comments.results });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin ||
      request.headers.get('content-type') !== 'application/json') {
    return json({ error: 'Use the review page to submit feedback.' }, 403);
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.view !== 'string') return json({ error: 'Choose a review view.' }, 400);
  const [roundId, comparisonId, extra] = body.view.split('/');
  const item = review.rounds.find(({ id }) => id === roundId)?.comparisons
    .find(({ id }) => id === comparisonId);
  if (extra !== undefined || item?.archived || !item?.after?.src) {
    return json({ error: 'Comparison unavailable.' }, 404);
  }
  if (body.type === 'approval' && typeof body.checked === 'boolean') {
    if (body.checked) {
      await db.prepare('INSERT INTO ui_review_approvals (reviewer, view) VALUES (?, ?) ON CONFLICT DO NOTHING')
        .bind(user, body.view).run();
    } else {
      await db.prepare('DELETE FROM ui_review_approvals WHERE reviewer = ? AND view = ?')
        .bind(user, body.view).run();
    }
    return json({ saved: true });
  }
  const id = body.comment?.id;
  const text = typeof body.comment?.text === 'string' ? body.comment.text.trim() : '';
  if (body.type !== 'comment' || typeof id !== 'string' || !/^[a-f\d-]{36}$/i.test(id) || !text || text.length > 4000) {
    return json({ error: 'Enter a comment up to 4000 characters.' }, 400);
  }
  await db.prepare('INSERT INTO ui_review_comments (id, reviewer, view, text, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING')
    .bind(id, user, body.view, text, new Date().toISOString()).run();
  const comment = await db.prepare('SELECT id, view, text, created_at AS createdAt FROM ui_review_comments WHERE id = ? AND reviewer = ?')
    .bind(id, user).first();
  if (!comment || comment.view !== body.view || comment.text !== text) {
    return json({ error: 'Comment identifier already in use.' }, 409);
  }
  return json({ comment });
}
