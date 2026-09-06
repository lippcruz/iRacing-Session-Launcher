# Política de Privacidade / Privacy Policy

Última atualização / Last updated: 6 de setembro de 2026 / September 6, 2026

## Português (Brasil)

### Resumo

O iRacing Session Launcher não envia dados pessoais, configurações, telemetria ou
logs ao desenvolvedor. O aplicativo funciona localmente no computador do usuário e
não possui conta, publicidade, analytics, servidor próprio ou rastreamento.

### Dados acessados e finalidade

Para executar sua função, o aplicativo acessa localmente:

- nomes, identificadores, caminhos e horários de criação de processos do Windows,
  para detectar o iRacing e administrar somente os aplicativos iniciados pelo launcher;
- o mapa de memória local disponibilizado pelo SDK do iRacing, para detectar o início
  e o encerramento de uma sessão;
- os caminhos, nomes, argumentos e ícones dos executáveis escolhidos pelo usuário;
- a configuração e o histórico de atividade criados pelo próprio aplicativo.

Essas informações são usadas exclusivamente no dispositivo para prestar as funções
solicitadas. Elas não são transmitidas ao desenvolvedor nem vendidas ou compartilhadas.

### Armazenamento e retenção

Configurações e logs ficam em `%APPDATA%\iracing-session-launcher`. A configuração é
mantida até ser alterada ou apagada pelo usuário. O log de atividade é rotacionado
localmente ao atingir aproximadamente 2 MB. Caminhos e argumentos podem conter nomes
de usuário ou outras informações pessoais escolhidas pelo próprio usuário.

### Controle e exclusão

O usuário pode editar ou remover aplicativos pela interface. Para apagar todos os
dados do launcher, encerre o aplicativo e exclua a pasta
`%APPDATA%\iracing-session-launcher`. A desinstalação pode não remover configurações
para permitir sua preservação em futuras instalações.


### Terceiros e Microsoft Store

Executáveis iniciados pelo usuário podem possuir suas próprias conexões e políticas;
o iRacing Session Launcher não controla suas práticas. Compras, downloads, atualizações e
dados de conta da Microsoft Store são processados pela Microsoft segundo os termos e
a política de privacidade da Microsoft. O desenvolvedor não recebe os dados locais do
launcher por meio da Store.

### Crianças

O aplicativo não é direcionado a crianças e não coleta deliberadamente informações
pessoais de crianças.

### Alterações e contato

Mudanças relevantes serão publicadas neste arquivo com uma nova data. Dúvidas sobre
privacidade podem ser abertas na [página de Issues do repositório](https://github.com/lippcruz/iRacing-Session-Loucher/issues),
sem incluir dados pessoais, configurações ou logs não revisados.

## English

### Summary

iRacing Session Launcher does not send personal data, configuration, telemetry, or
logs to the developer. It operates locally on the user's computer and has no account,
advertising, analytics, first-party server, or tracking.

### Data accessed and purpose

To provide its functionality, the application locally accesses:

- Windows process names, identifiers, paths, and creation times, to detect iRacing
  and manage only applications started by the launcher;
- the local shared-memory map exposed by the iRacing SDK, to detect session start and end;
- paths, names, arguments, and icons of executables selected by the user;
- configuration and activity history created by the application itself.

This information is used only on the device to provide requested functionality. It is
not transmitted to the developer, sold, or shared.

### Storage and retention

Configuration and logs are stored under `%APPDATA%\iracing-session-launcher`.
Configuration remains until changed or deleted by the user. The local activity log is
rotated at approximately 2 MB. Paths and arguments may contain a Windows user name or
other personal information selected by the user.

### User control and deletion

Applications can be edited or removed through the interface. To erase all launcher
data, exit the application and delete `%APPDATA%\iracing-session-launcher`.
Uninstallation may preserve configuration for a future installation.

### Third parties and Microsoft Store

User-selected executables may have their own connections and privacy policies; the
iRacing Session Launcher does not control their practices. Microsoft processes Store
purchases, downloads, updates, and Microsoft account data under Microsoft's terms and
privacy statement. The developer does not receive the launcher's local data through
the Store.

### Children

The application is not directed to children and does not knowingly collect children's
personal information.

### Changes and contact

Material changes will be published in this file with a revised date. Privacy questions
may be submitted through the [repository's Issues page](https://github.com/lippcruz/iRacing-Session-Loucher/issues)
without including personal data, configuration files, or unreviewed logs.
