# Microsoft Store listing / Listagem da Microsoft Store

Textos para a versão `0.4.0-beta.1`. Insira cada recurso em um campo separado.

Copy for version `0.4.0-beta.1`. Enter each feature in a separate field.

## Português (Brasil)

### Nome do produto

`iRacing Session Launcher`

### Descrição curta

```text
Inicie overlays e aplicativos auxiliares automaticamente com suas sessões do iRacing.
```

### Descrição

```text
O iRacing Session Launcher organiza os overlays e aplicativos auxiliares usados durante suas corridas. Cadastre os executáveis uma vez e o launcher poderá iniciá-los automaticamente quando uma sessão do iRacing for detectada.

A detecção usa a memória compartilhada local do SDK do iRacing como sinal principal e o processo real do simulador como alternativa. Cada aplicativo pode ter atraso próprio, inicialização oculta e controles independentes para abrir e fechar com o simulador.

O launcher encerra somente os processos que ele próprio iniciou e cuja identidade consegue confirmar. Aplicativos abertos fora dele são preservados. Também é possível iniciar ou parar todos os aplicativos, trabalhar apenas com os selecionados e acompanhar o histórico local de atividade.

O aplicativo não possui conta, anúncios, telemetria ou servidor próprio. Configurações e logs permanecem no computador do usuário. O código-fonte e a mesma versão funcional continuam disponíveis gratuitamente no GitHub; a compra na Microsoft Store apoia o tempo dedicado à manutenção e oferece a conveniência da distribuição certificada pela Microsoft.

Este é um projeto independente da comunidade. Não é afiliado, aprovado nem mantido pela iRacing.com Motorsport Simulations ou pelos responsáveis pelo iRacing Manager. iRacing é marca de seu respectivo titular.
```

### Novidades nesta versão

```text
Primeira versão beta pública.

- Detecção de sessão pelo SDK do iRacing, com alternativa por processo.
- Inicialização automática ou manual de overlays e aplicativos auxiliares.
- Atraso, início oculto e encerramento configuráveis por aplicativo.
- Bandeja do sistema, interface em português e inglês e histórico local.
- Proteções para encerrar somente processos iniciados pelo launcher.
```

### Recursos do produto

1. `Detecta automaticamente sessões do iRacing`
2. `Inicia overlays e aplicativos auxiliares`
3. `Atraso configurável por aplicativo`
4. `Início e encerramento manual ou automático`
5. `Preserva aplicativos abertos externamente`
6. `Integração com a bandeja do sistema`
7. `Histórico de atividade armazenado localmente`
8. `Interface em português e inglês`

### Termos de pesquisa

Um por campo: `iRacing launcher`, `overlays`, `aplicativos auxiliares`, `simulador`,
`automação de sessão`.

## English (United States)

### Product name

`iRacing Session Launcher`

### Short description

```text
Automatically start overlays and companion apps with your iRacing sessions.
```

### Description

```text
iRacing Session Launcher organizes the overlays and companion applications used during your races. Add each executable once, and the launcher can start it automatically when an iRacing session is detected.

Detection uses the iRacing SDK local shared memory as its primary signal and the real simulator process as a fallback. Each application can have its own delay, hidden-start preference, and independent controls for opening and closing with the simulator.

The launcher closes only processes it started and whose identity it can verify. Applications opened outside the launcher are preserved. You can also start or stop all applications, work only with selected items, and review a local activity history.

The application has no account, advertising, telemetry, or first-party server. Configuration and logs remain on the user's computer. The source code and the same functional version remain available free of charge on GitHub; purchasing the Microsoft Store distribution supports maintenance time and provides the convenience of Microsoft-certified distribution.

This is an independent community project. It is not affiliated with, endorsed by, or maintained by iRacing.com Motorsport Simulations or the iRacing Manager authors. iRacing is a trademark of its respective owner.
```

### What's new in this version

```text
First public beta release.

- Session detection through the iRacing SDK, with process fallback.
- Automatic or manual launch of overlays and companion applications.
- Per-app delay, hidden start, and closing preferences.
- System tray, English and Portuguese interface, and local activity history.
- Safeguards that close only processes started by the launcher.
```

### Product features

1. `Automatic iRacing session detection`
2. `Starts overlays and companion applications`
3. `Configurable delay for each application`
4. `Manual or automatic start and stop`
5. `Preserves externally opened applications`
6. `Windows system tray integration`
7. `Locally stored activity history`
8. `English and Portuguese interface`

### Search terms

One per field: `iRacing launcher`, `overlays`, `companion apps`, `sim racing`,
`session automation`.

## Common information / Informações comuns

- Website: `https://github.com/lippcruz/iRacing-Session-Launcher`
- Support: `https://github.com/lippcruz/iRacing-Session-Launcher/issues`
- Privacy policy: `https://github.com/lippcruz/iRacing-Session-Launcher/blob/main/PRIVACY.md`
- Developed by / Desenvolvido por: `Lipp Cruz`
- Copyright: `Copyright (c) 2026 Lipp Cruz`
- Category / Categoria: `Utilities & tools / Utilitários e ferramentas`
- Minimum memory / Memória mínima: `4 GB`
- Recommended memory / Memória recomendada: `8 GB`
- DirectX, dedicated video memory, processor, graphics, Xbox controller, and Windows
  Mixed Reality: leave unspecified or unchecked.
- DirectX, memória de vídeo dedicada, processador, gráficos, controle Xbox e Windows
  Mixed Reality: deixar sem especificar ou desmarcado.

## Certification notes / Notas para certificação

```text
PT-BR: O aplicativo usa a capacidade runFullTrust para detectar localmente o processo e a memória compartilhada do SDK do iRacing, iniciar executáveis escolhidos pelo usuário e encerrar somente processos iniciados por ele. Não há conta, telemetria, anúncios ou transmissão de configurações. O teste pode ser feito adicionando um executável inofensivo, como o Bloco de Notas, e usando os controles manuais. A automação requer uma sessão do iRacing.

EN-US: The application uses runFullTrust to locally detect the iRacing process and SDK shared memory, launch user-selected executables, and close only processes it started. There is no account, telemetry, advertising, or configuration transmission. It can be tested by adding a harmless executable such as Notepad and using the manual controls. Automatic behavior requires an iRacing session.
```
