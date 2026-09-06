# Beta 0.4.0-beta.1 review

The review removed obsolete Python/Tkinter code, old installers/builds, caches, and
test profiles. It hardened malformed configuration handling, process ownership, IPC,
Chromium permissions, navigation, and the package allowlist. Dependencies reported no
known vulnerabilities. Unit, isolated SDK smoke, clean-profile, tray, single-instance,
and clean-exit checks passed. Remaining limits: unsigned Windows x64 beta, no complete
hardware/overlay matrix, and no full clean-machine installation test.
