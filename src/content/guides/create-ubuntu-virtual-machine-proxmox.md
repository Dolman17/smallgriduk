---
title: "How to Create an Ubuntu Virtual Machine in Proxmox"
description: "Create an Ubuntu Server VM in Proxmox, choose sensible CPU, memory, disk and network settings, install the guest agent and verify reboot recovery."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "ubuntu", "virtual-machine", "virtualisation", "homelab", "linux"]
---

## Quick answer

Upload a verified Ubuntu Server ISO, select **Create VM**, attach the ISO, choose modest CPU and memory values, create a VirtIO SCSI disk, connect the VM to `vmbr0`, then complete the Ubuntu installer. After first boot, install `qemu-guest-agent`, enable it in Proxmox and test a controlled guest reboot.

This is a current Proxmox VE 9 procedure, not a claimed completed SmallGrid VM build. Resource values below are starting recommendations and must be adjusted for the workload.

First complete [How to Upload an ISO Image to Proxmox](/guides/how-to-upload-iso-image-proxmox/).

---

## Before creating the VM

Confirm:

- the Ubuntu ISO checksum was verified
- the ISO upload task completed
- the host has free memory and storage
- `vmbr0` is connected to the intended physical network
- a VM ID and clear name are available
- you know whether the guest should use DHCP or a static address
- the guest has a backup destination

Do not allocate all host memory or CPU threads. Proxmox and other guests need room to operate.

## Suggested beginner starting point

For a small Ubuntu Server guest:

| Setting | Starting recommendation |
|---|---|
| CPU | 2 cores |
| Memory | 2–4 GB |
| Disk | 32 GB or more, based on workload |
| Disk bus | SCSI with VirtIO SCSI controller |
| Network model | VirtIO |
| Bridge | `vmbr0` on a normal single-LAN setup |
| Firmware | Default unless the workload requires UEFI |

These are not benchmark results. A database, Docker server, Jellyfin VM or desktop installation may need substantially different resources.

## 1. Start the VM wizard

Select **Create VM** in the top-right corner.

On **General**:

1. choose the correct node
2. keep or record the generated VM ID
3. use a short descriptive name such as `ubuntu-server`
4. add tags if they support your own organisation

Avoid names tied to a temporary purpose if the VM may become long-lived.

## 2. Attach the Ubuntu ISO

On **OS**:

1. choose **Use CD/DVD disc image file (iso)**
2. select the storage containing the ISO
3. select the verified Ubuntu Server ISO
4. confirm the guest type is Linux

If the ISO is absent, return to its storage and check that the upload task succeeded.

## 3. Choose system settings

The defaults are a reasonable beginning for many Linux guests. Use a VirtIO SCSI controller for a modern Ubuntu VM.

Enable **QEMU Guest Agent** in the VM options if the wizard presents it, but remember that this only enables the Proxmox side. The agent package must also be installed inside Ubuntu.

Choose UEFI only when you have a reason or want a consistent UEFI-based guest standard. If using OVMF, keep the EFI disk that Proxmox adds.

## 4. Configure the virtual disk

Choose storage with enough capacity and an appropriate backup plan.

For a normal Ubuntu Server VM:

- use the SCSI bus with VirtIO SCSI
- enable discard only when the underlying storage supports it and you understand the reclamation path
- leave cache settings at a safe default unless you have measured a reason to change them
- choose a disk size that leaves room for updates, logs and application data

Thin-provisioned storage can report more assigned space than is physically available. Monitor the real storage pool, not only the filesystem inside Ubuntu.

## 5. Allocate CPU

Start with one socket and two cores for a light server.

The CPU type affects features and portability. `host` can expose more of the physical CPU and is useful on a single-node home lab, but can make migration to dissimilar hardware harder. A more generic model improves compatibility at the cost of some features or performance.

Do not select a value solely because it is the largest available.

## 6. Allocate memory

Set a deliberate amount rather than consuming the host's remaining RAM.

For a first server VM, 2–4 GB is a practical starting range. Review real usage after the workload is installed:

```bash
free -h
```

Ballooning can help flexible allocation, but it is not a substitute for capacity planning. Keep guaranteed memory for services that must remain responsive.

## 7. Configure networking

For a normal LAN-connected VM:

```text
Bridge: vmbr0
Model:  VirtIO (paravirtualized)
```

Leave the Proxmox firewall option disabled until an intentional rule set exists, or enable it only as part of a tested firewall plan.

`vmbr0` normally connects the guest to the same physical LAN as the Proxmox host. The guest still needs its own IP configuration; it does not share the host's management IP.

## 8. Review before creating

Check:

- node and VM ID
- VM name
- ISO filename
- disk storage and size
- CPU and memory
- bridge and network model

Create the VM, but do not assume the operating system is installed yet.

## 9. Install Ubuntu Server

Start the VM and open **Console**. Follow the Ubuntu installer.

During installation:

- select the correct virtual disk
- set the intended hostname
- create a named user
- choose network settings deliberately
- install OpenSSH only if remote shell access is required
- record any additional packages selected

The disk shown inside Ubuntu is the virtual disk, not the Proxmox host's physical installation disk.

When installation finishes, reboot the VM. If it starts the installer again, detach the ISO or move the virtual disk above the CD/DVD drive in **Options → Boot Order**.

## 10. Update Ubuntu and install the guest agent

Inside the VM:

```bash
sudo apt update
sudo apt full-upgrade
sudo apt install qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent
```

Then ensure **Options → QEMU Guest Agent** is enabled for the VM. A VM restart may be needed after changing that Proxmox option.

Check inside Ubuntu:

```bash
systemctl status qemu-guest-agent --no-pager
ip -brief address
ip route
systemctl --failed
```

The guest agent helps Proxmox obtain guest information and coordinate supported actions, but it does not replace normal monitoring or backups.

## 11. Verify reboot and shutdown

Record the initial state:

```bash
hostnamectl
free -h
lsblk -f
ip -brief address
systemctl --failed
```

Use the Proxmox **Shutdown** action and confirm Ubuntu shuts down cleanly. Start it again and verify:

- the guest obtains the expected address
- SSH works if enabled
- the guest agent is running
- the filesystem is mounted as expected
- no service has failed

Only then consider configuring automatic start. Startup ordering matters when a VM depends on another guest for DNS or storage.

## Troubleshooting

### `No bootable device`

Check that the ISO is attached, the CD/DVD drive is enabled and the boot order includes it for installation.

### Ubuntu installer cannot see a disk

Review the VM hardware and confirm a virtual disk exists. Modern Ubuntu supports VirtIO, so do not change controllers randomly without recording the original configuration.

### The VM has no network

Check both layers.

In Proxmox:

- network device exists
- bridge is `vmbr0`
- link is enabled
- firewall rules are not blocking it

Inside Ubuntu:

```bash
ip -brief address
ip route
resolvectl status
ping -c 4 192.168.0.1
getent hosts ubuntu.com
```

Use the real LAN gateway instead of the example when different.

### Proxmox does not show the guest IP

Confirm the guest-agent package is running inside Ubuntu and the QEMU Guest Agent option is enabled in Proxmox, then restart the VM if the Proxmox-side option changed.

## Final checklist

- [ ] Verified ISO attached
- [ ] Resource choices recorded
- [ ] Correct storage selected
- [ ] VM connected to intended bridge
- [ ] Ubuntu fully installed and updated
- [ ] QEMU guest agent running and enabled
- [ ] Clean shutdown and reboot tested
- [ ] Expected IP and DNS verified
- [ ] Backup job planned

Next: [How to Create an Ubuntu LXC Container in Proxmox](/guides/create-ubuntu-lxc-container-proxmox/).

