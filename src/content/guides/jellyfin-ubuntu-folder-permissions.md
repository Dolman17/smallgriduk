---
title: "Give Jellyfin Access to Media Folders on Ubuntu"
description: "Fix Jellyfin permission denied errors on Ubuntu. Check users, parent folders, mounted drives, ACLs, fstab options, and library paths step by step."
pubDate: 2026-06-27
updatedDate: 2026-07-09
tags: ["jellyfin", "ubuntu", "permissions", "media", "acl", "mounted-drives"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Quick answer

If Jellyfin cannot access a media folder on Ubuntu, test the exact path as the `jellyfin` service user:

```bash
sudo -u jellyfin ls -la /mnt/media
```

If that returns `Permission denied`, Jellyfin cannot traverse or read one of the folders in the path.

For a normal ext4 media folder, the cleanest fix is usually:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Replace `/mnt/media` with your real media path.

Do not start with `chmod -R 777`. Jellyfin normally needs read and execute access, not ownership of the whole library.

---

## What this guide covers

This guide is specifically for a **native Jellyfin installation on Ubuntu** where the Linux service user cannot read a media path.

It covers:

- confirming the `jellyfin` service account
- finding the exact folder blocking access
- checking parent-directory traversal
- granting access with ACLs
- making new files inherit the same access
- handling mounted disks and network shares
- proving the fix with direct service-user tests

For Docker installations, use [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/). Docker adds container paths and container user IDs that do not apply to a native package installation.

---

## SmallGrid verification method

SmallGrid uses Ubuntu Server and Linux media paths in a home-server environment. The native-package commands in this guide are verified by checking the same permission layers that affect any Linux service:

1. identify the service account
2. inspect every parent directory
3. test access as that account
4. apply the smallest required permission change
5. repeat the access test
6. confirm the library still works after restart or reboot

The important evidence is not that a command completed without an error. The `jellyfin` user must be able to list the real library folders and media files.

---

## Permission diagnosis table

| Test result | Meaning | Next action |
|---|---|---|
| `id jellyfin` fails | The service account is missing or the installation is incomplete | Repair the Jellyfin installation first |
| Your user can list the folder but `jellyfin` cannot | Linux permissions block the service account | Inspect the path with `namei -l` |
| `jellyfin` can list `/mnt/media` but not a subfolder | A deeper directory has different ownership or mode | Check that exact subfolder and its ACL |
| Old media works but new files fail | New files inherit different permissions | Add a default ACL and inspect the creating service |
| Permissions reset after reboot | The filesystem or mount options control access | Inspect `findmnt` and `/etc/fstab` |
| Both users see an empty folder | The disk or share may not be mounted | Fix the mount before changing permissions |
| Native tests work but Docker Jellyfin fails | The container uses a different path or identity | Use the Docker-specific permissions guide |

---

## Step 1: Confirm which user Jellyfin runs as

On a standard Ubuntu package install, Jellyfin normally runs as the Linux user `jellyfin`.

Check it:

```bash
id jellyfin
```

You should see a user ID, group ID, and group list.

Then confirm the service is running:

```bash
systemctl status jellyfin --no-pager
```

If `id jellyfin` fails, repair the Jellyfin installation before changing folder permissions.

---

## Step 2: Confirm the real media path

Check where the files actually live:

```bash
ls -la /mnt/media
ls -la /mnt/media/movies
ls -la /mnt/media/tv
```

Find a real file rather than checking only empty directories:

```bash
find /mnt/media -maxdepth 3 -type f | head -20
```

Common server paths include:

```text
/mnt/media
/srv/media
/media/storage
/home/YOUR-USER/media
```

Linux paths are case-sensitive. These are different:

```text
/mnt/media/tv
/mnt/Media/TV
```

The path configured in Jellyfin must exactly match the real Linux path.

If the library is empty rather than showing an explicit permission error, work through [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/) first.

---

## Step 3: Test the complete path as Jellyfin

Run:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

For a specific media file:

```bash
sudo -u jellyfin stat "/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv"
```

### Successful result

The directory contents or file metadata appear. Jellyfin can read that part of the path.

### Permission failure

A failure may look similar to:

```text
ls: cannot open directory '/mnt/media': Permission denied
```

or:

```text
ls: cannot access '/mnt/media/movies': Permission denied
```

That confirms the problem exists below Jellyfin's library interface. Fix the Linux path before rescanning.

---

## Step 4: Find the exact blocking directory

Use `namei` on the complete path:

```bash
namei -l /mnt/media/movies
```

For a specific file:

```bash
namei -l "/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv"
```

`namei -l` displays every directory from `/` to the target.

Jellyfin needs:

- execute permission on every parent directory so it can traverse the path
- read permission on directories so it can list their contents
- read permission on the media files

A media folder can be readable while an earlier parent blocks access.

Example:

```text
/home/sean/media/movies
```

Jellyfin may have access to `media` but still be blocked by `/home/sean`.

For shared service data, `/mnt/media` or `/srv/media` is usually cleaner than storing the library inside a personal home directory.

---

## Step 5: Inspect the existing ACL and permissions

Check the folder mode and ownership:

```bash
ls -ld /mnt/media
ls -ld /mnt/media/movies
```

Check ACL entries:

```bash
getfacl /mnt/media
getfacl /mnt/media/movies
```

Look for an entry such as:

```text
user:jellyfin:r-x
```

Also check the ACL mask. An ACL entry can exist but still be limited by the effective mask.

---

## Step 6: Grant access to existing media

Install the ACL tools:

```bash
sudo apt update
sudo apt install -y acl
```

Grant Jellyfin read and execute access recursively:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
```

The flags mean:

- `r`: read files and list directory contents
- `x`: enter and traverse directories
- `-R`: apply recursively

For a normal media library, Jellyfin usually does not need write access.

Verify the result:

```bash
getfacl /mnt/media
sudo -u jellyfin ls -la /mnt/media
```

---

## Step 7: Make new files inherit access

Existing files may work while newly copied or downloaded media remains invisible.

Set a default ACL on the library root:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

Then check the default ACL:

```bash
getfacl /mnt/media
```

You should see default entries as well as the normal access entries.

After a new file or directory is created, test it directly:

```bash
getfacl "/mnt/media/tv/New Show"
sudo -u jellyfin ls -la "/mnt/media/tv/New Show"
```

If Sonarr, Radarr, qBittorrent, or another service creates the files, inspect that service's user, group, and umask too. A shared group and cooperative umask can be cleaner for a multi-service media stack.

Use [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/) when only newly imported media fails.

---

## Step 8: Restart Jellyfin and retest

Restart the service:

```bash
sudo systemctl restart jellyfin
```

Retest the folder access:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
```

Then check the service status and recent logs:

```bash
systemctl status jellyfin --no-pager
sudo journalctl -u jellyfin --no-pager -n 100
```

If the direct Linux test succeeds, open Jellyfin and run a library scan.

---

## Mounted USB or internal drives

If the media is stored on another disk, confirm it is mounted where you expect:

```bash
findmnt /mnt/media
lsblk -f
```

Inspect the filesystem type and active options:

```bash
findmnt -no SOURCE,FSTYPE,OPTIONS /mnt/media
```

### ext4

ACLs normally work as expected on ext4.

### NTFS or exFAT

Normal Linux ownership and ACL behaviour may not apply in the same way. Mount options often control access instead.

Relevant options can include:

```text
uid=
gid=
umask=
fmask=
dmask=
```

Do not repeatedly run `chmod` on an NTFS or exFAT mount and expect persistent Linux permissions if the mount options override them.

### Drive works until reboot

An empty mount-point directory can look valid even when the real disk is not mounted.

Validate a permanent `/etc/fstab` entry before rebooting:

```bash
sudo mount -a
findmnt /mnt/media
```

Use a stable UUID rather than relying on `/dev/sdX` names or desktop auto-mount paths.

---

## Network shares and NAS mounts

For SMB or CIFS shares, inspect the mount:

```bash
findmnt | grep -i cifs
findmnt -no TARGET,SOURCE,FSTYPE,OPTIONS /mnt/media
```

Useful CIFS options may include:

```text
uid=
gid=
file_mode=
dir_mode=
```

For NFS, access may depend on server-side export rules, UID matching, and root-squash behaviour.

The fastest practical test remains:

```bash
sudo -u jellyfin ls -la /mnt/media
```

If the Jellyfin user cannot list the mounted path, Jellyfin cannot scan it.

---

## Do not use chmod 777 as the permanent fix

Avoid:

```bash
sudo chmod -R 777 /mnt/media
```

It gives every local user full read, write, and execute access.

A safer default is:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

Jellyfin normally needs to read your media. It does not need to own it.

---

## Worked verification example

Use a known media folder and test it before and after the permission change.

```bash
TARGET="/mnt/media/tv/Show Name"

ls -ld "$TARGET"
namei -l "$TARGET"
sudo -u jellyfin ls -la "$TARGET"
getfacl "$TARGET"
```

After applying the ACL:

```bash
sudo setfacl -R -m u:jellyfin:rx "$TARGET"
sudo setfacl -R -d -m u:jellyfin:rx "$TARGET"
sudo -u jellyfin ls -la "$TARGET"
getfacl "$TARGET"
```

| Before or after | Expected evidence |
|---|---|
| Before | The direct service-user test reproduces the permission failure |
| After | The same command lists the directory without changing the main owner |
| New subfolder | The default ACL is inherited and Jellyfin can list it |
| After restart | Jellyfin scans the folder without `Permission denied` messages |

This before-and-after comparison is stronger evidence than running a broad permission command and assuming it worked.

---

## Exact verification sequence

Run this block after making changes:

```bash
id jellyfin
namei -l /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
sudo -u jellyfin find /mnt/media -maxdepth 3 -type f | head -20
getfacl /mnt/media
findmnt /mnt/media
systemctl status jellyfin --no-pager
sudo journalctl -u jellyfin --no-pager -n 100
```

Then verify in Jellyfin:

1. The configured library path is exact.
2. The library scan completes normally.
3. Existing files appear.
4. A newly copied file appears after a rescan.
5. Logs do not show `Permission denied`.
6. The same access remains after a restart or controlled reboot.

---

## Related guides

- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/)
- [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/)
- [Remote Access Without Port Forwarding: Jellyfin + Tailscale](/guides/jellyfin-tailscale-remote-access/)

---

## Recap

Prove the problem with:

```bash
sudo -u jellyfin ls -la /mnt/media
```

Find the blocking directory with:

```bash
namei -l /mnt/media
```

For a normal ext4 media library, grant read and execute access with ACLs, add a default ACL for future files, and repeat the same direct service-user test.

If the media is mounted from USB, NTFS, exFAT, SMB, CIFS, or NFS, inspect the mount options as well as the folder permissions.
