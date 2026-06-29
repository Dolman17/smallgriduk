---
title: "Fix Jellyfin Folder Permissions on Ubuntu"
description: "A practical guide to fixing Jellyfin media folder access problems on Ubuntu using users, groups, ACLs, and simple checks."
pubDate: 2026-06-27
tags: ["jellyfin", "ubuntu", "permissions", "media"]
cover: "/images/guides/jellyfin-folder-permissions-diagram.webp"
---

## Goal

Fix the common Ubuntu problem where Jellyfin is installed correctly but cannot see your media folders.

This guide focuses on one thing: giving the `jellyfin` service user reliable read access to your media without making the whole system messy or insecure.

---

## The default recommendation

Use ACLs to give the `jellyfin` user read and execute access to your media folder.

For most home servers, this is cleaner than changing ownership of your entire media library or making the folder world-readable.

Default command pattern:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Replace `/mnt/media` with your actual media path.

---

## What you’ll need

- Jellyfin already installed on Ubuntu
- SSH or terminal access
- The path to your media folder
- Permission to use `sudo`

Common media paths include:

```text
/mnt/media
/srv/media
/media/storage
/home/YOUR-USER/media
```

If you are still setting Jellyfin up from scratch, start with [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/).

---

## Step 1: Check the Jellyfin user exists

Jellyfin normally runs as a Linux user called `jellyfin`.

Check it:

```bash
id jellyfin
```

You should see output showing a user ID, group ID, and groups.

If that command fails, Jellyfin may not be installed correctly. Reinstall or repair Jellyfin before continuing.

---

## Step 2: Find your media folder

Check where your media actually lives.

Example:

```bash
ls -la /mnt/media
```

If your folders are somewhere else, check that location instead:

```bash
ls -la /srv/media
ls -la /media
ls -la /home/$USER
```

For this guide, the example path is:

```text
/mnt/media
```

Inside it, you might have:

```text
/mnt/media/movies
/mnt/media/tv
/mnt/media/music
```

---

## Step 3: Test whether Jellyfin can read the folder

Run this command:

```bash
sudo -u jellyfin ls -la /mnt/media
```

Then test the library folders:

```bash
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

If Jellyfin can read them, you should see the folder contents.

If you see `Permission denied`, Jellyfin does not have enough access.

---

## Step 4: Install ACL support

Most Ubuntu installs already support ACLs, but installing the package is harmless:

```bash
sudo apt update
sudo apt install -y acl
```

ACLs let you give one specific user access to a folder without changing the main owner or group.

That is useful because your normal user can keep managing media files, while Jellyfin gets the read access it needs.

---

## Step 5: Give Jellyfin access to existing files

Give the `jellyfin` user read and execute access to the whole media folder:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
```

What this means:

- `r` lets Jellyfin read files and list folders.
- `x` lets Jellyfin enter folders.
- `-R` applies the rule recursively.

Do not use write access unless Jellyfin genuinely needs to write into that folder.

For a normal media library, read access is enough.

---

## Step 6: Make permissions apply to new files too

Set a default ACL so new files and folders inherit Jellyfin access:

```bash
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

This helps avoid the frustrating situation where today’s media works, but newly copied files disappear from Jellyfin later.

---

## Step 7: Restart Jellyfin and test again

Restart Jellyfin:

```bash
sudo systemctl restart jellyfin
```

Test folder access again:

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
```

If those commands now show folder contents, go back to the Jellyfin web interface and rescan the library.

---

## Step 8: Rescan your Jellyfin library

In Jellyfin:

1. Open **Dashboard**.
2. Go to **Libraries**.
3. Select the affected library.
4. Run a library scan.

If the folder still appears empty, check that the path in Jellyfin exactly matches the real Linux path.

For example, these are not the same:

```text
/mnt/media/tv
/mnt/Media/TV
```

Linux paths are case-sensitive.

---

## Common problem: media inside your home folder

If your media is inside your home directory, such as:

```text
/home/sean/media
```

Jellyfin may be blocked by the permissions on `/home/sean`, even if `/home/sean/media` looks readable.

You can test it:

```bash
sudo -u jellyfin ls -la /home/sean/media
```

If that fails, either move the media to a server-style path:

```text
/mnt/media
/srv/media
```

Or carefully grant traversal access on the parent directory.

For a home server, the cleaner long-term answer is usually to keep shared service data under `/srv` or `/mnt`, not inside a personal home folder.

---

## Common problem: external USB drives

If the media is on a USB drive, check the mount point:

```bash
findmnt
```

Then check permissions:

```bash
ls -la /mnt
ls -la /mnt/media
```

If the drive is formatted as NTFS or exFAT, Linux permissions may behave differently. In that case, the mount options in `/etc/fstab` matter more than normal `chmod` commands.

For a dedicated Ubuntu media server, ext4 is usually the simplest filesystem for internal or permanently attached drives.

---

## Common problem: network shares

For SMB/CIFS or NAS shares, the mount options decide which Linux user owns the files.

Check the mount:

```bash
findmnt | grep -i cifs
```

If Jellyfin cannot read a network-mounted folder, inspect `/etc/fstab` and confirm the share is mounted with suitable `uid`, `gid`, `file_mode`, and `dir_mode` options.

A typical home-server approach is to mount the share somewhere predictable, such as:

```text
/mnt/media
```

Then give Jellyfin access to that mount point.

---

## Do not make everything world-writable

Avoid quick fixes like this:

```bash
sudo chmod -R 777 /mnt/media
```

It may appear to fix Jellyfin, but it also gives every local user full read, write, and execute access.

For a home server, ACLs are a better default:

```bash
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
```

Jellyfin needs to read your media. It usually does not need to own it.

---

## Quick verification checklist

Run these checks:

```bash
id jellyfin
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin ls -la /mnt/media/movies
sudo -u jellyfin ls -la /mnt/media/tv
systemctl status jellyfin --no-pager
```

Then check Jellyfin itself:

- The library path is correct.
- The library scan completes.
- Files appear in the right library.
- New files appear after a rescan.

---

## Next steps

Useful follow-up guides:

- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Remote Access Without Port Forwarding: Jellyfin + Tailscale](/guides/jellyfin-tailscale-remote-access/)
- [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/)
- [3-2-1 Backups for Home Servers](/guides/backups-3-2-1-home-server/)

---

## Recap

If Jellyfin cannot see your media on Ubuntu, check permissions before reinstalling anything.

The practical fix is usually:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

A quiet, reliable Jellyfin server is mostly about boring fundamentals: sensible folders, clear permissions, and no exposed services unless you actually need them.
