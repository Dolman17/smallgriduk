---
title: "How to Add a Second Hard Drive to Proxmox"
description: "Add a second disk to Proxmox safely, verify its identity, create storage in the web interface, and prove that the mount survives a reboot."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "storage", "hard-drive", "ssd", "directory-storage", "homelab"]
---

## Quick answer

For a new or disposable second disk, the simplest beginner approach is usually to create Directory storage from the Proxmox web interface.

The critical step is identifying the correct physical disk. Creating a filesystem destroys existing data on the selected device.

If the disk already contains data you need, stop here and use [How to Mount an Existing Linux Drive in Proxmox](/guides/mount-existing-linux-drive-proxmox/) instead.

Read [Proxmox Storage Explained](/guides/proxmox-storage-explained-local-local-lvm-directory/) before deciding what the new drive should hold. For the wider platform context, see [What Is Proxmox VE? A Beginner's Guide for Home Servers](/guides/what-is-proxmox-ve-home-server/).

---

## Decide the disk's job first

Choose one primary purpose:

- active VM and LXC disks
- ISO images and templates
- local backup archives
- bulk application data
- temporary lab storage

Do not describe a disk as a backup merely because it is separate from the Proxmox system disk. A permanently attached disk in the same host still shares power, controller, theft and operator-error risks.

## Step 1: identify the disk without changing it

Open the node shell and run:

```bash
lsblk -o NAME,MODEL,SERIAL,SIZE,TYPE,FSTYPE,MOUNTPOINTS
blkid
findmnt
```

For a candidate such as `/dev/sdb`, inspect signatures without erasing them:

```bash
wipefs -n /dev/sdb
```

If SMART is available:

```bash
smartctl -a /dev/sdb
```

Replace `/dev/sdb` only after matching the model, serial number and capacity printed on the physical drive.

Stop if you find:

- an existing filesystem
- an LVM, ZFS or RAID signature
- a mounted partition
- a disk used by a guest
- any data you have not backed up and verified

## Step 2: record the current state

Save these details outside the server:

| Item | Record |
|---|---|
| Model and serial | From `lsblk` or `smartctl` |
| Device path | Current path, for this maintenance session only |
| Existing signatures | From `wipefs -n` |
| Intended purpose | VM disks, backups, ISO files or another role |
| Filesystem choice | Record the decision |
| Proxmox storage ID | Use a clear name |
| Backup status | Confirm separately |

Device names such as `/dev/sdb` can change. Persistent mounts should use UUIDs.

## Step 3: create Directory storage in the interface

For an empty disk that you explicitly approve for erasure:

1. Select the Proxmox node.
2. Open **Disks** and confirm the model and serial again.
3. Use the available disk initialisation or Directory creation workflow.
4. Select the intended disk.
5. Choose a clear storage name.
6. Choose the filesystem offered for your design.
7. Select only the required content types.
8. Review the destructive warning before confirming.

The exact button wording can vary by Proxmox release. Do not continue if the selected device does not match your written serial number.

Creating the filesystem removes existing data on that disk.

## Step 4: verify the result

After the task completes:

```bash
pvesm status
lsblk -f
findmnt
cat /etc/pve/storage.cfg
df -hT
```

Confirm:

- the storage is active
- the mount is backed by the correct UUID and disk
- its capacity matches the expected drive
- the intended content types are enabled
- no unexpected disk was changed

## Step 5: test with non-critical content

Before moving an important guest, use a low-risk test:

- upload a disposable ISO
- create a temporary backup of a test guest
- create a small test VM disk

Check that the task completes and the storage usage changes as expected.

## Step 6: reboot and prove persistence

A mount that works before reboot is not yet proven.

Before rebooting:

- make sure no important task is running
- confirm you have local-console access
- record `pvesm status`
- confirm guests are backed up

After the controlled reboot:

```bash
pvesm status
findmnt
lsblk -f
systemctl --failed
journalctl -b -p warning --no-pager
```

Do not start important guests automatically from a new storage target until this test passes.

## If the storage is inactive after reboot

Check:

```bash
findmnt
systemctl status mnt-pve-*.mount --no-pager
journalctl -b --no-pager | grep -Ei 'mount|filesystem|storage'
cat /etc/fstab
```

Likely causes include:

- wrong UUID
- filesystem errors
- disconnected cabling
- slow USB initialisation
- an incorrect mount point
- a storage definition pointing to an unmounted directory

Do not write guest data into an empty mount-point directory while the real disk is absent.

## Common mistakes

- selecting the system disk
- relying only on `/dev/sdX`
- formatting a disk that contains old data
- enabling every content type without a plan
- moving the only guest copy before testing
- skipping the reboot check
- treating an internal disk as the only backup

## Final verification checklist

- [ ] Model, serial and capacity were matched.
- [ ] Existing signatures were inspected.
- [ ] Destructive formatting was explicitly intended.
- [ ] `pvesm status` reports the storage as active.
- [ ] `findmnt` resolves to the correct disk.
- [ ] A non-critical write test succeeded.
- [ ] A controlled reboot succeeded.
- [ ] Important data has another recoverable copy.

These are safe implementation steps, not a claim that SmallGrid has completed this disk change.

Next: [How to Mount an Existing Linux Drive in Proxmox](/guides/mount-existing-linux-drive-proxmox/).

Official reference: [Proxmox VE Storage](https://pve.proxmox.com/pve-docs/chapter-pvesm.html).
