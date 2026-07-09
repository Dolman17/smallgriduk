---
title: "Jellyfin Cannot Access an External USB Drive on Ubuntu"
description: "Fix Jellyfin access to USB media drives on Ubuntu. Check mount paths, filesystem type, permissions, fstab options, and reboot behaviour step by step."
pubDate: 2026-07-08
tags: ["jellyfin", "usb", "ubuntu", "permissions", "mounts", "storage"]
cover: "/images/guides/jellyfin-external-usb-drive.svg"
---

## Quick answer

If Jellyfin cannot access an external USB drive, first confirm where Ubuntu mounted it:

```bash
lsblk -f
findmnt
```

Then test the actual path as the Jellyfin user:

```bash
sudo -u jellyfin ls -la /mnt/media
```

If that returns `Permission denied`, the fix depends on the filesystem type. ext4 normally works well with ACLs. NTFS and exFAT often require the correct mount options in `/etc/fstab`.

---

## Step 1: Find the drive and filesystem

Run:

```bash
lsblk -f
```

Look for:

- device name
- filesystem type
- UUID
- mount point

Example:

```text
sdb1  ext4  1234-ABCD  /mnt/media
```

Do not assume the path is `/media/username/DriveName`. Desktop auto-mount paths can change and may not be suitable for a server.

---

## Step 2: Confirm the drive is mounted

Run:

```bash
findmnt /mnt/media
ls -la /mnt/media
```

If `findmnt` shows nothing, Jellyfin is not looking at the real USB disk.

A stable server mount such as `/mnt/media` or `/srv/media` is easier to maintain.

---

## Step 3: Test access as Jellyfin

```bash
sudo -u jellyfin ls -la /mnt/media
sudo -u jellyfin find /mnt/media -maxdepth 2 -type f | head -20
```

Possible results:

- files listed: permissions are probably fine
- permission denied: fix access
- empty folder: the disk may not be mounted

Use `namei` to inspect the full path:

```bash
namei -l /mnt/media/movies
```

---

## Step 4: Fix ext4 permissions

For ext4, ACLs are usually the cleanest option:

```bash
sudo apt install -y acl
sudo setfacl -R -m u:jellyfin:rx /mnt/media
sudo setfacl -R -d -m u:jellyfin:rx /mnt/media
sudo systemctl restart jellyfin
```

Verify:

```bash
getfacl /mnt/media
sudo -u jellyfin ls -la /mnt/media
```

---

## Step 5: Fix NTFS or exFAT mounts

NTFS and exFAT permissions are often controlled by mount options rather than normal Linux ACLs.

Check the current options:

```bash
findmnt -no SOURCE,FSTYPE,OPTIONS /mnt/media
```

Find the Jellyfin group ID:

```bash
id jellyfin
```

An `/etc/fstab` entry may need options such as:

```text
uid=
gid=
umask=
fmask=
dmask=
```

The exact values depend on which user or group should manage the files.

Test changes with:

```bash
sudo mount -a
```

Do not reboot until `mount -a` completes without errors.

---

## Step 6: Make the mount persistent

Find the UUID:

```bash
lsblk -f
```

Create a stable mount point:

```bash
sudo mkdir -p /mnt/media
```

Back up and edit fstab:

```bash
sudo cp /etc/fstab /etc/fstab.backup
sudo nano /etc/fstab
```

Example ext4 entry:

```text
UUID=YOUR-UUID /mnt/media ext4 defaults,nofail 0 2
```

Then test:

```bash
sudo mount -a
findmnt /mnt/media
```

---

## Step 7: Add the correct path in Jellyfin

In Jellyfin, open:

```text
Dashboard → Libraries → Manage folders
```

Add the stable Linux path, for example:

```text
/mnt/media/movies
/mnt/media/tv
```

Avoid using a temporary desktop auto-mount path.

---

## Step 8: Reboot and verify

```bash
sudo reboot
```

After reconnecting:

```bash
findmnt /mnt/media
sudo -u jellyfin ls -la /mnt/media
systemctl status jellyfin --no-pager
```

If the library disappears after reboot, use [Jellyfin Media Disappears After Reboot](/guides/jellyfin-media-disappears-after-reboot/).

---

## Related guides

- [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Media Disappears After Reboot](/guides/jellyfin-media-disappears-after-reboot/)
- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Install Jellyfin on Ubuntu](/guides/jellyfin-ubuntu-low-power/)

---

## Recap

Find the real mount point, identify the filesystem, test access as the `jellyfin` user, and make the mount persistent.

Use ACLs for ext4. Use appropriate mount options for NTFS or exFAT.