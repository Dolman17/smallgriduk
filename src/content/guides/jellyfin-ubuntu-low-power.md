---
title: "Install Jellyfin on Ubuntu: Low-Power Setup, Media Folders and Permissions"
description: "Install Jellyfin on Ubuntu, create media folders, fix permission denied errors, survive reboots, and build a reliable low-power home media server."
pubDate: 2026-01-20
updatedDate: 2026-07-08
tags: ["jellyfin", "ubuntu", "low-power", "media", "permissions", "installation"]
cover: "/images/guides/jellyfin-ubuntu-low-power-hero.webp"
---

## Quick answer

A reliable low-power Jellyfin setup on Ubuntu needs four things:

1. Jellyfin installed as a system service.
2. Media stored in a stable path such as `/mnt/media` or `/srv/media`.
3. The `jellyfin` user given read and execute access.
4. The media disk mounted automatically before Jellyfin starts.

The basic permission test is:

```bash
sudo -u jellyfin ls -la /mnt/media
```

If that returns `Permission denied`, fix the folder access before rescanning or reinstalling Jellyfin.

For a normal ext4 media folder, the practical ACL fix is:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Replace `/mnt/media` with your actual media path.

---

## What this setup is designed for

This guide builds a Jellyfin server that is:

- reliable after reboots
- suitable for a small mini PC or older desktop
- simple to maintain
- clear about Linux folder permissions
- focused on Direct Play rather than unnecessary transcoding

The target is not a complicated media stack. It is a server that starts, sees the media, scans correctly, and stays quiet.

---

## What you need

- Ubuntu 22.04 or newer
- SSH or terminal access
- permission to use `sudo`
- a media folder or mounted disk
- another device with a web browser

This guide uses:

```text
Media path: /mnt/media
Server IP:  192.168.1.50
```

Adjust both values for your environment.

---

## 1. Install Jellyfin on Ubuntu

Update Ubuntu and install the repository tools:

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
sudo systemctl enable --now jellyfin
sudo systemctl status jellyfin --no-pager
```

You want to see:

```text
active (running)
```

If the service is not running, inspect the logs before adding libraries:

```bash
sudo journalctl -u jellyfin --no-pager -n 100
```

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

Complete the setup wizard:

1. Create an administrator account.
2. Choose the language and region.
3. Skip adding libraries temporarily.

Set up the media folders and permissions first. That prevents the common situation where Jellyfin installs correctly but the folder picker is empty.

---

## 3. Create a simple media folder structure

Use a stable server path:

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

Recommended naming examples:

```text
/mnt/media/movies/Blade Runner (1982)/Blade Runner (1982).mkv
/mnt/media/tv/The Expanse/Season 01/The Expanse - S01E01 - Dulcinea.mkv
```

Avoid storing a shared Jellyfin library inside a personal home folder unless you understand the parent-folder permissions.

Better long-term locations include:

```text
/mnt/media
/srv/media
```

---

## 4. Give Jellyfin access to the media folders

Jellyfin normally runs as the Linux user `jellyfin`.

Confirm it:

```bash
id jellyfin
```

Test the media path as that user:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

If those commands list the folders, Jellyfin can read them.

If they return `Permission denied`, inspect the complete path:

```bash
namei -l /mnt/media/movies
```

Jellyfin needs execute permission on every parent directory so it can traverse the path.

### Apply safer ACL access

Install ACL support:

```bash
sudo apt install -y acl
```

Grant read and execute access to existing files and folders:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
```

Set a default ACL for newly copied files:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

Restart Jellyfin:

```bash
sudo systemctl restart jellyfin
```

Verify the result:

```bash
getfacl /mnt/media
sudo -u jellyfin ls -la /mnt/media
```

For a deeper permissions workflow, read [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## 5. Check mounted drives before adding libraries

If the media is on another disk, USB drive, or NAS share, confirm it is mounted:

```bash
findmnt /mnt/media
lsblk -f
```

Inspect the path:

```bash
ls -la /mnt/media
```

A mount-point directory can exist even when the real disk is not mounted. Jellyfin then scans an empty folder.

Check the filesystem and options:

```bash
findmnt -no SOURCE,FSTYPE,OPTIONS /mnt/media
```

For permanent storage, use a stable UUID entry in `/etc/fstab` rather than a desktop auto-mount path.

If the media works before reboot but disappears afterwards, the mount is the first thing to investigate.

---

## 6. Add the media libraries in Jellyfin

Open:

```text
Dashboard → Libraries → Add Media Library
```

Use the real Linux paths:

```text
Movies:   /mnt/media/movies
TV Shows: /mnt/media/tv
Music:    /mnt/media/music
```

Save each library and run a scan.

If the folder picker is empty or the scan finds nothing, repeat:

```bash
sudo -u jellyfin ls -la /mnt/media
```

Do not change metadata settings or reinstall Jellyfin until the service user can list the files.

For a complete empty-library diagnosis, use [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/).

---

## 7. Fix new files that do not appear

A common pattern is:

- older media appears
- newly added episodes or films do not

This normally means the new files were created by another service with different ownership or permissions.

Test a new folder:

```bash
sudo -u jellyfin ls -la "/mnt/media/tv/New Show"
```

Compare the ACLs:

```bash
getfacl "/mnt/media/tv/Working Show"
getfacl "/mnt/media/tv/New Show"
```

The default ACL applied earlier should help future files inherit access.

If Sonarr, Radarr, qBittorrent, or another service creates the files, also inspect its user, group, and umask.

Use [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/) for the full workflow.

---

## 8. Use file names Jellyfin can identify

### Movies

```text
Movie Name (Year)/Movie Name (Year).ext
```

Example:

```text
movies/Dune (2021)/Dune (2021).mkv
```

### TV shows

```text
Show Name/Season 01/Show Name - S01E01 - Episode Title.ext
```

Example:

```text
tv/The Expanse/Season 01/The Expanse - S01E01 - Dulcinea.mkv
```

Poor naming usually causes incorrect identification rather than an entirely empty library, but clean naming avoids a large amount of manual correction.

---

## 9. Keep the server low power

For a small Jellyfin server, prioritise:

- Direct Play on capable clients
- an SSD for Ubuntu and Jellyfin metadata
- wired Ethernet
- sensible CPU power settings
- spinning disks only when needed
- hardware transcoding only where there is a real requirement

The server does very little work during Direct Play. Transcoding moves video conversion back to the CPU or GPU and increases power use.

Before changing hardware, read [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/) and [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/).

---

## 10. Optional hardware transcoding

If your server has a supported Intel iGPU or NVIDIA GPU, hardware acceleration can reduce CPU load when transcoding is necessary.

For Intel hardware, install the VAAPI tools:

```bash
sudo apt install -y vainfo intel-media-va-driver-non-free
vainfo | grep -i "driver"
```

Then open:

```text
Dashboard → Playback → Transcoding
```

For a typical Intel VAAPI setup, the render device is:

```text
/dev/dri/renderD128
```

Enable only the codecs your hardware supports and test one file at a time.

Use [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/) for the detailed setup.

---

## 11. Make sure Jellyfin survives reboots

Check whether the service is enabled:

```bash
sudo systemctl is-enabled jellyfin
```

If necessary:

```bash
sudo systemctl enable jellyfin
```

Reboot once:

```bash
sudo reboot
```

After the server returns, verify:

```bash
systemctl status jellyfin --no-pager
findmnt /mnt/media
sudo -u jellyfin ls -la /mnt/media
```

Then open:

```text
http://YOUR-SERVER-IP:8096
```

Confirm that Jellyfin loads and the media libraries remain visible.

---

## Exact verification checklist

Run:

```bash
systemctl status jellyfin --no-pager
id jellyfin
findmnt /mnt/media
namei -l /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
getfacl /mnt/media
```

Then check:

- Jellyfin loads on port 8096
- the media disk remains mounted after reboot
- the `jellyfin` user can list every library folder
- existing media appears
- newly copied media appears after a scan
- logs do not show permission or path errors

---

## Related guides

- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/)
- [Remote Access Without Port Forwarding: Jellyfin and Tailscale](/guides/jellyfin-tailscale-remote-access/)

---

## Recap

A reliable Ubuntu Jellyfin server depends more on stable paths, mounts, and permissions than on powerful hardware.

Install Jellyfin as a service, store media under `/mnt` or `/srv`, test access as the `jellyfin` user, apply default ACLs, verify the disk after reboot, and prefer Direct Play wherever possible.