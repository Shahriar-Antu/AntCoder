; AntCoder Windows NSIS Installer
; Build with: makensis installer.nsi

!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "WinMessages.nsh"
!include "x64.nsh"

; ---------------------------------------------------------
; Configuration
; ---------------------------------------------------------
!define APP_NAME "AntCoder"
!define APP_VERSION "0.1.0"
!define APP_PUBLISHER "Shahriar-Antu"
!define APP_WEBSITE "https://github.com/Shahriar-Antu/AntCoder"
!define APP_EXE "antcoder.exe"

; ---------------------------------------------------------
; General Settings
; ---------------------------------------------------------
Name "${APP_NAME} ${APP_VERSION}"
OutFile "AntCoder-${APP_VERSION}-windows-x64-setup.exe"
InstallDir "$LOCALAPPDATA\${APP_NAME}"
InstallDirRegKey HKCU "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel user
Icon "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"

; ---------------------------------------------------------
; Pages
; ---------------------------------------------------------
Page directory
Page instfiles

UninstPage uninstConfirm
UninstPage instfiles

; ---------------------------------------------------------
; Languages
; ---------------------------------------------------------
!insertmacro MUI_LANGUAGE "English"

; ---------------------------------------------------------
; MUI Settings
; ---------------------------------------------------------
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; ---------------------------------------------------------
; Variables
; ---------------------------------------------------------
Var StartMenuFolder
Var PreviousInstallDir

; ---------------------------------------------------------
; Functions
; ---------------------------------------------------------
Function .onInit
  ; Check for previous installation
  ReadRegStr $PreviousInstallDir HKCU "Software\${APP_NAME}" "InstallDir"
  IfErrors 0 +2
  StrCpy $PreviousInstallDir ""
  Goto +1
  StrCpy $InstallDir $PreviousInstallDir
FunctionEnd

Function un.onInit
  ReadRegStr $InstallDir HKCU "Software\${APP_NAME}" "InstallDir"
FunctionEnd

; ---------------------------------------------------------
; Sections
; ---------------------------------------------------------
Section "Main" SEC_MAIN
  SetOutPath $InstallDir
  File /r "bin\*"

  ; Create uninstaller
  WriteUninstaller "$InstallDir\uninstall.exe"

  ; Registry entries
  WriteRegStr HKCU "Software\${APP_NAME}" "InstallDir" $InstallDir
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
    "DisplayName" "${APP_NAME} ${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
    "UninstallString" "$InstallDir\uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
    "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
    "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
    "URLInfoAbout" "${APP_WEBSITE}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
    "NoModify" "1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
    "NoRepair" "1"

  ; Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$InstallDir\${APP_EXE}" "" "$InstallDir\${APP_EXE}" 0
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$InstallDir\uninstall.exe" "" "$InstallDir\uninstall.exe" 0

  ; Desktop shortcut (optional)
  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$InstallDir\${APP_EXE}" "" "$InstallDir\${APP_EXE}" 0

  ; Add to PATH (user scope)
  ${GetEnvironmentVariable} $R0 "PATH" "HKCU"
  StrStr $R0 $InstallDir $R1
  ${If} $R1 == ""
    ${If} $R0 != ""
      StrCpy $R0 "$R0;$InstallDir"
    ${Else}
      StrCpy $R0 $InstallDir
    ${EndIf}
    ${SetEnvironmentVariable} "PATH" $R0 "HKCU"
    SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment"
  ${EndIf}

  ; Create models directory
  CreateDirectory "$APPDATA\antcoder\models"
SectionEnd

; ---------------------------------------------------------
; Uninstaller
; ---------------------------------------------------------
Section "Uninstall"
  ; Remove from PATH
  ${GetEnvironmentVariable} $R0 "PATH" "HKCU"
  ${ReplaceInString} $R0 "$InstallDir;" ""
  ${ReplaceInString} $R0 ";$InstallDir" ""
  ${ReplaceInString} $R0 "$InstallDir" ""
  ${SetEnvironmentVariable} "PATH" $R0 "HKCU"
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment"

  ; Remove files
  Delete "$InstallDir\*.*"
  RMDir /r "$InstallDir"

  ; Remove shortcuts
  Delete "$SMPROGRAMS\${APP_NAME}\*.*"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  Delete "$DESKTOP\${APP_NAME}.lnk"

  ; Remove registry
  DeleteRegKey HKCU "Software\${APP_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd