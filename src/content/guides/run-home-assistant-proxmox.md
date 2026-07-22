---
title: "How to Run Home Assistant in Proxmox"
description: "Install Home Assistant OS as a Proxmox virtual machine using the official KVM image, with network, USB, backup and recovery planning."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "home-assistant", "virtual-machines", "smart-home", "home-server"]
---

## Quick answer

For the full Home Assistant experience inside Proxmox, use **Home Assistant OS in a VM**. Home Assistant publishes a KVM/Proxmox-compatible QCOW2 image and identifies Home Assistant OS as the convenient appliance-style option.

Use a VM rather than an LXC for this route. It preserves the complete Home Assistant OS environment and avoids an unsupported custom container arrangement.

Read [How to Create an Ubuntu Virtual Machine](/guides/create-ubuntu-virtual-machine-proxmox/) for Proxmox VM concepts, but do not install Ubuntu into this VM: the Home Assistant OS disk is the operating system.

## Choose the installation type deliberately

| Method | What it provides |
|---|---|
| Home Assistant OS VM | Full appliance experience, including apps and managed updates |
| Home Assistant Container | Home Assistant in Docker; more host management, no HAOS appliance layer |
| LXC workaround | Not the default documented Home Assistant route |

This guide uses the first option.

## Plan before downloading

Record:

- Proxmox version
- Home Assistant OS image version and checksum if published
- VM ID and name
- CPU, memory and disk allocation
- `vmbr0` and VLAN choice
- DHCP reservation
- USB radios that may need passthrough
- backup destination
- current Home Assistant backup if migrating

Home Assistant currently states a minimum of 2GB RAM and two vCPUs for a VM. Treat those as minimums, then size for add-ons, history and integrations.

## Download the official image

Use Home Assistant's current **Alternative** installation page and select the KVM/Proxmox QCOW2 image.

Do not reuse a version number or download URL copied from an old tutorial. Record the exact release you downloaded and extract the archive if required.

Store the image temporarily on the Proxmox node or another trusted administrative machine. Verify its size and checksum when Home Assistant publishes one.

## Create an empty VM

In Proxmox:

1. Create a VM with no installation ISO.
2. Give it a clear name such as `home-assistant`.
3. Use UEFI/OVMF because Home Assistant OS requires UEFI for this virtual-machine path.
4. Add an EFI disk on suitable storage.
5. Allocate at least the documented minimum CPU and memory.
6. Attach a VirtIO network device to `vmbr0`.
7. Do not boot it yet.

Interface labels can change. Review the summary before creating anything.

## Import the QCOW2 disk

One controlled command-line route is:

~~~bash
qm importdisk VMID /path/to/haos.qcow2 STORAGE
~~~

Replace:

- `VMID` with the Home Assistant VM ID
- `/path/to/haos.qcow2` with the verified image path
- `STORAGE` with a real Proxmox storage ID

The imported disk normally appears as unused hardware. Attach it to the VM using a supported controller, make it the first boot device and remove any empty placeholder disk that is no longer required.

Do not paste placeholders unchanged into a live command.

## First boot and network access

Start the VM and watch the Proxmox console. Home Assistant OS performs first-boot preparation, which can take time.

Try:

~~~text
http://homeassistant.local:8123
~~~

If local-name discovery is unavailable, find the VM's DHCP lease and use:

~~~text
http://VM_IP:8123
~~~

Reserve that address in DHCP after confirming it belongs to the VM.

Do not forward port 8123 directly from the public internet as a shortcut. Use Home Assistant's supported remote-access options or a private network design.

## Restore an existing Home Assistant system

If migrating, create and download a current Home Assistant backup before touching the old system.

Keep the old instance stopped or isolated while restoring. Two active Home Assistant instances can compete for devices, integrations and automations.

After restore, check:

- integrations
- automations
- dashboards
- history database
- add-ons/apps
- secrets
- entity availability
- mobile app connection
- external access

Retain the old installation until the new one has passed a controlled observation period.

## Pass through USB radios carefully

Zigbee, Z-Wave or Bluetooth adapters may need USB passthrough.

Prefer a stable physical USB port mapping where appropriate. Device numbering can change after a reboot. Pass through only the required device and record its vendor/product identity and physical port.

After adding it:

1. Start the VM.
2. Confirm Home Assistant detects the device.
3. Reboot the VM.
4. Reboot Proxmox during a maintenance window.
5. Confirm the device returns consistently.

Do not pass the same USB device to two guests.

## Back up at two levels

Use both:

- Home Assistant backups for application-level recovery
- Proxmox VM backups for whole-guest recovery

Store copies independently of the Proxmox system disk. A snapshot is useful before a risky change but is not an independent backup.

## Common failures

### VM does not boot

Check UEFI/OVMF, EFI disk, imported disk attachment and boot order.

### `homeassistant.local` does not resolve

Use the DHCP lease or VM IP directly. This is a name-discovery issue, not necessarily a failed VM.

### No network

Check the VirtIO adapter, `vmbr0`, VLAN, DHCP and firewall. Use [Proxmox VM Has No Internet](/guides/proxmox-vm-no-internet-troubleshooting/).

### USB radio disappears after reboot

Review the passthrough mapping and physical USB topology, then confirm the device on the Proxmox host before changing Home Assistant.

## Verification checklist

- [ ] The image came from Home Assistant's official page.
- [ ] Exact image version is recorded.
- [ ] The VM uses UEFI and the imported disk is first in boot order.
- [ ] The VM obtains the intended address.
- [ ] Port 8123 works on the trusted network.
- [ ] Integrations and automations operate after migration.
- [ ] USB devices survive guest and host reboots.
- [ ] Home Assistant and Proxmox backups both exist.
- [ ] At least one restore route has been tested.

This guide follows the supported image path but does not claim that SmallGrid has completed this Home Assistant migration.

Next: [How to Run Jellyfin in Proxmox](/guides/run-jellyfin-proxmox/). Return to [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

Official reference: [Home Assistant alternative installation](https://www.home-assistant.io/installation/alternative/).
