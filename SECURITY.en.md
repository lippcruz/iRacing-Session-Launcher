# Security

[Português](SECURITY.md) | **English**

Only the latest beta receives security fixes. Update old installations manually.

Do not publish exploitable details, personal data, or unreviewed logs in a public
issue. Use GitHub's **Report a vulnerability** feature when enabled. Otherwise, open
an issue requesting private contact without technical details. Include the affected
version, impact, prerequisites, and a minimal reproduction.

The launcher runs user-selected files with the current Windows account's permissions;
it does not sandbox or audit them. Logs under `%APPDATA%\iracing-session-launcher` may
contain local names and paths. Remove private information before sharing them.
