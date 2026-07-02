---
title: "Best Mini PC Specs for Jellyfin: What Actually Matters"
description: "Choose practical mini PC specs for a Jellyfin home server, including CPU, Intel Quick Sync, RAM, storage, network, power use, and when you need hardware transcoding."
pubDate: 2026-07-02
tags: ["jellyfin", "mini-pc", "hardware", "transcoding", "homelab"]
cover: "/images/guides/mini-pc-under-200-hero.webp"
---

## Goal

Choose a mini PC for Jellyfin without overbuying.

A good Jellyfin mini PC should be:

- quiet
- low-power
- reliable
- cheap to run
- capable of direct play
- capable of hardware transcoding if you need it

The mistake is buying only by CPU benchmark score. Jellyfin performance depends more on your playback situation than on raw power.

---

## The default recommendation

For most beginner Jellyfin home servers, aim for:

```text
CPU:       Intel 8th gen Core i3/i5 or newer
Graphics:  Intel integrated graphics with Quick Sync
RAM:       8GB minimum, 16GB nicer
Storage:   SSD for the OS, separate storage for media
Network:   Gigabit Ethernet
Power:     low idle power, ideally around 5–15W at idle
```

This kind of machine is usually enough for:

- one or more local direct-play streams
- basic home server services
- light hardware transcoding
- a small always-on Jellyfin setup

If you are still comparing hardware generally, start with [Best Used Mini PCs Under £200 for a Home Server](/guides/mini-pc-under-200/).

---

## First question: direct play or transcoding?

Before choosing specs, work out what Jellyfin will actually do.

### Direct play

Direct play means the client can play the file as-is.

In that case, the server mostly sends the file across the network. CPU use is low, and even modest hardware can work well.

For direct play, the mini PC needs:

```text
Reliable storage
Gigabit networking
Enough CPU for the Jellyfin interface and scanning
Good idle power
```

It does not need a monster CPU.

### Transcoding

Transcoding means Jellyfin converts the file during playback.

This can happen because of:

- unsupported video codec
- unsupported audio codec
- unsupported subtitles
- remote streaming quality limits
- browser playback limitations
- 4K files on weak clients

For transcoding, hardware acceleration matters. For most small Jellyfin boxes, that means Intel Quick Sync.

For the basics, read [Jellyfin Direct Play vs Transcoding: What Actually Matters](/guides/jellyfin-direct-play-vs-transcoding/).

---

## Best CPU choice for a Jellyfin mini PC

For SmallGrid-style builds, Intel is usually the easiest recommendation.

Good used mini PC CPU families include:

```text
Intel 8th gen Core i3, i5, i7
Intel 9th gen Core i3, i5, i7
Intel 10th gen Core i3, i5, i7
Intel N100 / N95 / N97 style newer low-power chips
```

You do not need an i7 for a basic Jellyfin server.

A used business mini PC with an Intel i5 is often the sweet spot because it gives enough CPU headroom while staying cheap and efficient.

Examples of useful machine types:

```text
Dell OptiPlex Micro
Lenovo ThinkCentre Tiny
HP EliteDesk Mini
HP ProDesk Mini
Intel NUC-style mini PCs
```

The exact model matters less than the combination of Intel iGPU, low idle power, SSD, and enough RAM.

---

## Intel Quick Sync matters more than you think

Intel Quick Sync is the integrated video hardware built into many Intel CPUs.

For Jellyfin, it can handle video transcoding more efficiently than doing everything on the CPU.

That matters because a low-power mini PC may struggle with software transcoding, especially for higher-resolution files.

A practical recommendation:

```text
If you expect transcoding, buy Intel with Quick Sync.
If you expect direct play only, almost any decent mini PC can work.
```

For setup details, see [Jellyfin Hardware Transcoding on Ubuntu: Intel Quick Sync and VAAPI](/guides/jellyfin-hardware-transcoding-ubuntu/).

---

## How much RAM does Jellyfin need?

Jellyfin itself does not need huge RAM for a small library.

A practical guide:

| RAM | Good for |
|---|---|
| 4GB | Possible, but tight if the server does anything else |
| 8GB | Good baseline for Jellyfin and a few small services |
| 16GB | Better if using Docker, extra services, or Proxmox |
| 32GB+ | Usually unnecessary for a simple Jellyfin-only box |

For most people, 8GB is fine. 16GB is more comfortable.

If you plan to run Proxmox and multiple containers or VMs, 16GB should be the practical starting point.

---

## Storage: SSD for the system, media somewhere sensible

Use an SSD for:

```text
Operating system
Jellyfin config
Jellyfin cache
metadata
small databases
```

This keeps the system responsive.

For media, you have options:

```text
USB hard drive
internal SATA SSD/HDD if the mini PC supports it
NAS share
separate storage server
MergerFS-style pool on a Linux server
```

A simple layout:

```text
/              SSD for Ubuntu and Jellyfin
/mnt/media     media disk or mounted storage
```

If Jellyfin cannot see your media after adding storage, it is usually a path or permissions issue. Use [Jellyfin Library Not Showing Files: Fix Media Scans, Paths, and Permissions](/guides/jellyfin-media-library-not-showing-files/).

---

## Network: use Ethernet if possible

For a Jellyfin server, wired Ethernet is better than Wi-Fi.

Aim for:

```text
1Gb Ethernet minimum
2.5Gb Ethernet nice but not essential
Wi-Fi only if you have no better option
```

Direct play of large files depends on steady throughput. Wi-Fi can work, but it adds another variable when troubleshooting buffering.

For a beginner setup, plug the mini PC into the router or switch with Ethernet and remove that problem from the list.

---

## Power use: idle matters more than peak

A Jellyfin home server is usually idle most of the day.

That means idle power matters more than peak power.

Good mini PCs can idle very low compared with old desktops or gaming PCs.

Things that affect power use:

- CPU generation
- BIOS power settings
- number of drives
- USB disks
- background services
- whether the server is transcoding
- whether disks sleep or stay awake

Measure it instead of guessing. See [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/).

---

## What specs for 1080p Jellyfin?

For a simple 1080p Jellyfin server:

```text
Intel 8th gen i3/i5 or newer
8GB RAM
SSD boot drive
Gigabit Ethernet
Ubuntu Server or another lightweight Linux setup
```

This is usually enough if your clients direct play most files.

If you need occasional transcoding, pick an Intel model with Quick Sync and configure hardware acceleration carefully.

---

## What specs for 4K Jellyfin?

4K is where people overestimate what a cheap server should do.

The best 4K Jellyfin setup is:

```text
Client direct plays the 4K file
Server does not transcode 4K in real time
Subtitles do not force burn-in
Network is wired and stable
```

For 4K, avoid relying on software transcoding.

Better options:

- use a client that supports the file directly
- keep a 1080p version for remote playback
- use compatible audio and subtitle formats
- avoid burning subtitles into 4K video
- enable hardware transcoding only after testing

For format choices, read [Best File Formats for Jellyfin Direct Play: Avoid Unnecessary Transcoding](/guides/best-file-formats-for-jellyfin-direct-play/).

---

## Specs that sound important but usually are not

### Huge CPU count

A simple Jellyfin server does not need lots of CPU cores unless you are also running many other services.

### Gaming GPU

A gaming GPU is usually not needed for a small Jellyfin box. It adds cost, heat, noise, and power draw.

### 64GB RAM

Useful for some homelab workloads, but not needed for a basic Jellyfin server.

### 10Gb networking

Nice in a bigger storage setup. Not necessary for most small Jellyfin builds.

---

## Good buying checklist

Before buying a used mini PC for Jellyfin, check:

```text
Intel CPU with integrated graphics
8GB RAM minimum
16GB RAM if running Proxmox or extra services
SSD included or easy to add
Gigabit Ethernet
quiet operation
low idle power reputation
USB 3 ports if using external drives
space for internal storage if needed
power adapter included
BIOS not locked down
```

Avoid machines where the seller cannot confirm the CPU model or power adapter.

---

## Example beginner builds

### Cheapest sensible Jellyfin box

```text
Used Intel 8th gen mini PC
8GB RAM
256GB SSD
External USB media drive
Ubuntu Server
```

Good for basic direct play and learning.

### Better small home server

```text
Used Intel 8th–10th gen i5 mini PC
16GB RAM
512GB SSD
External or NAS media storage
Ubuntu Server or Proxmox
```

Good for Jellyfin plus a few extra services.

### Newer low-power option

```text
Intel N100-style mini PC
16GB RAM
SSD
External/NAS storage
Linux
```

Good for very low power use, direct play, and efficient small-server duties.

---

## What I would buy first

For most beginners, I would look for:

```text
Used Dell/Lenovo/HP business mini PC
Intel 8th gen i5 or newer
16GB RAM if the price difference is small
SSD included
Gigabit Ethernet
```

That is boring in the best way. Boring is good for a server that you want to leave alone.

---

## Next steps

Useful related guides:

- [Best Used Mini PCs Under £200 for a Home Server](/guides/mini-pc-under-200/)
- [Jellyfin on a Mini PC: Build a Quiet Low-Power Media Server](/guides/jellyfin-mini-pc-home-server/)
- [Jellyfin Direct Play vs Transcoding: What Actually Matters](/guides/jellyfin-direct-play-vs-transcoding/)
- [Best File Formats for Jellyfin Direct Play](/guides/best-file-formats-for-jellyfin-direct-play/)
- [How to Measure Homelab Power Usage Properly](/guides/measure-power-usage-homelab/)

---

## Recap

The best mini PC for Jellyfin is not necessarily the fastest one.

For most small home servers, the winning combination is:

```text
Intel mini PC
Quick Sync-capable iGPU
8–16GB RAM
SSD for the system
wired Ethernet
low idle power
media stored somewhere reliable
```

Prioritise direct play first. Add hardware transcoding only when you know you need it.