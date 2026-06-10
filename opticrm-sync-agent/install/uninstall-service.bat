@echo off
set SERVICE_NAME=OptiCRMSyncAgent
nssm stop %SERVICE_NAME%
nssm remove %SERVICE_NAME% confirm
echo Service uninstalled.
