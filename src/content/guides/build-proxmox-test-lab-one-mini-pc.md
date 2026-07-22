---
title: "How to Build a Proxmox Test Lab on One Mini PC"
description: "Design a small Proxmox lab on one mini PC with separate guests, safe resource limits, internal networking, backups and practical test projects."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "mini-pc", "homelab", "virtual-machines", "lxc", "networking"]
---

## Quick answer

One mini PC can be a useful Proxmox learning lab when you keep the design small:

~~~text
Mini PC running Proxmox
├── Ubuntu Docker VM
├── Pi-hole LXC
├── Home Assistant OS VM
└── Temporary test guest
~~~

Do not run every guest merely because the hardware allows it. Start with one guest, measure idle and peak use, then add the next.

This is the final Phase 4 project. Begin with [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/) if the platform is new.

## Check the mini PC before buying or installing

Record:

- exact manufacturer and model
- CPU model and virtualisation support
- installed and maximum memory
- storage model, capacity and replaceability
- Ethernet controller and speed
- USB and PCIe expansion
- Intel iGPU generation, if relevant
- firmware virtualisation and IOMMU settings
- measured idle and workload power, if available

Avoid assuming every model in a product family has the same NIC, storage slots or memory limits.

For a multi-guest lab, memory is often the first constraint. CPU overcommit can be reasonable for mostly idle services, but allocated RAM and storage still need deliberate headroom.

## Define the purpose

A lab can mean different things:

- learn Proxmox without risking the main server
- test updates before production
- practise backup and restore
- build an isolated Docker host
- explore LXC permissions
- test VLANs and firewalls
- trial Home Assistant or Pi-hole
- reproduce a failure safely

Write down the primary purpose. It prevents the lab becoming an undocumented production server.

## Use a simple guest plan

Example planning table:

| Guest | Purpose | Start policy | Data importance |
|---|---|---|---|
| Ubuntu VM | Docker learning | Manual initially | Rebuildable configuration |
| Pi-hole LXC | DNS test | Manual until proven | Export settings |
| HAOS VM | Home Assistant trial | Manual initially | Application backup |
| Scratch VM | Destructive tests | Manual | Disposable |

Resource numbers should come from the service's current minimums plus measured demand. Leave capacity for Proxmox and temporary operations such as backups.

## Plan storage before guests

A mini PC may have only one SSD. That is convenient but creates one failure domain.

Separate logically:

- Proxmox system storage
- guest disks
- ISO and template files
- backup files
- large datasets

Do not call a second directory on the same SSD an independent backup. Use another physical system, NAS or removable disk for recoverable copies.

Use [Proxmox Storage Explained](/guides/proxmox-storage-explained-local-local-lvm-directory/) and [Where Should Proxmox Backups Be Stored?](/guides/where-store-proxmox-backups/).

## Build the network in layers

The simplest first design attaches guests to `vmbr0`, where the router provides DHCP:

~~~text
Router and LAN
      |
Mini PC Ethernet
      |
    vmbr0
   /  |  \
 VM  LXC  VM
~~~

Record every guest's MAC and reserved address.

For an isolated test network, create a separate bridge only after planning routing, DHCP and firewall behaviour. A bridge with no physical port can connect guests internally, but they will not gain internet access automatically.

Avoid making the first lab exercise a remote bridge rewrite. Keep a local console available and use [Proxmox Linux Bridge Explained](/guides/proxmox-linux-bridge-explained/).

## Build in a safe order

1. Install and update Proxmox.
2. Verify the management address survives reboot.
3. Configure independent backup storage.
4. Create one small Ubuntu VM.
5. Test network, guest agent, shutdown and restore.
6. Add one LXC and compare its behaviour.
7. Add Docker only inside the Ubuntu VM.
8. Add application projects one at a time.
9. Record idle and peak CPU, memory, disk and power.
10. Remove experiments that no longer serve a purpose.

Use [Proxmox First Setup](/guides/proxmox-first-setup-updates-repositories-security/) before adding workloads.

## First practical project: Docker VM

Build an Ubuntu VM, install Docker from its official repository and deploy one harmless test service.

Prove:

- VM network works
- Docker starts after reboot
- Compose validates
- guest backup completes
- isolated restore works

Then follow [How to Build a Docker Server Inside Proxmox](/guides/build-docker-server-inside-proxmox/).

## Second project: compare VM and LXC

Create a small unprivileged LXC and compare:

- boot time
- memory reporting
- filesystem access
- console behaviour
- backup and restore
- update responsibilities

Do not benchmark unrelated workloads and call the result a VM-versus-LXC conclusion. Keep the guest operating systems and task comparable.

## Third project: isolated recovery practice

Back up a disposable guest, change or break one setting deliberately, then restore to a different ID on an isolated network.

Verify:

- restored disk and configuration
- boot
- console login
- network identity
- application state
- collision avoidance with the original guest

This teaches more than collecting snapshots that have never been restored.

## Measure power properly

Mini PCs are often chosen for low power use, but model, storage, memory, firmware and workload all affect consumption.

Use a wall meter and record:

- meter model
- measurement duration
- guest state
- CPU load
- connected storage
- network activity
- display state
- minimum, typical and peak readings

Do not compare an idle bare-metal figure with a busy multi-guest figure. SmallGrid's [Jellyfin Ubuntu Low-Power Setup](/guides/jellyfin-ubuntu-low-power/) explains the evidence method even if the workload differs.

## Avoid turning the lab into a single point of failure

Pi-hole and Home Assistant can become important quickly. If they move from experiment to production:

- document ownership and recovery
- enable deliberate start order
- configure monitoring
- store backups independently
- test host reboot behaviour
- retain temporary DNS or automation fallback
- plan maintenance windows

A one-node lab has no high availability. Proxmox clustering features do not create redundancy when all workloads and storage remain on one physical mini PC.

## Capacity and health checks

On Proxmox:

~~~bash
pveversion -v
pvesh get /cluster/resources --type vm
free -h
df -hT
pvesm status
systemctl --failed
~~~

In the interface, review host CPU, memory, storage and guest trends. Investigate sustained pressure rather than reacting to one brief peak.

## Verification checklist

- [ ] Exact mini-PC hardware is recorded.
- [ ] The lab has a defined purpose.
- [ ] Proxmox retains resource headroom.
- [ ] Guest addresses and roles are documented.
- [ ] Backups leave the mini PC or its system SSD.
- [ ] At least one isolated restore is proven.
- [ ] Network changes have a local-console fallback.
- [ ] Important guests survive a controlled host reboot.
- [ ] Power claims use a recorded measurement method.
- [ ] Experimental and production services are distinguished.

This is a planning and build framework. It does not claim that SmallGrid has tested a specific mini PC or measured the example guest combination.

Phase 4 is complete. Continue with the evidence and SEO work in the roadmap, while leaving proven pages stable. Review the full series from [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/) or revisit [Run Docker in a Proxmox VM or LXC?](/guides/run-docker-proxmox-vm-or-lxc/).

Official references: [Proxmox VE Administration Guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.html) and [Proxmox backup and restore](https://pve.proxmox.com/pve-docs/chapter-vzdump.html).
