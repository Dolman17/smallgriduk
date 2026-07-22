---
title: "How to Back Up a Proxmox VM or LXC Container"
description: "Create a Proxmox VM or LXC backup, choose a backup mode and destination, verify the archive, and prepare for a real restore test."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "backup", "virtual-machine", "lxc", "vzdump", "recovery"]
---

## Quick answer

To create a one-off backup in the Proxmox interface:

1. select the VM or LXC container
2. open **Backup**
3. choose **Backup now**
4. select storage that accepts **VZDump backup file**
5. choose the backup mode and compression
6. start the job
7. read the task log and confirm the archive exists

A successful backup task is not proof that the guest can be recovered. Complete the process with [How to Restore a Proxmox Backup](/guides/restore-proxmox-backup/).

For storage background, read [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

---

## What a Proxmox backup contains

Proxmox VZDump backups are full guest backups containing the guest configuration and included guest data at the time of the job.

Check whether your workload also depends on data outside the guest backup, including:

- LXC bind mounts
- passed-through physical disks
- remote NFS or SMB shares
- application data on another server
- encryption keys and secrets
- external databases
- USB or PCIe devices

Do not assume a successful VM or LXC archive includes every dependency.

## Step 1: prepare backup storage

In `Datacenter → Storage`, confirm the destination:

- is active
- has enough free space
- permits `VZDump backup file`
- is not the same physical disk as the only guest copy
- has a documented retention plan

Check at the shell:

```bash
pvesm status
cat /etc/pve/storage.cfg
```

A backup stored on the same system disk may help with accidental guest changes, but not system-disk failure.

## Step 2: choose a backup mode

| Mode | What it prioritises | Trade-off |
|---|---|---|
| Snapshot | Lower interruption where supported | Consistency still depends on storage and workload |
| Suspend | Pauses the guest during part of the process | Guest interruption |
| Stop | Stops the guest for the backup | Longest outage, clearest quiescent state |

For applications with databases, use application-aware preparation when required. Filesystem-level consistency does not automatically guarantee application-level consistency.

Record the chosen mode and why.

## Step 3: create a backup in the interface

1. select the guest
2. open **Backup**
3. choose **Backup now**
4. select the destination storage
5. select the mode
6. choose Zstandard compression unless your design requires another option
7. optionally add notes
8. start the job
9. keep the task log open until completion

Do not close the browser and assume success. Read the final task status and warnings.

## CLI alternative

For guest ID `101`:

```bash
vzdump 101 --storage backup-store --mode snapshot --compress zstd
```

Replace `101` and `backup-store` with verified values.

List backup content:

```bash
pvesm list backup-store --content backup
```

Do not paste example IDs or storage names without checking them.

## Step 4: verify the backup archive

Check:

- task result is `OK`
- the backup is listed under the destination storage
- timestamp matches the run
- guest ID and type are correct
- size is plausible compared with used guest data
- task log contains no ignored warnings
- destination capacity remains safe

At the shell:

```bash
pvesm list backup-store --content backup
pvesm status
```

A plausible size is only a signal. It is not a restore test.

## Step 5: document excluded storage

For an LXC, inspect configuration:

```bash
pct config 101
```

For a VM:

```bash
qm config 101
```

Record:

- every disk
- mount point and bind mount
- passed-through device
- network dependency
- encryption secret
- application-specific export needed

If application data lives outside the guest archive, back it up separately and link both procedures in the recovery notes.

## Step 6: create a scheduled job

In `Datacenter → Backup`:

1. add a job
2. choose the node and guest selection
3. select independent backup storage
4. set a schedule
5. choose mode and compression
6. set retention deliberately
7. configure notifications
8. save and inspect the next-run time

Avoid selecting every guest automatically unless the destination has capacity for expected growth.

## Retention is part of capacity planning

A practical policy might keep several recent copies plus weekly and monthly recovery points. The correct numbers depend on:

- data change rate
- destination capacity
- recovery objectives
- offsite replication
- legal or privacy obligations

Do not keep only the latest backup. Corruption or accidental deletion may already exist in it.

## Step 7: perform a restore test

Restore to:

- an unused guest ID
- isolated or disconnected networking
- storage with adequate capacity
- a location that will not overwrite production

Verify boot, application data, permissions and service health. Then remove the test guest only after recording the result.

## Common mistakes

- storing the only backup on the guest disk
- overlooking LXC bind mounts
- ignoring application consistency
- relying on the green task status alone
- keeping no older recovery point
- filling the backup destination
- restoring with a duplicate IP or hostname
- never testing after a Proxmox upgrade

## Verification record

| Item | Record |
|---|---|
| Guest ID and name | |
| Guest type | VM or LXC |
| Backup mode | |
| Destination and physical location | |
| Start and finish time | |
| Task status | |
| Archive size | |
| External data excluded | |
| Restore-test guest ID | |
| Restore result | |

Do not mark the last row as passed until the restored guest has been used.

This is guidance based on Proxmox's backup workflow, not a claim of a completed SmallGrid backup or restore.

Next: [How to Restore a Proxmox Backup](/guides/restore-proxmox-backup/).

Official reference: [Proxmox Backup and Restore](https://pve.proxmox.com/pve-docs/chapter-vzdump.html).
