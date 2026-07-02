---
title: "Jellyfin Library Not Showing Files: Fix Media Scans, Paths, and Permissions"
description: "Troubleshoot Jellyfin when a library is empty, media scans do not find files, paths are wrong, or folder permissions block access."
pubDate: 2026-07-02
tags: ["jellyfin", "library", "permissions", "media", "troubleshooting"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Goal

Fix the common problem where Jellyfin is installed, the library exists, but media does not appear.

Symptoms include:

- Jellyfin library is empty
- Jellyfin can see a folder but not files
- media scans finish too quickly
- new files do not appear
- files exist on disk but not in Jellyfin

This is usually a path, permission, file format, mount, or scan issue.

---

## The default recommendation

Do not reinstall Jellyfin first.

Work through the basics in this order:

1. Check the path in Jellyfin.
2. Check the files exist on the server.
3. Check the `jellyfin` user can read the folder.
4. Check mounts are available after reboot.
5. Rescan the library.
6. Check logs.

Most empty-library problems are solved before step 6.

---

## Step 1: Confirm the media path is real

SSH into the server and check the folder path.

Example:

```bash
ls -la /mnt/media
ls -la /mnt/media/movies
ls -la /mnt/media/tv
```

If the path does not exist, Jellyfin cannot scan it.

Common path mistakes:

```text
/mnt/media/tv
/mnt/Media/TV
```

Linux paths are case-sensitive. Those are different paths.

---

## Step 2: Check the library path in Jellyfin

In Jellyfin:

```text
Dashboard → Libraries → Select library → Manage folders
```

Check that the folder path exactly matches the Linux path.

Good example:

```text
/mnt/media/movies
```

Bad examples:

```text
/mnt/media/movie
/media/movies
/home/user/Downloads/Movies
```

A path that looks close is still wrong if it is not exact.

---

## Step 3: Test access as the Jellyfin user

This is the key test.

Run:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
```

If you see the files, Jellyfin can read them.

If you get:

```text
Permission denied
```

then this is a permissions issue.

Use the full permissions guide: [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## Step 4: Fix folder permissions safely

For a normal Ubuntu install, ACLs are usually the cleanest fix.

Install ACL support:

```bash
sudo apt update
sudo apt install -y acl
```

Grant read and execute access:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Replace `/mnt/media` with your actual media path.

Do not start with `chmod -R 777`. It is a messy fix and gives too much access.

---

## Step 5: Check external drives and mounts

If your media is on a USB drive, NAS share, or mounted disk, make sure it is actually mounted.

Run:

```bash
findmnt
lsblk
```

Then check your media path again:

```bash
ls -la /mnt/media
```

A common mistake is adding a library path while the drive is mounted, then rebooting and the drive does not mount again.

If the folder exists but is empty after reboot, the drive may not be mounted.

---

## Step 6: Check file names and structure

Jellyfin is usually better when files are organised clearly.

Good movie layout:

```text
/mnt/media/movies/Film Name (2024)/Film Name (2024).mkv
```

Good TV layout:

```text
/mnt/media/tv/Show Name/Season 01/Show Name - S01E01.mkv
```

Poor layout can cause metadata issues, but it usually does not make files completely invisible. If the folder is empty in Jellyfin, check path and permissions first.

---

## Step 7: Rescan the library

In Jellyfin:

```text
Dashboard → Libraries → Scan All Libraries
```

Or scan a specific library from its settings page.

Give it time if the library is large. A big media library can take a while to scan, especially on a low-power mini PC.

---

## Step 8: Check the logs

Check the Jellyfin service:

```bash
systemctl status jellyfin --no-pager
```

Then check recent logs:

```bash
sudo journalctl -u jellyfin --no-pager -n 100
```

Look for messages about:

- permission denied
- path not found
- inaccessible mount
- unsupported file
- database or metadata errors

The log usually tells you whether Jellyfin tried to scan the folder.

---

## Docker note

If Jellyfin runs in Docker, the path inside Jellyfin is the container path, not always the host path.

Example host path:

```text
/srv/media/movies
```

Example container path:

```text
/media/movies
```

Inside Jellyfin, you would add:

```text
/media/movies
```

not the host path, unless that is how you mounted it.

See [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/).

---

## Quick checklist

Run through this:

```text
The media path exists on the server
The path in Jellyfin exactly matches the correct path
The jellyfin user can list the folder
The disk or NAS share is mounted
Files are in sensible folders
The library scan has been run
The logs do not show permission denied
```

---

## Next steps

Useful related guides:

- [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Docker Permissions: Fix Media Folder Access Properly](/guides/jellyfin-docker-permissions-media-folder/)
- [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

If a Jellyfin library is not showing files, start with path and permissions.

The fastest useful test is:

```bash
sudo -u jellyfin ls -la /mnt/media
```

If that fails, Jellyfin cannot read the folder. Fix that before changing metadata settings, reinstalling Jellyfin, or rebuilding the server.
