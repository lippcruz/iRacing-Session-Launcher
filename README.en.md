# iRacing Session Launcher

[Português](README.md) | **English**

Free Windows application that starts overlays and companion applications when an
iRacing session opens and can close only the processes it started when the session ends.

This independent community project is not affiliated with or endorsed by iRacing.com
Motorsport Simulations or the iRacing Manager authors.

## Origin and acknowledgement

This project was inspired by iRacing Manager. I am grateful for the time I used it;
it was a major help in organizing racing companion applications. On my installation,
it currently sometimes closes its window while leaving its process running and cannot
be opened again until that process is manually terminated. That experience motivated
this transparent community alternative.

No iRacing Manager code, libraries, icons, or files are redistributed here. Only its
general purpose inspired this project.

## Always free on GitHub

Every functional version offered through the Microsoft Store will also remain
available free of charge on this GitHub repository. The code may be used, studied,
modified, and redistributed for free. Third parties may not sell the application,
copies, or modified versions. Only the copyright holder, Lipp Cruz, may commercially
distribute the official application. See [LICENSE](LICENSE).

The paid Microsoft Store distribution funds maintenance time and offers a package
signed, certified, and delivered by Microsoft infrastructure. Store certification and
signing improve origin and installation trust but cannot guarantee that software has
no defects or vulnerabilities.

## Features and behavior

- Detects sessions through the iRacing SDK, with simulator-process fallback.
- Ignores the iRacing UI and background services.
- Starts all enabled or selected apps, with an independent configurable delay.
- Reads the selected executable's name and icon.
- Closes only processes it started and whose identity it can verify.
- Preserves externally started apps, including apps with the same filename.
- Provides a system tray, single instance, local activity history, and rotating logs.
- Closing with `X` exits the launcher and monitor; minimizing to tray is explicit.

New apps enable "Open with iRacing" and "Close with iRacing" by default.

## Installation and SmartScreen

Download only from this repository's **Releases** page and compare the installer's
SHA-256 with `SHA256SUMS.txt`:

```powershell
Get-FileHash ".\iRacing Session Launcher Setup 0.4.0-beta.1.exe" -Algorithm SHA256
```

This beta is unsigned. If Windows reports an unrecognized app, verify the official
download and matching hash, then choose **More info** and **Run anyway**. If the hash
differs, do not run it and report the incident. Do not disable SmartScreen or antivirus.
The permanent distribution solution is consistent trusted code signing or Microsoft
Users who prefer a signed and Store-certified installation may purchase the official
Microsoft Store distribution. A self-signed certificate does not establish trust.

Configuration is stored at `%APPDATA%\iracing-session-launcher\apps.json`.

## How monitoring works

1. `SessionProbe.exe` reads the official SDK's local shared-memory map.
2. A valid SDK connection is the primary session-start signal.
3. After 8 seconds without SDK data, a real simulator process becomes the fallback.
4. Launch delays are independent and cancellable; one app cannot block the others.
5. PID, creation time, and descendants are tracked for every launched process.
6. A 3-second debounce prevents brief SDK gaps from ending a session.
7. Before stopping an app, its identity is checked again. A normal close is requested
   first; forced termination may follow after 3 seconds.

## Code audit map

| Path | Responsibility |
| --- | --- |
| `src/main.js` | Window/tray lifecycle, trusted IPC, atomic persistence, probe lifecycle, permissions, and navigation controls. |
| `src/preload.js` | The only UI API; it does not expose Node.js or raw Electron access. |
| `src/config.js` | Data normalization, `.exe` paths, identifiers, duplicates, and managed-process protections. |
| `src/app-controller.js` | Delays, shell-free spawning, process ownership, launcher handoffs, and safe stopping. |
| `src/session-monitor.js` | SDK/process state machine, timing tolerances, and session transitions. |
| `src/native/SessionProbe.cs` | Local SDK read, process inventory, executable metadata, and PID/start-time validated stopping. |
| `src/renderer/` | Sandboxed bilingual interface and a content policy that blocks network, frames, and plugins. |
| `tests/` | Unit and isolated SDK fixture tests that never use the personal profile or real SDK map. |
| `scripts/` | Native build, smoke/release tests, exact ASAR allowlist, and public bundle creation. |

Security controls include Chromium sandboxing and context isolation, top-frame-only
IPC, denied permissions/navigation/webviews, no renderer network access, no command
shell for configured apps, main-process configuration validation, exact packaging
allowlists, locked dependencies, and automated dependency auditing.

The launcher has no account, advertising, telemetry, update server, or configuration
upload. Configuring an `.exe` authorizes that file to run with the current user's
permissions; verify every third-party app yourself. Local logs may contain paths.

## Development methodology with GPT

The application was built with GPT assistance through Codex. It was not accepted from
a single generated answer: requirements were described, the reference workflow was
observed, the implementation was written from scratch, the UI was visually reviewed,
failure and ownership cases received tests, dependencies and packaged files were
audited, and the final installer and checksums were verified. GPT output can be wrong,
so tests, human review, documented limitations, and public inspection are part of the
validation method.

## Build and verification

Requires Windows x64, Node.js 22.12+, npm, and .NET Framework 4.x:

```powershell
npm ci
npm run setup:runtime
npm audit
npm test
npm run test:smoke
npm run dist
npm run test:release
npm run release:bundle
```

Build the Partner Center package with `npm run dist:store`. It declares only the
`runFullTrust` capability required by Electron and local process management. Microsoft
signs the approved Store package. See the
[bilingual Microsoft Store checklist](docs/MICROSOFT-STORE.md).

## Known limitations and contributions

The beta is Windows x64 only and unsigned. Clean-machine installation/uninstallation
and a full hardware/overlay matrix still need external validation. "Start hidden"
depends on the target app, and forced termination may lose unsaved data.

Bug reports and suggestions are welcome. Thank you in advance for spending time on
testing and improvements. Remove private paths and data before sharing logs. Read
[SECURITY.en.md](SECURITY.en.md) and [CONTRIBUTING.en.md](CONTRIBUTING.en.md).
