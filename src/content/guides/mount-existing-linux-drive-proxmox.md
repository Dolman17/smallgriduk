---
title: "How to Mount an Existing Linux Drive in Proxmox"
description: "Mount an existing ext4 or XFS drive in Proxmox without formatting it, use a stable UUID, add Directory storage, and verify the mount after reboot."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "storage", "linux", "mount", "ext4", "xfs", "directory-storage"]
---

## Quick answer

To use an existing Linux filesystem in Proxmox without erasing it:

1. identify the disk by model, serial and UUID
2. confirm the filesystem and existing data
3. create an empty mount point
4. mount it read-only for the first inspection
5. add a UUID-based `/etc/fstab` entry
6. verify `mount -a`
7. add the mounted path as Directory storage
8. test a controlled reboot

Do not use Proxmox's create-filesystem workflow on a disk whose existing data must survive.

Start with [How to Add a Second Hard Drive to Proxmox](/guides/add-second-hard-drive-proxmox/) if the disk is empty and intended to be reformatted. For the wider platform context, see [What Is Proxmox VE? A Beginner's Guide for Home Servers](/guides/what-is-proxmox-ve-home-server/).

---

## Scope and limits

This guide is for a normal Linux filesystem such as ext4 or XFS.

Stop and research the existing storage design if `lsblk` or `wipefs -n` reports:

- LVM physical volumes
- ZFS members
- mdraid
- BitLocker
- LUKS encryption
- an unknown or damaged filesystem

Importing pools, RAID sets or encrypted volumes requires different procedures.

## Step 1: identify the drive

Run read-only checks:

```bash
lsblk -o NAME,MODEL,SERIAL,SIZE,FSTYPE,UUID,MOUNTPOINTS
blkid
wipefs -n /dev/sdX
```

Replace `/dev/sdX` only after matching the physical model and serial.

If the partition is `/dev/sdX1`, inspect it:

```bash
file -s /dev/sdX1
```

Do not run `mkfs`, `wipefs -a`, `fdisk`, `parted` or a Proxmox initialise action.

## Step 2: make sure it is not mounted elsewhere

Check:

```bash
findmnt
mount | grep '/dev/sdX'
lsof /dev/sdX1
```

A filesystem must not be mounted twice at different paths.

For a disk moved from another server, record:

- original mount path
- ownership and numeric UID/GID
- applications that expect its paths
- whether the source machine was shut down cleanly
- the latest verified backup

## Step 3: create a mount point

Use a clear permanent path:

```bash
mkdir -p /mnt/pve/existing-data
```

The directory should be empty before mounting:

```bash
find /mnt/pve/existing-data -mindepth 1 -maxdepth 1 -print
```

If that command prints files, stop and investigate.

## Step 4: mount read-only first

For an ext4 example:

```bash
mount -o ro /dev/disk/by-uuid/YOUR-UUID /mnt/pve/existing-data
findmnt /mnt/pve/existing-data
ls -la /mnt/pve/existing-data
```

Inspect representative data:

```bash
find /mnt/pve/existing-data -maxdepth 2 -type f | head -20
du -sh /mnt/pve/existing-data
```

Unmount after inspection:

```bash
umount /mnt/pve/existing-data
```

Do not change ownership recursively just because names look unfamiliar. Linux stores numeric UID and GID values; map the intended service accounts first.

## Step 5: add a persistent UUID mount

Back up the current file:

```bash
cp /etc/fstab /etc/fstab.before-existing-data
```

An ext4 example is:

```fstab
UUID=YOUR-UUID /mnt/pve/existing-data ext4 defaults,nofail,x-systemd.device-timeout=10 0 2
```

For XFS, use the correct filesystem type and final dump/pass fields for your system design.

Edit carefully:

```bash
nano /etc/fstab
systemctl daemon-reload
mount -a
findmnt /mnt/pve/existing-data
```

If `mount -a` reports an error, restore the backed-up file or correct the entry before rebooting.

`nofail` can allow the host to boot when the disk is absent, but it also means the mount may be missing while the directory still exists. Check the mount before any job writes to it.

## Step 6: add it as Directory storage

In the web interface:

1. open `Datacenter → Storage`
2. choose `Add → Directory`
3. enter a unique storage ID
4. set the directory to `/mnt/pve/existing-data`
5. select only the intended content types
6. restrict nodes if required
7. save the definition

Then verify:

```bash
pvesm status
cat /etc/pve/storage.cfg
findmnt /mnt/pve/existing-data
```

If the drive contains ordinary application files rather than Proxmox-managed content, do not enable content types simply to make those files appear in the interface.

## Existing data and Proxmox subdirectories

When Directory storage is enabled for Proxmox content, Proxmox may create managed subdirectories for ISOs, backups or guest images.

Keep unrelated existing files outside those managed subdirectories. Document which paths belong to Proxmox and which belong to applications.

## Step 7: test permissions safely

Use a temporary file only if the filesystem is meant to be writable:

```bash
touch /mnt/pve/existing-data/.proxmox-write-test
stat /mnt/pve/existing-data/.proxmox-write-test
rm /mnt/pve/existing-data/.proxmox-write-test
```

Do not use a recursive `chmod` or `chown` as a first response to permission errors.

## Step 8: reboot verification

Before rebooting, confirm you have console access and a valid `fstab`.

After reboot:

```bash
findmnt /mnt/pve/existing-data
pvesm status
systemctl --failed
journalctl -b -p warning --no-pager
```

Confirm representative existing files are still visible before starting dependent guests.

## Recovery if the host enters emergency mode

At the local console:

1. identify the failing `fstab` entry
2. temporarily comment it out or correct the UUID and filesystem type
3. run `systemctl daemon-reload`
4. test with `mount -a`
5. reboot only after the command returns cleanly

Keep the original `fstab` backup and avoid filesystem repair while the partition is mounted.

## Final verification checklist

- [ ] The drive was identified by model, serial and UUID.
- [ ] No formatting or signature removal was performed.
- [ ] Existing data was inspected read-only first.
- [ ] The permanent mount uses a UUID.
- [ ] `mount -a` returned without error.
- [ ] The storage path resolves to the expected filesystem.
- [ ] Permissions were tested without recursive changes.
- [ ] The reboot test passed.
- [ ] Existing files were rechecked after reboot.

This procedure has not been presented as a completed SmallGrid test.

Next: [Proxmox Directory Storage vs LVM-Thin](/guides/proxmox-directory-storage-vs-lvm-thin/).

Official reference: [Proxmox Directory storage](https://pve.proxmox.com/pve-docs/pve-storage-dir-plain.html).
