---
title: "Jellyfin Not Scanning New Files: Fix Missing Movies and Episodes"
description: "Fix Jellyfin when newly added movies or episodes do not appear. Check permissions, mounts, Docker paths, naming, scans, and logs step by step."
pubDate: 2026-07-06
tags: ["jellyfin", "scanning", "library", "permissions", "media", "troubleshooting"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Quick answer

When Jellyfin shows older media but does not scan newly added files, the most common cause is that the new files have different permissions from the existing library.

Start with this test:

```bash
sudo -u jellyfin ls -la /mnt/media/tv
```

Then test the new folder directly:

```bash
sudo -u jellyfin ls -la "/mnt/media/tv/New Show"
```

If the new folder returns `Permission denied`, Jellyfin cannot read it.

For a normal Ubuntu installation using an ext4 filesystem, apply a default ACL so future files inherit Jellyfin access:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Replace `/mnt/media` with your real media path, then run a library scan.

---

## Why old files appear but new files do not

This pattern usually means Jellyfin already has access to the original media, but newly created files were written by another user or service with different permissions.

Common file creators include:

- Sonarr
- Radarr
- qBittorrent
- SABnzbd
- NZBGet
- an SMB or NAS account
- your normal Linux user
- a Docker container using a different UID or GID

The old media may be readable because it was copied manually or permissions were fixed previously. New downloads can arrive with a different owner, group, or umask.

---

## Step 1: Confirm the new files exist

Check the folder as your normal user:

```bash
ls -la /mnt/media/tv
ls -la "/mnt/media/tv/New Show"
```

Find recent media files:

```bash
find /mnt/media -type f -mtime -2 | head -30
```

If the expected files are not present, the problem is with the download, import, or move process rather than Jellyfin.

Check whether Sonarr or Radarr imported the files into the correct final library path instead of leaving them in the downloads folder.

---

## Step 2: Compare a working file with a missing file

Inspect one folder that appears in Jellyfin and one that does not:

```bash
ls -ld "/mnt/media/tv/Working Show"
ls -ld "/mnt/media/tv/New Show"
```

Then inspect the files inside:

```bash
ls -la "/mnt/media/tv/Working Show"
ls -la "/mnt/media/tv/New Show"
```

Look for differences in:

- owner
- group
- read permissions
- execute permissions on directories

A directory needs execute permission so Jellyfin can enter it.

---

## Step 3: Test the new media as the Jellyfin user

Run:

```bash
sudo -u jellyfin ls -la "/mnt/media/tv/New Show"
```

For a specific file:

```bash
sudo -u jellyfin stat "/mnt/media/tv/New Show/Season 01/New Show - S01E01.mkv"
```

If the command succeeds, Jellyfin can see the file at the Linux permission level.

If it returns `Permission denied`, inspect the full path:

```bash
namei -l "/mnt/media/tv/New Show/Season 01/New Show - S01E01.mkv"
```

This shows the permissions on every directory between `/` and the file.

For a complete permissions workflow, use [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## Step 4: Fix existing and future permissions

Install the ACL tools:

```bash
sudo apt update
sudo apt install -y acl
```

Give Jellyfin access to the existing library:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
```

Set a default ACL for future files and folders:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

Restart Jellyfin:

```bash
sudo systemctl restart jellyfin
```

Verify the ACL:

```bash
getfacl /mnt/media
getfacl "/mnt/media/tv/New Show"
```

Look for:

```text
user:jellyfin:r-x
```

Do not use `chmod -R 777` as the permanent solution.

---

## Step 5: Check the service creating the files

If Sonarr, Radarr, or a download client creates the media, inspect which user it runs as:

```bash
systemctl status sonarr --no-pager
systemctl status radarr --no-pager
systemctl status qbittorrent-nox --no-pager
```

You can also inspect running processes:

```bash
ps aux | grep -E "sonarr|radarr|qbittorrent|sabnzbd"
```

Check the ownership of a new file:

```bash
stat "/mnt/media/tv/New Show/Season 01/New Show - S01E01.mkv"
```

A sensible shared-media setup often uses:

- a common media group
- consistent group ownership
- a cooperative umask such as `002`
- default ACLs on the library root

The exact configuration depends on whether the services run natively or in Docker.

---

## Step 6: Check whether the storage is mounted

If all media disappears or new files seem to go into an empty folder, confirm the disk or share is mounted:

```bash
findmnt /mnt/media
lsblk -f
ls -la /mnt/media
```

A mount-point directory can still exist when the actual disk is not mounted.

That can create a confusing situation where:

1. the media disk is missing after reboot
2. a download service writes new files into the empty mount-point directory
3. the disk later mounts over that directory
4. the newly downloaded files appear to disappear

Use a stable UUID entry in `/etc/fstab` for permanently attached storage.

For a broader empty-library diagnosis, read [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/).

---

## Step 7: Check Docker volume paths

For Docker installations, the new files must be visible inside the Jellyfin container.

Example Compose mapping:

```yaml
volumes:
  - /srv/media/tv:/media/tv:ro
```

Test inside the container:

```bash
docker exec -it jellyfin ls -la /media/tv
```

Then test the new folder:

```bash
docker exec -it jellyfin ls -la "/media/tv/New Show"
```

If the host sees the files but the container does not, check:

- the bind-mount source path
- the container destination path
- whether the correct Compose file was deployed
- read-only versus read-write mount settings
- container UID and GID

Inside Jellyfin, use the container path, such as `/media/tv`, not the host path `/srv/media/tv`.

See [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/).

---

## Step 8: Check the Jellyfin library path

Open:

```text
Dashboard → Libraries → Select library → Manage folders
```

Confirm the path is exact.

Native Ubuntu example:

```text
/mnt/media/tv
```

Docker example:

```text
/media/tv
```

Linux paths are case-sensitive.

These are different:

```text
/mnt/media/tv
/mnt/Media/TV
```

---

## Step 9: Check naming and folder structure

Recommended television layout:

```text
/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv
```

Recommended movie layout:

```text
/mnt/media/movies/Film Name (2026)/Film Name (2026).mkv
```

Check the new files:

```bash
find "/mnt/media/tv/New Show" -maxdepth 3 -type f
```

Make sure they are completed media files rather than:

- partial downloads
- temporary files
- archives that have not been extracted
- files without a recognised extension
- samples or trailers in unexpected folders

Poor naming normally causes identification problems rather than permission errors, but it can prevent episodes from being matched correctly.

---

## Step 10: Run a manual library scan

In Jellyfin:

```text
Dashboard → Libraries → Scan All Libraries
```

Or scan only the affected library.

After changing permissions or mounts, restart Jellyfin first:

```bash
sudo systemctl restart jellyfin
```

A scan that completes almost instantly can mean Jellyfin found no accessible new files.

---

## Step 11: Check real-time monitoring

Jellyfin can monitor supported library folders for changes, but real-time monitoring may not work reliably with every filesystem or network share.

It can be affected by:

- SMB or NFS mounts
- Docker bind mounts
- filesystem notification limits
- deeply nested libraries
- files moved across filesystems

Do not rely only on real-time monitoring. Run a manual scan while troubleshooting.

If manual scans work but automatic detection does not, use a scheduled library scan as a practical fallback.

---

## Step 12: Check the logs

For a native Ubuntu install:

```bash
sudo journalctl -u jellyfin --no-pager -n 200
```

Search for relevant messages:

```bash
sudo journalctl -u jellyfin --no-pager | grep -Ei "permission|denied|scan|watch|inotify|not found|inaccessible"
```

For Docker:

```bash
docker logs --tail 200 jellyfin
```

Look for:

- `Permission denied`
- path not found
- inaccessible directory
- filesystem watcher errors
- unsupported file
- scan failures

---

## Exact troubleshooting sequence

Run these checks in order:

```bash
find /mnt/media -type f -mtime -2 | head -30
findmnt /mnt/media
ls -ld /mnt/media /mnt/media/tv
namei -l "/mnt/media/tv/New Show"
sudo -u jellyfin ls -la /mnt/media/tv
sudo -u jellyfin ls -la "/mnt/media/tv/New Show"
getfacl /mnt/media/tv
systemctl status jellyfin --no-pager
sudo journalctl -u jellyfin --no-pager -n 100
```

Interpret the result:

- new files missing from disk: fix the download or import process
- mount missing: fix the disk or network mount
- permission denied: fix ACLs and parent traversal
- files visible to Jellyfin: check the library path, scan, naming, and logs
- Docker container cannot see files: fix the volume mapping

---

## Related guides

- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)

---

## Recap

When Jellyfin does not scan newly added files, compare the new files with older working media.

The key test is:

```bash
sudo -u jellyfin ls -la "/mnt/media/tv/New Show"
```

If that fails, fix the permissions and set a default ACL so future files inherit access.

If it succeeds, confirm the mount, Docker mapping, Jellyfin library path, naming structure, manual scan, and logs.