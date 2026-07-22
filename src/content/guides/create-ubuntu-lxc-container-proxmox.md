---
title: "How to Create an Ubuntu LXC Container in Proxmox"
description: "Download an Ubuntu container template, create an unprivileged LXC in Proxmox, configure storage and networking, then verify updates and reboot recovery."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "ubuntu", "lxc", "container", "virtualisation", "homelab"]
---

## Quick answer

Download an Ubuntu LXC template to template-capable storage, select **Create CT**, choose an unprivileged container, allocate modest storage, CPU and memory, connect it to `vmbr0`, then start and update it. Test networking, shutdown and restart before deploying an application.

LXC containers share the Proxmox host's Linux kernel. They are lighter than full VMs, but they are not simply small virtual machines and are not the right choice for every workload.

This guide follows the current Proxmox VE 9 workflow. SmallGrid had not yet completed this container build when the article was published.

For a full guest operating system, see [How to Create an Ubuntu Virtual Machine in Proxmox](/guides/create-ubuntu-virtual-machine-proxmox/).

---

## Before creating the container

Decide:

- what service the container will run
- whether it needs direct hardware or filesystem access
- where its root disk and backups will live
- whether it should use DHCP or a static address
- which users need access
- whether a VM would provide a cleaner security boundary

Prefer an **unprivileged** container unless a documented requirement prevents it. Unprivileged containers map container root to a non-root range on the host, reducing the impact of some container escapes or mistakes.

## 1. Download an Ubuntu template

Select storage that accepts **Container template** content—commonly **local**—then open **CT Templates** and select **Templates**.

Choose a supported Ubuntu template appropriate to the workload and download it. Record the exact template filename.

If **CT Templates** is missing, check **Datacenter → Storage → selected storage → Content**. `local-lvm` normally stores container root disks, not template archive files.

From the shell, available templates can also be refreshed and inspected with:

```bash
pveam update
pveam available --section system | grep ubuntu
pveam list local
```

Do not select an old release simply because a tutorial uses it.

## 2. Start Create CT

Select **Create CT**.

On **General**:

1. choose the correct node
2. record the container ID
3. enter a short hostname
4. set a strong password or provide an SSH public key
5. keep **Unprivileged container** enabled

SSH keys are preferable for routine shell access. Store any recovery credential securely.

## 3. Select the template

Choose the storage containing the downloaded template, then select the exact Ubuntu archive.

An LXC template creates a container root filesystem. There is no interactive Ubuntu ISO installer and no virtual BIOS.

## 4. Configure the root disk

Select the storage for the container disk and choose a size that covers:

- the base system
- application packages
- logs
- updates
- temporary files
- expected local data

Eight to sixteen gigabytes may be enough for a small single-purpose service, but that is a starting recommendation rather than a measured requirement.

Application data that must survive rebuilding may be better placed on deliberate mounted storage. Bind mounts introduce permission and backup considerations, especially with unprivileged UID/GID mapping. Do not mount host paths into the container until those ownership rules are understood.

## 5. Allocate CPU and memory

A small service can often begin with:

| Resource | Starting recommendation |
|---|---|
| CPU | 1–2 cores |
| Memory | 512 MB–2 GB, depending on the service |
| Swap | Small, deliberate allowance rather than unlimited reliance |

Monitor the real workload and adjust. Low allocation is not automatically efficient if the service constantly swaps or is killed for lack of memory.

## 6. Configure networking

For a normal LAN-connected container:

```text
Bridge: vmbr0
IPv4:   DHCP for initial testing, or a verified static address
IPv6:   Match the actual LAN plan
```

For a static IPv4 address, provide the correct prefix and gateway. Do not reuse the Proxmox host's management IP or another device's address.

If the container will provide DNS for the network, plan how the host and clients recover while that container is stopped.

## 7. Configure DNS

The wizard can inherit DNS settings from the host or use explicit values.

Avoid a circular dependency. If Pi-hole will run inside this container, the Proxmox host should not rely exclusively on that container for DNS during boot or maintenance.

Record the selected domain and resolver.

## 8. Review and create

Check:

- container ID and hostname
- unprivileged status
- exact template
- root-disk storage and size
- CPU and memory
- bridge, address and gateway
- DNS

Create the container. Keep **Start after created** disabled if you want to review its hardware and options first.

## 9. Start, log in and update

Start the container and open **Console**, or connect over SSH if configured.

Inside the Ubuntu container:

```bash
apt update
apt full-upgrade
hostnamectl
ip -brief address
ip route
systemctl --failed
```

Test connectivity:

```bash
ping -c 4 192.168.0.1
getent hosts ubuntu.com
```

Replace the example gateway with the actual LAN gateway when different.

## 10. Check container features before enabling them

Proxmox exposes optional LXC features such as nesting, key control and FUSE support. Leave them off unless the application requires them.

Docker inside LXC often leads users to enable nesting and other features. That can work for some home labs, but it adds kernel-sharing, storage-driver, permission and backup complexity. A Docker VM is the simpler isolation boundary for many beginners.

Do not convert a container to privileged merely to silence a permission error. Diagnose UID/GID mapping, mount ownership and the application's actual requirements.

## 11. Verify shutdown and restart

From the Proxmox interface, shut down the container cleanly. Start it again and verify:

```bash
uptime
ip -brief address
ip route
systemctl --failed
df -h
```

Confirm the application, mounted storage and network return normally before enabling **Start at boot**.

If startup depends on storage, DNS or another guest, configure an appropriate startup order and delay rather than assuming all guests become ready at once.

## Troubleshooting

### The container has no network

Check the Proxmox network device, `vmbr0`, link state and firewall setting. Inside the container, check its address, default route and DNS separately.

### A host directory is visible but access is denied

This is commonly an unprivileged-container ID-mapping issue, not a reason to run everything as privileged.

Record:

```bash
# On the host
pct config CONTAINER_ID
ls -ldn /verified/host/path

# Inside the container
id
ls -ldn /mounted/path
```

Replace the ID and paths with verified values. Plan the mapping before changing ownership recursively.

### The template list is empty

Refresh the appliance index with `pveam update`, confirm internet and DNS access, and make sure the selected storage permits container-template content.

### The container will not start

Read the task log, then inspect:

```bash
pct status CONTAINER_ID
pct config CONTAINER_ID
journalctl -p err -b --no-pager
```

Do not delete and recreate it before preserving the error.

## Final checklist

- [ ] Supported Ubuntu template recorded
- [ ] Unprivileged container selected
- [ ] Resource and storage choices recorded
- [ ] Unique network address verified
- [ ] Updates completed
- [ ] DNS and gateway tested
- [ ] Shutdown and restart tested
- [ ] Mount permissions understood
- [ ] Backup and restore plan defined

Next: [Proxmox VM vs LXC: Which Should You Use?](/guides/proxmox-vm-vs-lxc/).

