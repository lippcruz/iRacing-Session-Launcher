# Contributing

[Português](CONTRIBUTING.md) | **English**

Thank you in advance for reporting bugs, suggesting changes, or contributing a fix.
Search existing issues and include the launcher version, Windows version, expected and
observed behavior, and minimal reproduction steps. Do not publish personal data or
exploitable security details.

Keep code changes focused and run:

```powershell
npm ci
npm run setup:runtime
npm audit
npm test
npm run test:smoke
```

Monitoring or process-management changes should test launch, cancellation, stopping,
and protection of external processes. Contributions use the project's license.
