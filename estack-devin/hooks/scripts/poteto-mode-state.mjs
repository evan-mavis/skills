#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

export const STATE_SCHEMA = 1;
export const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const CLEANUP_CONCURRENCY = 16;

const SKILL_COMMAND = String.raw`/(?:estack-devin:)?(?:estack|poteto-mode)`;
const ACTIVATION = new RegExp(String.raw`^\s*${SKILL_COMMAND}(?:\s|$)`, "u");
const DISABLE = new RegExp(String.raw`^\s*disable ${SKILL_COMMAND}[.!]?\s*$`, "iu");
const REMINDER = "Estack and Poteto Mode are active for this session and project. For substantive engineering work, resolve estack-devin:estack from the current skill catalog and read its SKILL.md, then read poteto-mode/SKILL.md and the selected playbook file in full. Track every playbook step, including explicit skip reasons. Keep casual turns brief and honor current user opt-outs. Respect host and repository instructions and the user's scope; activation grants no additional authority.";
const MAX_SESSION_ID_LENGTH = 512;

export function hashValue(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sessionKey(sessionId) {
  if (typeof sessionId !== "string" || sessionId.length === 0 || sessionId.length > MAX_SESSION_ID_LENGTH) {
    return null;
  }
  return hashValue(sessionId);
}

export function projectFingerprint(cwd) {
  if (typeof cwd !== "string" || !path.isAbsolute(cwd) || cwd.length > 4096 || cwd.includes("\0")) {
    return null;
  }
  return hashValue(path.resolve(cwd));
}

export function classifyPrompt(prompt) {
  if (typeof prompt !== "string") return "inactive";
  if (DISABLE.test(prompt)) return "disable";
  return ACTIVATION.test(prompt) ? "activate" : "inactive";
}

export function statePaths(pluginData, sessionId, cwd) {
  const session = sessionKey(sessionId);
  const project = projectFingerprint(cwd);
  if (!session || !project || typeof pluginData !== "string" || !path.isAbsolute(pluginData) || pluginData.includes("\0")) return null;
  const key = hashValue(`${session}:${project}`);
  const root = path.join(pluginData, "poteto-mode");
  return {
    root,
    state: path.join(root, "sessions", `${key}.json`),
    receipt: path.join(root, "receipts", `${key}.json`),
  };
}

async function atomicWrite(target, value) {
  await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value)}\n`, { mode: 0o600, flag: "wx" });
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function writeStateAndReceipt(targets, state, receipt) {
  await Promise.all([
    atomicWrite(targets.state, state),
    atomicWrite(targets.receipt, receipt),
  ]);
}

async function removeFile(target, fileSystem = fs) {
  await fileSystem.rm(target, { force: true });
}

async function readJson(target, fileSystem = fs) {
  let source;
  try {
    source = await fileSystem.readFile(target, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  try {
    return JSON.parse(source);
  } catch {
    await removeFile(target, fileSystem);
    return null;
  }
}

async function runBounded(items, concurrency, operation) {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(items.length, Math.max(1, concurrency)) },
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await operation(item);
      }
    },
  );
  await Promise.all(workers);
}

export async function collectExpired(
  pluginData,
  now = Date.now(),
  ttlMs = DEFAULT_TTL_MS,
  options = {},
) {
  if (typeof pluginData !== "string" || pluginData.length === 0) return;
  const fileSystem = options.fileSystem ?? fs;
  const concurrency = options.concurrency ?? CLEANUP_CONCURRENCY;
  const root = path.join(pluginData, "poteto-mode");
  for (const directory of [path.join(root, "sessions"), path.join(root, "receipts")]) {
    let entries;
    try {
      entries = await fileSystem.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const candidates = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
    await runBounded(candidates, concurrency, async (entry) => {
      const target = path.join(directory, entry.name);
      const value = await readJson(target, fileSystem);
      const timestamp = Date.parse(value?.updatedAt ?? value?.lastHookAt ?? "");
      if (value?.schema !== STATE_SCHEMA || !Number.isFinite(timestamp) || now - timestamp > ttlMs) {
        await removeFile(target, fileSystem);
      }
    });
  }
}

export async function removeStateAndReceipt(targets, remove = removeFile) {
  await remove(targets.state);
  await remove(targets.receipt);
}

export async function readActiveState({ pluginData, sessionId, cwd, now = Date.now(), ttlMs = DEFAULT_TTL_MS }) {
  const targets = statePaths(pluginData, sessionId, cwd);
  const fingerprint = projectFingerprint(cwd);
  if (!targets || !fingerprint) return null;
  const state = await readJson(targets.state);
  const updated = Date.parse(state?.updatedAt ?? "");
  if (
    state?.schema !== STATE_SCHEMA ||
    state?.active !== true ||
    state?.projectFingerprint !== fingerprint ||
    !Number.isFinite(updated) ||
    now - updated > ttlMs
  ) {
    if (state && (state.schema !== STATE_SCHEMA || !Number.isFinite(updated) || now - updated > ttlMs)) {
      await removeFile(targets.state);
    }
    return null;
  }
  return state;
}

function stateValue(fingerprint, now, createdAt) {
  const timestamp = new Date(now).toISOString();
  return {
    schema: STATE_SCHEMA,
    active: true,
    createdAt: createdAt ?? timestamp,
    updatedAt: timestamp,
    projectFingerprint: fingerprint,
  };
}

function receiptValue(fingerprint, event, now) {
  return {
    schema: STATE_SCHEMA,
    event,
    lastHookAt: new Date(now).toISOString(),
    projectFingerprint: fingerprint,
  };
}

export async function handleHook(input, options = {}) {
  const stateHome = process.env.XDG_STATE_HOME;
  const pluginData = options.pluginData ?? path.join(
    typeof stateHome === "string" && path.isAbsolute(stateHome) ? stateHome : path.join(homedir(), ".local", "state"),
    "estack-devin",
  );
  input = { ...input, cwd: options.cwd ?? process.env.DEVIN_PROJECT_DIR };
  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const targets = statePaths(pluginData, input?.session_id, input?.cwd);
  const fingerprint = projectFingerprint(input?.cwd);
  if (!targets || !fingerprint) return null;

  const event = input?.hook_event_name;
  if (event === "SessionEnd") {
    await collectExpired(pluginData, now, ttlMs);
    const current = await readActiveState({ pluginData, sessionId: input.session_id, cwd: input.cwd, now, ttlMs });
    if (current) {
      await writeStateAndReceipt(
        targets,
        stateValue(fingerprint, now, current.createdAt),
        receiptValue(fingerprint, event, now),
      );
    }
    return null;
  }
  if (event === "SessionStart" || event === "PostCompaction") {
    const current = await readActiveState({ pluginData, sessionId: input.session_id, cwd: input.cwd, now, ttlMs });
    if (!current) return null;
    await writeStateAndReceipt(
      targets,
      stateValue(fingerprint, now, current.createdAt),
      receiptValue(fingerprint, event, now),
    );
    return {
      hookSpecificOutput: {
        hookEventName: event,
        additionalContext: REMINDER,
      },
    };
  }
  if (event !== "UserPromptSubmit") return null;

  const action = classifyPrompt(input.prompt);
  if (action === "disable") {
    await removeStateAndReceipt(targets);
    return null;
  }
  if (action === "activate") {
    await collectExpired(pluginData, now, ttlMs);
    const current = await readActiveState({ pluginData, sessionId: input.session_id, cwd: input.cwd, now, ttlMs });
    await writeStateAndReceipt(
      targets,
      stateValue(fingerprint, now, current?.createdAt),
      receiptValue(fingerprint, event, now),
    );
    return {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: REMINDER,
      },
    };
  }

  const current = await readActiveState({ pluginData, sessionId: input.session_id, cwd: input.cwd, now, ttlMs });
  if (!current) return null;
  await writeStateAndReceipt(
    targets,
    stateValue(fingerprint, now, current.createdAt),
    receiptValue(fingerprint, event, now),
  );
  return {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: REMINDER,
    },
  };
}

export async function readHookInput(stream = process.stdin) {
  let source = "";
  for await (const chunk of stream) {
    source += chunk;
    if (source.length > 1_048_576) return null;
  }
  if (!source.trim()) return null;
  try {
    return JSON.parse(source);
  } catch {
    return null;
  }
}

async function main() {
  const input = await readHookInput();
  if (!input) return;
  const output = await handleHook(input);
  if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(() => {
    process.exitCode = 1;
  });
}
