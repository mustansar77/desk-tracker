; Runs on every install/upgrade. Older builds used asar packaging (an
; app.asar file); Electron always prefers app.asar over the app/ folder if
; both are present, so a leftover app.asar from a previous version silently
; shadows the new build. Kill any running instance first (so its files
; aren't locked) and delete old asar artifacts before the new files land.

!macro customInit
  nsExec::Exec 'taskkill /F /IM "Desk Tracker.exe" /T'
!macroend

!macro customInstall
  RMDir /r "$INSTDIR\resources\app.asar.unpacked"
  Delete "$INSTDIR\resources\app.asar"
!macroend
