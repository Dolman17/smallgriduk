---
title: "Jellyfin on Ubuntu (Low-Power Setup That Just Works)"
description: "A practical Jellyfin install with sane folder permissions, libraries, and optional hardware transcoding."
pubDate: 2026-01-20
tags: ["jellyfin", "ubuntu", "low-power", "media"]
---

## Goal
Install Jellyfin on Ubuntu with a setup that’s reliable, efficient, and easy to maintain.

## What you’ll need
- Ubuntu 22.04+ (server or desktop)
- SSH access
- A media disk/folder (local or network share)

## Install Jellyfin
Run:

```bash
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg
curl -fsSL https://repo.jellyfin.org/jellyfin_team.gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/jellyfin.gpg
echo "deb [signed-by=/usr/share/keyrings/jellyfin.gpg] https://repo.jellyfin.org/ubuntu $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/jellyfin.list
sudo apt update
sudo apt install -y jellyfin
