import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("collect-release-evidence.sh")


class ReleaseEvidenceTests(unittest.TestCase):
    """Synthetic Git history for the user-reported release #1720 cases."""

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        cls.repo = cls.root / "repo"
        cls.repo.mkdir()
        cls.env = dict(os.environ, GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null")
        cls.git("init", "-b", "main")
        cls.git("config", "user.email", "fixture@example.test")
        cls.git("config", "user.name", "Release fixture")
        cls.write("README", "synthetic release #1720\n")
        cls.commit("initial")
        cls.write("earlier-feature.py", "earlier_shipped_work = True\n")
        cls.earlier = cls.commit("AIR-5554 via #1309")
        cls.git("tag", "previous-production")

        cls.git("checkout", "-b", "demos")
        cls.write("demos.py", "demos = True\n")
        cls.demos = cls.commit("AIR-7818 demos child targeting feature branch")
        cls.write("videos.py", "upload = True\nplayback = True\n")
        cls.videos = cls.commit("AIR-3045 parent covers video sub-issues")
        cls.git("checkout", "main")
        cls.git("merge", "--no-ff", "demos", "-m", "demos parent stack")

        cls.git("checkout", "-b", "originals", "previous-production")
        cls.write("consolidated.py", "first_operation = True\n")
        cls.original_a = cls.commit("AIR-7904 original closed PR")
        cls.write("consolidated.py", "first_operation = True\nsecond_operation = True\n")
        cls.original_b = cls.commit("AIR-8199 original closed PR")
        cls.git("checkout", "main")
        cls.write("consolidated.py", "first_operation = True\nsecond_operation = True\n")
        cls.consolidated = cls.commit("AIR-7904 AIR-8199 consolidated in #1224")

        cls.git("checkout", "-b", "unshipped", "previous-production")
        cls.write("unshipped.py", "requests = list(range(7955, 7963))\n")
        cls.unshipped = cls.commit("AIR-7955 through AIR-7962 still in open #1139")
        cls.git("checkout", "main")
        cls.write("icon-prompts.txt", "Generate cuisine icons using clearer prompts.\n")
        cls.prompts = cls.commit("#1716 prompts references AIR-8948")
        cls.release = cls.commit("release #1720", empty=True)
        cls.git("tag", "selected-release")
        cls.write("unshipped.py", "later_work = True\n")
        cls.commit("newer release must not replace selected snapshot")

        def pr(number, title, commit, files, state="MERGED", base="development", body=""):
            return {
                "metadata": {
                    "number": number, "title": title, "body": body,
                    "state": "open" if state == "OPEN" else "closed",
                    "merged": state == "MERGED", "base": {"ref": base},
                    "head": {"ref": f"fixture-{number}"},
                    "merged_at": "2026-10-01T00:00:00Z" if state == "MERGED" else None,
                    "merge_commit_sha": commit if state == "MERGED" else None,
                    "html_url": f"https://github.com/Airgoods-Inc/airgoods/pull/{number}",
                    "commits": 1, "changed_files": len(files),
                },
                "commits": [{"sha": commit}],
                "files": [{"filename": file, "status": "added"} for file in files],
            }

        cls.fixture = {
            "1600": pr(1600, "AIR-7818 demos", cls.demos, ["demos.py"], base="feature/demos"),
            "1601": pr(1601, "AIR-3045 videos", cls.videos, ["videos.py"], base="feature/videos", body="Parent implements upload and playback children without child PR attachments."),
            "1220": pr(1220, "AIR-7904 original", cls.original_a, ["consolidated.py"], state="CLOSED", body="Absorbed into #1224"),
            "1221": pr(1221, "AIR-8199 original", cls.original_b, ["consolidated.py"], state="CLOSED", body="Absorbed into #1224"),
            "1224": pr(1224, "AIR-7904 AIR-8199 consolidated", cls.consolidated, ["consolidated.py"]),
            "1139": pr(1139, "AIR-7955 through AIR-7962", cls.unshipped, ["unshipped.py"], state="OPEN"),
            "1309": pr(1309, "AIR-5554 earlier", cls.earlier, ["earlier-feature.py"]),
            "1716": pr(1716, "icon prompts", cls.prompts, ["icon-prompts.txt"], body="AIR-8948 is a separate American cuisine operation."),
            "9998": pr(9998, "unavailable original SHA", "a" * 40, ["consolidated.py"], state="CLOSED"),
        }
        cls.fixture["1601"]["commits"].insert(0, {"sha": cls.demos})
        cls.fixture["1601"]["files"].append({"filename": "demos.py", "status": "added"})
        cls.fixture["1601"]["metadata"].update(commits=2, changed_files=2)
        fixture_path = cls.root / "prs.json"
        fixture_path.write_text(json.dumps(cls.fixture))
        bin_dir = cls.root / "bin"
        bin_dir.mkdir()
        gh = bin_dir / "gh"
        gh.write_text(f"#!{sys.executable}\n" + '''import json, os, sys
args = sys.argv[1:]
assert args[:3] == ["api", "--method", "GET"], args
endpoint = args[-1]
assert endpoint.startswith("repos/Airgoods-Inc/airgoods/pulls/"), endpoint
parts = endpoint.split("/")
number = parts[4]
section = parts[5].split("?")[0] if len(parts) > 5 else "metadata"
if os.environ.get("GH_FIXTURE_FAIL") == section:
    sys.exit(1)
with open(os.environ["GH_FIXTURE"]) as file:
    value = json.load(file)[number][section]
if section != "metadata":
    assert "--paginate" in args and "--slurp" in args
    if os.environ.get("GH_FIXTURE_TRUNCATE") == section:
        value = value[:-1]
    value = [value[:1], value[1:]]
print(json.dumps(value))
''')
        gh.chmod(0o755)
        cls.env.update(PATH=f"{bin_dir}{os.pathsep}{cls.env['PATH']}", GH_FIXTURE=str(fixture_path))

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    @classmethod
    def git(cls, *args):
        return subprocess.run(["git", *args], cwd=cls.repo, env=cls.env, check=True, capture_output=True, text=True).stdout.strip()

    @classmethod
    def write(cls, filename, contents):
        (cls.repo / filename).write_text(contents)

    @classmethod
    def commit(cls, message, empty=False):
        cls.git("add", ".")
        cls.git("commit", "-m", message, *(["--allow-empty"] if empty else []))
        return cls.git("rev-parse", "HEAD")

    def collect(self, *numbers, fail=None, truncate=None, previous="previous-production", released="selected-release"):
        env = dict(self.env)
        if fail:
            env["GH_FIXTURE_FAIL"] = fail
        if truncate:
            env["GH_FIXTURE_TRUNCATE"] = truncate
        result = subprocess.run(["bash", str(SCRIPT), previous, released, *map(str, numbers)], cwd=self.repo, env=env, capture_output=True, text=True)
        records = [json.loads(line) for line in result.stdout.splitlines()]
        return result, records

    def test_feature_branch_stack_retains_released_evidence(self):
        result, rows = self.collect(1600)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(rows[0]["baseRefName"], "feature/demos")
        self.assertEqual(rows[0]["commits"][0]["ancestor_of_release"], "yes")
        self.assertEqual(rows[0]["files"][0]["present_in_release"], "yes")
        self.assertTrue(rows[0]["scope_review_required"])

    def test_closed_originals_and_squashed_consolidation_remain_auditable(self):
        result, rows = self.collect(1220, 1221, 1224)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([row["number"] for row in rows], [1220, 1221, 1224])
        for row in rows[:2]:
            self.assertEqual(row["state"], "CLOSED")
            self.assertEqual(row["commits"][0]["ancestor_of_release"], "no")
            self.assertEqual(row["files"][0]["present_in_release"], "yes")
            self.assertIn("#1224", row["body"])
        self.assertEqual(rows[2]["commits"][0]["ancestor_of_release"], "yes")

    def test_video_parent_supplies_evidence_without_child_attachments(self):
        result, rows = self.collect(1601)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("without child PR attachments", rows[0]["body"])
        self.assertEqual(rows[0]["files"][0]["present_in_release"], "yes")
        self.assertEqual(len(rows[0]["commits"]), 2)
        self.assertEqual(len(rows[0]["files"]), 2)

    def test_open_unshipped_work_has_negative_snapshot_evidence(self):
        result, rows = self.collect(1139)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(rows[0]["state"], "OPEN")
        self.assertEqual(rows[0]["commits"][0]["ancestor_of_release"], "no")
        self.assertEqual(rows[0]["files"][0]["present_in_release"], "no")
        self.assertEqual(rows[0]["released_snapshot"], self.release)
        self.assertEqual(self.git("show", "HEAD:unshipped.py"), "later_work = True")

    def test_earlier_shipped_work_is_visible_in_previous_snapshot(self):
        result, rows = self.collect(1309)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(rows[0]["commits"][0]["ancestor_of_previous"], "yes")
        self.assertEqual(rows[0]["files"][0]["present_in_previous"], "yes")

    def test_prompt_reference_does_not_emit_a_completion_verdict(self):
        result, rows = self.collect(1716)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([file["filename"] for file in rows[0]["files"]], ["icon-prompts.txt"])
        self.assertTrue(rows[0]["scope_review_required"])
        self.assertNotIn("American", self.git("show", f"{self.release}:icon-prompts.txt"))

    def test_unavailable_sha_is_unknown(self):
        result, rows = self.collect(9998)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(rows[0]["commits"][0]["ancestor_of_release"], "unknown")

    def test_api_failures_are_reported_instead_of_excluding_prs(self):
        for section in ["metadata", "commits", "files"]:
            with self.subTest(section=section):
                result, rows = self.collect(1600, fail=section)
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertEqual(rows[0]["number"], 1600)
                self.assertIn("collection_error", rows[0])

    def test_invalid_snapshot_stops_before_evidence_collection(self):
        result, rows = self.collect(1600, released="does-not-exist")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(rows, [])

    def test_truncated_commit_or_file_pages_report_incomplete_evidence(self):
        for section in ["commits", "files"]:
            with self.subTest(section=section):
                result, rows = self.collect(1601, truncate=section)
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertEqual(rows[0]["number"], 1601)
                self.assertEqual(rows[0]["collection_error"], "incomplete_pr_evidence")


if __name__ == "__main__":
    unittest.main()
