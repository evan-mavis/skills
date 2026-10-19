import { afterEach, describe, expect, it } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  NotFoundError,
  UserError,
  openStore,
  parseVerdict,
  type OpenStoreOptions,
  type Store,
} from "./store.ts";

const SCRIPT = join(import.meta.dir, "orch.ts");
const directories: string[] = [];
const handles: Store[] = [];

interface RunResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function makeDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "orch-test-"));
  directories.push(directory);
  return directory;
}

function useStore(
  directory: string,
  options?: OpenStoreOptions
): Store {
  const store = openStore(directory, options);
  handles.push(store);
  return store;
}

async function initializedStore(): Promise<{
  readonly directory: string;
  readonly store: Store;
}> {
  const directory = await makeDirectory();
  const store = useStore(directory);
  await store.init();
  return { directory, store };
}

function git({
  args,
  repo,
}: {
  args: readonly string[];
  repo: string;
}): string {
  const result = Bun.spawnSync(["git", "-C", repo, ...args]);
  if (result.exitCode !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr.toString()}`
    );
  }
  return result.stdout.toString().trim();
}

async function makeGitStack(directory: string): Promise<{
  readonly repo: string;
  readonly mergedSha: string;
  readonly closedSha: string;
  readonly openSha: string;
}> {
  const repo = join(directory, "repo");
  await mkdir(repo);
  git({ repo, args: ["init", "--initial-branch=main"] });
  git({ repo, args: ["config", "user.name", "Orch Test"] });
  git({ repo, args: ["config", "user.email", "orch@example.com"] });
  await writeFile(join(repo, "main.txt"), "main\n");
  git({ repo, args: ["add", "."] });
  git({ repo, args: ["commit", "-m", "main"] });

  const branches = ["stack/merged", "stack/closed", "stack/open"];
  for (const [index, branch] of branches.entries()) {
    git({ repo, args: ["checkout", "-b", branch] });
    await writeFile(join(repo, `stack-${index}.txt`), `${branch}\n`);
    git({ repo, args: ["add", "."] });
    git({ repo, args: ["commit", "-m", branch] });
  }

  return {
    repo,
    mergedSha: git({ repo, args: ["rev-parse", "stack/merged"] }),
    closedSha: git({ repo, args: ["rev-parse", "stack/closed"] }),
    openSha: git({ repo, args: ["rev-parse", "stack/open"] }),
  };
}

function nativeStack() {
  return {
    number: 42,
    base: { ref: "integration" },
    pull_requests: [
      {
        number: 10,
        state: "closed",
        merged_at: "2026-10-19T10:00:00Z",
        head: { ref: "stack/merged", sha: "a".repeat(40) },
        base: { ref: "unrelated" },
      },
      {
        number: 13,
        state: "closed",
        merged_at: null,
        head: { ref: "stack/closed", sha: "b".repeat(40) },
        base: { ref: "main" },
      },
      {
        number: 11,
        state: "open",
        merged_at: null,
        head: { ref: "stack/open", sha: "c".repeat(40) },
        base: { ref: "main" },
      },
    ],
  };
}

async function withFakeGh<T>({
  directory,
  operation,
}: {
  directory: string;
  operation: (outputPath: string) => Promise<T>;
}): Promise<T> {
  const bin = join(directory, "bin");
  const outputPath = join(directory, "gh-output.json");
  await mkdir(bin);
  await writeFile(outputPath, JSON.stringify(nativeStack()));
  const gh = join(bin, "gh");
  await writeFile(
    gh,
    `#!/usr/bin/env bash
set -euo pipefail
if [ "$(pwd -P)" != "${realpathSync(join(directory, "repo"))}" ]; then
  printf 'gh ran outside the fixture repo: %s\\n' "$(pwd -P)" >&2
  exit 2
fi
if [ "$*" != "api repos/{owner}/{repo}/stacks/42 -H Accept: application/vnd.github+json -H X-GitHub-Api-Version: 2026-03-10" ]; then
  printf 'unexpected gh arguments: %s\\n' "$*" >&2
  exit 2
fi
if [ -s "${outputPath}.error" ]; then
  cat "${outputPath}.error" >&2
  exit 1
fi
cat "${outputPath}"
`
  );
  await chmod(gh, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath ?? ""}`;
  try {
    return await operation(outputPath);
  } finally {
    if (originalPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }
  }
}

function runCli(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env
): RunResult {
  const result = Bun.spawnSync([process.execPath, SCRIPT, ...args], { env });
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

afterEach(async () => {
  for (const store of handles.splice(0).reverse()) {
    await store.close();
  }
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe("Store", () => {
  it("initializes an idempotent plain-file store and releases its lock", async () => {
    const directory = await makeDirectory();
    const store = useStore(directory);

    expect(await store.init()).toEqual({ store: directory });
    const firstUnits = await readFile(join(directory, "units.tsv"), "utf8");
    const firstLedger = await readFile(
      join(directory, "ledger.tsv"),
      "utf8"
    );

    expect(await store.init()).toEqual({ store: directory });
    expect(await readFile(join(directory, "units.tsv"), "utf8")).toBe(
      firstUnits
    );
    expect(await readFile(join(directory, "ledger.tsv"), "utf8")).toBe(
      firstLedger
    );
    expect((await readdir(directory)).sort()).toEqual([
      ".orch.lock",
      "frontier.json",
      "gates.md",
      "inbox",
      "ledger.tsv",
      "preferences.md",
      "units.tsv",
    ]);

    await store.close();
    expect(await readdir(directory)).not.toContain(".orch.lock");
  });

  it("composes unit add, set, get, list, and counts", async () => {
    const { store } = await initializedStore();

    expect(
      await store.units.add({
        id: "u1",
        track: "build",
        brief: "briefs/u1.md",
      })
    ).toMatchObject({ id: "u1", state: "pending" });
    expect(
      await store.units.add({ id: "=SUM(A1)", track: "+build" })
    ).toMatchObject({ id: "'=SUM(A1)", track: "'+build" });

    const updated = await store.units.set({
      id: "u1",
      state: "done",
      branch: "poteto/u1",
      pr: 184530,
      sha: "abc123",
    });
    expect(updated).toEqual({
      id: "u1",
      track: "build",
      state: "done",
      branch: "poteto/u1",
      pr: "184530",
      sha: "abc123",
      brief: "briefs/u1.md",
    });
    expect(await store.units.get("u1")).toEqual(updated);
    expect(
      await store.units.list({ state: "done", track: "build" })
    ).toEqual([updated]);
    expect(await store.units.counts()).toEqual({ done: 1, pending: 1 });
    await expect(
      store.units.add({ id: "u1", track: "build" })
    ).rejects.toThrow("unit u1 already exists");
    await expect(
      store.units.set({ id: "missing", state: "done" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("records, replaces, checks, and summarizes typed ledger verdicts", async () => {
    const { store } = await initializedStore();

    try {
      await store.ledger.check({ pr: 184530, sha: "abc123" });
      throw new Error("expected ledger check to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
      if (error instanceof NotFoundError) {
        expect(error.output).toEqual({
          compact: "NOT-VERIFIED",
          json: {
            pr: "184530",
            sha: "abc123",
            verdict: "NOT-VERIFIED",
          },
        });
      }
    }
    expect(() => parseVerdict("looks-good")).toThrow("verdict must be");

    const recorded = await store.ledger.record({
      pr: 184530,
      sha: "abc123",
      verdict: "unit-test-verified",
      evidence: "reports/verify.md",
      verifier: "sol",
    });
    expect(await store.ledger.check({ pr: 184530, sha: "abc123" })).toEqual(
      recorded
    );
    expect(await store.ledger.summary()).toEqual({
      "unit-test-verified": 1,
    });

    await store.ledger.record({
      pr: 184530,
      sha: "abc123",
      verdict: "live-ui-verified",
      evidence: "reports/live.md",
    });
    expect(await store.ledger.summary()).toEqual({
      "live-ui-verified": 1,
    });
  });

  it("pushes, peeks, and atomically drains inbox pointers", async () => {
    const { directory, store } = await initializedStore();

    const first = await store.inbox.push({
      agent: "worker-1",
      unit: "u1",
      status: "done",
      report: "reports/u1.md",
    });
    expect(first.pointer).toMatchObject({ unit: "u1", status: "done" });
    expect(first.filename).toEndWith(".tsv");
    await store.inbox.push({
      agent: "worker-2",
      unit: "u2",
      status: "failed",
    });

    expect(await store.inbox.count()).toBe(2);
    expect(await store.inbox.peek()).toHaveLength(2);
    expect(await store.inbox.count()).toBe(2);
    expect(await store.inbox.drain()).toHaveLength(2);
    expect(await store.inbox.count()).toBe(0);
    expect(await readdir(join(directory, "inbox"))).toEqual([]);
    expect(
      (await readdir(directory)).filter((name) =>
        name.startsWith(".inbox-drain-")
      )
    ).toEqual([]);
  });

  it("replaces a stale lock whose holder pid is dead", async () => {
    const { directory } = await initializedStore();
    const exited = Bun.spawn(["true"]);
    await exited.exited;
    await writeFile(join(directory, ".orch.lock"), `${exited.pid}\n`);

    const stale: string[] = [];
    const recovered = useStore(directory, {
      onStaleLock: (holder) => stale.push(holder),
    });
    expect(
      await recovered.units.add({ id: "u1", track: "build" })
    ).toMatchObject({ id: "u1" });
    expect(stale).toEqual([String(exited.pid)]);
    await recovered.close();
    expect(await readdir(directory)).not.toContain(".orch.lock");
  });

  it("blocks a writer and steals the pid lock only with force", async () => {
    const { directory, store } = await initializedStore();
    await store.close();
    await writeFile(join(directory, ".orch.lock"), `${process.pid}\n`);

    const blocked = useStore(directory);
    await expect(
      blocked.units.add({ id: "u1", track: "build" })
    ).rejects.toThrow(`store lock held by pid ${process.pid}`);

    const stolen: string[] = [];
    const forced = useStore(directory, {
      force: true,
      onLockStolen: (holder) => stolen.push(holder),
    });
    expect(
      await forced.units.add({ id: "u1", track: "build" })
    ).toMatchObject({ id: "u1" });
    expect(stolen).toEqual([String(process.pid)]);
    await forced.close();
    expect(await readdir(directory)).not.toContain(".orch.lock");
  });

  it("parks gates, stores standing orders, and renders status", async () => {
    const { directory, store } = await initializedStore();
    await store.units.add({ id: "u1", track: "build" });
    expect(
      await store.gates.park({
        id: "release",
        question: "Ship now?",
        options: "ship,wait",
        defaultAnswer: "wait",
      })
    ).toMatchObject({ kind: "open", id: "release" });
    expect(
      await store.standing.add({ line: "Never force push." })
    ).toEqual({ number: 1, line: "Never force push." });

    const first = await store.status.render();
    expect(first.changed).toBe("first render");
    expect(first.summary.openGateIds).toEqual(["release"]);
    expect(await readFile(join(directory, "status.md"), "utf8")).toContain(
      "| release | open | Ship now? |"
    );
    expect((await store.status.render()).changed).toBe("no derived changes");

    expect(
      await store.gates.resolve({ id: "release", answer: "ship" })
    ).toMatchObject({ kind: "resolved", answer: "ship" });
    expect((await store.status.render()).changed).toBe("open gates 1->0");
    expect(await store.gates.list()).toEqual([]);
    expect(await store.standing.show()).toEqual([
      { number: 1, line: "Never force push." },
    ]);
  });

  it("resolves native GitHub stack order and submitted heads from any checkout", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);
    expect(stack.openSha).not.toBe("c".repeat(40));

    await withFakeGh({
      directory,
      operation: async () => {
        for (const [index, checkout] of ["main", "--detach"].entries()) {
          git({ repo: stack.repo, args: ["checkout", checkout] });
          expect(await store.frontier.set({ repo: stack.repo, stack: 42 })).toEqual({
            generation: index + 1,
            prs: [
              { pr: 10, branches: "stack/merged", sha: "a".repeat(40), state: "MERGED" },
              { pr: 13, branches: "stack/closed", sha: "b".repeat(40), state: "CLOSED" },
              { pr: 11, branches: "stack/open", sha: "c".repeat(40), state: "OPEN" },
            ],
            lowestUnmerged: 11,
          });
        }
        git({ repo: stack.repo, args: ["branch", "-D", "stack/merged", "stack/closed", "stack/open"] });
        expect((await store.frontier.set({ repo: stack.repo, stack: 42, prs: [10, 13, 11] })).generation).toBe(3);
        const saved = await readFile(join(directory, "frontier.json"), "utf8");
        for (const [prs, message] of [
          [[10, 11, 12], "frontier pin mismatch: missing from GitHub stack: 12; extra in GitHub stack: 13"],
          [[13, 10, 11], "frontier pin mismatch: order differs: expected 13,10,11; GitHub stack 10,13,11"],
          [[10, 10], "--prs must not contain duplicates"],
        ] satisfies readonly (readonly [readonly number[], string])[]) {
          await expect(store.frontier.set({ repo: stack.repo, stack: 42, prs })).rejects.toThrow(message);
          expect(await readFile(join(directory, "frontier.json"), "utf8")).toBe(saved);
          expect((await store.frontier.show()).generation).toBe(3);
        }
      },
    });
  });

  it("preserves the frontier on malformed native stack data or API failures", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);
    await withFakeGh({
      directory,
      operation: async (outputPath) => {
        await store.frontier.set({ repo: stack.repo, stack: 42 });
        const saved = await readFile(join(directory, "frontier.json"), "utf8");
        const first = nativeStack().pull_requests[0];
        if (first === undefined) throw new Error("missing fixture row");
        const malformed: readonly unknown[] = [
          null,
          [],
          { ...nativeStack(), number: 43 },
          { ...nativeStack(), number: "42" },
          { ...nativeStack(), number: 0 },
          { ...nativeStack(), base: null },
          { ...nativeStack(), base: { ref: "" } },
          { ...nativeStack(), base: { ref: "bad\nref" } },
          { ...nativeStack(), pull_requests: [] },
          { ...nativeStack(), pull_requests: {} },
          ...[
            null,
            { ...first, number: 0 },
            { ...first, number: Number.MAX_SAFE_INTEGER + 1 },
            { ...first, head: null },
            { ...first, head: { ...first.head, ref: "" } },
            { ...first, head: { ...first.head, sha: "not-a-sha" } },
            { ...first, head: { ...first.head, sha: "f".repeat(41) } },
            { ...first, state: "merged" },
            { ...first, state: "open" },
            { ...first, merged_at: "invalid-date" },
            { ...first, merged_at: 1 },
            { ...first, merged_at: undefined },
          ].map((row) => ({ ...nativeStack(), pull_requests: [row] })),
          { ...nativeStack(), pull_requests: [first, first] },
          { ...nativeStack(), pull_requests: [first, { ...first, number: 12 }] },
        ];
        for (const response of ["not JSON", ...malformed.map((value) => JSON.stringify(value))]) {
          await writeFile(outputPath, response);
          await expect(store.frontier.set({ repo: stack.repo, stack: 42 })).rejects.toThrow("GitHub stack");
          expect(await readFile(join(directory, "frontier.json"), "utf8")).toBe(saved);
          expect((await store.frontier.show()).generation).toBe(1);
        }
        for (const error of ["HTTP 404: Not Found", "HTTP 403: Forbidden", "network connection failed"]) {
          await writeFile(`${outputPath}.error`, error);
          await expect(store.frontier.set({ repo: stack.repo, stack: 42 })).rejects.toThrow(error);
          expect(await readFile(join(directory, "frontier.json"), "utf8")).toBe(saved);
          expect((await store.frontier.show()).generation).toBe(1);
        }
        for (const invalid of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
          await expect(store.frontier.set({ repo: stack.repo, stack: invalid })).rejects.toThrow("stack must be a positive integer");
          expect(await readFile(join(directory, "frontier.json"), "utf8")).toBe(saved);
        }
      },
    });
  });

  it("rejects malformed TSV, verdict, frontier, and inbox data", async () => {
    const { directory, store } = await initializedStore();

    await writeFile(join(directory, "units.tsv"), "wrong\n");
    await expect(store.units.list()).rejects.toThrow(
      "units.tsv has an invalid header"
    );
    await writeFile(
      join(directory, "units.tsv"),
      "id\ttrack\tstate\tbranch\tpr\tsha\tbrief\nshort\trow\n"
    );
    await expect(store.units.list()).rejects.toThrow(
      "units.tsv has a malformed row"
    );

    await writeFile(
      join(directory, "ledger.tsv"),
      "pr\tsha\tverdict\tevidence\tverifier\tts\n1\tsha\tinvalid\treport\tme\tnow\n"
    );
    await expect(store.ledger.summary()).rejects.toThrow(
      "ledger.tsv has invalid verdict invalid"
    );

    await writeFile(join(directory, "frontier.json"), '{"generation":"1"}\n');
    await expect(store.frontier.show()).rejects.toThrow(
      "frontier.json has an invalid shape"
    );

    await writeFile(join(directory, "inbox", "bad.tsv"), "too\tshort\n");
    await expect(store.inbox.peek()).rejects.toThrow(
      "inbox pointer bad.tsv is malformed"
    );
  });

  it("rejects operations after close", async () => {
    const { store } = await initializedStore();
    await store.close();
    await expect(store.units.list()).rejects.toThrow("store is closed");
    await expect(store.status.render()).rejects.toBeInstanceOf(UserError);
  });
});

describe("orch CLI", () => {
  it("prints commander help and rejects invalid parsing with exit 1", async () => {
    const help = runCli(["--help"]);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain("Commands:");
    expect(help.stdout).toContain("unit");
    expect(help.stdout).toContain("ledger");

    const frontierHelp = runCli(["frontier", "set", "--help"]);
    expect(frontierHelp.code).toBe(0);
    expect(frontierHelp.stdout).toContain("--repo <dir>");
    expect(frontierHelp.stdout).toContain("--stack <number>");
    expect(frontierHelp.stdout).toContain("--prs <n,...>");

    const directory = await makeDirectory();
    const invalid = runCli(["--store", directory, "unit", "add", "u1"]);
    expect(invalid.code).toBe(1);
    expect(invalid.stderr).toContain("required option '--track <track>'");
  });

  it("requires a positive native stack number and snapshots it through the CLI", async () => {
    const directory = await makeDirectory();
    const stack = await makeGitStack(directory);
    expect(runCli(["--store", directory, "init"]).code).toBe(0);
    const args = ["--store", directory, "frontier", "set", "--repo", stack.repo];
    const missing = runCli(args);
    expect(missing.code).toBe(1);
    expect(missing.stderr).toContain("required option '--stack <number>'");
    for (const value of ["0", "-1", "1.5", "abc", "9007199254740992"]) {
      const invalid = runCli([...args, "--stack", value]);
      expect(invalid.code).toBe(1);
      expect(invalid.stderr).toContain("must be a positive integer");
    }
    await withFakeGh({
      directory,
      operation: async () => {
        const result = runCli([...args, "--stack", "42", "--prs", "10,13,11", "--json"]);
        expect(result.code).toBe(0);
        expect(JSON.parse(result.stdout)).toEqual({
          generation: 1,
          prs: [
            { pr: 10, branches: "stack/merged", sha: "a".repeat(40), state: "MERGED" },
            { pr: 13, branches: "stack/closed", sha: "b".repeat(40), state: "CLOSED" },
            { pr: 11, branches: "stack/open", sha: "c".repeat(40), state: "OPEN" },
          ],
          lowestUnmerged: 11,
        });
      },
    });
  });

  it("accepts ORCH_STORE and emits complete JSON", async () => {
    const directory = await makeDirectory();
    const env = { ...process.env, ORCH_STORE: directory };
    expect(runCli(["init"], env).code).toBe(0);

    const added = runCli(
      ["unit", "add", "u1", "--track", "build", "--json"],
      env
    );
    expect(added.code).toBe(0);
    expect(JSON.parse(added.stdout)).toEqual({
      id: "u1",
      track: "build",
      state: "pending",
      branch: "",
      pr: "",
      sha: "",
      brief: "",
    });
  });

  it("maps user and not-found outcomes to the preserved exit codes", async () => {
    const directory = await makeDirectory();
    expect(runCli(["--store", directory, "init"]).code).toBe(0);

    const missingRepo = runCli([
      "--store",
      directory,
      "frontier",
      "set",
      "--stack",
      "42",
    ]);
    expect(missingRepo.code).toBe(1);
    expect(missingRepo.stderr).toContain(
      "set --repo <dir> or ORCH_REPO"
    );

    const userError = runCli([
      "--store",
      directory,
      "unit",
      "add",
      "",
      "--track",
      "build",
    ]);
    expect(userError.code).toBe(1);
    expect(userError.stderr).toContain("unit id must not be empty");

    const missingUnit = runCli([
      "--store",
      directory,
      "unit",
      "get",
      "missing",
    ]);
    expect(missingUnit.code).toBe(2);
    expect(missingUnit.stderr).toContain("unit missing not found");

    const missingLedger = runCli([
      "--store",
      directory,
      "--json",
      "ledger",
      "check",
      "184530",
      "abc123",
    ]);
    expect(missingLedger.code).toBe(2);
    expect(JSON.parse(missingLedger.stdout)).toEqual({
      pr: "184530",
      sha: "abc123",
      verdict: "NOT-VERIFIED",
    });
    expect(missingLedger.stderr).toBe("");
  });
});
