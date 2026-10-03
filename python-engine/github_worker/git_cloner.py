#!/usr/bin/env python3
"""
Hendy-Server / Python Engine - Git Cloner Worker
Module: python-engine/github_worker/git_cloner.py
Description: Securely clones source code from GitHub repositories, handling
authenticated OAuth tokens, branch checkouts, depth limits, and workspace cache.
"""

import os
import sys
import shutil
import subprocess
import logging
from typing import Optional, Dict, Any

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [GitCloner] %(message)s")
logger = logging.getLogger("GitCloner")


class GitCloner:
    def __init__(self, workspace_root: str = "/tmp/hendy_builds"):
        self.workspace_root = workspace_root
        os.makedirs(self.workspace_root, exist_ok=True)

    def prepare_repo_url(self, repo_full_name: str, auth_token: Optional[str] = None) -> str:
        """Injects authentication token securely for automated cloning."""
        if auth_token:
            return f"https://x-access-token:{auth_token}@github.com/{repo_full_name}.git"
        return f"https://github.com/{repo_full_name}.git"

    def clone_repository(
        self,
        repo_full_name: str,
        branch: str = "main",
        commit_sha: Optional[str] = None,
        depth: int = 50,
        auth_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Clones a repository into an isolated build directory.
        Returns metadata: build_path, commit_hash, files_count, success.
        """
        clean_repo_name = repo_full_name.replace("/", "_")
        target_dir = os.path.join(self.workspace_root, clean_repo_name)

        if os.path.exists(target_dir):
            logger.info(f"Target directory exists. Performing incremental fetch & prune at {target_dir}")
            try:
                subprocess.run(["git", "remote", "set-url", "origin", self.prepare_repo_url(repo_full_name, auth_token)], cwd=target_dir, check=True)
                subprocess.run(["git", "fetch", "--prune", f"--depth={depth}", "origin", branch], cwd=target_dir, check=True)
                subprocess.run(["git", "checkout", "-f", branch], cwd=target_dir, check=True)
                subprocess.run(["git", "reset", "--hard", f"origin/{branch}"], cwd=target_dir, check=True)
            except subprocess.SubprocessError as e:
                logger.warning(f"Fetch failed ({e}). Re-cloning cleanly...")
                shutil.rmtree(target_dir, ignore_errors=True)

        if not os.path.exists(target_dir):
            logger.info(f"Cloning {repo_full_name} (branch: {branch}, depth: {depth}) -> {target_dir}")
            clone_cmd = [
                "git", "clone",
                "--depth", str(depth),
                "--branch", branch,
                "--single-branch",
                self.prepare_repo_url(repo_full_name, auth_token),
                target_dir
            ]
            try:
                subprocess.run(clone_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            except subprocess.CalledProcessError as e:
                logger.error(f"Clone failed: {e.stderr}")
                return {"success": False, "error": e.stderr, "target_dir": target_dir}

        # Specific commit checkout if provided
        if commit_sha:
            logger.info(f"Checking out commit {commit_sha}")
            subprocess.run(["git", "checkout", commit_sha], cwd=target_dir, check=False)

        # Get current revision SHA
        rev_res = subprocess.run(["git", "rev-parse", "HEAD"], cwd=target_dir, capture_output=True, text=True)
        resolved_sha = rev_res.stdout.strip() if rev_res.returncode == 0 else (commit_sha or "unknown")

        # Count repository files
        files_count = sum(len(files) for _, _, files in os.walk(target_dir) if ".git" not in _)

        logger.info(f"Clone completed successfully. Commit: {resolved_sha}, Files: {files_count}")
        return {
            "success": True,
            "target_dir": target_dir,
            "commit_sha": resolved_sha,
            "branch": branch,
            "files_count": files_count
        }


if __name__ == "__main__":
    cloner = GitCloner()
    repo = sys.argv[1] if len(sys.argv) > 1 else "hendy-dev/vietsub-pro-live"
    res = cloner.clone_repository(repo)
    print(res)
