# Contribuindo

**Português** | [English](CONTRIBUTING.en.md)

Obrigado antecipadamente por relatar bugs, sugerir ajustes ou enviar uma correção.

## Issues

Pesquise issues existentes e descreva versão do launcher, Windows, comportamento
esperado, comportamento observado e passos mínimos para reproduzir. Não publique
dados pessoais nem vulnerabilidades exploráveis; para segurança, use `SECURITY.md`.

## Código

Mantenha mudanças pequenas e focadas. Execute antes de enviar:

```powershell
npm ci
npm run setup:runtime
npm audit
npm test
npm run test:smoke
```

Alterações no monitoramento ou gerenciamento de processos devem incluir testes para
início, cancelamento, encerramento e proteção de processos externos. Ao contribuir,
você concorda que sua contribuição será distribuída sob a licença do projeto.
