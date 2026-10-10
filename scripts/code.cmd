@echo off
rem Named code.cmd so Windows editor launchers pass file:line. This is not VS Code.
node "%~dp0open-in-editor.mjs" %*
