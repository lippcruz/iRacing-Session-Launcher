$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$output = Join-Path $projectRoot 'build-assets\SessionProbe.exe'
& $compiler /nologo /optimize+ /target:exe /reference:System.Web.Extensions.dll "/out:$output" (Join-Path $projectRoot 'src\native\SessionProbe.cs')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar SessionProbe.' }
