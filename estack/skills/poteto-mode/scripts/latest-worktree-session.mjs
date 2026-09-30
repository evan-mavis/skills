import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';

export async function latestWorktreeSession(sessionRoot, worktree) {
  let latest = 0;
  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        const input = createReadStream(file);
        const lines = createInterface({ input, crlfDelay: Infinity });
        try {
          for await (const line of lines) {
            let metadata;
            try { metadata = JSON.parse(line); } catch { break; }
            if (metadata.type === 'session_meta' && metadata.payload?.cwd === worktree) {
              latest = Math.max(latest, Math.floor((await stat(file)).mtimeMs / 1000));
            }
            break;
          }
        } finally {
          lines.close();
          input.destroy();
        }
      }
    }
  }
  await visit(sessionRoot);
  return latest;
}

if (import.meta.main) {
  const [sessionRoot, worktree] = process.argv.slice(2);
  if (!sessionRoot || !worktree) throw new Error('Usage: bun latest-worktree-session.mjs <sessions> <worktree>');
  const timestamp = await latestWorktreeSession(sessionRoot, worktree);
  const date = timestamp ? new Date(timestamp * 1000).toISOString().slice(0, 10) : '-';
  console.log(`${timestamp}\t${date}`);
}
