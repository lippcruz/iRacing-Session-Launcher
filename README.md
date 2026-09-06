# iRacing Session Launcher

**Português** | [English](README.en.md)

Aplicativo gratuito para Windows que inicia overlays e programas auxiliares quando
uma sessão do iRacing é aberta e, opcionalmente, encerra os processos que ele próprio
iniciou ao final da sessão.

Este é um projeto independente da comunidade. Não é afiliado, aprovado ou mantido
pela iRacing.com Motorsport Simulations nem pelos responsáveis pelo iRacing Manager.

## Origem e agradecimento

O projeto foi inspirado no iRacing Manager. Agradeço pelo tempo em que o utilizei:
ele foi de grande ajuda para organizar os aplicativos que acompanham as corridas.
Atualmente, na minha instalação, ele tem apresentado um problema em que a janela é
fechada, mas o processo continua em execução e o programa não abre novamente até
esse processo ser finalizado manualmente. Essa experiência motivou a criação de uma
alternativa simples, transparente e mantida pela comunidade.

O iRacing Session Launcher não reutiliza código, bibliotecas, ícones ou arquivos do
iRacing Manager. A inspiração está no objetivo do produto: acompanhar a sessão do
simulador e administrar os aplicativos escolhidos pelo usuário.

## Gratuito para sempre

O aplicativo é e sempre será gratuito. O código pode ser lido, usado, estudado,
modificado e redistribuído gratuitamente. A venda do aplicativo, de cópias ou de
versões modificadas é proibida. Consulte [LICENSE](LICENSE) para os termos completos.
Por conter uma restrição comercial, esta é uma licença de código público e uso livre
não comercial, e não uma licença "open source" segundo a definição da OSI.

## O que ele faz

- Detecta uma sessão pelo SDK do iRacing e usa o processo do simulador como alternativa.
- Ignora a interface e os serviços do iRacing, evitando disparos fora de uma sessão.
- Inicia todos os apps habilitados, ou apenas os selecionados, com atraso configurável.
- Obtém nome e ícone diretamente do executável escolhido.
- Pode iniciar um app oculto quando o próprio aplicativo de destino oferece suporte.
- Encerra somente processos que o launcher iniciou e cuja identidade foi confirmada.
- Mantém apps externos intactos, mesmo quando possuem o mesmo nome.
- Oferece bandeja do sistema, instância única, histórico da sessão e logs locais.
- Ao fechar a janela pelo `X`, encerra também o monitor. A ação de recolher para a
  bandeja é explícita e mantém o monitoramento ativo.

"Abrir com iRacing" e "Fechar com iRacing" vêm habilitados por padrão em novos apps.
O encerramento global ainda pode ser desativado nas configurações.

## Instalação

Baixe o instalador ou o ZIP da versão publicada em **Releases**. Antes de executar,
compare o SHA-256 do instalador com `SHA256SUMS.txt`. No PowerShell:

```powershell
Get-FileHash ".\iRacing Session Launcher Setup 0.4.0-beta.1.exe" -Algorithm SHA256
```

A beta ainda não possui assinatura digital de editor, portanto o Windows pode exibir
um aviso do SmartScreen. Não baixe instaladores enviados por terceiros. O usuário
final não precisa instalar Node.js, Python ou ferramentas de desenvolvimento.

### Se o Windows mostrar "aplicativo não reconhecido"

1. Confirme que o arquivo veio da página **Releases** deste repositório.
2. Compare seu SHA-256 com `SHA256SUMS.txt` usando o comando acima.
3. Se o hash for idêntico, selecione **Mais informações** e **Executar assim mesmo**.
4. Se o hash for diferente, não execute o arquivo e reporte o ocorrido.

Não desative o SmartScreen ou o antivírus. A solução permanente planejada é assinar
todas as versões com uma identidade validada ou distribuir pela Microsoft Store.
Certificados autoassinados não estabelecem confiança em computadores de terceiros.

As configurações ficam em `%APPDATA%\iracing-session-launcher\apps.json`.

## Como o monitoramento funciona

1. `SessionProbe.exe` consulta o mapa de memória oficial exposto localmente pelo SDK.
2. A conexão válida do SDK é o sinal principal de que uma sessão começou.
3. Se o SDK não responder, o launcher considera processos reais do simulador depois
   de uma tolerância de 8 segundos.
4. Cada app configurado recebe seu próprio atraso cancelável e uma falha não impede
   os demais de iniciar.
5. O launcher registra PID, horário de criação e descendentes do processo iniciado.
6. No fim da sessão, há uma tolerância de 3 segundos contra quedas breves do SDK.
7. Para encerrar, a identidade do processo é validada novamente; primeiro é solicitado
   o fechamento normal e, após 3 segundos, pode ser usado encerramento forçado.

## Auditoria do código

O repositório foi organizado para que cada responsabilidade possa ser verificada:

| Caminho | Responsabilidade e pontos para conferir |
| --- | --- |
| `src/main.js` | Ciclo de vida da janela e bandeja, IPC permitido, persistência atômica, inicialização do monitor, política de permissões e bloqueio de navegação externa. |
| `src/preload.js` | Única API exposta à interface; não entrega acesso direto ao Node.js ou ao Electron. |
| `src/config.js` | Normalização dos dados, caminhos `.exe`, IDs, duplicidades e proteção contra alteração de processos ainda administrados. |
| `src/app-controller.js` | Atrasos, criação sem shell, rastreamento de propriedade, adoção de atualizações e encerramento seguro dos processos. |
| `src/session-monitor.js` | Máquina de estados do SDK/processo, tolerâncias de conexão e emissão de início/fim de sessão. |
| `src/native/SessionProbe.cs` | Leitura local do SDK, inventário de processos, metadados do executável e encerramento com validação de PID/hora. |
| `src/renderer/` | Interface; política de conteúdo impede rede, frames, plugins e formulários externos. |
| `tests/` | Testes unitários e fixture isolada do SDK; não utiliza o perfil pessoal nem o mapa real do simulador. |
| `scripts/` | Compilação, testes de integração, validação do pacote e montagem por lista permitida. |

### Controles de segurança

- `contextIsolation`, sandbox do Chromium e ausência de Node.js na interface.
- Chamadas IPC aceitas somente da janela principal e do frame local esperado.
- Novas janelas, navegação, webviews e permissões do Chromium são negadas.
- Política de conteúdo sem conexões de rede; o launcher não possui telemetria.
- Executáveis são iniciados diretamente, sem `cmd.exe`, PowerShell ou `shell: true`.
- O probe é chamado com argumentos estruturados e não aceita comandos arbitrários.
- Configuração é normalizada novamente no processo principal antes de ser salva.
- O instalador usa lista explícita; testes, perfis, logs, certificados e segredos não
  entram no artefato nem no Git.
- Dependências têm versões fixadas no `package-lock.json` e passam por `npm audit`.

O código público permite auditoria, mas não torna qualquer programa configurado
confiável. Adicionar um `.exe` autoriza a execução desse arquivo com as permissões do
usuário atual. Confira a origem de overlays e apps antes de cadastrá-los. Logs locais
podem conter caminhos pessoais e devem ser revisados antes de serem compartilhados.

Não há contas, servidor, telemetria, atualização automática ou envio de configuração.
Os aplicativos iniciados podem possuir suas próprias conexões e políticas.

## Metodologia de criação com GPT

O aplicativo foi desenvolvido com assistência do GPT, usando o Codex como agente de
programação. A criação não consistiu em aceitar uma única resposta gerada: cada etapa
foi conduzida de forma iterativa e verificável:

1. O comportamento desejado e o problema do aplicativo de referência foram descritos.
2. O aplicativo de referência foi observado apenas para entender o fluxo funcional.
3. A arquitetura foi reimplementada do zero com Electron e um leitor nativo pequeno.
4. As interfaces foram avaliadas visualmente e refinadas a partir de uso real.
5. Casos de falha, propriedade de processos e transições do SDK ganharam testes.
6. Dependências, arquivos empacotados, dados pessoais e superfícies de segurança foram
   revisados antes da beta.
7. O instalador foi gerado, seu conteúdo foi conferido e hashes foram publicados.

GPT pode produzir erros. Por isso, código gerado não foi tratado como evidência de
correção: testes automatizados, revisão humana, documentação das limitações e auditoria
pública fazem parte do processo de validação.

## Desenvolvimento e reprodução da beta

Requisitos: Windows x64, Node.js 22.12 ou superior, npm e .NET Framework 4.x. O
`csc.exe` incluído no Windows compila o leitor nativo.

```powershell
npm ci
npm run setup:runtime
npm test
npm run test:smoke
npm start
```

Para reproduzir a verificação e o pacote:

```powershell
npm audit
npm test
npm run test:smoke
npm run dist
npm run test:release
npm run release:bundle
```

O pacote para envio à Microsoft Store usa a identidade reservada no Partner Center:

```powershell
npm run dist:store
```

Ele declara apenas `runFullTrust`, capacidade necessária para o Electron e para
monitorar/iniciar aplicativos locais. A Microsoft assina o pacote aprovado na Store.
Veja [o checklist bilíngue da Microsoft Store](docs/MICROSOFT-STORE.md).

Os testes usam executáveis artificiais, mapa de memória separado e perfis temporários.
O bundle só é criado após validar a mesma versão empacotada. `release/`,
`verification/`, dependências, binários gerados e dados locais ficam fora do Git.

Consulte [docs/BETA-REVIEW.md](docs/BETA-REVIEW.md) para o relatório da versão e
[THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) para componentes de terceiros.

## Limitações conhecidas

- Beta exclusiva para Windows x64 e ainda sem assinatura digital.
- Instalação/desinstalação em uma máquina Windows limpa precisa de validação externa.
- Não existe uma matriz completa de hardware, overlays e versões do simulador.
- "Iniciar oculto" depende do comportamento do aplicativo escolhido.
- O encerramento forçado pode causar perda de dados não salvos no app de destino.

## Bugs, sugestões e segurança

Relatos de bugs e sugestões de ajustes são bem-vindos. Agradeço antecipadamente a
quem dedicar tempo para testar, explicar um problema ou propor uma melhoria. Antes de
abrir uma issue, remova caminhos pessoais, nomes de usuário e outros dados privados
dos logs e inclua versão do Windows, versão do launcher e passos para reproduzir.

Para vulnerabilidades, não publique detalhes exploráveis em uma issue aberta. Siga
[SECURITY.md](SECURITY.md). Para contribuir com código, leia
[CONTRIBUTING.md](CONTRIBUTING.md).
