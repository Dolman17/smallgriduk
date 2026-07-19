---
title: "How to Install Proxmox VE: Complete Beginner Guide"
description: "Prepare a Proxmox host safely, verify the ISO, choose the correct disk, configure networking, complete the installer, and record the checks needed after first boot."
pubDate: 2026-07-19
updatedDate: 2026-07-19
tags: ["proxmox", "virtualisation", "homelab", "home-server", "installation", "linux"]
---

## Quick answer

To install Proxmox VE safely:

1. Record the hardware, disks and current network configuration.
2. Back up anything on the installation target.
3. Download the current ISO from Proxmox and verify its SHA-256 checksum.
4. Write the ISO to a USB drive.
5. Enable CPU virtualisation in the BIOS or UEFI.
6. Boot the USB and select the correct installation disk.
7. Configure the country, time zone, password and management network.
8. Reboot, remove the USB drive and open the web interface on port **8006**.
9. Record the installed version, storage layout, network configuration and any errors.
10. Prove that the host and its guests recover after a controlled reboot.

The dangerous step is selecting the target disk. The Proxmox installer reformats it. Never choose a disk by size alone when several drives are connected.

---

## Evidence status for this guide

SmallGrid has inspected the intended host from its existing Ubuntu Server installation. The hardware, disks and current network state below were obtained from live commands on **19 July 2026**.

The Proxmox installation itself, first reboot and web-interface access had **not yet been completed when this guide was published**. Those steps therefore describe the supported installation process and the exact checks to record, not a claimed successful SmallGrid installation.

This distinction matters. Preparation commands can prove which hardware and disks exist, but they cannot prove how the installer behaved or whether the finished host recovered after reboot.

For an introduction to the platform and its trade-offs, start with [What Is Proxmox VE? A Beginner's Guide for Home Servers](/guides/what-is-proxmox-ve-home-server/).

---

## SmallGrid preparation environment

The intended host was verified as:

| Component | Verified detail |
|---|---|
| System | Custom-built server |
| Motherboard | Gigabyte A520M H |
| Processor | AMD Ryzen 5 2600 Six-Core Processor |
| Memory | 31 GiB usable, consistent with 32 GB installed |
| Ethernet | Realtek RTL8111/8168-series Gigabit Ethernet |
| Linux interface | `enp3s0` |
| Existing address | `192.168.0.128/24`, assigned by DHCP |
| Gateway | `192.168.0.1` |
| Current DNS | Virgin Media DNS supplied through DHCP |
| Intended system disk | 240 GB Crucial BX500 SSD at `/dev/sdb` |
| Additional disks | Three ext4 media disks, mounted separately |

The existing SSD contains Ubuntu Server:

```text
/dev/sdb
├── /dev/sdb1
├── /dev/sdb2    ext4, mounted at /boot
└── /dev/sdb3    LVM physical volume
    └── ubuntu--vg-ubuntu--lv    ext4, mounted at /
```

Installing Proxmox to this SSD will erase Ubuntu and anything stored on its root filesystem.

The other disks contain media. They must not be selected, reformatted, added to a storage pool or initialised during installation.

No disk serial numbers are needed in the public guide. Keep them in a private build record if they help distinguish physically similar drives.

---

## What you need before starting

Prepare:

- the Proxmox VE ISO
- an empty USB drive large enough for the ISO
- a monitor and keyboard connected to the server
- wired Ethernet
- access to the router or DHCP settings
- a verified backup of the current system configuration
- a separate location for future Proxmox guest backups
- the management IP, gateway, DNS server and hostname written down

Do not depend entirely on remote access for the first installation. A network or bridge mistake can make the host unreachable while the local console continues to work.

---

## Step 1: Record the existing machine

If the machine currently runs Linux, collect its state before replacing it:

```bash
sudo dmidecode -s baseboard-manufacturer
sudo dmidecode -s baseboard-product-name
lscpu
free -h
lsblk -o NAME,MODEL,SERIAL,SIZE,TYPE,FSTYPE,MOUNTPOINTS
lspci -nn | grep -i ethernet
ip -brief address
ip route
resolvectl status
```

Save the full output privately.

The most important result is the disk map. Record:

```text
Installation target:
Current operating-system disk:
Data disks that must not be changed:
External backup destination:
```

Photograph the physical drive labels if several installed disks have similar capacities.

### Check AMD virtualisation

On an AMD host, look for the `svm` CPU flag and KVM support:

```bash
grep -m1 -o '\bsvm\b' /proc/cpuinfo
test -e /dev/kvm && echo "/dev/kvm is available" || echo "/dev/kvm is not available"
lsmod | grep -E '^kvm|kvm_amd'
sudo dmesg | grep -Ei 'AMD-V|AMD-Vi|IOMMU|virtualisation|virtualization'
```

If the expected results are absent, enter the BIOS or UEFI and enable **SVM Mode**.

Enable **IOMMU** if PCIe, storage-controller or GPU passthrough may be needed later. Record the setting rather than assuming the processor's capability means it is enabled.

---

## Step 2: Back up before erasing Ubuntu

A media disk is not automatically a backup of the system disk.

Before replacing Ubuntu, preserve at least:

- Docker Compose files
- environment files and secrets
- application configuration
- container volumes
- service databases
- mount configuration
- user-created scripts
- SSH configuration
- scheduled jobs
- notes explaining how storage is assembled
- a list of running containers and images

Useful inventory commands include:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker compose ls
findmnt
cat /etc/fstab
systemctl list-timers --all
crontab -l
sudo crontab -l
```

Do not publish the contents of environment files, private keys or tokens.

After copying the backup, compare it with the source. For normal files, an `rsync` dry run is useful:

```bash
rsync -aHAXvn --delete /path/to/source/ /path/to/backup/
```

The exact source and destination must be replaced with verified paths. Do not paste a guessed path into a command that includes `--delete`.

The installation should not start until the backup can be listed and at least one important file can be opened from the destination.

---

## Step 3: Download and verify the Proxmox ISO

Use the [official Proxmox VE ISO download page](https://www.proxmox.com/en/downloads/proxmox-virtual-environment/iso).

On **19 July 2026**, the current installer listed by Proxmox was:

```text
Release:     Proxmox VE 9.2
ISO version: 9.2-1
File size:   1.71 GB
Released:    21 May 2026
SHA-256:     4e88fe416df9b527624a175f24c9aa07c714d3332afb1ee3dbf3879573ef2c6c
```

Check the download page again before installing because the current release can change.

On Linux, verify the downloaded file:

```bash
cd ~/Downloads
sha256sum proxmox-ve_9.2-1.iso
```

The calculated value must exactly match the checksum published by Proxmox.

If it differs:

1. do not write the ISO to USB
2. delete the incomplete or incorrect download
3. download it again from the official source
4. calculate the checksum again

Record the ISO filename, version, checksum and verification date in the build notes.

---

## Step 4: Create the installation USB

Use a trusted imaging tool such as:

- Rufus on Windows
- balenaEtcher on Windows, macOS or Linux
- GNOME Disks on a Linux desktop
- `dd` on Linux if you are comfortable identifying block devices

Writing an image destroys the existing contents of the selected USB drive.

Before using `dd`, identify the USB device:

```bash
lsblk -o NAME,MODEL,SIZE,TRAN,MOUNTPOINTS
```

Unmount its mounted partitions, then write to the whole device, not a numbered partition:

```bash
sudo dd if=proxmox-ve_9.2-1.iso of=/dev/sdX bs=4M status=progress conv=fsync
sync
```

Replace `/dev/sdX` with the verified USB device. Do not copy that placeholder unchanged, and do not assume the USB uses the same device name after reconnecting it.

Run `lsblk` again before every destructive disk command.

---

## Step 5: Prepare the BIOS or UEFI

Restart the server and open its firmware settings. The key varies by motherboard, but **Delete** and **F2** are common.

Record:

- firmware version
- UEFI or legacy boot mode
- SVM Mode
- IOMMU setting
- storage-controller mode
- boot order
- secure-boot state
- which USB entry was selected

Recommended starting point:

| Setting | Starting choice |
|---|---|
| Boot mode | UEFI |
| SVM Mode | Enabled |
| IOMMU | Enabled if passthrough may be used |
| SATA mode | AHCI unless the existing design requires otherwise |
| First temporary boot | Proxmox installer USB |

These are recommendations, not recorded settings from the finished SmallGrid host.

If the USB appears twice in the boot menu, choose its UEFI entry when using UEFI mode.

---

## Step 6: Boot the installer

Boot from the USB drive and choose the graphical Proxmox VE installation option.

Before accepting any destructive action, confirm:

- the installer version matches the downloaded ISO
- the server is the intended machine
- the backups are complete
- the target disk is unmistakable
- the data disks have been recorded

Read and accept the licence agreement if you agree to its terms.

---

## Step 7: Select the installation disk

This is the point at which a mistake can destroy the wrong disk.

For the recorded SmallGrid host, the intended target is:

```text
Model: Crucial BX500 SSD
Reported Linux size: 223.6 GiB
Existing Linux name: /dev/sdb
Current contents: Ubuntu Server
```

Linux device names such as `/dev/sdb` are not guaranteed to appear identically in every environment. Match the model and capacity shown by the installer, not only the old device letter.

The three media disks should remain untouched.

### Which filesystem should you choose?

For a first single-disk Proxmox installation, **ext4 with the default LVM layout** is the straightforward recommendation.

ZFS provides valuable integrity and storage features, but it adds design decisions and should not be chosen merely because it appears more advanced. A single-disk ZFS installation does not create disk redundancy.

The SmallGrid host has 32 GB of RAM, but memory capacity alone is not a reason to choose ZFS. Storage design, recovery plans and future expansion matter more.

Record the actual selection:

```text
Target disk:
Filesystem:
Installer options changed:
Reason for the choice:
```

Do not claim ext4, ZFS, XFS or Btrfs was used until the installer selection has been recorded.

---

## Step 8: Configure location and keyboard

Choose the correct:

- country
- time zone
- keyboard layout

For the SmallGrid environment, the intended time zone is:

```text
Europe/London
```

Check the displayed time before continuing. Correct time is important for logs, certificates, scheduled jobs and troubleshooting.

---

## Step 9: Set the administrator credentials

Create a strong root password and provide a working email address for system notifications.

Store the password in a password manager. Do not place it in:

- screenshots
- public notes
- shell history
- the guide source
- an unencrypted text file

Proxmox initially uses the `root` account for administration. A later security pass should cover named accounts, permissions and two-factor authentication rather than treating the installation password as the entire security configuration.

---

## Step 10: Configure the management network

The installer asks for:

- management interface
- hostname
- IP address and prefix
- gateway
- DNS server

The verified SmallGrid starting state is:

```text
Interface:       enp3s0
Current address: 192.168.0.128/24
Gateway:         192.168.0.1
Current source:  DHCP
```

Proxmox normally uses a static management configuration. Do not reuse `192.168.0.128` until the router has been checked and the address is reserved or excluded from its DHCP pool.

A proposed configuration might be:

```text
Management IP:  192.168.0.128/24
Gateway:        192.168.0.1
Hostname:       pve.home.arpa
DNS:            a deliberately selected reachable resolver
```

This is a proposed layout, not a recorded completed installation.

### Choosing DNS

Pi-hole is available at `192.168.0.65`, but the old Ubuntu host was using ISP DNS supplied by DHCP when inspected.

Using Pi-hole for the Proxmox host is reasonable only if Pi-hole remains available independently during host maintenance. If Pi-hole will run inside this same Proxmox server, depending on it for the host's only DNS resolver creates a circular recovery problem.

Whichever resolver is selected, record it and test it after first boot.

### Use a proper hostname

The Proxmox installer expects a fully qualified hostname.

For a home network, `home.arpa` is reserved for local naming. An example is:

```text
pve.home.arpa
```

Make sure the hostname resolves to the management IP through local DNS or the host configuration.

---

## Step 11: Review the summary before installing

Stop at the final summary and compare every field with the written plan.

Check:

- target disk model and capacity
- filesystem
- country and time zone
- keyboard
- management interface
- IP address and prefix
- gateway
- DNS server
- hostname

Photograph or capture the summary without exposing the password.

Only begin installation after the disk has been checked again.

---

## Step 12: Complete installation and reboot

Allow the installer to finish.

Record:

- whether any warning appeared
- installation start and finish time
- whether the installer completed normally
- whether the USB was removed
- what appeared during the first boot
- the management URL displayed at the console

Remove the USB drive when prompted or before the machine boots into the installer again.

If it returns to the installer, do not reinstall. Remove the USB or correct the boot order, then reboot.

---

## Step 13: Open the Proxmox web interface

From another device on the same LAN, open:

```text
https://PROXMOX-IP:8006
```

If the proposed SmallGrid address is adopted, that becomes:

```text
https://192.168.0.128:8006
```

A browser warning is expected initially because the host uses a locally generated certificate. Confirm that the address is the one you configured before proceeding.

The initial login normally uses:

```text
User name: root
Realm:     Linux PAM standard authentication
```

Use the password set during installation.

Do not expose port 8006 directly to the public internet.

---

## Step 14: Verify the first boot

Open the local shell or the web-interface shell and record:

```bash
pveversion -v
hostnamectl
ip -brief address
ip route
cat /etc/network/interfaces
lsblk -o NAME,MODEL,SIZE,FSTYPE,MOUNTPOINTS
findmnt
systemctl --failed
journalctl -p err -b --no-pager
```

Then test name resolution and the gateway:

```bash
ping -c 4 192.168.0.1
getent hosts pve.proxmox.com
```

Do not hide errors simply to make the installation appear complete. Record the message, the action taken and the result after the change.

Also confirm that the media disks still appear as expected, but do not mount, import or initialise them until the storage plan has been documented.

---

## Step 15: Update the new installation

Proxmox advises updating a fresh ISO installation to the latest available packages.

Repository configuration differs depending on whether the host has a Proxmox subscription. Do not blindly copy repository commands from an old Proxmox 7 or 8 tutorial into Proxmox 9.

The next guide in this series covers:

- enterprise and no-subscription repositories
- package updates
- the subscription notice
- basic host security
- safe reboot checks

Until that configuration has been checked against the installed version, treat repository changes as a separate, recorded task.

Use the [current Proxmox VE administration documentation](https://pve.proxmox.com/pve-docs/) as the authoritative reference.

---

## Common installation problems

## The USB drive does not boot

Check:

- the ISO checksum
- that the image was written rather than copied as a normal file
- UEFI versus legacy boot mode
- boot-menu selection
- another USB port
- whether the USB is visible in firmware

Do not disable unrelated firmware protections at random. Change one setting, record it and test again.

## The target disk is missing

Check:

- whether the disk appears in BIOS or UEFI
- power and data connections
- storage-controller mode
- whether the installer reports it under a different device name
- disk health from the old operating system, if it still boots

Do not continue by selecting a different disk merely because it is visible.

## The network interface is missing

Check the physical link lights and try another known-working cable or switch port.

Record the controller shown by:

```bash
lspci -nn | grep -i ethernet
```

For the inspected SmallGrid host, the adapter is a Realtek RTL8111/8168-series controller. Driver behaviour after installation must still be verified on the installed Proxmox version.

## The web interface does not open

At the local console, check:

```bash
ip -brief address
ip route
systemctl status pveproxy --no-pager
ss -lntp | grep 8006
```

From another LAN device:

```bash
ping 192.168.0.128
```

Possible causes include:

- wrong management IP
- duplicate address
- incorrect prefix or gateway
- disconnected cable
- client on another network
- `pveproxy` not listening
- browser using `http` instead of `https`
- missing `:8006`

Use the local console to repair networking rather than repeatedly reinstalling.

## The address works until another device joins

This suggests a duplicate IP or an unreserved address inside the DHCP pool.

Reserve the management address in the router or choose a verified unused static address outside the dynamic range.

## The server boots back into the installer

Remove the USB drive and select the installed SSD from the boot menu.

Do not start the installer again.

---

## First reboot verification

After the initial checks, perform one controlled reboot before creating important guests:

```bash
reboot
```

After the host returns, verify:

```bash
uptime
pveversion -v
ip -brief address
ip route
systemctl --failed
systemctl status pveproxy --no-pager
lsblk -o NAME,MODEL,SIZE,FSTYPE,MOUNTPOINTS
```

Then confirm:

1. the web interface loads
2. the management address is unchanged
3. DNS resolution works
4. no unexpected filesystem is mounted
5. all physical disks remain identifiable
6. the task log contains no unexplained failure

A successful installer screen is not the final proof. The build becomes credible when the same healthy state returns after reboot.

---

## Installation record

Complete this during the real installation:

```text
Machine:
Motherboard:
CPU:
RAM:
Network controller:

BIOS/UEFI version:
SVM Mode:
IOMMU:
Boot mode:

Proxmox ISO:
SHA-256 verified:
Installation date:
Target disk:
Filesystem:
Hostname:
Management IP:
Gateway:
DNS:

Installer warnings:
First boot result:
Web interface result:
Installed pveversion:
First update result:
Controlled reboot result:
Backup destination:
Screenshots captured:
Mistakes and recovery steps:
```

Do not fill missing fields from memory after the event. Leave them marked unknown until they can be verified.

---

## Final checklist

| Check | Required evidence |
|---|---|
| Hardware | Make, board, CPU, RAM and network controller recorded |
| Virtualisation | SVM/KVM or firmware setting verified |
| ISO | Version and checksum recorded |
| Backup | Important configuration recoverable from another location |
| Target disk | Model and capacity checked at final installer summary |
| Data disks | Not selected or reformatted |
| Network | Static management plan confirmed |
| First boot | Version, address, route and failed services checked |
| Web interface | Accessed from another LAN device |
| Updates | Repository choice and package result recorded |
| Reboot | Host returns with the same network and storage state |
| Recovery | Problems and corrective actions documented |
| Backups | Destination separate from the Proxmox system disk selected |

---

## Recap

A safe Proxmox installation begins before the USB drive boots.

The essential sequence is:

```text
Record the existing machine
→ verify backups
→ verify the ISO
→ identify the target disk
→ configure the management network
→ install
→ inspect the first boot
→ update
→ reboot
→ record the result
```

The SmallGrid host preparation has established the motherboard, processor, memory, network adapter, current network and disk layout. It has also confirmed that the intended SSD currently contains Ubuntu Server and will be erased.

The remaining evidence must come from the installation itself. Record the actual filesystem, BIOS settings, management configuration, installer messages, first web login and controlled reboot rather than presenting expected results as completed tests.
