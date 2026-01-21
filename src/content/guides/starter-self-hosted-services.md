---
title: "First Things to Self-Host: A Sane Starter Stack"
description: "A practical starter stack for a small homelab: services that are worth running yourself and won’t eat your time."
pubDate: 2026-01-21
tags: ["homelab", "self-hosting", "beginner", "stack"]
---

## Goal

Pick a **small set of services** to self-host that:

- actually make your life better
- don’t require a full-time SRE to babysit
- run happily on a low-power box

This is a **starter stack**, not a “30 containers and 4 reverse proxies” situation.

---

## 1. The SmallGrid starter stack

Here’s a simple set of services that play nicely together:

1. **Media** – Jellyfin  
2. **Backups** – something to push data off the box (restic / Borg / plain rsync)  
3. **Network-level sanity** – Pi-hole or AdGuard Home  
4. **Remote access** – Tailscale  
5. **Sync** – Syncthing for your files across devices  

You can run all of these on:

- one mini PC, or  
- one Proxmox VM / LXC with Docker  

---

## 2. Jellyfin (media you actually control)

Jellyfin is your:

- films / TV / home videos / kids stuff
- served to TVs, phones, tablets

On a Debian/Ubuntu server:

```bash
# Example: Docker-based Jellyfin
mkdir -p /srv/docker/jellyfin
cd /srv/docker/jellyfin

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./config:/config
      - /mnt/media:/media
EOF

docker compose up -d
Point your browser at:

text
Copy code
http://YOUR-SERVER-IP:8096
Add your library paths and you’re done.

3. Backups (boring but important)
Pick something you can understand when tired:

rsync to a USB disk

restic to a local disk and/or cloud

Borg if you like dedup + archives

Example: quick rsync to a USB drive mounted at /mnt/usb-backup:

bash
Copy code
rsync -av --delete /srv/docker/ /mnt/usb-backup/docker/
rsync -av --delete /mnt/media/ /mnt/usb-backup/media/
Put that in a script and run it via cron or systemd timers.

4. Pi-hole / AdGuard Home (network-level ad-blocking)
DNS + ad-blocking in one place:

cut down noise on the network

easy to point devices at

Example: Pi-hole folder layout:

text
Copy code
/srv/docker/pihole/
  docker-compose.yml
  etc-pihole/
  etc-dnsmasq.d/
Compose file:

bash
Copy code
cd /srv/docker/pihole

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  pihole:
    image: pihole/pihole:latest
    container_name: pihole
    restart: unless-stopped
    environment:
      TZ: "Europe/London"
      WEBPASSWORD: "changeme"
    volumes:
      - ./etc-pihole:/etc/pihole
      - ./etc-dnsmasq.d:/etc/dnsmasq.d
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "80:80/tcp"
    cap_add:
      - NET_ADMIN
EOF

docker compose up -d
Then set your router’s DNS to the Pi-hole IP.

5. Tailscale (remote access without pain)
Install Tailscale on:

your homelab box

your laptop / phone

Then Jellyfin, Pi-hole, Proxmox, etc. are reachable via:

text
Copy code
http://TAIL_IP_SERVER:PORT
No port forwarding, no external DNS.

Install (on Ubuntu):

bash
Copy code
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
6. Syncthing (file sync without cloud drama)
Syncthing gives you:

peer-to-peer file sync between PCs, laptop, server

versioning, selective folders

On a Docker host:

bash
Copy code
mkdir -p /srv/docker/syncthing
cd /srv/docker/syncthing

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  syncthing:
    image: syncthing/syncthing:latest
    container_name: syncthing
    restart: unless-stopped
    ports:
      - "8384:8384"   # Web UI
      - "22000:22000" # Sync
      - "21027:21027/udp"
    volumes:
      - ./config:/var/syncthing
      - /srv/sync:/sync
EOF

docker compose up -d
Web UI:

text
Copy code
http://YOUR-SERVER-IP:8384
7. Recap: starter stack rules
Start with 5–6 services, not 25.

Make each one:

easy to back up

easy to restart

easy to ignore for weeks

Once this stack feels boring, you’re ready to add more toys.
Boring is the goal. Boring means “it just works”.