---
title: "Proxmox VM vs LXC: Which Should You Use?"
description: "Compare Proxmox virtual machines and LXC containers by isolation, compatibility, resources, hardware access, Docker support, backups and maintenance."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "virtual-machine", "lxc", "container", "virtualisation", "homelab"]
---

## Quick answer

Choose a **VM** when you need a separate kernel, stronger isolation, broad operating-system compatibility or the simplest place to run Docker. Choose an **unprivileged LXC container** for a trusted Linux service when low overhead, fast startup and efficient density matter.

If you are unsure, use a VM. It consumes more resources, but its boundary and behaviour are easier to reason about for many beginners.

Proxmox supports both KVM virtual machines and LXC containers. The right choice depends on the workload, not which option appears more advanced.

For background, see [What Is Proxmox VE? A Beginner's Guide for Home Servers](/guides/what-is-proxmox-ve-home-server/).

---

## The core difference

A VM emulates a computer. It has virtual hardware and runs its own kernel.

An LXC container isolates a Linux userspace while sharing the Proxmox host's Linux kernel.

```text
Virtual machine
Proxmox host → KVM/QEMU → virtual hardware → guest kernel → applications

LXC container
Proxmox host kernel → isolated container userspace → applications
```

That one architectural difference explains most trade-offs.

## Comparison table

| Question | VM | LXC container |
|---|---|---|
| Separate kernel | Yes | No; shares host kernel |
| Windows or non-Linux guest | Yes | No |
| Isolation boundary | Stronger and easier to reason about | Lighter, with more host-kernel exposure |
| Typical overhead | Higher | Lower |
| Startup | Usually slower | Usually faster |
| Kernel modules inside guest | Flexible | Constrained by host kernel |
| Docker experience | Usually simpler | Possible, but adds nesting and storage complexity |
| Direct host-path mounts | Possible through network/filesystem design or passthrough | Bind mounts are convenient but need UID/GID planning |
| Live migration and portability | Depends on hardware and configuration | Depends on mounts and features |
| Best beginner default | Yes when uncertain | Yes for a clearly suitable trusted Linux service |

These are architectural tendencies, not performance measurements from the SmallGrid server.

## Choose a VM when…

Use a VM when:

- the guest is Windows, BSD or another non-Linux system
- the application expects its own kernel or kernel modules
- you want a clear security boundary from the host
- you plan to run Docker with conventional documentation
- appliance documentation specifically supports a VM image
- you need UEFI, virtual TPM or other machine-level features
- future migration should not depend on host bind mounts
- you are testing potentially untrusted software

A VM is also a sensible default for a general-purpose Ubuntu Docker server. Docker already creates containers; placing it in a VM keeps that container stack behind a separate guest kernel.

## Choose an LXC container when…

Use an unprivileged LXC when:

- the workload is a normal Linux service
- it works with the host kernel
- resource overhead needs to stay low
- fast start and stop matter
- you understand any bind-mount permissions
- the service is trusted and narrowly scoped
- you can keep the container unprivileged

Examples can include a small web service, monitoring tool, DNS service or internal utility. Suitability still depends on the application's documented requirements.

## Isolation and security

A VM has its own kernel, so an application must cross a virtualisation boundary to affect the host.

An LXC container shares the host kernel. Namespaces, cgroups and unprivileged ID mapping provide isolation, but the boundary is not identical to a VM.

Practical rule:

- untrusted or exposed workload: prefer a VM
- trusted, simple Linux service: an unprivileged LXC may be appropriate
- privileged LXC: use only for a documented reason and understand the reduced isolation

Neither choice removes the need for updates, least privilege, firewalling and backups.

## Performance and resource use

LXC avoids a separate guest kernel and virtual hardware, so it usually has lower memory and storage overhead.

That does not mean every application is faster in LXC. Storage configuration, CPU limits, application design, hardware acceleration and network paths may dominate real performance.

Do not publish percentage savings without measuring the same workload on the same host.

For a home lab with 32 GB of RAM, both models can be practical. Choose the cleaner operational design before trying to save the last few hundred megabytes.

## Docker: VM or LXC?

Docker can run inside an LXC container, but it may require nesting and interacts with the shared kernel, cgroups, filesystems and container security features.

A VM is the straightforward recommendation for beginners because:

- mainstream Docker instructions apply normally
- the Docker host has its own kernel
- storage permissions are easier to separate from the Proxmox host
- Docker changes are less likely to affect the hypervisor
- moving or rebuilding the Docker server is conceptually clean

An LXC-based Docker host may suit an experienced administrator who has tested its storage driver, nesting features, backups and upgrade path.

## Storage and bind mounts

VM disks are self-contained virtual block devices. This makes backup and restore easy to understand, although large application data may still need a separate strategy.

LXC containers can use mount points and host bind mounts efficiently. The trade-off is ownership mapping.

In an unprivileged container, UID `0` inside is mapped to a non-root host UID. A host directory that looks correctly owned by root may therefore be unwritable inside the container.

Never solve this by recursively changing a large host filesystem without mapping the numeric IDs and understanding other services that use it.

## Backups and recovery

Proxmox can back up both VMs and LXC containers, but external mounts and passed-through storage need special attention.

Before relying on a backup, document:

- what the guest backup includes
- what it excludes
- where application data lives
- whether bind mounts or physical disks are external
- how secrets are restored
- whether the restored guest starts on another host

A successful backup task is not proof of recovery. Test a restore to an isolated ID or lab host.

## Hardware access

LXC can expose selected devices from the host, but configuration and permissions can become tightly coupled to that host.

VM passthrough can give a guest more complete ownership of a PCIe or USB device, but requires IOMMU planning and may reduce migration flexibility.

For Jellyfin hardware transcoding, the answer depends on GPU type, driver support, isolation needs and how much host coupling is acceptable. Do not choose solely on assumed performance.

## Decision examples

| Workload | Sensible starting choice | Why |
|---|---|---|
| Ubuntu Docker server | VM | Familiar Docker environment and separate kernel |
| Pi-hole | Unprivileged LXC or VM | Small Linux service; VM if maximum separation is preferred |
| Home Assistant OS | VM | Appliance-style operating system expects a full VM |
| Windows test machine | VM | LXC cannot run a Windows kernel |
| Small internal web app | Unprivileged LXC | Efficient, narrow Linux service |
| Untrusted software test | VM | Stronger isolation boundary |
| Kernel-module development | VM | Guest controls its own kernel |

These are starting recommendations, not universal rules.

## A practical decision process

Ask in this order:

1. Does it require a non-Linux OS or separate kernel? Use a VM.
2. Does official documentation expect a VM appliance? Use a VM.
3. Is it untrusted or internet-exposed? Prefer a VM.
4. Does it need Docker? Prefer a VM unless you deliberately accept LXC complexity.
5. Is it a small trusted Linux service with simple storage? Consider unprivileged LXC.
6. Does it need host bind mounts or devices? Map permissions and recovery before choosing.
7. Can you back it up and restore it cleanly? If not, redesign before deployment.

## Can you change later?

There is no universal one-click conversion between a VM and LXC container.

Treat migration as an application rebuild:

1. back up application data and configuration
2. create the new guest type
3. install the service cleanly
4. restore or migrate data
5. test on a temporary address
6. switch clients only after verification
7. retain the old guest until rollback is no longer needed

Application-level migration is usually safer than trying to transplant an entire root filesystem between architectures.

## Final recommendation

Use a VM as the safe beginner default. Move selected services to unprivileged LXC only when the benefit is clear and the storage, security and backup implications are understood.

If you already know the workload is a straightforward Linux service, an unprivileged LXC is an efficient choice. Avoid privileged containers and extra features unless the requirement is documented.

Related guides:

- [How to Create an Ubuntu Virtual Machine in Proxmox](/guides/create-ubuntu-virtual-machine-proxmox/)
- [How to Create an Ubuntu LXC Container in Proxmox](/guides/create-ubuntu-lxc-container-proxmox/)
- [How to Install Proxmox VE: Complete Beginner Guide](/guides/how-to-install-proxmox-ve/)

