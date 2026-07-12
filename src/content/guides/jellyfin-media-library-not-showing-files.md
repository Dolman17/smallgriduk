---
title: "Jellyfin Library Not Showing Files: Fix Scans, Paths and Permissions"
description: "Fix an empty Jellyfin library when scans find no media. Check storage mounts, paths, Linux permissions, Docker mappings, new-file access, scans, and logs in the correct order."
pubDate: 2026-07-02
updatedDate: 2026-07-12
tags: ["jellyfin", "library", "permissions", "media", "troubleshooting", "scanning"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Quick answer

If Jellyfin is not showing files, do not reinstall it first.

Check the path from the storage layer upwards:

1. confirm the media exists on the host
2. confirm the disk, pool, USB drive, or network share is mounted
3. confirm the Jellyfin service or Docker container can list the files
4. confirm Jellyfin uses the exact path visible inside its own environment
5. run a scan and inspect the logs

For a native Ubuntu installation:

```bash
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

For Docker:

```bash
docker exec jellyfin find /media -maxdepth 3 -type f | head -20
```

Interpret the result:

| Result | Meaning |
|---|---|
| Files are listed | Filesystem access works; check the Jellyfin library path, scan, naming, library type, and logs |
| `Permission denied` | The service account or container identity cannot traverse or read the path |
| Path does not exist | The configured path or Docker destination is wrong |
| Folder is empty | The storage may not be mounted, the host source may be wrong, or the bind mount points at an empty directory |

The important test is not whether your own SSH user can see the files. It is whether **Jellyfin can see them from the environment in which Jellyfin actually runs**.

---

## What this guide covers

This is the broad diagnostic guide for a Jellyfin library that is empty, incomplete, or unable to find files.

It helps you locate the failing layer:

- host storage
- persistent mount
- Linux path traversal and read access
- Docker bind mount
- Jellyfin library path
- inherited permissions on newly created files
- library scan
- naming, extensions, and library type
- Jellyfin logs

Once the failing layer is known, use the narrower guide linked in that section.

This page intentionally does not repeat every detailed repair procedure:

- use [Jellyfin Docker Volume Paths Explained](/guides/jellyfin-docker-volume-paths-explained/) for host-to-container mappings
- use [Jellyfin Docker Permissions](/guides/jellyfin-docker-permissions-media-folder/) when the container mount is correct but access is denied
- use [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/) for native service-user permissions and ACLs
- use [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/) when old files work but new imports do not
- use [Jellyfin Media Disappears After Reboot](/guides/jellyfin-media-disappears-after-reboot/) when the problem starts after restart

---

## SmallGrid verification environment

This workflow is based on the SmallGrid home media server:

```text
Host:             Ubuntu Server
Storage pool:     MergerFS
Host TV path:     /srv/media_pool/TV
Jellyfin runtime: Docker
Container TV path:/tv
Jellyfin path:    /tv
```

The server also uses Sonarr and qBittorrent, so the diagnostic order has to distinguish between:

- storage not being mounted
- a Docker source/destination mismatch
- Jellyfin being unable to read the mounted files
- newly imported files receiving different access
- a scan or identification problem

Example paths such as `/mnt/media` and `/media` are used elsewhere in this guide because they are easier to adapt. Use the real paths from your own host and Compose configuration.

---

## Diagnostic decision table

| What the check shows | Most likely cause | Next action |
|---|---|---|
| Host path does not exist | Wrong path or missing mount point | Confirm the real storage path with `findmnt`, `lsblk -f`, and the Compose file |
| Host path exists but is empty | Disk, pool, USB drive, or network share is not mounted | Repair the mount before changing Jellyfin |
| Your user sees files but native `jellyfin` does not | Linux permissions or parent-folder traversal | Check `namei -l`, ownership, groups, and ACLs |
| Host sees files but Docker container does not | Wrong bind mount, wrong destination, or old container configuration | Inspect active mounts and recreate the service from the correct Compose project |
| Container sees files but Jellyfin does not | Wrong library folder, wrong library type, or scan problem | Use the exact container path and rescan |
| Old media appears but new imports do not | Ownership, group, umask, or default ACL differs | Compare one working file with one missing file |
| Media disappears after reboot | Storage was not mounted when Jellyfin started | Validate persistent mounts and service ordering |
| Files are readable but unidentified | Naming, extension, folder structure, or library type | Check layout and logs |

---

## Step 1: Confirm the media exists on the host

Inspect the exact host path:

```bash
ls -ld /mnt/media
find /mnt/media -maxdepth 3 -type f | head -20
```

For the SmallGrid TV path, the equivalent check is:

```bash
ls -ld /srv/media_pool/TV
find /srv/media_pool/TV -maxdepth 3 -type f | head -20
```

A useful result contains real media files:

```text
/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv
```

If `find` returns nothing, stop here. Jellyfin cannot index files that are absent from the host path.

Check for case-sensitive path mistakes:

```text
/mnt/media/tv
/mnt/Media/TV
```

These are different paths on Linux.

### Count files for later comparison

A count is useful when comparing the host with the container:

```bash
find /mnt/media -type f | wc -l
```

Record the result. The container-side count should be broadly consistent for the same mounted tree.

---

## Step 2: Confirm the storage is mounted

A mount-point directory can exist even when the actual storage is absent. Jellyfin may then scan an empty directory underneath the intended mount.

Check the target:

```bash
findmnt /mnt/media
findmnt -no SOURCE,TARGET,FSTYPE,OPTIONS /mnt/media
lsblk -f
```

For a MergerFS pool:

```bash
findmnt -T /srv/media_pool
findmnt -no SOURCE,TARGET,FSTYPE,OPTIONS -T /srv/media_pool
```

Expected evidence includes:

- the intended source
- the intended target
- the expected filesystem type
- mount options that permit the required access

If `findmnt` returns nothing, fix the storage layer before changing permissions or Jellyfin settings.

### Validate persistent mounts

Inspect `/etc/fstab`:

```bash
grep -vE '^\s*(#|$)' /etc/fstab
```

After making a change:

```bash
sudo mount -a
findmnt /mnt/media
```

A silent `mount -a` followed by the expected `findmnt` result is a useful pre-reboot validation.

---

## Step 3: Check the path configured in Jellyfin

Open:

```text
Dashboard → Libraries → select the library → Manage folders
```

The path must match what Jellyfin can see.

Native installation example:

```text
/mnt/media/movies
```

Docker example:

```text
/media/movies
```

SmallGrid Docker example:

```text
/tv
```

Do not put a host-only path into Jellyfin unless the same path is mounted at the same destination inside the container.

For this mapping:

```yaml
volumes:
  - /srv/media/movies:/media/movies:ro
```

Jellyfin must use:

```text
/media/movies
```

not:

```text
/srv/media/movies
```

---

## Step 4: Test access as Jellyfin

### Native Ubuntu installation

Run the checks as the service account:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

Possible outcomes:

#### Files are listed

The native Jellyfin service can read the path. Continue to library settings, scans, naming, and logs.

#### Permission denied

Check every parent directory:

```bash
namei -l /mnt/media/movies
```

Jellyfin needs directory traversal permission on every directory in the path, not only read permission on the final folder.

Inspect ACLs:

```bash
getfacl -p /mnt/media
getfacl -p /mnt/media/movies
```

Follow the dedicated [Ubuntu permissions guide](/guides/jellyfin-ubuntu-folder-permissions/) for the full repair workflow.

#### Folder is empty

Compare the result with your normal user:

```bash
find /mnt/media -maxdepth 3 -type f | head -20
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

If both are empty, return to the mount and source path. If only Jellyfin is empty or denied, investigate access.

### Docker installation

Test the destination inside the running container:

```bash
docker exec jellyfin ls -la /media
docker exec jellyfin find /media -maxdepth 3 -type f | head -20
```

For the SmallGrid TV mapping:

```bash
docker exec jellyfin find /tv -maxdepth 3 -type f | head -20
```

This is stronger evidence than reading the Compose file alone because it tests the running container.

---

## Step 5: Verify the active Docker bind mount

Inspect the active mounts:

```bash
docker inspect jellyfin \
  --format '{{range .Mounts}}{{println .Type "|" .Source "|" .Destination "|" .Mode}}{{end}}'
```

Expected shape:

```text
bind | /srv/media/movies | /media/movies | ro
```

SmallGrid path relationship:

```text
bind | /srv/media_pool/TV | /tv | ro
```

Check all three values:

1. **Source** exists and contains files on the host.
2. **Destination** is the path used inside Jellyfin.
3. **Mode** is appropriate; read-only is normally enough for media.

If the expected mapping is absent, check which Compose project created the container:

```bash
docker inspect jellyfin \
  --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}'

docker inspect jellyfin \
  --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}'
```

Then apply the correct configuration:

```bash
docker compose config
docker compose up -d
```

Re-check `docker inspect` after recreation.

---

## Step 6: Separate mapping problems from permission problems

Use this sequence:

```bash
find /srv/media/movies -maxdepth 2 -type f | head
docker inspect jellyfin \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
docker exec jellyfin find /media/movies -maxdepth 2 -type f | head
```

Interpretation:

| Host | Active mapping | Container | Diagnosis |
|---|---|---|---|
| Files visible | Correct | Files visible | Mapping and basic access work |
| Files visible | Missing or wrong | Empty/missing | Bind-mount problem |
| Files visible | Correct | `Permission denied` | Container identity or host permissions |
| Empty | Correct or wrong | Empty | Host storage or source path problem |

Do not apply `chmod -R 777`. It hides the diagnostic signal and grants more access than Jellyfin normally needs.

---

## Step 7: Check parent traversal and permissions safely

For a native service:

```bash
namei -l /mnt/media/movies
id jellyfin
```

For a container, first identify the runtime user:

```bash
docker exec jellyfin id
```

Then inspect the host path:

```bash
namei -l /srv/media/movies
getfacl -p /srv/media/movies
```

The required fix depends on the container image and user model. LinuxServer images commonly use `PUID` and `PGID`; other images may use different configuration.

Keep this broad guide diagnostic. Apply the detailed repair from [Jellyfin Docker Permissions](/guides/jellyfin-docker-permissions-media-folder/) once the failure is confirmed as access rather than mapping.

---

## Step 8: Check whether only new files are missing

A different problem exists when:

- old files remain visible
- files imported recently by Sonarr, Radarr, qBittorrent, or another service do not appear

Compare one working item and one missing item:

```bash
stat -c '%A %U:%G %n' \
  "/mnt/media/tv/Working Show" \
  "/mnt/media/tv/New Show"

getfacl -p "/mnt/media/tv/Working Show"
getfacl -p "/mnt/media/tv/New Show"
```

Compare:

- owner
- group
- directory execute permission
- file read permission
- ACL entries
- default ACL inheritance
- downloader or importer umask

Do not recursively rewrite the whole library before identifying the difference.

Use [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/) for the dedicated workflow.

---

## Step 9: Check removable and network storage

### NTFS and exFAT

On NTFS and exFAT, mount options often control effective ownership and permissions.

Inspect them:

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

Repeated `chmod` commands may not survive a remount. Fix the mount configuration instead.

### SMB or CIFS

Check that the share is mounted:

```bash
findmnt -t cifs
```

Then test access:

```bash
sudo -u jellyfin find /mnt/media -maxdepth 2 -type f | head
```

CIFS access may depend on:

```text
uid=
gid=
file_mode=
dir_mode=
```

### NFS

Check the client mount and server-side export permissions. UID/GID mapping may matter.

If the network storage is unavailable when Jellyfin starts, fix the mount dependency and then rescan.

---

## Step 10: Check naming, extensions, and library type

Poor naming usually causes identification or metadata problems rather than a completely empty library. Still, inspect the structure once path access is proven.

Recommended movie layout:

```text
/mnt/media/movies/Film Name (2024)/Film Name (2024).mkv
```

Recommended television layout:

```text
/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv
```

Inspect extensions:

```bash
find /mnt/media -maxdepth 4 -type f \
  -printf '%f\n' | sed -n '1,30p'
```

Check for:

- incomplete downloads
- temporary files
- files without media extensions
- television content added to a movie library
- movie content added to a television library
- unexpected nested folders

---

## Step 11: Rescan and inspect logs

Run a manual scan:

```text
Dashboard → Libraries → Scan All Libraries
```

Restart after correcting mounts or access:

Native:

```bash
sudo systemctl restart jellyfin
```

Docker:

```bash
docker restart jellyfin
```

Read recent logs.

Native:

```bash
sudo journalctl -u jellyfin --since "10 minutes ago" --no-pager
```

Docker:

```bash
docker logs --since 10m jellyfin
```

Filter likely access and path failures:

```bash
docker logs jellyfin 2>&1 |
  grep -Ei 'permission|denied|not found|inaccessible|scan|mount'
```

Look for:

- `Permission denied`
- path not found
- inaccessible directories
- unavailable mounts
- scan failures
- unsupported or skipped files
- database errors

A scan that finishes almost immediately can indicate that Jellyfin found no accessible files.

---

## Verified SmallGrid case: host, pool, container, and library agreed

The following verification uses the real SmallGrid path relationship, with private filenames omitted.

### 1. Confirm the MergerFS pool

```bash
findmnt -T /srv/media_pool
```

The active target was `/srv/media_pool`, exposed as a MergerFS filesystem.

### 2. Confirm the host library

```bash
find /srv/media_pool/TV -type f | wc -l
```

The active storage branches contained **1,539 media files in total** at the time of verification.

### 3. Confirm the active Docker mapping

```bash
docker inspect jellyfin \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

The television library used this path relationship:

```text
/srv/media_pool/TV -> /tv
```

### 4. Confirm visibility inside the container

```bash
docker exec jellyfin find /tv -type f | wc -l
```

The host and Jellyfin-visible media counts matched for the active pool.

### 5. Confirm the Jellyfin library path

The television library used:

```text
/tv
```

### 6. Final result

```text
Storage mounted:          yes
Host media visible:       yes
Docker mapping correct:   yes
Container media visible:  yes
Host/container counts:    matched
Jellyfin healthy:         yes
Library path:             /tv
```

This case demonstrates the correct evidence chain. A matching final state does not prove every future scan will succeed, but it proves that the storage, bind mount, and container visibility layers are aligned.

---

## Exact troubleshooting sequence

### Native installation

```bash
findmnt /mnt/media
find /mnt/media -maxdepth 3 -type f | head -20
namei -l /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
systemctl status jellyfin --no-pager
sudo journalctl -u jellyfin --since "10 minutes ago" --no-pager
```

### Docker installation

```bash
findmnt /srv/media
find /srv/media -maxdepth 3 -type f | head -20
docker inspect jellyfin \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
docker exec jellyfin find /media -maxdepth 3 -type f | head -20
docker logs --since 10m jellyfin
```

Stop at the first failed layer. Do not change later layers until the earlier one is confirmed.

---

## Final verification

Confirm all of these:

1. The intended storage is mounted.
2. The host path contains real media files.
3. The native Jellyfin user or Docker container can list those files.
4. The active Docker source and destination are correct, where applicable.
5. Jellyfin uses the exact path visible inside its runtime environment.
6. A manual scan completes without path or permission errors.
7. At least one previously missing item appears.
8. Newly imported media also appears.
9. The storage and library remain available after a controlled restart or reboot.

Useful count comparison for Docker:

```bash
find /srv/media -type f | wc -l
docker exec jellyfin find /media -type f | wc -l
```

Counts can differ when the host path contains files outside the mounted subtree, but unexpected differences should be investigated.

---

## Related guides

- [Jellyfin Docker Volume Paths Explained](/guides/jellyfin-docker-volume-paths-explained/)
- [Jellyfin Docker Permissions](/guides/jellyfin-docker-permissions-media-folder/)
- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/)
- [Jellyfin Media Disappears After Reboot](/guides/jellyfin-media-disappears-after-reboot/)
- [Jellyfin Cannot Access an External USB Drive](/guides/jellyfin-cannot-access-external-usb-drive/)
- [Jellyfin on Ubuntu: Low-Power Setup](/guides/jellyfin-ubuntu-low-power/)

---

## Recap

When a Jellyfin library is not showing files, test the complete evidence chain:

```text
storage → host path → service/container visibility → Jellyfin library path → scan → logs
```

For native Jellyfin:

```bash
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head
```

For Docker:

```bash
docker exec jellyfin find /media -maxdepth 3 -type f | head
```

If Jellyfin cannot list the files, fix the mount, mapping, or permissions first.

If Jellyfin can list the files, focus on the exact library folder, scan behaviour, naming, library type, and log messages.
