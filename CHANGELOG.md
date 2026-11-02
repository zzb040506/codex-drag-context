# Changelog

## 0.1.1 — Unreleased

- Prepare Marketplace metadata, original PNG icon, and dark gallery banner.
- Change the candidate publisher to `zzb040506`; Marketplace ownership and publication remain pending.
- Add a manual GitHub Actions OIDC publishing workflow and setup guide.
- Upgrade and pin `@vscode/vsce` to 4.1.0 for OIDC support.
- Document migration from the original `local.codex-drag-context` extension ID.

## 0.1.0 — 2026-11-02

Initial community preview.

- Dedicated Explorer drop target for local file and folder references.
- Multi-select context menu and file/folder picker.
- Per-batch deduplication and ordered dispatch across consecutive operations.
- Unsupported URI warnings and partial failure counts.
- Chinese and English documentation, automated tests, and VSIX packaging workflows.

Known limits: integration uses an unconfirmed Codex command contract; actual GUI attachment behavior and cross-platform behavior remain unverified. Folder expansion is controlled by Codex.
