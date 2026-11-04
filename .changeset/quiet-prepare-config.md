---
'create-reactloom': patch
---

Fix concurrent prepare scripts writing git config by configuring the commit template only at the repository root, skipping an already configured template, and treating config lock contention as a warning. Generated projects use the same setup script.

Honor explicitly configured Neovim before the default GUI editor, retain quoted Windows path separators, and preserve socket files when an editor probe cannot establish liveness.
