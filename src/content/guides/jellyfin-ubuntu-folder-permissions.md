---
title: "Give Jellyfin Access to Media Folders on Ubuntu"
description: "Fix Jellyfin permission denied errors on Ubuntu. Check users, parent folders, mounted drives, ACLs, fstab options, and library paths step by step."
pubDate: 2026-06-27
updatedDate: 2026-07-06
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

## Common Jellyfin permission errors

Typical symptoms include:

- `Permission denied`
- Jellyfin can add the folder but shows no files
- a library scan completes almost instantly
- old files appear but newly copied files do not
- media works until the server reboots
- a USB drive or NAS path appears empty
- Jellyfin can see `/mnt/media` but not `/mnt/media/movies`

These problems are usually caused by one of four things:

1. Jellyfin cannot traverse a parent folder.
2. Existing files do not grant the `jellyfin` user read access.
3. New files do not inherit the correct permissions.
4. A mounted drive or network share uses unsuitable mount options.

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

If the library is empty rather than showing an explicit permission error, work through [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/) alongside this guide.

---

## Step 3: Test the complete path as the Jellyfin user

This is the most useful test:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

If Jellyfin can read the folders, you will see their contents.

If you see:

```text
ls: cannot open directory '/mnt/media': Permission denied
```

or:

```text
ls: cannot access '/mnt/media/movies': Permission denied
```

then the problem is confirmed.

To identify the exact parent folder blocking access, use:

```bash
namei -l /mnt/media/movies
```

The output shows the owner and permissions for every part of the path. Jellyfin needs execute permission on each directory in the chain so it can traverse into the final folder.

---

## Step 4: Check parent-folder traversal

A media folder can look readable while a parent directory blocks access.

For example:

```text
/home/sean/media/movies
```

Jellyfin may have access to `media` but still be blocked by `/home/sean`.

Test the path directly:

```bash
sudo -u jellyfin ls -la /home/sean/media
```

For shared service data, a cleaner long-term structure is usually:

```text
/mnt/media
/srv/media
```

If you keep media inside a home folder, grant traversal carefully rather than making the whole home directory broadly readable.

---

## Step 5: Install ACL support

Install the ACL tools:

```bash
sudo apt update
sudo apt install -y acl
```

ACLs let you give the `jellyfin` user access without changing the main owner or group of the media library.

This is useful when your normal account, Sonarr, Radarr, or another service still manages the files.

---

## Step 6: Give Jellyfin access to existing files

Grant read and execute access recursively:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
```

The flags mean:

- `r`: read files and list directory contents
- `x`: enter and traverse directories
- `-R`: apply recursively

For a normal media library, Jellyfin usually does not need write access.

Check the resulting ACL:

```bash
getfacl /mnt/media
getfacl /mnt/media/movies
```

You should see an entry similar to:

```text
user:jellyfin:r-x
```

---

## Step 7: Make new files inherit access

Existing files may work while newly copied media remains invisible.

Set a default ACL on the media folder:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

This gives new files and folders an inherited Jellyfin rule.

After copying a new file, verify it:

```bash
getfacl /mnt/media/movies/NEW-FOLDER
sudo -u jellyfin ls -la /mnt/media/movies/NEW-FOLDER
```

If automated tools create the files, also check the service account and umask used by Sonarr, Radarr, qBittorrent, or your download client.

---

## Step 8: Restart Jellyfin and test again

Restart the service:

```bash
sudo systemctl restart jellyfin
```

Retest folder access:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

If those commands work, open Jellyfin and run a library scan.

---

## Mounted USB or internal drives

If the media is stored on another disk, confirm it is mounted where you expect:

```bash
findmnt /mnt/media
lsblk -f
```

Also inspect the filesystem type:

```bash
findmnt -no SOURCE,FSTYPE,OPTIONS /mnt/media
```

### ext4

ACLs normally work as expected on ext4.

### NTFS or exFAT

Normal Linux ownership and ACL behaviour may not apply in the same way. Mount options often control access instead.

Check `/etc/fstab`:

```bash
sudo nano /etc/fstab
```

For NTFS or exFAT, options such as `uid`, `gid`, `umask`, `fmask`, and `dmask` may determine what Jellyfin can access.

Do not repeatedly run `chmod` on an NTFS or exFAT mount and expect persistent Linux permissions if the mount options override them.

### Drive works until reboot

If Jellyfin works before a reboot but the library becomes empty afterwards, the disk may not be mounting automatically.

Check:

```bash
findmnt /mnt/media
ls -la /mnt/media
```

An empty mount-point directory can look valid even when the real disk is not mounted.

For permanently attached storage, use a stable UUID entry in `/etc/fstab` rather than relying on a desktop auto-mount path.

---

## Network shares and NAS mounts

For SMB or CIFS shares, mount options decide which local user and group appear to own the files.

Check the mount:

```bash
findmnt | grep -i cifs
```

Then inspect the options:

```bash
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

## If Jellyfin runs in Docker

A Docker container has two relevant paths:

```text
Host path:      /srv/media/movies
Container path: /media/movies
```

Jellyfin must use the container path shown inside the container, not necessarily the host path.

Also check the UID and GID used by the container. A host folder can be readable by the native `jellyfin` user while still being inaccessible to a container running under a different UID.

Use the dedicated guide: [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/).

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

## Exact verification sequence

Run this block after making changes:

```bash
id jellyfin
namei -l /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
getfacl /mnt/media
findmnt /mnt/media
systemctl status jellyfin --no-pager
```

Then verify in Jellyfin:

1. The configured library path is exact.
2. The library scan completes normally.
3. Existing files appear.
4. A newly copied file appears after a rescan.
5. Logs do not show `Permission denied`.

---

## Related guides

- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [Remote Access Without Port Forwarding: Jellyfin + Tailscale](/guides/jellyfin-tailscale-remote-access/)

---

## Recap

If Jellyfin cannot access a media folder on Ubuntu, prove the problem with:

```bash
sudo -u jellyfin ls -la /mnt/media
```

Then inspect the full path with:

```bash
namei -l /mnt/media
```

For a normal ext4 media library, the practical fix is usually:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

If the media is mounted from USB, NTFS, exFAT, SMB, CIFS, or NFS, inspect the mount options as well as the folder permissions.