---
title: "Proxmox Disk Full: Find What Is Using the Space"
description: "Diagnose a full Proxmox filesystem or LVM-thin pool, find large backups, ISOs, logs, snapshots and guest disks, then reclaim space without deleting the wrong data."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "storage", "disk-full", "troubleshooting", "lvm-thin", "backup"]
---

## Quick answer

Do not delete random files when Proxmox reports full storage.

First determine what is full:

```bash
pvesm status
df -hT
df -ih
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
```

Then investigate the correct layer:

- full mounted filesystem: use `du`, backup and ISO inventories, logs and mount checks
- full LVM-thin pool: use `lvs`, guest configuration and snapshot inventories
- inactive Directory storage: confirm the real disk is mounted before writing or deleting anything
- full inode table: find directories containing huge numbers of small files

For the storage model, read [Proxmox Storage Explained](/guides/proxmox-storage-explained-local-local-lvm-directory/).

For platform context, read [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

---

## Immediate precautions

If storage is at or near 100%:

- pause non-essential backups and migrations
- avoid creating snapshots
- stop large downloads and ISO uploads
- do not reboot blindly if guest disks or host services are failing
- preserve local-console access
- record command output before making changes
- confirm an independent backup exists

Do not use `rm -rf` against storage directories or manually remove LVM volumes.

## Step 1: identify the full storage layer

Run:

```bash
pvesm status
df -hT
df -ih
vgs
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
lsblk -f
findmnt
```

Interpretation:

| Signal | Likely issue |
|---|---|
| `df` Use% near 100 | Mounted filesystem full |
| `df -i` IUse% near 100 | Inodes exhausted |
| Thin pool Data% near 100 | Guest block allocation full |
| Thin pool Meta% near 100 | Thin metadata pressure |
| Storage inactive | Mount, network or backend problem |
| Unexpected small filesystem at storage path | Real disk may not be mounted |

## Step 2: make sure a Directory mount has not disappeared

For storage expected at `/mnt/pve/backup`:

```bash
findmnt /mnt/pve/backup
mountpoint /mnt/pve/backup
lsblk -f
```

If the mount is missing, the path may be an ordinary directory on the root filesystem. A backup job can then fill `/` while appearing to use the external path.

Stop the writing job. Do not move or delete files until you distinguish:

- files written into the bare mount-point directory
- files on the actual external filesystem

Mounting the disk over existing misplaced files hides them rather than resolving the root usage.

## Step 3: find large top-level directories

Stay on one filesystem with `-x`:

```bash
du -xhd1 / 2>/dev/null | sort -h
du -xhd1 /var 2>/dev/null | sort -h
du -xhd1 /var/lib 2>/dev/null | sort -h
```

For default local storage:

```bash
du -xhd1 /var/lib/vz 2>/dev/null | sort -h
du -xhd1 /var/lib/vz/dump 2>/dev/null | sort -h
du -xhd1 /var/lib/vz/template 2>/dev/null | sort -h
```

Do not cross into other mounted guest or network filesystems while diagnosing root usage.

## Step 4: inventory Proxmox-managed content

List storages and backup archives:

```bash
pvesm status
pvesm list local --content backup
```

Replace `local` with the verified storage ID.

Check guest references:

```bash
qm list
pct list
qm config 101
pct config 102
```

Use the interface to review:

- backup archives
- ISO images
- LXC templates
- VM and container disks
- snapshots
- unused disks
- replication or migration tasks

Remove only content that has been identified and approved.

## Step 5: check logs and the journal

```bash
journalctl --disk-usage
du -xhd1 /var/log 2>/dev/null | sort -h
find /var/log -xdev -type f -printf '%s %p\n' 2>/dev/null | sort -n | tail -20
```

If retained journal data is genuinely excessive, review retention first. A controlled cleanup example is:

```bash
journalctl --vacuum-time=14d
```

Fourteen days is an example, not a universal recommendation. Preserve logs needed for current troubleshooting or compliance.

Check why logs grew before deleting history. A repeating fault can fill the disk again.

## Step 6: check package caches

Inspect before cleaning:

```bash
du -sh /var/cache/apt/archives 2>/dev/null
```

If appropriate:

```bash
apt clean
```

Package cache cleanup can create breathing room, but it is rarely the main answer to a badly sized guest or backup store.

## Step 7: diagnose LVM-thin usage

For a thin pool:

```bash
lvs -a -o lv_name,vg_name,lv_size,pool_lv,origin,data_percent,metadata_percent
pvesm status
```

Do not use `du` to account for thin logical volumes.

Investigate:

- virtual disk sizes
- snapshots
- unused guest volumes
- deleted guests with retained volumes
- unexpected guest growth
- target storage chosen for migrations

Remove snapshots and unused volumes through Proxmox only after confirming rollback and backup requirements.

If thin metadata is near full, treat it as urgent. Do not improvise LVM repair commands from an unrelated tutorial.

## Step 8: find deleted files still held open

A process can keep disk blocks allocated after a file is deleted.

Check:

```bash
lsof +L1
```

If a large deleted file is held open, identify the owning service and plan a safe restart. Do not kill critical Proxmox processes blindly.

## Step 9: reclaim space in a safe order

A lower-risk order is:

1. stop the job causing continued growth
2. remove obsolete ISO images through Proxmox
3. remove clearly expired backups according to retention policy
4. clean package cache
5. address runaway logs after preserving evidence
6. remove approved snapshots
7. remove identified unused guest volumes
8. move a guest disk to verified storage if required
9. expand storage only after understanding the original pressure

After each action:

```bash
pvesm status
df -hT
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
```

## What not to delete manually

Do not manually remove files or volumes under:

- `/etc/pve`
- LVM volume paths
- active VM image directories
- container root directories
- snapshot data
- backup archives that have not been identified
- database or cluster configuration paths

Use Proxmox's interface or management commands so configuration remains consistent with storage.

## After recovery

Find the cause, not only the symptom.

Add:

- storage-capacity alerts
- backup retention
- log retention
- a free-space safety margin
- thin data and metadata monitoring
- mount verification before backup jobs
- quarterly restore tests
- a documented emergency cleanup list

## Verification checklist

- [ ] The full layer was identified.
- [ ] Directory mounts were verified.
- [ ] Root filesystem and thin pool were checked separately.
- [ ] The growth source was recorded.
- [ ] Only approved Proxmox-managed content was removed.
- [ ] Logs needed for diagnosis were preserved.
- [ ] Services and guests recovered.
- [ ] Storage remains below the warning threshold after normal workloads resume.
- [ ] Monitoring and retention were corrected.
- [ ] A recent independent backup exists.

This is a troubleshooting method, not a claim that SmallGrid encountered or resolved this exact Proxmox failure.

Related guides:

- [How to Move a Proxmox VM to Another Storage Drive](/guides/move-proxmox-vm-another-storage-drive/)
- [Where Should Proxmox Backups Be Stored?](/guides/where-store-proxmox-backups/)
- [How to Restore a Proxmox Backup](/guides/restore-proxmox-backup/)

Official references: [Proxmox VE Storage](https://pve.proxmox.com/pve-docs/chapter-pvesm.html) and [Proxmox Backup and Restore](https://pve.proxmox.com/pve-docs/chapter-vzdump.html).
