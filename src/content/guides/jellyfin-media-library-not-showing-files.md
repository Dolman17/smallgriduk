---
title: "Jellyfin Library Not Showing Files: Fix Scans, Paths and Permissions"
description: "Fix an empty Jellyfin library when scans find no media. Check paths, permissions, mounted drives, Docker mappings, file structure, and logs step by step."
pubDate: 2026-07-02
updatedDate: 2026-07-06
tags: ["jellyfin", "library", "permissions", "media", "troubleshooting", "scanning"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Quick answer

If Jellyfin is not showing files, do not reinstall it first.

Check these four things in order:

1. The media path exists on the server.
2. The path configured in Jellyfin exactly matches it.
3. The `jellyfin` user can list the files.
4. The disk or network share is actually mounted.

The fastest useful test is:

```bash
sudo -u jellyfin ls -la /mnt/media
```

If that returns `Permission denied`, fix folder access.

If it shows an empty folder even though the disk should contain media, the storage may not be mounted.

If it lists the media correctly, move on to the Jellyfin library path, scan, file structure, and logs.

---

## Common symptoms

This guide applies when:

- the Jellyfin library is empty
- Jellyfin can add a folder but shows no media
- a scan completes almost instantly
- new episodes or films do not appear
- files exist on disk but not in Jellyfin
- media disappears after a reboot
- one library works but another does not
- Docker Jellyfin sees an empty path

These problems are usually caused by:

- an incorrect or case-sensitive path
- missing execute permission on a parent folder
- the `jellyfin` user lacking read access
- an unmounted drive or NAS share
- an incorrect Docker volume mapping
- new files inheriting different permissions
- unsupported or badly organised files

---

## Step 1: Confirm the media exists on the server

SSH into the server and inspect the exact folder:

```bash
ls -la /mnt/media
ls -la /mnt/media/movies
ls -la /mnt/media/tv
```

If the files do not appear here, Jellyfin cannot find them either.

Check a specific media file:

```bash
find /mnt/media/movies -maxdepth 2 -type f | head -20
```

Common path mistakes include:

```text
/mnt/media/tv
/mnt/Media/TV
```

Linux paths are case-sensitive. Those are different locations.

---

## Step 2: Check the library path inside Jellyfin

In Jellyfin, open:

```text
Dashboard → Libraries → Select library → Manage folders
```

The configured path must exactly match the real server path.

Correct example:

```text
/mnt/media/movies
```

Incorrect examples:

```text
/mnt/media/movie
/media/movies
/home/user/Downloads/Movies
```

A path that looks close is still wrong.

After correcting it, save the library and run another scan.

---

## Step 3: Test access as the Jellyfin user

Run:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin find /mnt/media/movies -maxdepth 2 -type f | head -20
```

Possible results:

### Files are listed

Jellyfin can read the path. Continue to mounts, scans, structure, and logs.

### Permission denied

The issue is Linux folder access.

Use:

```bash
namei -l /mnt/media/movies
```

This shows the permissions on every parent folder. Jellyfin needs execute permission on each directory in the chain.

Then follow [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

### Folder is empty

If your normal user sees files but `jellyfin` does not, permissions or mount visibility are still the likely cause.

If both users see an empty folder, check whether the disk or share is mounted.

---

## Step 4: Fix permissions safely

For a native Ubuntu package install on a normal Linux filesystem, ACLs are usually the cleanest fix:

```bash
sudo apt update
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Replace `/mnt/media` with the real path.

Verify it:

```bash
getfacl /mnt/media
sudo -u jellyfin ls -la /mnt/media
```

Do not use `chmod -R 777` as the permanent fix. Jellyfin normally needs read and execute access, not unrestricted write access.

---

## Step 5: Check whether the drive is mounted

A missing mount is one of the most common reasons a library becomes empty after reboot.

Run:

```bash
findmnt /mnt/media
lsblk -f
```

Then inspect the folder:

```bash
ls -la /mnt/media
```

A mount-point directory can exist even when the actual disk is not mounted. In that situation, Jellyfin scans the empty directory underneath the expected mount.

Check the filesystem and options:

```bash
findmnt -no SOURCE,FSTYPE,OPTIONS /mnt/media
```

If the drive should mount automatically, inspect `/etc/fstab`:

```bash
cat /etc/fstab
```

For permanent storage, prefer a UUID-based mount rather than a desktop auto-mount path such as `/media/username/DriveName`.

---

## Step 6: Check USB, NTFS and exFAT storage

If the media is on NTFS or exFAT, Linux ACLs and `chmod` may not behave as expected.

Mount options often control ownership and permissions.

Check:

```bash
findmnt -no TARGET,SOURCE,FSTYPE,OPTIONS /mnt/media
```

Relevant options may include:

```text
uid=
gid=
umask=
fmask=
dmask=
```

If permissions reset after every reboot, correct the mount options in `/etc/fstab` instead of repeatedly changing the files.

For a permanently attached Ubuntu media disk, ext4 is usually simpler.

---

## Step 7: Check NAS, SMB, CIFS and NFS mounts

For an SMB or CIFS share:

```bash
findmnt | grep -i cifs
```

Then test it as Jellyfin:

```bash
sudo -u jellyfin ls -la /mnt/media
```

CIFS access may depend on:

```text
uid=
gid=
file_mode=
dir_mode=
```

For NFS, check server-side export permissions and UID/GID matching.

If the share is not mounted when Jellyfin starts, the initial scan may see an empty folder. Fix the mount dependency and then rescan.

---

## Step 8: Check Docker volume paths

If Jellyfin runs in Docker, the library path must be the path visible inside the container.

Example mapping:

```yaml
volumes:
  - /srv/media/movies:/media/movies:ro
```

Host path:

```text
/srv/media/movies
```

Container path:

```text
/media/movies
```

Inside Jellyfin, add:

```text
/media/movies
```

not the host path.

Verify the container can see the files:

```bash
docker exec -it jellyfin ls -la /media/movies
```

If that path is empty or missing, correct the volume mapping before changing Jellyfin library settings.

Also check the UID and GID used by the container.

Use [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/) for the complete container workflow.

---

## Step 9: Check new-file permissions

A common pattern is:

- old media appears
- newly downloaded media does not

This usually means new files inherit different ownership or permissions.

Check a working and non-working file:

```bash
ls -l /mnt/media/tv/Working-Show
ls -l /mnt/media/tv/New-Show
getfacl /mnt/media/tv/Working-Show
getfacl /mnt/media/tv/New-Show
```

Set a default ACL so future files inherit Jellyfin access:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

If Sonarr, Radarr, qBittorrent, or another service creates the files, also inspect its user, group, and umask settings.

---

## Step 10: Check file names and folder structure

Clear organisation helps Jellyfin identify media correctly.

Recommended movie layout:

```text
/mnt/media/movies/Film Name (2024)/Film Name (2024).mkv
```

Recommended television layout:

```text
/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv
```

Poor naming usually causes identification or metadata problems rather than a completely empty library. If no files appear at all, path, permissions, mounts, and Docker mappings remain the priorities.

Check that files have real media extensions:

```bash
find /mnt/media -type f | head -30
```

Files without recognised extensions, partial downloads, hidden files, and temporary download files may be skipped.

For playback compatibility after the files appear, read [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/).

---

## Step 11: Rescan the library

In Jellyfin:

```text
Dashboard → Libraries → Scan All Libraries
```

Or scan the affected library from its settings page.

A very large library may take time, especially on a low-power system. However, a scan that finishes almost immediately can indicate Jellyfin found no accessible files.

After changing permissions or mounts, restart Jellyfin before rescanning:

```bash
sudo systemctl restart jellyfin
```

---

## Step 12: Check Jellyfin logs

Check the service status:

```bash
systemctl status jellyfin --no-pager
```

Read recent logs:

```bash
sudo journalctl -u jellyfin --no-pager -n 200
```

Search for likely errors:

```bash
sudo journalctl -u jellyfin --no-pager | grep -Ei "permission|denied|not found|inaccessible|scan|mount"
```

Look for messages about:

- `Permission denied`
- path not found
- inaccessible directories
- unavailable mounts
- unsupported files
- database or metadata errors

The logs help distinguish a scanning problem from a folder-access problem.

---

## Exact troubleshooting sequence

Run this block in order:

```bash
ls -la /mnt/media
findmnt /mnt/media
namei -l /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin find /mnt/media/movies -maxdepth 2 -type f | head -20
systemctl status jellyfin --no-pager
sudo journalctl -u jellyfin --no-pager -n 100
```

Interpret it like this:

- path missing: correct the location or mount
- mount missing: fix `/etc/fstab` or the network mount
- permission denied: fix parent traversal and ACLs
- files visible to Jellyfin: check the library path, scan, naming, and logs
- Docker path empty: fix the volume mapping

---

## Related guides

- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/)
- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

If a Jellyfin library is not showing files, start with the server rather than reinstalling Jellyfin.

The fastest test is:

```bash
sudo -u jellyfin ls -la /mnt/media
```

Then confirm the mount:

```bash
findmnt /mnt/media
```

If Jellyfin can list the media and the drive is mounted, verify the exact library path, run a scan, and inspect the logs.

If Jellyfin cannot list the files, fix permissions, parent-folder traversal, mount options, or Docker volume mappings before changing metadata settings.