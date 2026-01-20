---
title: "Jellyfin on Ubuntu (Low-Power Setup That Just Works)"
description: "A practical Jellyfin install with sane folder permissions, libraries, and optional hardware transcoding."
pubDate: 2026-01-20
tags: ["jellyfin", "ubuntu", "low-power", "media"]
---

## Goal

Install Jellyfin on Ubuntu with a setup that’s:

- reliable  
- low-maintenance  
- friendly to low-power hardware

…and doesn’t turn into a weekend-long troubleshooting session.

---

## What you’ll need

- Ubuntu 22.04+ (server or desktop)
- SSH access to the box
- A media disk/folder (local disk or network share)
- A browser on another machine on the same network

For the rest of this guide we’ll assume:

- your media lives at `/mnt/media`
- the server’s IP is `192.168.x.x`

Adjust paths/IPs as needed.

---

## 1. Install Jellyfin on Ubuntu

First, update packages and add the Jellyfin repo.

<div class="terminal">
  <div class="terminal__bar">
    <div class="terminal__dots">
      <span class="terminal__dot red"></span>
      <span class="terminal__dot amber"></span>
      <span class="terminal__dot green"></span>
    </div>
    <div class="terminal__title">Install Jellyfin (Ubuntu 22.04+)</div>
  </div>

  <pre><code>$ sudo apt update
$ sudo apt install -y apt-transport-https ca-certificates curl gnupg

$ curl -fsSL https://repo.jellyfin.org/jellyfin_team.gpg.key \
  | sudo gpg --dearmor -o /usr/share/keyrings/jellyfin.gpg

$ echo "deb [signed-by=/usr/share/keyrings/jellyfin.gpg] https://repo.jellyfin.org/ubuntu \
  $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/jellyfin.list

$ sudo apt update
$ sudo apt install -y jellyfin</code></pre>
</div>

### Check the service is running

~~~bash
sudo systemctl enable jellyfin
sudo systemctl start jellyfin
sudo systemctl status jellyfin --no-pager
~~~

You want to see `active (running)` in the status output.

If it’s not running, fix that **before** doing anything else:

- double-check the repo commands
- re-run `sudo apt update && sudo apt install -y jellyfin`

---

## 2. Access the Jellyfin web UI

On a device on the same network, open a browser and go to:

- `http://YOUR-SERVER-IP:8096`

Example:

- `http://192.168.1.50:8096`

You should see the Jellyfin setup wizard.

Walk through:

1. Create an **admin user** with a strong password.
2. Choose your **language / region**.
3. Skip adding libraries for a moment — we’ll set up folders and permissions first.

---

## 3. Set up media folders (the future pain-avoidance bit)

The goal: Jellyfin can read your media folders without you fighting permissions on every new drive.

We’ll assume:

- main media mount: `/mnt/media`
- inside that, you use:
  - `/mnt/media/movies`
  - `/mnt/media/tv`
  - `/mnt/media/music` (optional)

Create folders (if they don’t exist):

~~~bash
sudo mkdir -p /mnt/media/movies
sudo mkdir -p /mnt/media/tv
sudo mkdir -p /mnt/media/music
~~~

### Give Jellyfin read access

On Ubuntu, the `jellyfin` service runs as the `jellyfin` user and group.

We’ll:

- make the `jellyfin` group own the folder
- give group read+execute permissions

~~~bash
# Set group to 'jellyfin'
sudo chgrp -R jellyfin /mnt/media

# Owner: read/write/execute; Group: read/execute; Others: no access
sudo chmod -R 750 /mnt/media
~~~

This means:

- your own user can still manage files (if you’re the owner)
- Jellyfin can read everything inside `/mnt/media`
- the rest of the world on that box gets nothing

If your media comes from a NAS / network share, make sure that share is mounted with permissions that map cleanly to Linux users (or use a dedicated Jellyfin mount later).

---

## 4. Point Jellyfin at your media

Back in the Jellyfin web UI:

1. Go to **Dashboard → Libraries → Add Media Library**
2. Choose a **content type**:
   - Movies → `/mnt/media/movies`
   - TV Shows → `/mnt/media/tv`
   - Music → `/mnt/media/music`
3. Save each library.

Jellyfin will start a library scan. Depending on the size of your collection, this may take a while.

---

## 5. File naming that “just works”

Jellyfin’s metadata depends heavily on file/folder names.

### Movies

Recommended:

- `Movie Name (Year)/Movie Name (Year).ext`

Examples:

- `movies/Blade Runner (1982)/Blade Runner (1982).mkv`
- `movies/Dune (2021)/Dune (2021).mp4`

### TV shows

Recommended:

- `Show Name/Season 01/Show Name - S01E01 - Episode Title.ext`

Example:

- `tv/The Expanse/Season 01/The Expanse - S01E01 - Dulcinea.mkv`

You don’t **have** to be perfect, but this pattern avoids 90% of the “why is metadata wrong?” pain.

---

## 6. Optional: hardware-accelerated transcoding (low-power win)

If your box has an Intel iGPU (Quick Sync) or a compatible NVIDIA GPU, you can offload transcoding and keep CPU usage/power down.

### 6.1 Enable Intel Quick Sync (common small-grid case)

Install extra VAAPI bits:

~~~bash
sudo apt install -y vainfo intel-media-va-driver-non-free
vainfo | grep -i "driver"
~~~

`vainfo` should print something sensible (not just errors).

Then in Jellyfin:

1. Go to **Dashboard → Playback → Transcoding**
2. Set **Hardware acceleration** to:
   - VAAPI
3. VAAPI device path:
   - `/dev/dri/renderD128` (common default)

Start with **H.264** hardware decoding/encoding enabled; expand later only if needed.

> If this feels flaky or your hardware is weird, it’s perfectly fine to leave hardware acceleration **off**. For direct play it’s often not needed.

---

## 7. Make sure it survives reboots

If you installed via the official repo, Jellyfin is already set to start on boot. To be sure:

~~~bash
sudo systemctl is-enabled jellyfin
~~~

If it doesn’t say `enabled`, run:

~~~bash
sudo systemctl enable jellyfin
~~~

Reboot once to confirm:

~~~bash
sudo reboot
~~~

After the reboot, visit `http://YOUR-SERVER-IP:8096` again and make sure Jellyfin is alive.

---

## 8. Next: safe remote access

For SmallGrid-style setups, the default remote access recommendation is:

- no exposed ports
- use a private mesh network like **Tailscale** to reach Jellyfin from outside your house

See the follow-up guide:

- **Remote Access Without Port Forwarding: Jellyfin + Tailscale** (`/guides/jellyfin-tailscale-remote-access/`)

---

## Recap

By now you should have:

- Jellyfin running on Ubuntu  
- media in `/mnt/media/...` with sane permissions  
- libraries set up and scanning  
- optional hardware transcoding configured (or safely ignored for now)

From here, you can start refining:

- better metadata  
- multiple user accounts for family  
- backups of Jellyfin’s config and database  

You now have a **low-power, low-drama** media server instead of a mysterious box that sometimes works.
