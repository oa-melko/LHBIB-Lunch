@echo off
chcp 65001 >nul
REM ============================================================
REM stop-all.bat - LHBIB-Lunch : arrete TOUT.
REM   Ports : 3001 serveur d'equipe, 5173 Vite dev.
REM   Ne touche a AUCUN autre projet.
REM
REM Meme methode que les autres projets Melko :
REM   - on tue les enfants du proprietaire du socket, puis son arbre
REM     (un superviseur de rechargement auto laisse sinon un worker
REM     orphelin qui garde le port ouvert) ;
REM   - jusqu'a 3 passes ;
REM   - on ne touche JAMAIS un port tenu par Docker ou par le systeme ;
REM   - on ferme les consoles "cmd /k" laissees par start-all.bat ;
REM   - on VERIFIE que les ports sont libres avant d'annoncer OK.
REM ============================================================
title LHBIB-Lunch - Arret
cd /d "%~dp0"

echo.
echo  Arret LHBIB-Lunch - ports 3001 (equipe) 5173 (dev)
echo.

powershell -NoProfile -Command ^
  "$ports = 3001,5173;" ^
  "$dossier = '%~dp0';" ^
  "$systeme = @('com.docker.backend','com.docker.proxy','com.docker.service','dockerd','docker','vpnkit','wslservice','wslhost','vmmem','System','Idle','svchost');" ^
  "$serveurs = @('python.exe','pythonw.exe','node.exe','caddy.exe','cmd.exe','npm.exe');" ^
  "$restants = @();" ^
  "foreach ($essai in 1..3) {" ^
  "  foreach ($p in $ports) {" ^
  "    foreach ($c in @(Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue)) {" ^
  "      $chef = $c.OwningProcess;" ^
  "      $nom = (Get-Process -Id $chef -ErrorAction SilentlyContinue).ProcessName;" ^
  "      if ($systeme -contains $nom) { Write-Host ('   port ' + $p + ' : tenu par ' + $nom + ' - laisse tel quel'); continue };" ^
  "      Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ParentProcessId -eq $chef -and $serveurs -contains $_.Name } | ForEach-Object { Write-Host ('   port ' + $p + ' : worker ' + $_.ProcessId + ' (' + $_.Name + ')'); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue };" ^
  "      Write-Host ('   port ' + $p + ' : arret du PID ' + $chef);" ^
  "      & taskkill /PID $chef /T /F 2>$null | Out-Null;" ^
  "    }" ^
  "  }" ^
  "  Start-Sleep -Seconds 2;" ^
  "  $restants = @($ports | Where-Object { @(Get-NetTCPConnection -State Listen -LocalPort $_ -ErrorAction SilentlyContinue).Count -gt 0 });" ^
  "  if ($restants.Count -eq 0) { break };" ^
  "  if ($essai -lt 3) { Write-Host ('   passe ' + ($essai + 1) + ' - encore occupe : ' + ($restants -join ', ')) };" ^
  "}" ^
  "$n = 0;" ^
  "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -like ('*' + $dossier + '*') -and $_.CommandLine -like '* /k *' } | ForEach-Object { & taskkill /PID $_.ProcessId /T /F 2>$null | Out-Null; $n++ };" ^
  "if ($n -gt 0) { Write-Host ('   ' + $n + ' console(s) fermee(s)') };" ^
  "if ($restants.Count -gt 0) { Write-Host ''; Write-Host ('   [ATTENTION] encore occupe : ' + ($restants -join ', ')); exit 1 };" ^
  "Write-Host ''; Write-Host '   [OK] tous les ports sont libres.'; exit 0"

if errorlevel 1 (
    echo.
    echo  L'arret n'est pas complet. Pour voir qui tient encore un port :
    echo      netstat -ano ^| findstr ":3001 "
    echo.
    pause
    exit /b 1
)

echo.
echo  Termine.
pause
exit /b 0
