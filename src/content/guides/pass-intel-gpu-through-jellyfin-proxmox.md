---
title: "How to Pass an Intel GPU Through to Jellyfin in Proxmox"
description: "Plan Intel iGPU PCI passthrough from Proxmox to a Jellyfin VM, verify IOMMU and QSV or VA-API, and retain a safe recovery path."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "jellyfin", "intel", "gpu-passthrough", "hardware-acceleration"]
---

## Read this warning first

PCI passthrough changes which operating system controls the GPU. If the Intel iGPU is the Proxmox host's only display device, assigning it to a VM may remove the local graphical console and complicate recovery.

Before changing boot parameters or assigning hardware:

- confirm SSH and the Proxmox web interface work
- arrange another local-console path if possible
- record every current boot setting
- create current backups
- schedule downtime
- know how to edit the boot configuration from recovery media

Do not perform the first passthrough attempt when remote access is your only recovery route.

## What passthrough accomplishes

The path is:

~~~text
Intel iGPU
→ IOMMU isolation on Proxmox
→ Host PCI device assigned to VM
→ Intel driver and /dev/dri in Ubuntu
→ render device passed into Docker
→ QSV or VA-API enabled in Jellyfin
~~~

Each arrow is a separate verification point.

Read [How to Run Jellyfin in Proxmox](/guides/run-jellyfin-proxmox/) first. Prove storage and ordinary playback before adding hardware acceleration.

## Confirm the hardware supports the plan

Intel processors with an `F` suffix generally do not include an integrated GPU. Codec support also varies by generation.

On Proxmox:

~~~bash
lspci -nn | grep -Ei 'vga|display|3d'
lscpu | grep -E 'Model name|Virtualization'
grep -Eo 'vmx|svm' /proc/cpuinfo | head
~~~

Record:

- CPU model
- GPU PCI address and IDs
- motherboard model
- firmware version
- Proxmox version and kernel
- codecs required by the media library

Check Jellyfin's Intel documentation for the exact generation. QSV is preferred on supported mainstream Intel GPUs; VA-API remains relevant for older hardware and compatibility.

## Enable firmware virtualisation features

Intel systems normally need:

- Intel Virtualization Technology
- Intel VT-d or IOMMU
- integrated graphics enabled

Firmware names vary. Photograph or record the original values before changing them.

After booting Proxmox, inspect:

~~~bash
dmesg | grep -Ei 'DMAR|IOMMU'
find /sys/kernel/iommu_groups/ -type l | sort
~~~

The CPU and motherboard must support IOMMU, and it usually needs to be enabled in firmware.

## Enable IOMMU in Proxmox carefully

Proxmox may use GRUB or systemd-boot depending on how it was installed. Check before editing:

~~~bash
proxmox-boot-tool status
cat /proc/cmdline
~~~

Use the current Proxmox PCI passthrough documentation for the correct bootloader-specific method. Do not edit both methods blindly.

After applying the documented change and rebooting, verify IOMMU again before proceeding. If the host does not return, use the planned local recovery route and revert only the setting you changed.

## Inspect the IOMMU group

Identify the GPU and related audio function, if present:

~~~bash
lspci -nnk -s GPU_PCI_ADDRESS
readlink /sys/bus/pci/devices/0000:GPU_PCI_ADDRESS/iommu_group
~~~

Replace the placeholder. Then list all devices in that group.

Do not pass through an unsafe group containing unrelated essential host hardware merely to make the interface accept it. ACS overrides can weaken isolation and are not a default beginner fix.

## Add the GPU to the VM

Shut down the Jellyfin VM. In its **Hardware** tab:

1. Select **Add**.
2. Choose **PCI Device** or **Host PCI**.
3. Select the verified Intel GPU.
4. Review multifunction and primary-GPU options rather than enabling them automatically.
5. Confirm the VM uses a compatible machine type and firmware.
6. Start the VM and watch both host and guest behaviour.

Proxmox documents the interface route as the easiest way to add a Host PCI device.

If the host loses access, stop and recover. Do not stack further configuration changes onto an unverified state.

## Verify the GPU inside Ubuntu

Inside the VM:

~~~bash
lspci -nn | grep -Ei 'vga|display|3d'
ls -l /dev/dri
id
~~~

Install only the Intel media packages appropriate to the Ubuntu release and GPU generation. Then use `vainfo` or Jellyfin's documented checks to confirm the device can decode and encode the required codecs.

A PCI device appearing in `lspci` does not prove hardware transcoding works.

## Pass the render device into Docker

The Jellyfin container normally needs the relevant `/dev/dri` render device and permission to use it.

Verify the render-group identity on the Ubuntu VM and inside the container rather than assuming a numeric GID. Container definitions should follow Jellyfin's current Intel Docker example.

After updating Compose:

~~~bash
sudo docker compose config
sudo docker compose up -d
sudo docker compose logs --tail=100
sudo docker exec jellyfin ls -l /dev/dri
~~~

Replace the container name if it differs.

## Enable and prove acceleration in Jellyfin

In Jellyfin's playback/transcoding settings, select the documented Intel method for the hardware. Enable only codecs the GPU actually supports.

Test with a file that intentionally requires video transcoding. Check:

- playback information and transcode reason
- Jellyfin logs
- FFmpeg command and output
- host CPU use
- GPU engine activity using an appropriate Intel monitoring tool

Do not treat successful Direct Play as proof of GPU acceleration because Direct Play does not transcode the video.

## Common failures

### VM will not start

Check whether the host still owns the device, whether the IOMMU group is viable and whether VM firmware/machine settings are compatible.

### GPU is visible but `/dev/dri` is absent

Check the guest kernel driver and logs:

~~~bash
dmesg | grep -Ei 'i915|xe|drm'
lsmod | grep -E 'i915|xe'
~~~

### Jellyfin reports permission denied

Compare device ownership, render/video group membership and Docker device mapping. Do not use privileged mode as the first fix.

### CPU remains high

Confirm the playback is a video transcode, inspect the FFmpeg log and check whether unsupported codecs, subtitle burn-in or tone mapping force a partial software path.

## Reboot and recovery test

After one successful transcode:

1. Reboot the VM.
2. Repeat the transcode.
3. Reboot Proxmox during a maintenance window.
4. Confirm host management access.
5. Confirm the VM starts.
6. Confirm `/dev/dri` and Docker mapping.
7. Repeat the same transcode and compare logs.

Keep the prior boot configuration and a way to remove the PCI device from the VM.

## Verification checklist

- [ ] CPU, GPU and codec support are recorded.
- [ ] VT-d/IOMMU is enabled and proven.
- [ ] IOMMU group contents are understood.
- [ ] Local recovery is available.
- [ ] The GPU appears inside the VM.
- [ ] The render device appears inside Docker.
- [ ] Jellyfin logs prove hardware decoding or encoding.
- [ ] The same test survives VM and host reboots.
- [ ] A rollback procedure is stored offline.

This guide describes the controlled process. It does not claim that SmallGrid has completed Intel GPU passthrough or measured its performance.

Next: [How to Build a Proxmox Test Lab on One Mini PC](/guides/build-proxmox-test-lab-one-mini-pc/). Compare the deployment choices in [Jellyfin in a VM vs LXC vs Bare Metal](/guides/jellyfin-vm-vs-lxc-vs-bare-metal/) or return to [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

Official references: [Proxmox PCI passthrough](https://pve.proxmox.com/pve-docs/chapter-qm.html#qm_pci_passthrough) and [Jellyfin Intel GPU acceleration](https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/intel/).
