---
title: "How to Restore a Proxmox Backup"
description: "Restore a Proxmox VM or LXC backup safely, avoid ID and network conflicts, verify the recovered guest, and document a repeatable recovery test."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "restore", "backup", "virtual-machine", "lxc", "disaster-recovery"]
---

## Quick answer

The safest first restore is a test restore to an unused guest ID with networking disconnected or isolated.

1. locate the correct backup archive
2. confirm destination capacity
3. choose an unused VM or container ID
4. restore without overwriting the original
5. inspect the recovered configuration
6. prevent duplicate IP, hostname and service conflicts
7. start the guest and verify the application
8. record the result

Create the archive first with [How to Back Up a Proxmox VM or LXC Container](/guides/back-up-proxmox-vm-lxc/).

For the wider platform context, read [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

---

## Restore test versus emergency recovery

A restore test should preserve the live guest and use an isolated identity.

An emergency recovery may intentionally replace a failed guest, but the replacement should start only after checking:

- the old guest is stopped
- its IP address is not active
- shared disks will not be mounted twice
- the correct backup point was selected
- external data dependencies are available

Do not overwrite a working guest merely to prove a backup.

## Step 1: locate the backup

In the web interface:

1. select the backup storage
2. open **Backups**
3. identify the archive by guest ID, type, timestamp and notes
4. open the task or backup details if available

At the shell:

```bash
pvesm list backup-store --content backup
pvesm status
```

Confirm the archive is a VM or LXC backup, not only an application export.

## Step 2: check destination capacity

For Directory storage:

```bash
df -hT
```

For LVM-thin:

```bash
lvs -a -o lv_name,vg_name,lv_size,data_percent,metadata_percent
```

For all Proxmox storage:

```bash
pvesm status
```

Leave headroom for extraction, temporary files, guest growth and snapshots.

## Step 3: choose a safe identity

For a test restore:

- use an unused guest ID
- use an isolated bridge, firewall rule or disconnected virtual NIC
- plan a different temporary IP address
- avoid duplicate hostnames where they affect discovery
- do not mount writable shared storage from both copies
- disable automatic start until verification is complete

A restored guest may retain its original static IP and application credentials.

## Step 4: restore through the interface

1. select the backup archive
2. choose **Restore**
3. enter the unused guest ID
4. choose the destination storage
5. review unique options and limits
6. keep the guest from starting automatically if possible
7. confirm and read the full task log

Do not select a destination merely because it has the same label as the original host. Verify its physical capacity and purpose.

## CLI examples

Restore a VM archive to VM ID `201`:

```bash
qmrestore /path/to/vzdump-qemu-101-DATE.vma.zst 201 --storage local-lvm
```

Restore an LXC archive to container ID `201`:

```bash
pct restore 201 /path/to/vzdump-lxc-101-DATE.tar.zst --storage local-lvm
```

The filenames, IDs and storage names are placeholders. Use `pvesm list`, `qm list` and `pct list` to verify real values.

## Step 5: inspect before starting

For a VM:

```bash
qm config 201
```

For an LXC:

```bash
pct config 201
```

Check:

- CPU and memory
- every disk and mount point
- network bridge, MAC and VLAN
- boot order
- passed-through devices
- bind mounts
- start-at-boot setting
- protection setting
- tags and notes

Remove or isolate conflicting networking before the first boot.

## Step 6: start and verify

Start only after conflict checks.

VM:

```bash
qm start 201
qm status 201
```

LXC:

```bash
pct start 201
pct status 201
```

Use the console first where practical.

Inside the guest, verify:

- operating system boots
- filesystem is mounted
- expected files exist
- services start
- application data is current for that backup point
- permissions and ownership are correct
- databases open cleanly
- logs contain no recovery errors
- external shares are handled safely

## Step 7: perform an application test

A guest that reaches a login prompt is not fully verified.

Examples:

- open the web application
- read and write a disposable record
- play a test media file
- resolve a DNS query
- run an application health check
- restart the recovered guest once more

Record what was tested and what was not.

## Missing external data

A Proxmox archive may not include:

- LXC bind-mounted content
- passed-through physical disks
- remote shares
- external databases
- secrets stored elsewhere
- hardware-specific configuration

Restore those through their own documented procedures. Do not connect a restored guest to writable production storage until you understand the application behaviour.

## Cutover after a real failure

A controlled cutover should be:

```text
Stop or confirm loss of old guest
→ restore chosen backup
→ inspect configuration
→ attach required external data
→ assign intended network identity
→ start
→ verify application
→ monitor
```

Keep the failed or old guest untouched where possible until recovery is proven.

## Common restore failures

### Guest ID already exists

Choose an unused ID for testing. Overwrite only during an explicitly planned emergency recovery.

### Not enough storage

Free space safely or restore to another compatible storage target. Do not delete random guest volumes.

### Duplicate IP address

Disconnect the virtual NIC or use an isolated network before starting the restored copy.

### Guest starts but application is broken

Check application-specific backups, database consistency, secrets, bind mounts and remote services.

### Restore task succeeds but guest does not boot

Inspect boot order, firmware type, disks, console and task log. Compare the recovered configuration with the documented original.

## Recovery proof checklist

- [ ] Correct archive and timestamp selected.
- [ ] Restore used an unused ID.
- [ ] Destination had safe capacity.
- [ ] Network conflicts were prevented.
- [ ] Configuration was inspected before start.
- [ ] Guest booted.
- [ ] Application data was verified.
- [ ] External data was included or restored separately.
- [ ] A second guest reboot succeeded.
- [ ] Result and duration were recorded.

This guide does not claim a SmallGrid restore has been completed.

Next: [Where Should Proxmox Backups Be Stored?](/guides/where-store-proxmox-backups/).

Official reference: [Proxmox Backup and Restore](https://pve.proxmox.com/pve-docs/chapter-vzdump.html).
