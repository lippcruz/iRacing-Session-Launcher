param([Parameter(Mandatory)][string]$Source, [Parameter(Mandatory)][string]$Destination, [Parameter(Mandatory)][string]$Installer)
$ErrorActionPreference = 'Stop'
$names = @($Installer, 'LEIA-ME.txt', 'README.en.txt', 'LICENSE.txt', 'LICENSE.pt-BR.txt', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.txt', 'lucide-LICENSE.txt', 'SHA256SUMS.txt')
$files = $names | ForEach-Object { Join-Path $Source $_ }
Compress-Archive -LiteralPath $files -DestinationPath $Destination -CompressionLevel Optimal
