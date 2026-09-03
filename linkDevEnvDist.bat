@echo off
mklink /J %localappdata%\FoundryVTT\Data\systems\dimensionalwar %cd%\dist
mklink /J G:\herd\www\foundry-vtt-server-data\Data\systems\dimensionalwar %cd%\dist