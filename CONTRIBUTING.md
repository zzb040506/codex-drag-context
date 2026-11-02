# Contributing

Thanks for helping make file handoff less distracting. Bug reports, verified compatibility results, and focused pull requests are welcome.

## Development

Use Node.js 22+ and npm. Run `npm ci`, `npm run check`, then `npm run package`. Press F5 in VS Code to launch the configured Extension Development Host. Install the official Codex extension in that host if needed.

- `extension.js`: VS Code view, drop controller, command registration, dependency checks.
- `context-sender.js`: serialized dispatch, deduplication, partial failure handling.
- `resource-utils.js`: URI list parsing and local resource filtering.
- `test/`: Node built-in tests; no external test service.

Keep changes small. Explain observable behavior and include meaningful tests for dispatch or parsing changes. Do not introduce telemetry or network requests without discussing the product change first.

## Manual integration checklist

Use a throwaway local project and record OS, VS Code, and Codex versions. Do not use sensitive paths or code in screenshots.

- Open the intended Codex conversation before sending references.
- Drop one file, then several selected files, onto the Explorer target row.
- Repeat using the Explorer context menu and `+` picker.
- Verify references actually appear in Codex; command completion alone is insufficient.
- Try a local folder and document what Codex does with it.
- Verify prompts are not automatically submitted.
- Confirm unsupported remote URIs produce a clear warning.
- Confirm a missing or changed Codex command produces an actionable error.

Do not mark a platform or Codex version as tested unless this integration check was performed. The current command integration is not a confirmed stable API.

## Releases

The initial release is 0.1.0. To prepare a later release:

1. Update `package.json`, lockfile, changelog, and versioned install examples in both READMEs.
2. Run checks, package, and complete the manual integration checklist where available; document gaps.
3. Push the commit, then an annotated `vX.Y.Z` tag matching the package version.
4. The release workflow runs checks, builds the VSIX, and publishes a GitHub Release with generated notes. Review its notes and add compatibility evidence.

The `local` publisher preserves the initial local installation ID. Moving to a Marketplace publisher would change the extension ID and needs a migration plan.

## Reporting problems

Use the issue templates. Include minimal steps and exact versions. Remove tokens, private source, personal paths, and account details from logs. For security-sensitive reports, avoid posting exploit details or secrets publicly; use a private contact method listed on the maintainer's profile, if available.

The maintainer can run `npm run publish:github` after `gh auth login`. This checks the account and working tree, creates the public repository if needed, pushes main and the version tag, and triggers the release workflow. It never force-pushes. Review GitHub Actions to confirm release completion.
