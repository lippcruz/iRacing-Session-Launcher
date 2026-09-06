iRacing Session Launcher - Beta 0.4.0-beta.1

Independent community application. Not an official iRacing product.

REQUIREMENTS
64-bit Windows 10/11, .NET Framework 4.x, and iRacing. End users do not need
Node.js, Python, or the original iRacing Manager.

INSTALLATION AND SMARTSCREEN
Close an older Session Launcher version and run the installer. This beta is unsigned.
Download only from the official GitHub Release and compare the installer SHA-256 with
SHA256SUMS.txt. If it matches, choose More info and Run anyway. If it differs, do not
run it. Never disable SmartScreen or antivirus to install this application.

FIRST SESSION
1. Add overlay and companion app executables.
2. Review Open with iRacing and Close with iRacing.
3. Leave Automatic enabled and enter a simulator session.
4. The Activity view shows detection and launch results.

The SDK is the primary signal; process detection is the fallback after 8 seconds.
Opening only the iRacing UI does not start configured apps.

CLOSING
The X exits the launcher and monitor. Minimize to tray keeps monitoring active.
Stop all and Close with iRacing affect only processes started by this launcher.
A normal close is requested first; the process may be forced closed after 3 seconds.

LOCAL DATA
Configuration: %APPDATA%\iracing-session-launcher\apps.json
Activity: %APPDATA%\iracing-session-launcher\activity.log
There is no account, advertising, telemetry, or automatic log upload.

BETA LIMITATIONS
- Windows x64 only; installer is unsigned.
- Start hidden depends on the target application.
- Administrator applications may need to be opened manually.
- No automatic updater or import from the original iRacing Manager.
- Review logs before sharing them; never publish apps.json.
