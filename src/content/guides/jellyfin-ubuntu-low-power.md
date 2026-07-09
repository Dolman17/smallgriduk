---
title: "Install Jellyfin on Ubuntu: Low-Power Setup, Media Folders and Permissions"
description: "Install Jellyfin on Ubuntu, create media folders, fix permission denied errors, survive reboots, and build a reliable low-power home media server."
pubDate: 2026-01-20
updatedDate: 2026-07-09
tags: ["jellyfin", "ubuntu", "low-power", "media", "permissions", "installation"]
cover: "/images/guides/jellyfin-ubuntu-low-power-hero.webp"
---

## Quick answer

A reliable low-power Jellyfin server on Ubuntu needs five things:

1. Jellyfin installed as a managed service.
2. Media stored at a stable server path.
3. The Jellyfin service account able to read every library folder.
4. Storage mounted before Jellyfin scans it.
5. Clients capable of Direct Play for the formats you actually use.

The most useful permission test is:

```bash
sudo -u jellyfin ls -la /mnt/media
```

The most useful reboot checks are:

```bash
systemctl status jellyfin --no-pager
findmnt /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

Do not optimise power consumption until the server reliably starts, mounts its storage, sees the files, and survives a reboot.

---

## What this guide covers

This guide builds a native Ubuntu Jellyfin installation intended for a mini PC, small desktop, or other always-on home server.

It covers:

- installation and service checks
- a maintainable media-folder layout
- native Ubuntu permissions and ACLs
- persistent storage mounts
- adding and verifying libraries
- keeping Direct Play as the default goal
- optional hardware transcoding
- reboot and recovery checks
- a repeatable verification record

For Docker, use the Docker-specific guides because container paths and user IDs change the permission model.

---

## SmallGrid verification environment

SmallGrid's current media environment uses Ubuntu Server with Jellyfin and related media services on Linux. The production setup is containerised and stores television media under a MergerFS-backed path, but the same reliability checks apply to a native installation:

- service or container status
- stable media paths
- mounted storage
- direct file access from the Jellyfin process
- library scan results
- playback mode
- restart and reboot survival

The example native path in this guide is `/mnt/media`. Replace it with the path actually used by your server.

No power-consumption figure is claimed here without a wall-meter measurement. “Low power” means designing the server to avoid unnecessary work, especially avoidable video transcoding.

---

## Build decision table

| Decision | Recommended starting point | Reason |
|---|---|---|
| Operating system | Current Ubuntu Server LTS | Stable package and service management |
| System disk | SSD | Faster metadata, database, updates, and lower idle noise |
| Media path | `/mnt/media` or `/srv/media` | Clear shared-service location |
| Network | Wired Ethernet | More predictable high-bitrate playback |
| Playback target | Direct Play | Lowest server processing requirement |
| 1080p format target | H.264 with AAC or AC3 | Broad client compatibility |
| 4K format target | HEVC only where clients support it | Saves space without forcing server conversion |
| Permissions | Read/execute ACL for `jellyfin` | Avoids changing the main owner |
| Permanent disks | UUID-based `/etc/fstab` mount | Stable after device-name changes and reboot |
| Transcoding | Hardware acceleration only when required | Reduces CPU load but adds setup complexity |

---

## What you need

- Ubuntu Server 22.04 or newer
- SSH or local terminal access
- a user with `sudo`
- a stable media disk or folder
- another device with a browser
- preferably wired networking

This guide uses:

```text
Media path: /mnt/media
Server IP:  192.168.1.50
Web port:   8096
```

Adjust every value for your environment.

---

## Step 1: Record the starting environment

Before installing Jellyfin, record the system:

```bash
cat /etc/os-release
uname -r
lscpu | sed -n '1,20p'
lsblk -o NAME,SIZE,FSTYPE,MODEL,MOUNTPOINTS
ip -brief address
```

Keep this with your server notes. It makes later troubleshooting and guide updates more precise.

Check the current date and timezone:

```bash
timedatectl
```

Correct time matters for logs, scheduled tasks, certificates, and backup records.

---

## Step 2: Install Jellyfin

Update Ubuntu and install repository tools:

```bash
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
```

Add the Jellyfin signing key:

```bash
curl -fsSL https://repo.jellyfin.org/jellyfin_team.gpg.key \
  | sudo gpg --dearmor -o /usr/share/keyrings/jellyfin.gpg
```

Add the repository:

```bash
echo "deb [signed-by=/usr/share/keyrings/jellyfin.gpg] https://repo.jellyfin.org/ubuntu $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/jellyfin.list
```

Install and start Jellyfin:

```bash
sudo apt update
sudo apt install -y jellyfin
sudo systemctl enable --now jellyfin
```

Verify:

```bash
systemctl status jellyfin --no-pager
systemctl is-enabled jellyfin
```

You want an active service and an enabled startup state.

Check the installed version:

```bash
jellyfin --version
```

Record that version with the date the guide was followed.

---

## Step 3: Open the setup interface

From another device on the same network, open:

```text
http://YOUR-SERVER-IP:8096
```

Example:

```text
http://192.168.1.50:8096
```

Complete the administrator and regional settings, but add the media libraries only after the storage and permissions checks below.

That prevents the common situation where Jellyfin installs correctly but the folder picker is empty or a scan finds nothing.

---

## Step 4: Create a stable media structure

A simple layout is:

```text
/mnt/media/
  movies/
  tv/
  music/
```

Create it:

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

Avoid shared libraries inside a personal home directory unless you understand every parent directory's traversal permissions.

---

## Step 5: Confirm the storage is mounted

For media on another disk, USB device, NAS share, or pooled filesystem, check:

```bash
findmnt /mnt/media
lsblk -f
ls -la /mnt/media
```

A mount-point directory can exist even when the actual storage is absent. In that state Jellyfin scans the empty directory underneath it.

Inspect the active filesystem and options:

```bash
findmnt -no TARGET,SOURCE,FSTYPE,OPTIONS /mnt/media
```

For permanent disks, use a UUID-based entry in `/etc/fstab`.

After editing `/etc/fstab`, validate it before rebooting:

```bash
sudo mount -a
findmnt /mnt/media
```

Do not continue until the expected files appear at the host path.

---

## Step 6: Give Jellyfin access

Confirm the service account:

```bash
id jellyfin
```

Test the paths as that user:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

If access fails, inspect the full path:

```bash
namei -l /mnt/media/movies
```

For a normal ext4 library, install ACL support and grant read/execute access:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Verify the result:

```bash
getfacl /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

Use [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/) for the complete permission workflow.

---

## Step 7: Add the libraries

In Jellyfin, open:

```text
Dashboard → Libraries → Add Media Library
```

Use the real native Ubuntu paths:

```text
Movies:   /mnt/media/movies
TV Shows: /mnt/media/tv
Music:    /mnt/media/music
```

Save each library and run a scan.

If a scan completes almost immediately or finds nothing, do not reinstall Jellyfin. Repeat the direct service-user and mount checks.

Use [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/) for the diagnostic decision tree.

---

## Step 8: Check new-file inheritance

Old files may appear while new Sonarr, Radarr, download-client, or manually copied files remain invisible.

Compare a working and missing folder:

```bash
ls -ld "/mnt/media/tv/Working Show"
ls -ld "/mnt/media/tv/New Show"
getfacl "/mnt/media/tv/Working Show"
getfacl "/mnt/media/tv/New Show"
```

Test the new path directly:

```bash
sudo -u jellyfin ls -la "/mnt/media/tv/New Show"
```

The default ACL created earlier should allow future folders to inherit Jellyfin access. Also check the creating service's user, group, and umask.

---

## Step 9: Make Direct Play the default goal

Direct Play sends the original file to the client without converting the video.

For broad 1080p compatibility, start with:

```text
Container: MP4 or MKV
Video:     H.264
Audio:     AAC or AC3
Subtitles: SRT
```

For 4K, HEVC is practical only when the main clients support the exact profile, bit depth, HDR format, audio, and subtitles.

While a file plays, open the Jellyfin dashboard and record:

- Direct Play, Direct Stream, or Transcoding
- the stated conversion reason
- whether video or only audio is being converted
- whether subtitles trigger burn-in

Use [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/) before converting a library.

---

## Step 10: Keep the server genuinely low power

Prioritise changes that remove unnecessary work:

- choose clients that support the library formats
- use wired networking for high-bitrate playback
- keep the operating system and Jellyfin metadata on an SSD
- avoid converting video when Direct Play is possible
- use text subtitles instead of image subtitle burn-in where practical
- avoid background tasks that repeatedly rescan or process the whole library
- allow large media disks to follow a considered power policy
- measure at the wall before claiming a saving

Do not infer power consumption from CPU utilisation alone. A wall plug meter gives the useful whole-system figure.

When measuring, record:

| State | What to record |
|---|---|
| Idle | Server running with no playback |
| Direct Play | One representative local stream |
| Direct Stream | Container or audio remux scenario |
| Software transcode | One known incompatible file |
| Hardware transcode | Same file after acceleration is enabled |

Use the same file and client when comparing states.

---

## Step 11: Optional hardware transcoding

Enable hardware acceleration only when a real playback requirement remains after client and format testing.

For Intel graphics, inspect the device:

```bash
ls -la /dev/dri
```

Install diagnostic tools where appropriate:

```bash
sudo apt install -y vainfo intel-media-va-driver-non-free
vainfo
```

The common render device is:

```text
/dev/dri/renderD128
```

The `jellyfin` user must be able to access the render device. Check relevant groups:

```bash
id jellyfin
getent group render
getent group video
```

After enabling acceleration in Jellyfin, test one known transcoding file and inspect both the dashboard and logs.

Use [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/) for the detailed setup.

---

## Step 12: Verify restart and reboot survival

First restart Jellyfin:

```bash
sudo systemctl restart jellyfin
systemctl status jellyfin --no-pager
```

Then perform one controlled reboot:

```bash
sudo reboot
```

After the server returns, verify:

```bash
systemctl status jellyfin --no-pager
systemctl is-enabled jellyfin
findmnt /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
sudo journalctl -u jellyfin --no-pager -b -n 100
```

Open the web interface and confirm:

- Jellyfin loads
- the libraries remain present
- the storage contains the expected files
- a scan runs normally
- a known file plays

A server that works only before reboot is not complete.

---

## Worked verification record

Use a simple record after installation:

| Check | Evidence to capture | Result |
|---|---|---|
| Ubuntu and Jellyfin versions | `cat /etc/os-release` and `jellyfin --version` | Pass or fail |
| Service startup | `systemctl status jellyfin` | Pass or fail |
| Persistent storage | `findmnt /mnt/media` before and after reboot | Pass or fail |
| Service-user access | `sudo -u jellyfin find ...` | Pass or fail |
| Library scan | Previously absent item appears | Pass or fail |
| Direct Play | Dashboard shows playback mode | Pass or fail |
| New-file inheritance | Newly created folder remains readable | Pass or fail |
| Reboot recovery | Libraries and playback still work | Pass or fail |

Use real dates, versions, and results. Do not mark a check as passed because the instructions merely appear correct.

---

## Exact verification sequence

```bash
cat /etc/os-release
jellyfin --version
systemctl status jellyfin --no-pager
systemctl is-enabled jellyfin
id jellyfin
findmnt /mnt/media
namei -l /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
getfacl /mnt/media
sudo journalctl -u jellyfin --no-pager -n 100
```

Then verify in the interface:

1. Libraries use the exact Linux paths.
2. Existing media appears.
3. Newly copied media appears after a scan.
4. A representative file plays.
5. The dashboard shows the expected playback mode.
6. The same result remains after reboot.

---

## Related guides

- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/)
- [Best Video Format for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/)
- [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

A low-power Jellyfin server is primarily a reliable server that avoids unnecessary conversion work.

Install Jellyfin as a managed service, use stable storage paths, prove the service account can read the media, validate mounts before and after reboot, and test playback on the actual clients.

Measure power at the wall before and after a controlled change rather than relying on assumptions.
