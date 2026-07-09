---
title: "Jellyfin Media Disappears After Reboot: Fix Missing Mounts"
description: "Fix Jellyfin libraries that disappear after reboot. Check mount points, UUID entries, fstab, service timing, permissions, and empty media folders."
pubDate: 2026-07-08
tags: ["jellyfin", "reboot", "mounts", "fstab", "ubuntu", "media"]
cover: "/images/guides/jellyfin-media-disappears-after-reboot.svg"
---

## Quick answer

If Jellyfin media disappears after reboot, the media disk or network share probably did not mount before Jellyfin scanned the library.

Check:

```bash
findmnt /mnt/media
ls -la /mnt/media
```

If `findmnt` returns nothing and the folder is empty, Jellyfin is looking at the mount-point directory rather than the real disk.

---

## Why this happens

Linux can leave the mount-point folder in place even when the disk is not mounted.

Example:

```text
Expected disk: /mnt/media
Actual state:  empty local directory at /mnt/media
```

Jellyfin starts, scans the empty directory, and the library appears to vanish.

---

## Confirm the disk is missing

Run:

```bash
findmnt /mnt/media
lsblk -f
ls -la /mnt/media
```

Also check available space:

```bash
df -h /mnt/media
```

If the reported filesystem is your Ubuntu root filesystem rather than the media disk, the mount failed.

---

## Use the disk UUID in fstab

Find the UUID:

```bash
lsblk -f
```

Back up `/etc/fstab`:

```bash
sudo cp /etc/fstab /etc/fstab.backup
```

Edit it:

```bash
sudo nano /etc/fstab
```

Example ext4 entry:

```text
UUID=YOUR-UUID /mnt/media ext4 defaults,nofail 0 2
```

Create the mount point if needed:

```bash
sudo mkdir -p /mnt/media
```

Test the configuration without rebooting:

```bash
sudo mount -a
findmnt /mnt/media
```

Fix any error before rebooting.

---

## Check permissions after mounting

Once mounted, test access as Jellyfin:

```bash
sudo -u jellyfin ls -la /mnt/media
```

If that returns `Permission denied`, apply the correct ACL or group access.

See [Give Jellyfin Access to Media Folders on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/).

---

## Make Jellyfin wait for the mount

For local mounts, a correct `/etc/fstab` entry is often enough.

For slow network shares or unusual storage, Jellyfin may start before the mount is ready.

Create a systemd override:

```bash
sudo systemctl edit jellyfin
```

Add:

```ini
[Unit]
RequiresMountsFor=/mnt/media
After=network-online.target
Wants=network-online.target
```

Then reload systemd:

```bash
sudo systemctl daemon-reload
sudo systemctl restart jellyfin
```

This makes the service depend on the media path.

---

## Watch for files written into the empty mount point

A download service can write files into `/mnt/media` while the real disk is absent.

Later, when the disk mounts, those files become hidden underneath the mounted filesystem.

To investigate safely:

1. Stop services that write to the path.
2. Confirm the disk contents are backed up.
3. Unmount the disk.
4. Inspect the underlying mount-point directory.

Do not move or delete files until you know which filesystem you are viewing.

---

## Network shares

For SMB, CIFS, or NFS mounts, check:

```bash
findmnt -t cifs,nfs,nfs4
```

Network mounts may need options such as:

```text
_netdev
x-systemd.automount
nofail
```

Use credentials files rather than placing passwords directly in `/etc/fstab`.

---

## Test the complete reboot path

Reboot:

```bash
sudo reboot
```

After reconnecting, run:

```bash
findmnt /mnt/media
sudo -u jellyfin ls -la /mnt/media
systemctl status jellyfin --no-pager
```

Then open Jellyfin and scan the affected library.

---

## Related guides

- [Jellyfin Library Not Showing Files](/guides/jellyfin-media-library-not-showing-files/)
- [Jellyfin Cannot Access an External USB Drive](/guides/jellyfin-cannot-access-external-usb-drive/)
- [Jellyfin Not Scanning New Files](/guides/jellyfin-not-scanning-new-files/)
- [Install Jellyfin on Ubuntu](/guides/jellyfin-ubuntu-low-power/)

---

## Recap

When media disappears after reboot, verify the mount before changing Jellyfin.

Use a stable UUID entry, test it with `mount -a`, verify Jellyfin permissions, and make the service wait for the media path when necessary.