# Changelog

## 0.4.0-beta.1

Primeira beta preparada para distribuicao a comunidade.

- Electron atualizado para 44.2.0 e dependencias de desenvolvimento fixadas.
- Validacao de configuracoes, identificadores e executaveis duplicados.
- Edicao e remocao cancelam aberturas pendentes, inclusive as manuais.
- Apps em execucao permanecem sob controle: remocao ou troca de caminho exige parar primeiro.
- Erro de leitura do SDK nao e confundido com encerramento de sessao.
- Salvamentos da interface sao serializados; icones antigos sao descartados ao trocar o executavel.
- Indicador da bandeja contabiliza tambem processos acompanhados apos launchers intermediarios.
- Removidos codigo Python/Tkinter, instaladores anteriores, builds e perfis de teste antigos.
- Pacote inclui somente os arquivos necessarios; biblioteca Lucide nao e duplicada.
- Testes independentes de configuracoes pessoais e verificacao da primeira abertura sem perfil existente.
- IPC restrito ao frame principal, permissoes e webviews bloqueadas e politica de
  conteudo sem acesso de rede.
- Limites de tamanho para configuracao e selecoes recebidas pela interface.
- Allowlist exata dos arquivos de producao; licenca, politica de seguranca e guia de
  contribuicao adicionados para a publicacao no GitHub.

Mantidos: SDK com alternativa por processo, atrasos independentes, selecao multipla,
icones detectados, atividade, bandeja e encerramento completo do monitor.

Limitacoes e requisitos estao em docs/LEIA-ME.txt.

### English

First public community beta: Electron 44.2.0, validated configuration and process
ownership, SDK/process monitoring, cancellable independent delays, sandboxed UI,
top-frame-only IPC, exact package allowlist, no telemetry, bilingual interface and
documentation, 22 unit tests, isolated SDK smoke test, and packaged-app verification.
Known limitations and requirements are in `docs/README.en.txt`.
