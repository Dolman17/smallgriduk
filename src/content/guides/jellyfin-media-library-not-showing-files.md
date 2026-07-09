---
title: "Jellyfin Library Not Showing Files: Fix Scans, Paths and Permissions"
description: "Fix an empty Jellyfin library when scans find no media. Check paths, permissions, mounted drives, Docker mappings, file structure, and logs step by step."
pubDate: 2026-07-02
updatedDate: 2026-07-09
tags: ["jellyfin", "library", "permissions", "media", "troubleshooting", "scanning"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Quick answer

If Jellyfin is not showing files, do not reinstall it first.

Check these four things in order:

1. The media path exists on the server.
2. The path configured in Jellyfin exactly matches it.
3. The Jellyfin service or container can list the files.
4. The disk or network share is actually mounted.

For a native Ubuntu installation, the fastest useful test is:

```bash
sudo -u jellyfin ls -la /mnt/media
```

For Docker, test the path inside the running container:

```bash
docker exec -it jellyfin ls -la /media
```

If the command returns `Permission denied`, fix folder access.

If it shows an empty folder even though the disk should contain media, the storage may not be mounted or the Docker bind mount may be wrong.

If it lists the media correctly, move on to the Jellyfin library path, scan, file structure, and logs.

---

## What this guide covers

This is the broad diagnostic guide for a Jellyfin library that is empty, incomplete, or unable to find files.

Use it to identify which layer has failed:

- the files are missing from the server path
- the storage is not mounted
- Linux permissions block access
- Docker maps the wrong path
- Jellyfin uses the wrong library folder
- only newly created files have unsuitable permissions
- the scan or file layout needs attention

Once the fault is identified, use the narrower guide linked in the relevant section for the complete repair workflow.

This page is not intended to duplicate every permissions, Docker, mount, or playback fix. Its purpose is to help you locate the failing layer quickly.

---

## SmallGrid verification environment

This troubleshooting sequence is checked against the SmallGrid home-server environment, which uses:

- Ubuntu Server
- Jellyfin running as a Docker service
- media stored under `/srv/media_pool/TV`
- a MergerFS-backed media pool
- Sonarr and qBittorrent creating and moving television files
- persistent Linux mounts that must remain available after reboot

The example paths in the main guide use `/mnt/media` because it is easier to read and adapt. On the SmallGrid server, equivalent checks use the real host path and the container path configured in Docker Compose.

For example:

```text
Host path:      /srv/media_pool/TV
Container path: /tv
Jellyfin path:  /tv
```

Do not copy these paths blindly. Use the paths from your own server and Compose file.

---

## Diagnostic decision table

| What the check shows | Most likely problem | Next action |
|---|---|---|
| The host path does not exist | Incorrect path or missing mount point | Confirm the real storage path and inspect `findmnt` and `lsblk -f` |
| The host path exists but is empty | Disk, MergerFS pool, NAS share, or USB storage is not mounted | Fix the mount before changing Jellyfin settings |
| Your normal user sees files but the `jellyfin` user does not | Linux permissions or parent-folder traversal | Check `namei -l`, ACLs, ownership, and inherited permissions |
| The host sees files but the Docker container does not | Incorrect bind mount or container path | Inspect Docker Compose and test the path inside the container |
| The container sees files but Jellyfin does not | Incorrect Jellyfin library folder or scan issue | Use the exact container path in Jellyfin and rescan |
| Old files appear but new files do not | Downloader/importer ownership, group, umask, or default ACL | Compare a working file with a new file and fix inheritance |
| Files appear until the server reboots | Storage starts late or fails to mount | Validate `/etc/fstab`, mount dependencies, and service order |
| Files are visible and readable but not identified correctly | Naming, extensions, metadata, or library type | Check folder structure, extensions, library type, and logs |

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

### What to record

Record the exact path that contains the files. Avoid relying on the path you expected to use.

A useful result looks like this:

```text
/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv
```

If `find` returns no media files, stop here and investigate the storage or import process before changing Jellyfin.

---

## Step 2: Check the library path inside Jellyfin

In Jellyfin, open:

```text
Dashboard → Libraries → Select library → Manage folders
```

The configured path must exactly match the path visible to Jellyfin.

For a native installation, this may be:

```text
/mnt/media/movies
```

For Docker, it may instead be:

```text
/media/movies
```

Incorrect examples include:

```text
/mnt/media/movie
/media/movies when /media is not mounted into the container
/home/user/Downloads/Movies
```

A path that looks close is still wrong.

After correcting it, save the library and run another scan.

---

## Step 3: Test access as the Jellyfin user

For a native Ubuntu installation, run:

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

The verification should show that the service account can list the directory and that the ACL contains a `jellyfin` read-and-execute entry.

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

After editing `/etc/fstab`, validate it before rebooting:

```bash
sudo mount -a
findmnt /mnt/media
```

A silent `mount -a` followed by the expected `findmnt` result is a much stronger validation than waiting for the next reboot.

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

Use [Jellyfin Cannot Access an External USB Drive](/guides/jellyfin-cannot-access-external-usb-drive/) for a storage-specific workflow.

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

Inspect the active mount rather than assuming the Compose file was deployed:

```bash
docker inspect jellyfin --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

If the expected source-to-destination mapping is absent, recreate the container from the correct Compose project.

If the path is present but empty, check the host mount and source directory before changing Jellyfin library settings.

Use [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/) for the complete container workflow.

---

## Step 9: Check new-file permissions

A common pattern is:

- old media appears
- newly downloaded media does not

This usually means new files inherit different ownership or permissions.

Check a working and non-working file:

```bash
ls -ld /mnt/media/tv/Working-Show
ls -ld /mnt/media/tv/New-Show
getfacl /mnt/media/tv/Working-Show
getfacl /mnt/media/tv/New-Show
```

Compare:

- owner
- group
- directory execute permission
- default ACL entries
- the service that created the new file

Set a default ACL so future files inherit Jellyfin access:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

If Sonarr, Radarr, qBittorrent, or another service creates the files, also inspect its user, group, and umask settings.

Use [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/) when old media works but newly imported files remain missing.

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

After changing permissions or mounts, restart Jellyfin before rescanning.

Native installation:

```bash
sudo systemctl restart jellyfin
```

Docker installation:

```bash
docker restart jellyfin
```

---

## Step 12: Check Jellyfin logs

For a native installation, check the service status:

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

For Docker:

```bash
docker logs --tail 200 jellyfin
docker logs jellyfin 2>&1 | grep -Ei "permission|denied|not found|inaccessible|scan|mount"
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

## Worked troubleshooting example

The following is a sanitised example based on the SmallGrid Docker layout. Names and non-essential details are removed, but the path relationship reflects the real setup.

The Jellyfin television library was expected to use:

```text
Host path:      /srv/media_pool/TV
Container path: /tv
Jellyfin path:  /tv
```

The host check comes first:

```bash
findmnt /srv/media_pool
a ls -la /srv/media_pool/TV
```

The second command should be entered without the leading `a`:

```bash
ls -la /srv/media_pool/TV
```

This confirms whether the pooled storage is mounted and whether television folders exist on the host.

Next, verify the active container mapping:

```bash
docker inspect jellyfin --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

The relevant mapping should show the host media path connected to the expected container destination.

Then test inside Jellyfin's container:

```bash
docker exec -it jellyfin ls -la /tv
```

Interpret the sequence as follows:

| Host path | Container path | Meaning |
|---|---|---|
| Files visible | Files visible | Storage and Docker mapping work; check the Jellyfin library path and scan |
| Files visible | Empty or missing | Docker bind mount or destination path is wrong |
| Empty or missing | Empty or missing | Fix the host storage or MergerFS mount first |
| Permission denied | Permission denied | Fix host permissions or the container user/group configuration |

This order prevents unnecessary Jellyfin reinstalls and avoids changing permissions when the real issue is a missing mount or incorrect bind path.

---

## Exact troubleshooting sequence

For a native installation, run this block in order:

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

For Docker, use:

```bash
ls -la /srv/media
findmnt /srv/media
docker inspect jellyfin --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
docker exec -it jellyfin ls -la /media
docker exec -it jellyfin find /media -maxdepth 3 -type f | head -20
docker logs --tail 100 jellyfin
```

Interpret the result using this table:

| Result | Meaning | Fix |
|---|---|---|
| Path missing | Jellyfin is pointing at the wrong location or storage is unavailable | Correct the location or mount |
| Mount missing | The folder exists but the actual disk, pool, or share is absent | Fix `/etc/fstab`, MergerFS, USB, or network mounting |
| Permission denied | The service account or container identity cannot traverse or read the path | Fix parent traversal, ACLs, ownership, group, or container UID/GID |
| Host files visible but container path empty | Docker mapping is wrong | Correct the bind mount and recreate the container |
| Files visible to Jellyfin | Filesystem access works | Check the exact library path, scan, naming, library type, and logs |
| Only new files fail | Inherited permissions differ | Fix downloader/importer ownership, group, umask, or default ACL |

---

## Final verification

Do not consider the problem resolved only because one command stops returning an error.

Confirm all of the following:

1. The storage is mounted at the expected host path.
2. The host path contains real media files.
3. The Jellyfin service user or Docker container can list those files.
4. The library uses the exact path visible to Jellyfin.
5. A manual scan runs without path or permission errors.
6. At least one previously missing item appears in the library.
7. Newly added media also appears after the importer finishes.
8. The storage and library remain available after a controlled reboot.

Useful final checks include:

```bash
findmnt /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

or, for Docker:

```bash
findmnt /srv/media
docker exec -it jellyfin find /media -maxdepth 3 -type f | head -20
docker logs --tail 100 jellyfin
```

A successful result is not merely an empty error log. Jellyfin should be able to see the expected files, complete a scan, display the missing media, and retain access after restart or reboot.

---

## Related guides

- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/)
- [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/)
- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

If a Jellyfin library is not showing files, start with the server rather than reinstalling Jellyfin.

For native Jellyfin, test:

```bash
sudo -u jellyfin ls -la /mnt/media
```

For Docker, test:

```bash
docker exec -it jellyfin ls -la /media
```

Then confirm the mount, path mapping, library path, scan, and logs.

If Jellyfin cannot list the files, fix permissions, parent-folder traversal, mount options, or Docker volume mappings before changing metadata settings.

If Jellyfin can list the files, focus on the exact library path, scan behaviour, naming, library type, and log messages.
