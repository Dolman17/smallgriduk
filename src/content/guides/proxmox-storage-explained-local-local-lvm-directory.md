---
title: "Proxmox Storage Explained: local, local-lvm and Directory Storage"
description: "Understand what local, local-lvm and Directory storage mean in Proxmox, what each can hold, and how to check where your files and virtual disks really live."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "storage", "local-lvm", "lvm-thin", "directory-storage", "homelab"]
---

## Quick answer

On a typical Proxmox VE installation, `local` and `local-lvm` are two storage definitions, not necessarily two physical drives.

- **`local`** is normally Directory storage at `/var/lib/vz`. It commonly holds ISO images, LXC templates and backup files.
- **`local-lvm`** is normally an LVM-thin pool used for VM and LXC virtual disks.
- **Directory storage** is a mounted filesystem path that Proxmox is allowed to use for selected content types.

Before changing anything, check the live configuration. Names and layouts can differ if the installer choices or storage settings were changed.

For the wider platform context, read [What Is Proxmox VE? A Beginner's Guide for Home Servers](/guides/what-is-proxmox-ve-home-server/).

---

## Check your actual storage layout

In the web interface, open:

`Datacenter → Storage`

Then select each entry and record:

- storage ID
- storage type
- node restrictions
- path, volume group or thin pool
- enabled content types
- available capacity

At the shell, use:

```bash
pvesm status
cat /etc/pve/storage.cfg
lsblk -o NAME,SIZE,FSTYPE,TYPE,MOUNTPOINTS
findmnt
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
```

These commands inspect the layout. They do not modify storage.

Do not assume a label such as `local-lvm` identifies a particular disk. Follow the configured volume group, logical volume and underlying block device.

## What `local` normally means

A common default entry looks conceptually like:

```text
dir: local
    path /var/lib/vz
    content iso,vztmpl,backup
```

The exact content list may differ.

Directory storage stores ordinary files in a mounted filesystem. Depending on enabled content types, Proxmox creates subdirectories such as:

| Content | Common subdirectory |
|---|---|
| ISO images | `template/iso` |
| LXC templates | `template/cache` |
| Backup archives | `dump` |
| Snippets | `snippets` |
| VM disk images | `images/<VMID>` |
| Container root directories | `private/<VMID>` |

Do not manually move files between these directories while guests or tasks are using them.

## What `local-lvm` normally means

A common default LVM-thin entry refers to a thin pool such as `pve/data`.

It commonly accepts:

- VM disk images
- LXC container root filesystems

It normally does not store ISO or backup files as ordinary browseable files.

Check the thin pool with:

```bash
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
```

Watch both `Data%` and `Meta%`. A thin pool can have serious problems if either becomes full.

Thin provisioning lets virtual disks have a larger combined provisioned size than the physical space currently consumed. That flexibility is not extra capacity. Monitor real usage and leave recovery headroom.

## What Directory storage means

Directory storage points Proxmox at a filesystem path, for example:

```text
/mnt/pve/backup-disk
```

The filesystem underneath might be ext4, XFS or another supported Linux filesystem. It must be mounted reliably before Proxmox uses it.

Directory storage is useful when you want:

- visible backup archives
- ISO and template storage
- file-based VM images
- a simple second disk
- a mounted network or local filesystem exposed through a directory

The storage definition does not mount a local disk by itself if you manually created the filesystem. Mount the filesystem first, verify it, and then add the Directory storage.

## Content types control what storage can hold

When adding or editing storage, Proxmox asks which content types it may contain.

Common choices include:

- Disk image
- Container
- ISO image
- Container template
- VZDump backup file
- Snippets

Only enable content that belongs there. For example, a backup-only disk should not also become the default home for active guest disks unless that mixed role is deliberate.

## Storage is not the same as a physical disk

Think in layers:

```text
Physical disk
→ partition or LVM physical volume
→ filesystem or thin pool
→ Proxmox storage definition
→ permitted content
→ VM, LXC, ISO or backup
```

This is why deleting a storage definition does not necessarily erase the underlying data, while formatting a disk certainly can.

## Safe checks before making a change

Record the output of:

```bash
pvesm status
cat /etc/pve/storage.cfg
lsblk -f
findmnt
vgs
lvs -a
```

Then answer:

1. Which physical disk contains the data?
2. Is it mounted, an LVM member, ZFS member or unused?
3. Which guests use the storage?
4. Does the storage contain backups or installation media?
5. Is there a separate, tested backup?
6. Will a reboot remount it correctly?

## Common mistakes

### Treating `local` and `local-lvm` as separate drives

They are often different allocations on the same system disk. A failure of that disk can lose both.

### Storing backups beside the guests

A guest backup on the same physical disk does not protect against failure of that disk.

### Checking only `df -h`

`df` shows mounted filesystems, but not LVM-thin allocation. Use `pvesm status` and `lvs` too.

### Deleting files directly

Remove guests, disks, ISOs and backups through the Proxmox interface or the correct management command where possible. Confirm the item is not referenced before removal.

### Letting thin storage reach 100%

Keep alerts and free headroom. Recovery becomes harder once a thin pool or its metadata is full.

## Verification checklist

- [ ] `pvesm status` shows every expected storage as active.
- [ ] `findmnt` confirms Directory storage is backed by the expected mount.
- [ ] `lvs` shows healthy data and metadata usage.
- [ ] Each storage permits only the intended content.
- [ ] Backups are stored in a separate failure domain.
- [ ] The layout is documented by physical disk, not only by storage ID.
- [ ] A reboot has been tested before relying on a new mount.

This guide explains the storage model; it is not a record of a completed SmallGrid storage change.

Next: [How to Add a Second Hard Drive to Proxmox](/guides/add-second-hard-drive-proxmox/).

Official reference: [Proxmox VE Storage](https://pve.proxmox.com/pve-docs/chapter-pvesm.html).
