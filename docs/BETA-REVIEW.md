# Revisao da beta 0.4.0-beta.1

## Problemas encontrados e corrigidos

- Electron 38 tinha vulnerabilidades conhecidas. Atualizado para 44.2.0.
- Configuracao aceitava entradas malformadas, IDs repetidos e caminhos duplicados.
  A validacao foi centralizada e executada tambem no processo principal.
- Remover um app iniciado fazia perder o comando de parada. Agora e necessario
  para-lo antes de remover ou trocar seu executavel.
- Editar/remover um app nao cancelava uma abertura manual com atraso.
- Erro de acesso ao SDK sem processo visivel podia produzir uma falsa desconexao.
- Metadados antigos podiam manter o icone do executavel anterior.
- Scripts de verificacao liam o perfil pessoal e deixavam caches no projeto.
- Empacotamento incluia uma copia completa desnecessaria da biblioteca de icones.
- Canais IPC confiavam implicitamente no chamador da interface. Agora aceitam apenas
  a janela e o frame principal esperados, com validacao das listas de IDs.
- Permissoes do Chromium e webviews nao eram negadas explicitamente. Agora sao
  bloqueadas, assim como rede, frames e formularios externos pela politica de conteudo.
- Canais IPC confiavam implicitamente no chamador da interface. Agora aceitam apenas
  a janela e o frame principal esperados, com validacao das listas de IDs.
- Permissoes do Chromium e webviews nao eram negadas explicitamente. Agora sao
  bloqueadas, assim como rede, frames e formularios externos pela politica de conteudo.

## Limpeza

Removidos Python/Tkinter, instaladores Python/PowerShell, specs PyInstaller, icone
obsoleto, script de inspecao do programa original, builds 0.2/0.3, caches e perfis
de teste. Aproximadamente 1,3 GB removidos. Nenhum dado da instalacao do usuario foi
apagado. Mantido scripts/make_icon.py, que gera o icone proprio ainda utilizado.

Pastas de builds, dependencias e verificacoes sao ignoradas no versionamento.
Certificados, chaves, arquivos de ambiente, perfis, logs e dumps tambem sao ignorados.
Certificados, chaves, arquivos de ambiente, perfis, logs e dumps tambem sao ignorados.
O instalador inclui uma lista explicita de arquivos e o pacote publico e montado
por allowlist. Perfis de testes sao temporarios e independentes do perfil real.

## Validacao

21 testes unitarios passaram. npm audit nao reportou vulnerabilidades.
O teste de integracao validou o sinal SDK isolado, disparo, falha independente,
encerramento, interface compacta e fim do monitor. O executavel empacotado passou
com perfil vazio, bandeja, instancia unica e encerramento completo.
Os resultados de integracao ficam em verification/.
O bundle recusa versoes sem verificacao e arquivos de desenvolvimento no ASAR.

## Limites

Beta para Windows x64, sem assinatura digital de editor e sem atualizador automatico.
Nao foi executada uma matriz de hardware ou versoes de todos os overlays.
Instalacao e desinstalacao completas em uma maquina Windows limpa ainda precisam
de validacao externa; foi testado o executavel empacotado com perfil novo.
O comportamento de iniciar oculto depende do executavel de destino.
Logs podem conter caminhos locais; revisa-los antes de compartilhar.
