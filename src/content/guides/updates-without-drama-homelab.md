---
title: "Updates Without Drama: Keeping Your Homelab Patched Safely"
description: "A simple update routine for homelabs that keeps things secure without breaking everything every weekend."
pubDate: 2026-01-21
tags: ["updates", "maintenance", "homelab", "security"]
cover: "/images/guides/updates-hero.svg"
---

## Goal

Have a **repeatable update routine** that:

- keeps the OS and apps patched
- minimises surprise downtime
- lets you roll back when something breaks

“Secure enough” without “I updated and everything is on fire”.

---

## 1. The basic rhythm

Weekly or bi-weekly is plenty for most home setups:

1. Check status / disk space  
2. Update OS packages  
3. Update containers / apps  
4. Restart what needs restarting  
5. Quick smoke-test of key services  

Try to do it at **roughly the same time** so your household knows when “TV might reset”.

---

## 2. OS updates (Debian/Ubuntu)

Before you touch anything, check space:

```bash
df -h
Then:

bash
Copy code
sudo apt update
sudo apt full-upgrade -y
If a new kernel or core libraries are installed, reboot:

bash
Copy code
sudo reboot
You can also use unattended-upgrades for security patches only:

bash
Copy code
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
That handles the boring security fixes in the background.

3. Docker updates (without losing everything)
For a Docker-based stack:

Keep all your services defined in docker-compose.yml files.

Back up your config/data volumes.

Pull and restart.

Example global update script:

bash
Copy code
#!/usr/bin/env bash
set -e

cd /srv/docker

for stack in */ ; do
  cd "$stack"
  echo "Updating stack: $stack"
  docker compose pull
  docker compose up -d
  cd ..
done
Run it:

bash
Copy code
chmod +x /usr/local/bin/update-docker-stacks.sh
sudo /usr/local/bin/update-docker-stacks.sh
4. Proxmox updates (if you’re using it)
On the Proxmox host via SSH:

bash
Copy code
apt update
apt full-upgrade -y
Reboot if:

kernel updated

Proxmox core packages changed

Before a big host update, it’s often worth:

shutting down non-critical VMs

taking an extra backup of important VMs

5. Have a rollback plan
For important services:

Proxmox:

use snapshots or have a recent backup

Docker:

keep your old images for a bit:

after an update, don’t run docker image prune -a immediately

Config:

use git for important config directories if you’re feeling fancy

Example: if a new Jellyfin image is broken:

bash
Copy code
docker ps   # get container name
docker images jellyfin/jellyfin

# Recreate with a known-good tag:
docker compose down
# edit docker-compose.yml to use e.g. "10.9.3" instead of "latest"
docker compose up -d
6. Smoke tests after updating
After updates, test the stuff you actually care about:

Jellyfin:

Can you log in?

Can you play something for 30 seconds?

DNS / Pi-hole:

Does general browsing still work?

Remote access:

Can you still reach things over Tailscale?

If something is broken, fix/rollback now, not two days later when someone wants to watch something.

7. What not to do
Don’t auto-update everything with zero oversight.

Don’t run ancient, never-updated images either.

Don’t update stuff right before:

travelling

guests

big streaming night

Pick low-risk windows.

8. Recap: SmallGrid update rule
Small, regular updates beat giant yearly upgrades of doom.

OS, then Docker/Proxmox, then apps.

Always have at least one way back if the new version is a lemon.

If updating feels like a non-event, you’re doing it right.