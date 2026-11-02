# Marketplace publishing

The Marketplace candidate uses publisher ID `Fantasia040506`, producing extension ID `Fantasia040506.codex-drag-context`. The publisher has been created; the first Marketplace publication remains pending verification. Do not advertise this extension as listed until the publish job succeeds and the public listing is verified.

## One-time publisher setup

Sign in at https://marketplace.visualstudio.com/manage with the Microsoft account that will own the extension. Open the existing publisher with ID `Fantasia040506`. The ID is permanent. If you use another publisher ID, update `package.json` and this document before publishing.

Open **Trusted Publishing**, create a policy, and enter:

| Field | Value |
| --- | --- |
| Policy name | Codex Drag Context |
| Repository owner | `zzb040506` |
| Repository | `codex-drag-context` |
| Workflow | `marketplace.yml` |
| Environment | Leave empty |

The workflow file is `.github/workflows/marketplace.yml`; the policy field takes only its filename. No PAT or GitHub repository secret is needed for this workflow.

## Publish

The project pins `@vscode/vsce` to `4.1.0`, which provides `--oidc`. After configuring the policy, trigger the workflow using GitHub Actions or:

```sh
gh workflow run marketplace.yml --repo zzb040506/codex-drag-context --ref main
gh run list --repo zzb040506/codex-drag-context --workflow marketplace.yml
```

The workflow runs checks, packages the extension, saves the exact VSIX as an artifact, and publishes it with a short-lived OIDC credential. `npm run publish:marketplace` is intended for the authorized GitHub Actions job, not a normal local terminal.

For later versions, increment the package version and lockfile, update the changelog, commit, push, and trigger the workflow. A successful upload can precede listing availability; verify the public Marketplace page before announcing availability. The workflow deliberately runs only when manually dispatched on `main`.

## Existing local installations

The original 0.1.0 VSIX used ID `local.codex-drag-context`. The Marketplace candidate uses `Fantasia040506.codex-drag-context`, so VS Code treats it as a separate extension. Disable or uninstall the old **local** copy before enabling the new one to avoid duplicate views and commands. Switching IDs does not migrate installed extensions automatically.

## Reference

Microsoft's publishing guide: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publish-with-github-actions-and-trusted-publishing
