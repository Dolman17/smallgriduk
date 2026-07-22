---
title: "Where Should Proxmox Backups Be Stored?"
description: "Choose a safer Proxmox backup destination by comparing internal disks, USB storage, NAS shares, another server, Proxmox Backup Server and offsite copies."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "backup", "storage", "nas", "proxmox-backup-server", "3-2-1"]
---

## Quick answer

Do not keep the only Proxmox backup on the same physical disk as the VM or LXC container.

A practical home-lab design is:

```text
Live guest: Proxmox host storage
Local backup: separate disk, NAS or backup server
Offsite copy: encrypted cloud storage or rotated disk elsewhere
Proof: scheduled restore tests
```

The best destination is the one that survives the failures you are planning for and can be restored within the time you can tolerate.

Start with [How to Back Up a Proxmox VM or LXC Container](/guides/back-up-proxmox-vm-lxc/) and the broader [3-2-1 home-server backup guide](/guides/backups-3-2-1-home-server/). For the wider platform context, see [What Is Proxmox VE? A Beginner's Guide for Home Servers](/guides/what-is-proxmox-ve-home-server/).

---

## Think in failure domains

Two storage labels do not necessarily mean two independent copies.

Ask whether the original and backup share:

- physical disk
- host
- power supply
- disk controller
- filesystem
- administrator account
- network location
- building
- destructive automation

A backup becomes stronger as it shares fewer likely failure causes with the live guest.

## Destination comparison

| Destination | Protects from guest corruption | Protects from host disk failure | Protects from host loss | Offsite |
|---|---:|---:|---:|---:|
| Same storage as guest | Limited | No | No | No |
| Second internal disk | Yes | Usually | No | No |
| USB disk kept attached | Yes | Usually | Partly | No |
| Rotated USB disk disconnected | Yes | Yes | Better | If stored elsewhere |
| NAS on another machine | Yes | Yes | Yes | Usually no |
| Proxmox Backup Server elsewhere | Yes | Yes | Yes | Depends on location |
| Encrypted cloud or remote copy | Yes | Yes | Yes | Yes |

The table is about failure separation, not measured performance.

## Same host, same disk

This is the weakest option.

It may help with:

- accidental changes inside a guest
- short-term rollback from a retained archive
- temporary migration work

It does not protect against:

- disk failure
- host theft or fire
- filesystem loss
- destructive host commands
- a full storage pool

Treat it as convenience, not the complete backup plan.

## Separate internal disk

A second internal drive protects against failure of the guest's original disk.

It still shares:

- motherboard and power
- host administrator access
- physical location
- many operator mistakes

It can be a useful local layer, especially when combined with another copy outside the host.

## USB disk

A permanently attached USB disk is simple and portable, but still exposed to host-side deletion, power events and theft.

A rotated disk that is disconnected after a verified job improves isolation.

Before relying on USB storage:

- use a stable UUID mount
- check cable and bridge reliability
- refuse backup writes when the real mount is absent
- monitor SMART where supported
- test after reboot
- document safe removal

## NAS or another Linux server

A network destination moves the backup away from the Proxmox host.

Benefits:

- separate physical machine
- larger capacity options
- central backup location
- easier protection for several hosts

Risks:

- network or DNS failure
- shared credentials
- ransomware or destructive access
- the share being unavailable when the job runs
- both systems living in the same room

Use a dedicated backup account with the least permissions practical.

## Proxmox Backup Server

Proxmox Backup Server is designed for Proxmox workloads and provides features including deduplication, incremental transfer, verification and retention management.

It is strongest when it runs on separate hardware and separate storage. Running it as a guest on the same host can be useful for learning, but does not create an independent failure domain by itself.

Record recovery instructions for the backup server as well as the Proxmox host.

## Offsite copy

Offsite protection covers:

- theft
- fire or flood
- electrical damage affecting the room
- loss of both host and local backup
- some destructive local events

Options include:

- encrypted cloud storage
- another trusted machine in a different location
- rotated encrypted removable media

Protect encryption keys and credentials outside the server. An encrypted backup without its key is unrecoverable.

## What should be included?

A guest archive may not be the whole service.

Inventory:

- VM and LXC backups
- Proxmox configuration notes
- network and storage layout
- application databases
- LXC bind-mounted data
- passed-through disk data
- Compose files and environment files
- encryption keys
- recovery credentials

Do not copy sensitive secrets into an unencrypted document.

## Capacity planning

Estimate:

```text
Expected backup size
× number of retained versions
+ growth
+ temporary restore space
+ safety margin
```

Compression and deduplication can reduce use, but do not promise a saving before measuring your real data.

Monitor:

```bash
pvesm status
df -hT
```

Also monitor the backup system's own health, verification jobs and failed notifications.

## A sensible home-lab pattern

One example:

```text
Proxmox system SSD
└── active guests

Separate machine or NAS
└── scheduled local backups

Encrypted remote destination
└── selected critical backups

Test storage
└── periodic isolated restore
```

This guide is a recommendation, not a record of a completed or tested SmallGrid backup setup.

## How often should you back up?

Set frequency from acceptable data loss.

- rapidly changing critical service: more frequent
- stable infrastructure utility: daily may be enough
- disposable test VM: perhaps no backup
- irreplaceable personal data: protect separately from the guest schedule

The schedule should reflect the application, not a universal rule.

## Prove the design

At least periodically:

1. select a real backup
2. restore it to an unused ID
3. isolate networking
4. boot the guest
5. verify application data
6. record time, result and missing dependencies
7. repeat after major storage or Proxmox changes

## Final checklist

- [ ] The only backup is not on the guest's physical disk.
- [ ] At least one copy is outside the Proxmox host.
- [ ] Critical data has an offsite layer.
- [ ] Credentials use least privilege.
- [ ] Retention keeps older recovery points.
- [ ] Capacity and failures are monitored.
- [ ] Encryption keys are stored separately.
- [ ] External guest data has its own backup.
- [ ] A restore test has succeeded.

Next: [How to Move a Proxmox VM to Another Storage Drive](/guides/move-proxmox-vm-another-storage-drive/).

Official references: [Proxmox Backup and Restore](https://pve.proxmox.com/pve-docs/chapter-vzdump.html) and [Proxmox Backup Server](https://www.proxmox.com/en/products/proxmox-backup-server/overview).
