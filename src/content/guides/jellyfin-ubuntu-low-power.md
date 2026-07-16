---
title: "Jellyfin on Ubuntu: Low-Power Setup, Media Folders and Reboot Checks"
description: "Build a reliable low-power Jellyfin server on Ubuntu. Install Jellyfin, mount storage, fix media access, favour Direct Play, measure power, and verify the server after reboot."
pubDate: 2026-01-20
updatedDate: 2026-07-15
tags: ["jellyfin", "ubuntu", "low-power", "media", "permissions", "installation"]
cover: "/images/guides/jellyfin-ubuntu-low-power-hero.webp"
---

## Quick answer

A reliable low-power Jellyfin server on Ubuntu needs six things:

1. Jellyfin installed as a managed service.
2. Media stored at a stable server path.
3. Storage mounted before Jellyfin starts scanning.
4. The Jellyfin service account able to read every library folder.
5. Clients capable of Direct Play for the formats you actually use.
6. A measured power baseline rather than an assumed one.

The most useful access test is:

```bash
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

The most useful reboot checks are:

```bash
systemctl status jellyfin --no-pager
findmnt /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

Do not optimise power consumption until the service starts correctly, the storage is mounted, the files are readable, and the library survives a controlled reboot.

---

## What this guide covers

This is the complete native-Ubuntu build guide for a small, always-on Jellyfin server.

It covers:

- installing Jellyfin as a system service
- choosing a maintainable storage layout
- mounting media reliably
- granting the `jellyfin` account read access
- adding and validating libraries
- reducing avoidable transcoding
- measuring idle and playback power
- checking temperatures, storage and service health
- proving the build survives restart and reboot

It does not duplicate the full repair workflow for every failure type.

Use:

- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/) for detailed ACL and parent-directory diagnosis
- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/) for the broad empty-library decision tree
- [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/) for playback diagnosis
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/) when a required transcode needs acceleration

For Docker installations, use the Docker-specific guides because container paths and user IDs change the permission model.

---

## SmallGrid verification environment

SmallGrid's current media-server environment uses:

```text
Operating system: Ubuntu Server
Jellyfin runtime: Docker in production
Storage pool:     MergerFS
TV host path:     /srv/media_pool/TV
Container path:   /tv
Media services:   Jellyfin, Sonarr, Radarr and qBittorrent
Network:          Local Ethernet
Timezone:         Europe/London
```

The production system is containerised, but the reliability checks in this guide also apply to a native package installation:

- the service is active
- the storage is mounted
- the Jellyfin process can read real files
- the library path is correct
- playback mode is known
- the same state returns after reboot

At the last verified storage check, the active media branches contained **1,539 files**, and the host and Jellyfin-visible counts matched.

No wattage figure is claimed in this guide without a wall-meter measurement. “Low power” means avoiding unnecessary work and measuring the whole machine rather than guessing from CPU utilisation.

---

## Recommended starting design

| Decision | Recommended starting point | Reason |
|---|---|---|
| Operating system | Current Ubuntu Server LTS | Stable package and service management |
| System disk | SSD | Fast metadata access, quiet operation and responsive updates |
| Media path | `/mnt/media` or `/srv/media` | Clear location for shared service data |
| Network | Wired Ethernet | Predictable high-bitrate playback |
| Playback target | Direct Play | Lowest server processing requirement |
| 1080p target | H.264 with AAC or AC3 | Broad client compatibility |
| 4K target | HEVC only where clients support it | Saves storage without forcing conversion |
| Permissions | Read and execute ACL for `jellyfin` | Preserves the main owner while granting access |
| Permanent disks | UUID-based `/etc/fstab` mount | Stable after reboots and device-name changes |
| Transcoding | Hardware acceleration only when required | Reduces CPU load but adds configuration complexity |

A low-power design is mostly about removing unnecessary activity:

```text
Direct Play instead of video conversion
Stable mounts instead of failed rescans
SSD metadata instead of slow random access
Suitable clients instead of server upgrades
Measured changes instead of assumptions
```

---

## Step 1: Record the starting environment

Before changing the server, record its current state:

```bash
cat /etc/os-release
uname -r
lscpu | sed -n '1,25p'
free -h
lsblk -o NAME,SIZE,FSTYPE,MODEL,MOUNTPOINTS
ip -brief address
timedatectl
```

Check the graphics devices if hardware transcoding may be used later:

```bash
lspci | grep -Ei 'vga|display|3d'
ls -la /dev/dri 2>/dev/null
```

Keep this output with the date. It makes later troubleshooting, upgrades and power comparisons meaningful.

---

## Step 2: Install Jellyfin

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

Verify the service:

```bash
systemctl status jellyfin --no-pager
systemctl is-enabled jellyfin
systemctl show jellyfin -p User -p Group
jellyfin --version
```

Expected state:

```text
Service active:  yes
Starts at boot:  yes
Service user:    jellyfin
Version recorded: yes
```

---

## Step 3: Create a stable media layout

Use a shared-service path rather than a personal home directory:

```text
/mnt/media/
├── movies/
├── tv/
└── music/
```

Create the directories:

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

Avoid storing shared libraries below `/home/YOUR-USER` unless you understand every parent directory's traversal permissions.

---

## Step 4: Confirm the storage is mounted

A mount-point directory can exist even when the actual disk, share or pool is missing.

Check the active mount:

```bash
findmnt /mnt/media
findmnt -no SOURCE,TARGET,FSTYPE,OPTIONS /mnt/media
lsblk -f
find /mnt/media -maxdepth 3 -type f | head -20
```

Interpretation:

| Result | Meaning |
|---|---|
| `findmnt` shows the expected source | Storage is mounted at the intended target |
| Folder exists but `findmnt` shows nothing | Jellyfin may be scanning the empty mount-point directory |
| Files are absent | Fix the storage or import path before changing Jellyfin |
| Files are present | Continue to the service-user access test |

For permanent disks, use UUID-based entries in `/etc/fstab`.

After editing `/etc/fstab`, validate before rebooting:

```bash
sudo mount -a
findmnt /mnt/media
```

Do not continue until the expected files appear at the host path.

---

## Step 5: Give Jellyfin read access

Confirm the service account:

```bash
id jellyfin
```

Test the path as Jellyfin:

```bash
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

If access fails, inspect every directory in the path:

```bash
namei -l /mnt/media/movies
getfacl /mnt/media
```

For a normal ext4 library, grant read and conditional execute access:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rX /mnt/media
sudo setfacl -R -d -m u:jellyfin:rX /mnt/media
sudo systemctl restart jellyfin
```

Verify with the same test:

```bash
getfacl /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

The direct service-user test is the proof. A successful `setfacl` command alone is not enough.

---

## Step 6: Open Jellyfin and add the libraries

From another device on the same network, open:

```text
http://YOUR-SERVER-IP:8096
```

Add the native Ubuntu paths:

```text
Movies:   /mnt/media/movies
TV Shows: /mnt/media/tv
Music:    /mnt/media/music
```

Run a library scan.

A successful result should include:

```text
Library path accepted
Scan does not finish immediately with no files
Known media appears
No permission or path errors in logs
```

Check recent logs:

```bash
sudo journalctl -u jellyfin --since "10 minutes ago" --no-pager
```

---

## Step 7: Verify new-file inheritance

Old files may work while new Sonarr, Radarr, download-client or manually copied files remain invisible.

Compare one working and one new folder:

```bash
ls -ld "/mnt/media/tv/Working Show"
ls -ld "/mnt/media/tv/New Show"
getfacl "/mnt/media/tv/Working Show"
getfacl "/mnt/media/tv/New Show"
```

Test the new path directly:

```bash
sudo -u jellyfin find "/mnt/media/tv/New Show" -maxdepth 2 -type f | head
```

The default ACL should be inherited. Also inspect the creating service's user, group and umask when new imports differ from existing media.

---

## Step 8: Make Direct Play the default goal

Direct Play keeps server work low because Jellyfin sends the original media to the client.

A broadly compatible 1080p target is:

```text
Container: MP4 or MKV
Video:     H.264
Audio:     AAC or AC3
Subtitles: SRT
```

For 4K, use HEVC only when the main playback clients support the exact profile, bit depth, HDR format, audio and subtitles.

During playback, record:

```text
Client:
Connection: local or remote
Playback mode:
Video codec:
Audio codec:
Subtitle format:
Reported transcode reason:
```

If a file transcodes, test subtitles, audio, client and quality settings before upgrading the server.

---

## Step 9: Measure power properly

Use a plug-in wall meter or another whole-system measurement method.

Record the same server in these states:

| State | What to record |
|---|---|
| Powered on and idle | Whole-system watts after background work settles |
| Local Direct Play | Same representative file and client |
| Direct Stream | A known remux or audio-conversion case |
| Software transcode | One incompatible file without acceleration |
| Hardware transcode | The same file after acceleration is enabled |
| Library scan | Temporary peak during active indexing |

Use the same file, client and test duration when comparing playback states.

A useful record looks like:

```text
Date:
Server hardware:
Ubuntu version:
Jellyfin version:
Storage state:
Playback file:
Playback client:
Playback mode:
Wall power:
CPU temperature:
Notes:
```

Do not publish or rely on a power saving unless the measured difference is repeatable.

---

## Step 10: Optional hardware transcoding

Enable hardware acceleration only when a real playback requirement remains.

Inspect available devices:

```bash
ls -la /dev/dri
id jellyfin
```

For Intel VAAPI or Quick Sync diagnostics:

```bash
sudo apt install -y vainfo intel-media-va-driver-non-free
vainfo
```

Confirm the Jellyfin user can access the render device and enable only the codecs the hardware actually supports.

Hardware acceleration can make a necessary transcode efficient. It does not make an incompatible client Direct Play the original file.

---

## Step 11: Check temperatures and background load

Install basic monitoring tools:

```bash
sudo apt install -y lm-sensors htop
sudo sensors-detect --auto
sensors
```

Inspect active processes:

```bash
top
ps aux --sort=-%cpu | head -15
```

Unexpected background work can come from:

- a library scan
- chapter-image extraction
- metadata refreshes
- software transcoding
- another media service
- filesystem maintenance
- a failed task retrying repeatedly

Do not treat every short CPU spike as a power problem. Look for sustained, repeatable activity.

---

## Step 12: Reboot and prove recovery

A home server is not reliable until the same working state returns after reboot.

Before rebooting:

```bash
sudo mount -a
systemctl is-enabled jellyfin
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

Reboot:

```bash
sudo reboot
```

After reconnecting:

```bash
uptime
systemctl status jellyfin --no-pager
findmnt /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
sudo journalctl -u jellyfin -b --no-pager -n 100
```

Then confirm in Jellyfin:

1. the web interface loads
2. libraries remain populated
3. a known file plays
4. the expected playback mode appears
5. no path or permission errors appear in the current-boot logs

---

## Final verification record

Do not call the build complete until every row is confirmed:

| Check | Required result |
|---|---|
| Jellyfin service | Active and enabled |
| Media mount | Expected source mounted at the expected target |
| Host files | Real media visible |
| Service-user access | `jellyfin` can list known media files |
| Library path | Exact native Ubuntu path configured |
| Library scan | Completes without access errors |
| New imports | Inherit usable access |
| Playback | Mode and conversion reason known |
| Power | Idle and playback states measured |
| Reboot | Service, mount, library and playback recover |

Useful final command block:

```bash
systemctl is-active jellyfin
systemctl is-enabled jellyfin
findmnt /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
sudo journalctl -u jellyfin -b --no-pager -n 100
```

---

## Related guides

- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/)
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/)
- [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/)
- [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

A low-power Jellyfin server is not simply a low-wattage computer.

It is a server that:

- starts predictably
- mounts storage correctly
- can read the media without broad permissions
- Direct Plays most everyday files
- uses hardware transcoding only when required
- has measured idle and playback consumption
- returns to the same healthy state after reboot

Build reliability first, then measure and optimise.