$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Установите Node.js 22.12+ и запустите скрипт снова.' }
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($npmCommand) {
    if (-not (Test-Path -LiteralPath 'node_modules/vite')) {
        & $npmCommand.Source install
        if ($LASTEXITCODE -ne 0) { throw 'Не удалось установить зависимости.' }
    }
    & $npmCommand.Source run dev
} else {
    $nodeDirectory = Split-Path -Parent $nodeCommand.Source
    $pnpmScript = Join-Path (Split-Path -Parent $nodeDirectory) 'node_modules/pnpm/bin/pnpm.cjs'
    if (-not (Test-Path -LiteralPath 'node_modules/vite')) {
        if (-not (Test-Path -LiteralPath $pnpmScript)) { throw 'Не найден npm или pnpm. Установите стандартный Node.js с npm.' }
        & $nodeCommand.Source $pnpmScript install --frozen-lockfile
        if ($LASTEXITCODE -ne 0) { throw 'Не удалось установить зависимости.' }
    }
    & $nodeCommand.Source 'node_modules/vite/bin/vite.js' --host 127.0.0.1
}
