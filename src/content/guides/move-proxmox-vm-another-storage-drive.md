---
title: "How to Move a Proxmox VM to Another Storage Drive"
description: "Move a Proxmox VM disk to different storage safely, check compatibility and capacity, verify the guest, and remove the source only after validation."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "storage", "virtual-machine", "migration", "disk", "homelab"]
---

## Quick answer

Use Proxmox's **Move Storage** action for the VM disk rather than manually copying or renaming its underlying files or LVM volume.

The safe order is:

```text
Verify backup
→ inspect every VM disk
→ check target capacity and compatibility
→ move one disk
→ keep the source where possible
→ start and test the VM
→ remove the old volume only after validation
```

For storage types, read [Proxmox Directory Storage vs LVM-Thin](/guides/proxmox-directory-storage-vs-lvm-thin/).

For platform context, read [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

---

## Reasons to move a VM disk

- the original storage is nearly full
- a new SSD has been added
- active guests and backups need separating
- the VM needs a different storage feature
- the old disk is being retired
- capacity is being rebalanced

Moving a disk is not a substitute for a backup. The source and destination are both involved in the operation.

## Step 1: verify the VM and its disks

Replace `101` with the real VM ID:

```bash
qm status 101
qm config 101
pvesm status
```

Record every disk slot, for example:

- `scsi0`
- `scsi1`
- `efidisk0`
- `tpmstate0`
- cloud-init drive

Do not assume moving `scsi0` moves every VM-related volume.

## Step 2: verify a recoverable backup

Create or locate a backup and confirm it can be restored.

Record:

- backup timestamp
- backup destination
- archive or snapshot identifier
- external data excluded
- latest restore-test result

Do not start a storage migration while another backup, snapshot or replication task is manipulating the same guest.

## Step 3: check target storage

Run:

```bash
pvesm status
cat /etc/pve/storage.cfg
```

For Directory targets:

```bash
df -hT
findmnt /mnt/pve/TARGET
```

For LVM-thin:

```bash
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
```

Confirm:

- target is active
- target allows VM disk images
- usable capacity exceeds the disk's required allocation
- required snapshot or format features are compatible
- the target mount will survive reboot
- no warning or failed disk health check is being ignored

## Step 4: decide whether the VM can remain running

Proxmox may support moving a disk while the VM runs, depending on storage and configuration.

For a beginner or critical service, a planned shutdown can reduce moving parts:

```bash
qm shutdown 101
qm status 101
```

If it does not stop, investigate before forcing it off. A forced stop can damage guest data.

Record the outage window and notify users of the service.

## Step 5: move through the web interface

1. select the VM
2. open **Hardware**
3. select the intended disk
4. open **Disk Action**
5. choose **Move Storage**
6. select the target storage
7. choose a target format if offered
8. leave source deletion disabled for the first cautious move where the interface and capacity allow
9. start the task
10. read the complete task log

The precise labels can vary. Confirm the selected disk slot and target before applying the action.

## CLI alternative

For VM `101`, disk `scsi0` and target `fast-ssd`:

```bash
qm move_disk 101 scsi0 fast-ssd
```

After full verification, a later operation may remove an unused source volume through Proxmox. The `--delete 1` option can delete the source as part of the move, but that reduces the rollback margin and should not be copied casually.

Use:

```bash
qm help move_disk
```

to confirm options on the installed Proxmox version.

## Step 6: inspect configuration after the move

```bash
qm config 101
pvesm status
```

Confirm:

- the intended disk points to the target storage
- no unrelated disk changed
- any retained source appears only as expected
- the target capacity changed plausibly
- the task log ended successfully

Do not delete an `unusedX` volume until you have identified exactly what it contains.

## Step 7: boot and verify the guest

```bash
qm start 101
qm status 101
```

Inside the guest, check:

- operating system boots
- all partitions and filesystems appear
- services start
- application data is readable
- a safe write test succeeds
- logs show no disk or filesystem errors
- expected performance is stable

Then reboot the guest once and repeat the service check.

## Step 8: test the host reboot path

Before a controlled host reboot, confirm target storage mounts automatically.

After reboot:

```bash
pvesm status
findmnt
qm status 101
systemctl --failed
```

Start the VM and repeat the application test if it did not start automatically.

## Step 9: remove the old source safely

Only after validation:

1. inspect `qm config 101`
2. identify any unused source volume by storage and volume ID
3. check that the VM is running from the target
4. retain it through an agreed rollback period if capacity allows
5. remove it through Proxmox, not with `rm` or direct LVM commands
6. recheck storage usage

A retained source copy is not an independent backup if it remains on a failing disk.

## What about LXC containers?

LXC volumes use different management commands. Do not substitute `qm move_disk` for a container.

Inspect the installed command options with:

```bash
pct help move-volume
```

Apply the same backup, capacity, mount and verification principles.

## Common mistakes

- moving the wrong disk slot
- overlooking EFI, TPM or secondary volumes
- enabling immediate source deletion
- filling the target
- moving to an unproven mount
- manually copying active image files
- assuming task completion proves application health
- deleting an unused volume without identifying it

## Verification record

| Item | Record |
|---|---|
| VM ID and name | |
| Source storage and disk slot | |
| Target storage | |
| Backup used for rollback | |
| VM state during move | |
| Task start and finish | |
| Guest boot result | |
| Application test | |
| Guest reboot result | |
| Host reboot result | |
| Source removal date | |

This is a recommended procedure, not a recorded SmallGrid migration result.

Next: [Proxmox Disk Full: Find What Is Using the Space](/guides/proxmox-disk-full-find-space/).

Official reference: [Proxmox VM management command](https://pve.proxmox.com/pve-docs/qm.1.html).
