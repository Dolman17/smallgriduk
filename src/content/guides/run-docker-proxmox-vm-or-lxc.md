---
title: "Run Docker in a Proxmox VM or LXC?"
description: "Compare Docker in a Proxmox virtual machine and LXC container, including security, nesting, backups, hardware access and the best default for beginners."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "docker", "lxc", "virtual-machines", "home-server"]
---

## Quick answer

For most beginners, run Docker inside an **Ubuntu virtual machine** on Proxmox.

An LXC container uses fewer resources, but Docker inside LXC adds nesting, permissions and kernel-sharing complications. It can work, but it is a more specialised design and is harder to troubleshoot.

| Choice | Best fit |
|---|---|
| Ubuntu VM | Reliable default, clearer isolation and conventional Docker support |
| Unprivileged LXC | Experienced users prioritising low overhead and prepared to manage nesting |
| Docker on the Proxmox host | Avoid; it mixes application workloads with the hypervisor |

Read [Proxmox VM vs LXC](/guides/proxmox-vm-vs-lxc/) first if those terms are new.

## Why a VM is the safer default

A VM has its own kernel. Docker therefore runs in the kind of Linux environment its documentation normally assumes.

That gives you:

- a strong boundary between Docker and the Proxmox host
- familiar Ubuntu and Docker instructions
- simpler firewall and network diagnosis
- ordinary Docker volume and device behaviour
- a guest that can be backed up, restored or moved as one unit
- fewer Proxmox-specific settings to remember

The cost is additional memory and storage for the guest operating system. On a modern home server, that trade-off is often worthwhile.

## Why Docker inside LXC is different

An LXC container shares the Proxmox host kernel. Docker also relies on kernel features such as namespaces and control groups. Running one container system inside another therefore requires nesting.

Proxmox exposes a `nesting` feature for LXC, but its documentation warns that this exposes additional host filesystem information to the container. Unprivileged containers and deliberate ID mapping are preferable where possible.

Common complications include:

- enabling nesting and sometimes key-management features
- UID and GID mapping for bind-mounted storage
- AppArmor or capability restrictions
- Docker storage-driver behaviour
- device access for GPUs, USB or serial hardware
- less obvious failures after host or guest updates

Do not convert an LXC to privileged merely to make a permission error disappear without understanding the security change.

## Do not install Docker on the Proxmox host

Proxmox is the infrastructure layer. Adding application containers directly to it can:

- introduce package and firewall conflicts
- make updates harder to reason about
- blur backup boundaries
- increase the consequences of an application compromise
- make a future Proxmox rebuild more complicated

Keep workloads in guests. The host should remain focused on virtualisation, storage, networking and backups.

## Compare the two designs

| Question | Docker in a VM | Docker in LXC |
|---|---|---|
| Kernel | Guest owns its kernel | Shares host kernel |
| Isolation | Stronger | Lighter, but shared-kernel |
| Setup | Conventional | Requires nesting considerations |
| Resource overhead | Higher | Lower |
| Storage permissions | Familiar Linux model | May require host-to-container ID mapping |
| Hardware access | PCI or USB passthrough | Device mapping and permissions |
| Portability | Strong | More tied to Proxmox LXC configuration |
| Beginner recovery | Easier | More Proxmox-specific |

## A sensible beginner layout

~~~text
Proxmox host
└── Ubuntu Server VM
    ├── Docker Engine
    ├── Docker Compose
    ├── application data
    └── mounted data storage
~~~

Keep these three things separate:

1. VM system disk
2. Docker Compose and application configuration
3. large or shared data such as media

This makes it easier to back up configuration frequently without duplicating a large media library in every VM backup.

## When LXC may be reasonable

Consider Docker inside an unprivileged LXC when:

- you already understand LXC ID mapping and nesting
- the workload is trusted and simple
- resource pressure is genuinely important
- hardware access is not complicated
- you have tested backup and restore
- you have documented every non-default container feature

Avoid it as the first choice when the service is business-critical, needs complex USB or GPU access, or must follow vendor-supported Docker instructions exactly.

## Backups are not the same as application consistency

A Proxmox guest backup captures the VM or LXC, but an active database may still need an application-aware backup or clean shutdown.

Protect:

- Compose files
- `.env` files and secrets
- named-volume data
- bind-mounted application data
- database dumps where appropriate
- a record of external storage mounts

Then perform a real restore test. A successful backup job is not proof that the application will recover.

Use [How to Back Up a Proxmox VM or LXC](/guides/back-up-proxmox-vm-lxc/) and [How to Restore a Proxmox Backup](/guides/restore-proxmox-backup/).

## Decision checklist

Choose a VM if any of these are true:

- this is your first Docker host
- you want the clearest security boundary
- you will follow mainstream Ubuntu instructions
- you need predictable hardware passthrough
- you value easier recovery over minimum overhead

Choose LXC only when you can explain why the saved overhead matters and how you will manage nesting, permissions, devices and restores.

## Verification checklist

- [ ] Docker is not installed on the Proxmox host.
- [ ] The VM or LXC choice and reason are documented.
- [ ] Storage paths and ownership are recorded.
- [ ] The guest starts automatically if required.
- [ ] Containers recover after a controlled guest reboot.
- [ ] The guest recovers after a Proxmox reboot.
- [ ] Configuration and application data are backed up.
- [ ] A restore has been tested separately.

This comparison is architectural guidance. It does not claim that SmallGrid has benchmarked Docker in both deployment types.

Next, build the recommended layout with [How to Build a Docker Server Inside Proxmox](/guides/build-docker-server-inside-proxmox/). Return to [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/) for the full beginner series.

Official references: [Proxmox LXC configuration](https://pve.proxmox.com/pve-docs/pct.conf.5.html) and [Docker Engine installation](https://docs.docker.com/engine/install/).
