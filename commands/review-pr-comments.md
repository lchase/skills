---
description: Triage unresolved review comments on a GitHub PR, fix or reject each, reply, and resolve.
argument-hint: "[PR number or URL]"
---

Address unresolved review comments (e.g. GitHub Copilot, human reviewers) on PR `$ARGUMENTS`, then reply and resolve each thread. Requires `gh` authenticated for this repo. This is comment-triage glue, not a code review pass — it does not run the smart-review lenses.

1. Resolve the PR: `gh pr view $ARGUMENTS --json number,headRefName,headRefOid,url` for the head branch and SHA (needed for replies and pushes).
2. Fetch unresolved review threads via GraphQL (REST doesn't expose thread IDs, which the resolve mutation needs):
   ```
   gh api graphql -f query='
   query { repository(owner: "{owner}", name: "{repo}") {
     pullRequest(number: {pr}) { reviewThreads(first: 100) { nodes {
       id isResolved
       comments(first: 1) { nodes { id databaseId path line body author { login } } }
   } } } } }'
   ```
   Filter to `isResolved: false`.
3. For each unresolved thread, read the file at that line and classify:
   - **Fix** — code change needed.
   - **Docs** — comment/doc update only.
   - **Explain** — no change; reply with reasoning (e.g. false positive, out of scope, intentional).
   - **Disagree** — reviewer is right in principle but you're choosing not to act; needs the user's explicit call, not an assumed one.
4. **Human gate — show the triage table before touching anything.** List every thread: author, file:line, comment summary, proposed classification, and (for Fix/Docs) the planned change. Ask the user to confirm, edit, or override the plan. Wait for an explicit answer — do not edit code or post to GitHub on the assumption that running the command implied approval.
5. Once confirmed, apply only the approved Fix/Docs changes locally. Stage and commit them together with a message that references the addressed threads.
6. **Second gate — confirm before touching the shared PR.** Show the commit (files + diff summary) and ask the user to approve pushing to `headRefName` and posting replies. This is a separate approval from step 4: approving the triage plan is not approval to push and comment on GitHub.
7. Once approved: `git push` to the PR's head branch, then for each thread:
   - Reply via REST: `gh api -X POST repos/{owner}/{repo}/pulls/comments/{databaseId}/replies -f body="<explanation, with commit SHA if fixed>"`.
   - Resolve via GraphQL mutation: `gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<id>"}) { thread { isResolved } } }'`.
   - Only resolve threads that got a reply in this run — never resolve a thread silently.
8. Summarize: threads fixed, threads explained/disagreed (with reasons), commit SHA, and any threads left unresolved (e.g. user asked to defer).

Do not approve, request changes, or merge the PR — this replies to and resolves comment threads only, same boundary as `/smart-review:add-pr-review`.
