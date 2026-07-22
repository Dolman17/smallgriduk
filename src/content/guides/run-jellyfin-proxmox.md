---
title: "How to Run Jellyfin in Proxmox"
description: "Plan and deploy Jellyfin in a Proxmox Ubuntu VM, including media storage, Docker, networking, backups and hardware-transcoding decisions."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "jellyfin", "docker", "virtual-machines", "media-server"]
---

## Quick answer

The clearest beginner design is Jellyfin in Docker inside an Ubuntu VM:

~~~text
Proxmox host
└── Ubuntu VM
    ├── mounted media storage
    └── Docker
        └── Jellyfin
~~~

This adds a virtualisation layer compared with bare-metal Ubuntu, but it gives a clean guest boundary and familiar Docker management.

Do not migrate a working media server merely because Proxmox is available. First decide how the VM will reach media, whether hardware transcoding is needed and how configuration will be restored.

Read [How to Build a Docker Server Inside Proxmox](/guides/build-docker-server-inside-proxmox/) before starting.

## Choose where the media lives

Separate the Jellyfin system from the library.

| Storage method | Use case | Main caution |
|---|---|---|
| Network share mounted in VM | NAS or separate storage server | Availability, credentials and startup order |
| Virtual disk attached to VM | Storage managed as a Proxmox guest disk | Backup size and host-storage planning |
| Physical disk passed to VM | Guest needs direct control | Reduced host flexibility; confirm disk identity |
| LXC bind mount | LXC deployment only | UID/GID mapping and host coupling |

A VM cannot use an LXC bind mount. It needs a virtual disk, network filesystem or passed-through controller/device.

Do not format an existing media disk during setup. Confirm every device by model, serial, filesystem and mount before changing it.

Use [How to Mount an Existing Linux Drive in Proxmox](/guides/mount-existing-linux-drive-proxmox/) for preservation-first storage planning.

## Decide whether transcoding matters

Direct Play avoids video transcoding when the client supports the media. Hardware acceleration matters when Jellyfin must convert video, tone-map HDR or handle unsupported codecs efficiently.

Before designing GPU passthrough:

1. Test representative clients.
2. Open Jellyfin playback information.
3. Identify Direct Play, Direct Stream or Transcode.
4. Record the stated transcode reason.
5. Decide whether CPU transcoding is actually inadequate.

Use [Jellyfin Direct Play vs Transcoding](/guides/jellyfin-direct-play-vs-transcoding/) and [How to Check Why Jellyfin Is Transcoding](/guides/how-to-check-why-jellyfin-is-transcoding/).

## Build the Ubuntu VM

Create an Ubuntu Server VM with:

- a verified current ISO
- CPU and memory based on the expected workload
- a system disk separate from large media where practical
- VirtIO network attached to `vmbr0`
- QEMU guest agent
- start-at-boot enabled after testing

Do not over-allocate all host resources. Proxmox itself and other guests need capacity.

Inside Ubuntu, update and inspect the network:

~~~bash
sudo apt update
sudo apt full-upgrade
sudo reboot
ip -brief address
ip route
~~~

Give the VM a stable reservation and confirm TCP 8096 is reachable only from intended networks.

## Mount media in Ubuntu first

Mount the library at a documented guest path, for example `/srv/media`, and verify it before Docker starts:

~~~bash
findmnt /srv/media
df -hT /srv/media
find /srv/media -maxdepth 2 -type f | head
~~~

Test access using the same UID/GID or service context Jellyfin will use. Do not hide a permissions problem with `chmod 777`.

If the mount is unavailable, stop. Starting Jellyfin against an empty mount point can make the library appear missing and may cause other services to write into the VM system disk.

## Deploy Jellyfin

Use Jellyfin's current official container documentation and image. Keep:

- Compose file
- environment settings
- Jellyfin configuration
- cache/transcode path
- media mount definitions

under documented paths with appropriate ownership.

Validate and start:

~~~bash
sudo docker compose config
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail=100
~~~

Open:

~~~text
http://JELLYFIN_VM_IP:8096
~~~

Add libraries only after the guest media path is proven.

## Add hardware acceleration later

Keep the first build simple. Prove software playback, storage and restart behaviour before adding a GPU.

For an Intel iGPU in a VM, the high-level path is:

1. Enable VT-d/IOMMU in firmware and Proxmox.
2. Confirm the GPU's IOMMU group.
3. Make a local-console recovery plan.
4. Pass the PCI device to the VM.
5. Install supported guest drivers.
6. expose the render device to the Jellyfin container
7. enable QSV or VA-API in Jellyfin
8. verify with an actual transcode

Use [How to Pass an Intel GPU Through to Jellyfin](/guides/pass-intel-gpu-through-jellyfin-proxmox/) for the detailed risk controls.

## Back up the right data

Back up:

- Jellyfin configuration and database
- Compose and environment files
- Ubuntu VM or a reproducible build record
- mount configuration
- library metadata if it is not reproducible

The media library itself needs an independent protection plan. Including terabytes of media in frequent VM backups may be impractical.

Stop Jellyfin or use an application-consistent method before copying an active database. Then perform an isolated restore test.

## Reboot verification

Test in stages:

1. Restart Jellyfin.
2. Restart Docker.
3. Reboot Ubuntu.
4. Reboot Proxmox during a maintenance window.
5. Verify storage before Jellyfin.
6. Play representative media on important clients.
7. Confirm Direct Play and one intentional transcode.
8. Check logs and disk use.

~~~bash
findmnt /srv/media
systemctl is-active docker
sudo docker compose ps
df -hT
~~~

## Common failures

### Library is empty

Compare the Ubuntu mount path with the Docker bind mount and Jellyfin library path. Use [Jellyfin Docker Volume Paths Explained](/guides/jellyfin-docker-volume-paths-explained/).

### Permission denied

Check every parent directory, UID/GID and container mapping with [Jellyfin Ubuntu Folder Permissions](/guides/jellyfin-ubuntu-folder-permissions/).

### Playback starts transcoding unexpectedly

Check the playback reason, client codec support, subtitles and audio before blaming Proxmox.

### GPU appears in Ubuntu but not Jellyfin

Confirm the render device exists in the VM, then confirm Docker received it and the container user has permission.

## Verification checklist

- [ ] The deployment type is documented.
- [ ] Media storage is proven before Docker starts.
- [ ] Existing disks were not reformatted.
- [ ] Jellyfin configuration is separate from media.
- [ ] Important clients have been tested.
- [ ] Transcode reasons are recorded.
- [ ] Guest and Proxmox reboots are verified.
- [ ] Configuration and media have appropriate backup plans.
- [ ] A restore has been tested.

This is a deployment guide, not a claim that SmallGrid's recorded bare-metal Ubuntu media stack has been migrated to Proxmox.

Next: [Jellyfin in a VM vs LXC vs Bare Metal](/guides/jellyfin-vm-vs-lxc-vs-bare-metal/). Return to [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

Official references: [Jellyfin container installation](https://jellyfin.org/docs/general/installation/container/) and [Jellyfin hardware acceleration](https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/).
