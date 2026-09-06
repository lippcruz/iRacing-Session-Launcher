# Segurança

## Versões suportadas

Durante a beta, somente a versão mais recente publicada recebe correções de
segurança. Instalações antigas devem ser atualizadas manualmente.

## Reportando uma vulnerabilidade

Não publique uma vulnerabilidade explorável, dados pessoais ou logs sem revisão em
uma issue aberta. Use **Report a vulnerability** na aba **Security** do repositório
GitHub, quando disponível. Se esse canal ainda não estiver habilitado, abra uma issue
contendo apenas um pedido de contato privado, sem detalhes técnicos.

Inclua versão afetada, impacto, pré-condições e uma reprodução mínima. O recebimento
será confirmado quando possível; nenhuma data fixa de resposta é prometida neste
projeto comunitário.

## Escopo de confiança

O launcher executa os arquivos escolhidos pelo usuário com as permissões dessa conta
do Windows. Ele não isola nem audita esses executáveis. Problemas de overlays ou apps
de terceiros devem ser reportados aos respectivos responsáveis.

Logs em `%APPDATA%\iracing-session-launcher` podem conter nomes e caminhos locais.
Remova informações pessoais antes de anexá-los a qualquer relatório.
