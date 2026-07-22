---
title: "Proxmox Directory Storage vs LVM-Thin"
description: "Compare Proxmox Directory storage and LVM-thin for VM disks, containers, ISO files, backups, snapshots, monitoring and recovery."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "storage", "directory-storage", "lvm-thin", "virtual-machines", "lxc"]
---

## Quick answer

Choose **Directory storage** when you want ordinary files on a mounted filesystem, broad content support and straightforward file-level inspection.

Choose **LVM-thin** when the main job is thin-provisioned VM and LXC disks with block-storage snapshots and clones.

Neither is universally better. The choice should follow the content, recovery plan and monitoring you can maintain.

For the default layout, read [Proxmox Storage Explained](/guides/proxmox-storage-explained-local-local-lvm-directory/). For the wider platform context, see [What Is Proxmox VE? A Beginner's Guide for Home Servers](/guides/what-is-proxmox-ve-home-server/).

---

## Side-by-side comparison

| Question | Directory storage | LVM-thin |
|---|---|---|
| Underlying form | Mounted filesystem path | Thin pool in an LVM volume group |
| VM disks | File-based images such as raw or qcow2, depending on configuration | Thin logical volumes |
| LXC root filesystems | Supported | Supported |
| ISO images | Supported | Not the normal role |
| LXC templates | Supported | Not the normal role |
| VZDump backups | Supported | Not stored as ordinary backup archives |
| Snippets | Supported | Not the normal role |
| Thin provisioning | Depends on file format and filesystem behaviour | Native thin-pool allocation |
| Snapshots | Depends on image format and storage support | Supported for guest volumes |
| File-level browsing | Straightforward | Requires LVM tools; volumes are block devices |
| Capacity tools | `df`, `du`, `pvesm` | `lvs`, `vgs`, `pvesm` |
| Main risk | Filling the filesystem or writing to an unmounted mount point | Filling thin data or metadata |

Capabilities can depend on the exact content and image format. Check the storage entry and current Proxmox documentation before relying on a feature.

## How Directory storage works

Directory storage points to a path such as:

```text
/var/lib/vz
/mnt/pve/second-disk
```

The path must sit on a mounted filesystem.

Benefits:

- easy to inspect with normal Linux tools
- can hold several Proxmox content types
- convenient for ISO files and backup archives
- simple to copy files to another filesystem
- works with an existing mounted Linux filesystem

Trade-offs:

- performance and snapshot support depend on filesystem and image format
- a missing mount can expose an ordinary directory at the same path
- file-based images can fragment or grow unexpectedly
- mixing active guests and backups can complicate capacity planning

Monitor it with:

```bash
pvesm status
df -hT
du -xhd1 /mnt/pve/STORAGE_PATH
findmnt /mnt/pve/STORAGE_PATH
```

## How LVM-thin works

LVM-thin allocates guest volumes from a thin pool. A guest may see a large virtual disk even though only written blocks consume physical pool space.

Benefits:

- efficient initial allocation
- block-level guest volumes
- snapshots and clones
- well integrated for VM and LXC disks
- no directory full of large image files

Trade-offs:

- cannot normally hold ISO or VZDump backup files
- over-provisioning can hide future capacity pressure
- thin-pool metadata needs monitoring
- manual file copying is not the management model
- reaching full allocation can affect several guests at once

Monitor it with:

```bash
pvesm status
vgs
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
```

Do not look only at guest filesystem free space. Ten guests can each report free space while their combined writes consume the host thin pool.

## Which should hold backups?

Use Directory, NFS, CIFS or Proxmox Backup Server storage for VZDump backups.

Do not count a backup on the same physical disk or thin pool as protection from that disk failing.

## Which should hold ISO images?

Directory storage is the normal choice. ISO images are files, and LVM-thin is intended for guest block volumes.

## Which should hold active guest disks?

Either can work.

Use LVM-thin when:

- the storage is dedicated mainly to guest volumes
- snapshots and thin allocation matter
- you will monitor data and metadata usage
- file-level access is not required

Use Directory storage when:

- you want ordinary image files
- the filesystem already exists
- the disk also holds ISO images or backups by deliberate design
- file-level tooling makes recovery easier for your environment

Avoid choosing solely from assumed performance. Test the same workload on the same hardware if performance is the deciding factor.

## Snapshot support is not a backup plan

A snapshot shares the storage and failure domain of the original guest disk. It can help roll back a software change, but it does not protect against:

- disk failure
- loss of the host
- accidental deletion of the storage
- thin-pool exhaustion
- corruption affecting the same storage

Use independent backups and test restores.

## Capacity planning example

Suppose a 1 TB thin pool contains four virtual disks sized at 400 GB each.

The total provisioned size is 1.6 TB, but the host has only 1 TB of physical pool capacity. This can be valid while actual blocks used stay below the limit.

It becomes dangerous if guest growth is not monitored.

For Directory storage, the equivalent danger is several image and backup files competing for one mounted filesystem until `df` reports no space.

## Decision checklist

Choose the storage only after answering:

- What content must it hold?
- Are snapshots required?
- Does the storage need ordinary files?
- How will capacity be monitored?
- Where are independent backups kept?
- Can the guest be restored to different storage?
- What happens if the mount or thin pool is unavailable?
- Has reboot recovery been tested?

## Common mistakes

- enabling every content type
- assuming thin provisioning creates extra capacity
- storing the only backup beside the guest
- monitoring `df` but not `lvs`
- using `du` to diagnose an LVM-thin pool
- expecting a Directory snapshot feature regardless of image format
- deleting LVM volumes manually instead of through Proxmox

## Practical beginner recommendation

A simple single-node layout can be:

```text
local      → ISO images and LXC templates
local-lvm  → active VM and LXC disks
backup     → VZDump archives on separate storage
```

This guide is a recommendation, not a record of a measured or completed SmallGrid storage configuration.

Next: [How to Back Up a Proxmox VM or LXC Container](/guides/back-up-proxmox-vm-lxc/).

Official reference: [Proxmox VE Storage](https://pve.proxmox.com/pve-docs/chapter-pvesm.html).
