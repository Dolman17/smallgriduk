---
title: "Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions"
description: "Install Jellyfin on Ubuntu, give it access to your media folders, and avoid the usual Linux permissions problems."
pubDate: 2026-01-20
tags: ["jellyfin", "ubuntu", "low-power", "media"]
cover: "/images/guides/jellyfin-ubuntu-low-power-hero.webp"
---

## Goal

Install Jellyfin on Ubuntu with a setup that is:

- reliable
- low-maintenance
- friendly to low-power hardware
- clear about media folder permissions

The aim is simple: Jellyfin should start, see your media, survive reboots, and not become a second job.

---

## What you’ll need

- Ubuntu 22.04 or newer, server or desktop
- SSH access to the machine
- A media disk or folder
- A browser on another device on the same network

For the rest of this guide we’ll assume:

- your media lives at `/mnt/media`
- the server’s IP address is `192.168.1.50`

Adjust paths and IP addresses to match your own setup.

---

## 1. Install Jellyfin on Ubuntu

First, update Ubuntu and install the packages needed to add the Jellyfin repository.

```bash
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
```

Add the Jellyfin signing key:

```bash
curl -fsSL https://repo.jellyfin.org/jellyfin_team.gpg.key \
  | sudo gpg --dearmor -o /usr/share/keyrings/jellyfin.gpg
```

Add the Jellyfin repository:

```bash
echo "deb [signed-by=/usr/share/keyrings/jellyfin.gpg] https://repo.jellyfin.org/ubuntu $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/jellyfin.list
```

Install Jellyfin:

```bash
sudo apt update
sudo apt install -y jellyfin
```

Enable and start the service:

```bash
sudo systemctl enable jellyfin
sudo systemctl start jellyfin
sudo systemctl status jellyfin --no-pager
```

You want to see `active (running)`.

If Jellyfin is not running, fix that before adding libraries or changing network settings.

---

## 2. Open the Jellyfin web interface

On another device on the same network, open:

```text
http://YOUR-SERVER-IP:8096
```

Example:

```text
http://192.168.1.50:8096
```

You should see the Jellyfin setup wizard.

Walk through the first setup screens:

1. Create an admin user with a strong password.
2. Choose your language and region.
3. Skip adding libraries for the moment.

Set up folders and permissions first. This avoids the common problem where Jellyfin installs correctly but cannot see your media.

---

## 3. Create media folders

We’ll use a simple folder layout:

```text
/mnt/media/
  movies/
  tv/
  music/
```

Create the folders:

```bash
sudo mkdir -p /mnt/media/movies
sudo mkdir -p /mnt/media/tv
sudo mkdir -p /mnt/media/music
```

Put your media files into the right folders before adding them to Jellyfin.

Recommended examples:

```text
/mnt/media/movies/Blade Runner (1982)/Blade Runner (1982).mkv
/mnt/media/tv/The Expanse/Season 01/The Expanse - S01E01 - Dulcinea.mkv
```

Good naming fixes more Jellyfin problems than most people expect.

---

## 4. How to give Jellyfin access to your media folders on Ubuntu

On Ubuntu, Jellyfin usually runs as the `jellyfin` user.

Check that first:

```bash
id jellyfin
```

If Jellyfin cannot see your media folder, the problem is usually Linux permissions, not Jellyfin itself.

The safest beginner-friendly fix is to give the `jellyfin` user read and execute access to the media folder using ACLs.

Install ACL support if needed:

```bash
sudo apt install -y acl
```

Give Jellyfin access to the existing folders and files:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
```

Set default permissions so new files and folders inherit the same access:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

Restart Jellyfin:

```bash
sudo systemctl restart jellyfin
```

Then check the service:

```bash
systemctl status jellyfin --no-pager
```

This approach means:

- your normal user can still manage the media files
- Jellyfin can read the library
- you do not need to make the whole folder world-readable

If your media folder is somewhere else, replace `/mnt/media` with your own path.

---

## 5. Why Jellyfin cannot see your media folder

The most common causes are:

- Jellyfin does not have permission to read the folder.
- Jellyfin can read the folder but not the parent directory.
- The media disk is mounted with restrictive permissions.
- A network share is mounted as the wrong user.
- The files are inside a user home folder such as `/home/sean/media` without traversal permissions.

A quick check:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

If those commands fail with `Permission denied`, Jellyfin will not be able to scan the library.

Re-apply the ACL commands:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

For a deeper permissions-only walkthrough, see: [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## 6. Point Jellyfin at your media

Back in the Jellyfin web interface:

1. Go to **Dashboard → Libraries → Add Media Library**.
2. Choose a content type.
3. Add the matching folder path.

Use:

```text
Movies:   /mnt/media/movies
TV Shows: /mnt/media/tv
Music:    /mnt/media/music
```

Save each library and let Jellyfin scan.

If the folder picker is empty or the scan finds nothing, go back to the permissions section before changing anything else.

---

## 7. File naming that works well in Jellyfin

Jellyfin’s metadata matching depends heavily on file and folder names.

### Movies

Use:

```text
Movie Name (Year)/Movie Name (Year).ext
```

Examples:

```text
movies/Blade Runner (1982)/Blade Runner (1982).mkv
movies/Dune (2021)/Dune (2021).mp4
```

### TV shows

Use:

```text
Show Name/Season 01/Show Name - S01E01 - Episode Title.ext
```

Example:

```text
tv/The Expanse/Season 01/The Expanse - S01E01 - Dulcinea.mkv
```

You do not need perfection, but this pattern avoids most metadata issues.

---

## 8. Optional: hardware-accelerated transcoding

If your machine has an Intel iGPU or compatible NVIDIA GPU, you can offload transcoding and keep CPU usage lower.

For many low-power Jellyfin setups, direct play matters more than transcoding. Direct play means the client plays the file as-is, without the server converting it.

If most of your devices can direct play your media, you may not need hardware transcoding at all.

### Enable Intel Quick Sync

Install the VAAPI tools:

```bash
sudo apt install -y vainfo intel-media-va-driver-non-free
vainfo | grep -i "driver"
```

Then in Jellyfin:

1. Go to **Dashboard → Playback → Transcoding**.
2. Set **Hardware acceleration** to **VAAPI**.
3. Use VAAPI device path `/dev/dri/renderD128`.

Start conservatively. Enable H.264 first, test playback, and only expand the options when needed.

If this feels unreliable on your hardware, leave hardware acceleration off. A stable direct-play setup is better than a clever setup that breaks every other evening.

---

## 9. Make sure Jellyfin survives reboots

Check whether Jellyfin is enabled on boot:

```bash
sudo systemctl is-enabled jellyfin
```

If it does not say `enabled`, run:

```bash
sudo systemctl enable jellyfin
```

Reboot once:

```bash
sudo reboot
```

After the server comes back, visit:

```text
http://YOUR-SERVER-IP:8096
```

Confirm that Jellyfin still loads and the libraries are still visible.

---

## 10. Next steps

Useful follow-up guides:

- [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Remote Access Without Port Forwarding: Jellyfin + Tailscale](/guides/jellyfin-tailscale-remote-access/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [3-2-1 Backups for Home Servers](/guides/backups-3-2-1-home-server/)

For SmallGrid-style setups, the default remote access recommendation is simple: do not expose Jellyfin directly to the internet unless you have a very good reason. Use a private mesh network such as Tailscale instead.

---

## Recap

By now you should have:

- Jellyfin installed on Ubuntu
- media folders under `/mnt/media`
- Jellyfin permission to read those folders
- libraries added and scanning
- optional hardware transcoding configured or safely ignored
- Jellyfin enabled at boot

The key lesson: most “Jellyfin cannot see my media” problems are Linux permissions problems. Fix the folder access first, then tune the media server later.
