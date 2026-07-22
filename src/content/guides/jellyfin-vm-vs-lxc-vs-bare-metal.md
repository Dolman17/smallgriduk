---
title: "Jellyfin in a VM vs LXC vs Bare Metal"
description: "Compare Jellyfin on bare-metal Linux, a Proxmox virtual machine and a Proxmox LXC container across performance, isolation, storage and GPU access."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["jellyfin", "proxmox", "lxc", "virtual-machines", "bare-metal", "media-server"]
---

## Quick answer

- Choose **bare-metal Ubuntu** when the machine is primarily a media server and simplicity matters most.
- Choose a **Proxmox VM** when you want stronger isolation, conventional Docker support and whole-guest backup or migration.
- Choose an **unprivileged LXC** when low overhead matters and you are comfortable with bind mounts, ID mapping and device permissions.

There is no universal winner. A working bare-metal server does not automatically become better after adding Proxmox.

## Side-by-side comparison

| Area | Bare metal | VM | LXC |
|---|---|---|---|
| Kernel | Host kernel | Guest kernel | Proxmox host kernel |
| Isolation | Application/process | Strongest of the three | Shared-kernel boundary |
| Overhead | Lowest platform complexity | Highest resource overhead | Low overhead |
| Docker fit | Conventional | Conventional | Nested-container complications |
| Media storage | Direct mounts | Virtual disk, share or passthrough | Host bind mount possible |
| GPU access | Direct | PCI passthrough | Device mapping |
| Whole-system backup | OS-specific tooling | Proxmox VM backup | Proxmox LXC backup |
| Troubleshooting | Fewest layers | Clear layers | More host/container permission detail |

These are architectural differences, not benchmark results.

## Bare metal: the simplest path

Jellyfin on Ubuntu or another supported Linux system has direct access to storage and hardware.

Advantages:

- fewer layers
- straightforward GPU detection
- direct filesystem ownership
- no hypervisor resource allocation
- existing Linux and Docker documentation applies directly

Trade-offs:

- other services share the same OS
- host changes have a wider blast radius
- whole-host migration is less convenient than moving a VM
- virtualisation features require an additional layer later

Bare metal remains sensible when the server's main job is Jellyfin and the current installation is reliable.

## VM: the clean Proxmox boundary

A VM owns its kernel and receives virtual hardware.

Advantages:

- strong isolation from Proxmox and other guests
- mainstream Ubuntu and Docker workflow
- Proxmox snapshots, backups and storage moves
- easier duplication into an isolated test VM
- clear CPU and memory limits

Trade-offs:

- more memory and disk overhead
- media must reach the VM through a share, virtual disk or passthrough
- GPU acceleration normally requires PCI passthrough
- more layers to check during playback problems

For a beginner already committed to Proxmox, the VM is the most supportable default.

## LXC: efficient but more specialised

LXC shares the Proxmox host kernel.

Advantages:

- fast startup
- low overhead
- host directory bind mounts can expose media efficiently
- render devices can be mapped without assigning a whole PCI device to a VM

Trade-offs:

- UID/GID mapping can make media permissions harder
- hardware-device permissions cross host/container boundaries
- Docker inside LXC adds nesting complexity
- configuration is more closely coupled to Proxmox
- privileged LXC weakens isolation and should not be the default fix

A native Jellyfin package in an unprivileged LXC avoids Docker nesting, but it changes the deployment and update model.

## Does virtualisation reduce playback performance?

Direct Play usually needs little server processing, so storage and network reliability matter more than raw virtualisation overhead.

Transcoding changes the picture. Compare:

- codec and resolution
- subtitle burn-in
- HDR tone mapping
- CPU versus hardware acceleration
- number of simultaneous sessions
- guest resource limits
- storage throughput

Do not publish a percentage performance difference without measuring the same file, client, transcode reason and hardware on each design.

Use [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/) to diagnose the workload first.

## Storage is often the deciding factor

Bare metal sees Linux mounts directly. LXC can bind-mount a Proxmox directory, subject to mapping. A VM needs a virtualised or networked storage path.

Ask:

- Who owns the filesystem?
- Does another guest need the same media?
- Must Proxmox back up the data?
- Can the library be remounted after a rebuild?
- What happens if the share is unavailable at boot?
- Are Sonarr, Radarr and download clients using the same paths?

Path consistency can matter more than the deployment label.

## GPU acceleration trade-offs

Bare metal has the shortest path to the device.

A VM usually needs IOMMU and PCI passthrough. The assigned GPU may no longer be available to the Proxmox host or another guest.

LXC can map `/dev/dri` devices, but host and container ownership must align. This can be efficient, though it is not the same isolation boundary as PCI passthrough.

Before choosing, verify that the GPU supports the codecs you need in Jellyfin's current documentation.

## Migration risk

Do not destroy a working server first. Build the new deployment alongside it where possible:

1. Back up Jellyfin configuration.
2. Record current paths, users, ports and devices.
3. Create the new guest under a temporary address.
4. Mount media read-only initially.
5. Restore or recreate Jellyfin configuration.
6. Test important clients and transcodes.
7. Stop the old instance before making the new one authoritative.
8. Retain a rollback route.

Avoid running two Jellyfin servers against the same writable database.

## Which should you choose?

Choose bare metal when:

- Jellyfin is the main purpose of the machine
- the current system is stable
- direct hardware and disk access matters
- hypervisor features do not solve a real need

Choose a VM when:

- Proxmox will host several isolated services
- Docker supportability matters
- you want whole-guest recovery and testing
- you can plan storage and GPU passthrough cleanly

Choose LXC when:

- you understand unprivileged containers
- low overhead is important
- bind-mounted media is useful
- you can test UID/GID and device mappings after updates and reboots

## Verification checklist

- [ ] The choice solves a documented need.
- [ ] Media ownership and paths are mapped.
- [ ] Direct Play and transcode workloads are measured separately.
- [ ] GPU codec support is confirmed.
- [ ] Startup order and missing-mount behaviour are tested.
- [ ] Backup scope is documented.
- [ ] A rollback path preserves the working installation.

SmallGrid has verified a bare-metal Ubuntu media environment, but this article does not claim a controlled VM-versus-LXC benchmark.

Next: [How to Pass an Intel GPU Through to Jellyfin](/guides/pass-intel-gpu-through-jellyfin-proxmox/). For the VM build, use [How to Run Jellyfin in Proxmox](/guides/run-jellyfin-proxmox/). Return to [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

Official references: [Proxmox virtual machines](https://pve.proxmox.com/pve-docs/chapter-qm.html), [Proxmox containers](https://pve.proxmox.com/pve-docs/chapter-pct.html) and [Jellyfin hardware acceleration](https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/).
