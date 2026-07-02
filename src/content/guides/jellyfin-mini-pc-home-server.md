---
title: "Jellyfin on a Mini PC: Build a Quiet Low-Power Media Server"
description: "Build a quiet Jellyfin media server on a mini PC with sensible hardware, storage, direct play, backups, and low-power home lab defaults."
pubDate: 2026-07-02
tags: ["jellyfin", "mini-pc", "low-power", "home-server", "homelab"]
cover: "/images/guides/mini-pc-under-200-hero.webp"
---

## Goal

Build a practical Jellyfin media server on a mini PC.

The target is:

- quiet enough for a normal room
- low-power enough to leave on
- simple enough to maintain
- powerful enough for direct play and occasional transcoding
- easy to back up and rebuild

This is the SmallGrid-style Jellyfin setup: useful, boring, and reliable.

---

## The default recommendation

For most beginners, start with a used business mini PC.

A sensible target is:

```text
CPU:      Intel 8th gen i5 or newer, or similar Ryzen
RAM:      16GB minimum, 32GB if using Proxmox or extra services
Storage:  256GB to 1TB NVMe SSD
Network:  Wired gigabit Ethernet
Media:    External HDD, NAS, DAS, or separate storage disk
```

This is enough for Jellyfin, Tailscale, a few Docker services, monitoring, and light home lab use.

For buying details, read [Budget Mini PC Home Lab: Picking a Tiny Box That Can Actually Homelab](/guides/mini-pc-under-200/).

---

## Why a mini PC works well for Jellyfin

A mini PC is often better than an old tower or rack server for a home media setup.

Benefits:

- low idle power
- low noise
- small size
- cheap used business models
- good integrated graphics on many Intel systems
- easy replacement if it fails

For a home Jellyfin server, idle power matters more than peak performance. The server spends most of its life waiting for someone to watch something.

---

## Direct play first

The best Jellyfin server is not always the most powerful one.

It is the one where most playback direct plays.

Direct play means Jellyfin sends the file to the client without converting it.

That keeps:

- CPU use low
- power use low
- heat low
- fan noise low

Read [Jellyfin Direct Play vs Transcoding: What Actually Matters](/guides/jellyfin-direct-play-vs-transcoding/) before buying hardware purely for transcoding.

---

## When hardware transcoding matters

Hardware transcoding is useful when Jellyfin has to convert video.

This may happen because:

- the client does not support the file format
- subtitles need to be burned in
- remote bitrate needs lowering
- the media is too large for the connection

Intel Quick Sync is a strong reason many people choose Intel mini PCs for Jellyfin.

See [Jellyfin Hardware Transcoding on Ubuntu: Intel Quick Sync Setup](/guides/jellyfin-hardware-transcoding-ubuntu/).

---

## Storage layout

Keep the system simple:

```text
Mini PC internal SSD:
  Ubuntu, Jellyfin, config, metadata, Docker/Proxmox if used

Separate media storage:
  movies, TV, music, photos

Separate backup:
  config, important files, metadata, scripts
```

Do not rely on the internal SSD as your only copy of anything important.

Large media libraries usually belong on:

- external USB HDD
- NAS share
- DAS enclosure
- larger internal disk if the machine supports it

For quiet storage advice, read [Quiet Storage: Add Disks Without Turning Your Home Into a Datacentre](/guides/quiet-storage-without-noise/).

---

## Ubuntu or Proxmox?

For the simplest setup:

```text
Ubuntu Server + Jellyfin directly installed
```

For a more flexible home lab:

```text
Proxmox host + Ubuntu VM/container + Jellyfin
```

Use Ubuntu directly if Jellyfin is the main job.

Use Proxmox if you also want test VMs, extra services, snapshots, and a more flexible lab.

See [Proxmox for Normal Humans: One-Node Starter Setup](/guides/proxmox-one-node-starter/).

---

## Networking

Use wired Ethernet for the server.

Avoid Wi-Fi for the always-on box if you can.

A simple network setup is:

```text
Mini PC → Ethernet cable → router or switch
```

Gigabit Ethernet is enough for most Jellyfin libraries.

2.5 GbE is useful if you regularly move large files across the network, but it is not required for a basic Jellyfin setup.

---

## Remote access

The safe default is private remote access.

For most people:

```text
Tailscale first
Reverse proxy later only if needed
```

This avoids exposing Jellyfin directly to the internet.

Start with [Remote Jellyfin with Tailscale: Private Access Setup](/guides/jellyfin-tailscale-remote-access/).

For the wider comparison, read [Jellyfin Remote Access Safely: Tailscale, Reverse Proxy, or VPN?](/guides/jellyfin-remote-access-safely/).

---

## Backups

Back up more than just media.

Important Jellyfin items include:

- Jellyfin config
- metadata if you care about it
- Docker Compose files if using Docker
- scripts
- notes about paths and mounts
- library folder structure

The media itself may be large, so decide what is genuinely important and what can be recreated.

Use [Backups That Don’t Lie: 3-2-1 for Home Servers](/guides/backups-3-2-1-home-server/) as the baseline.

---

## Power usage

A good mini PC can be very cheap to run, but measure it.

Do not guess.

Use a plug-in power meter or smart plug with energy monitoring.

Measure:

- idle watts
- normal playback watts
- transcoding watts
- storage watts

See [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/).

---

## Suggested build path

A sensible order is:

1. Buy or reuse a suitable mini PC.
2. Install Ubuntu Server.
3. Install Jellyfin.
4. Add media storage.
5. Fix permissions.
6. Confirm direct play.
7. Add Tailscale.
8. Add backups.
9. Measure power usage.
10. Only then tune transcoding.

This avoids chasing advanced settings before the basics work.

---

## Next steps

Useful related guides:

- [Jellyfin on Ubuntu: Low-Power Setup and Folder Permissions](/guides/jellyfin-ubuntu-low-power/)
- [Fix Jellyfin Folder Permissions on Ubuntu](/guides/jellyfin-ubuntu-folder-permissions/)
- [Jellyfin Direct Play vs Transcoding: What Actually Matters](/guides/jellyfin-direct-play-vs-transcoding/)
- [Jellyfin Hardware Transcoding on Ubuntu](/guides/jellyfin-hardware-transcoding-ubuntu/)
- [Recommended Home Lab Gear](/recommended-gear/)

---

## Recap

A mini PC is one of the best starting points for a quiet Jellyfin home server.

Choose efficient hardware, aim for direct play, keep storage and backups simple, use private remote access, and measure real power use before upgrading.
