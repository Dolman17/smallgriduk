---
title: "Mini PCs Under £200: Picking a Tiny Box That Can Actually Homelab"
description: "How to choose a used or budget mini PC that can run Jellyfin, Docker, and a small homelab without murdering your power bill."
pubDate: 2026-01-21
tags: ["hardware", "mini-pc", "low-power", "homelab"]
cover: "/images/guides/mini-pc-hero.svg"
---

## Goal

Pick a **mini PC under ~£200** that can:

- run Jellyfin, a few Docker containers, and maybe a lightweight VM
- idle at low power (not 60–80 W all day)
- not sound like a jet engine

This is not a shopping list; it’s a **checklist** so you can sanity-check anything you find on eBay / CEX / FB Marketplace.

---

## 1. CPU & generation: how “old” is okay?

For a SmallGrid-style homelab box, start with:

- **Intel 8th gen (Coffee Lake)** or newer
- **AMD Ryzen 3000 series mobile** or newer

That gets you:

- modern instruction set support
- decent performance-per-watt
- often an iGPU that can help with Jellyfin

A few rough tiers that usually work well:

- **Intel i5 / i7 U-series** (laptop/NUC):
  - Good for Jellyfin + a handful of services
- **Ryzen 5 / 7 U-series**:
  - Similar; sometimes better iGPU for general use

Avoid:

- very old Core 2 / 2nd–4th gen Core i5/i7 unless they’re basically free and you don’t care about power.

---

## 2. RAM: don’t starve the poor thing

Absolute minimum:

- **8 GB** if you’re doing *very* light stuff

Comfortable baseline:

- **16 GB** – enough for:
  - Jellyfin
  - 3–5 Docker apps
  - a small VM or LXC for experiments

If the mini PC has **two RAM slots**, that’s ideal:

- You can start with 1×8 and upgrade to 2×8 later
- Dual channel gives you better iGPU performance

---

## 3. Storage: fast inside, big outside

Pattern that works well:

- **Internal NVMe or SATA SSD** (256–512 GB)
  - OS, Docker, Proxmox / VMs, configs
- **External HDD / NAS** for bulk media and backups

Don’t feel pressured to cram huge HDDs inside a tiny box:

- it makes cooling harder
- can add vibration and noise

If the mini PC has room for a 2.5" drive as well as NVMe, treat that as a bonus for:

- a local backup disk
- overflow storage

---

## 4. iGPU: why it matters for Jellyfin

For media stuff, the integrated GPU is your quiet friend.

Look for:

- **Intel iGPU with Quick Sync** (almost any 4th gen+ Core)
- **Modern AMD APU** if you’re more on the AMD side

You don’t need it if:

- you plan to direct play everything
- or all clients are on the same LAN with friendly codecs

But in practice, a decent iGPU lets you:

- transcode the odd awkward file
- keep CPU and power usage lower under load

---

## 5. Ports & networking: the boring but important bits

Checklist:

- **At least 1× Gigabit Ethernet**
  - 2× is nice but not mandatory
- **2× USB-A** minimum
  - one for external storage
  - one spare for emergencies
- **USB-C** is a bonus but not required
- **HDMI/DisplayPort**:
  - you might need to plug in a screen for troubleshooting

Wi-Fi is nice, but for homelabs, you really want:

- **wired Ethernet** for the main connection

---

## 6. Idle power and noise: what you’re aiming for

Rough, real-world targets for a “good” mini PC:

- **Idle:** 5–15 W
- **Light load:** 20–35 W
- **Full stress:** you don’t care as much; that’s rare in normal use

If you can keep the machine:

- physically away from your head
- on rubber feet or a mouse mat
- in a cool, ventilated spot

…it’ll be almost invisible day-to-day.

---

## 7. Example “good enough” specs

If you see something like this under ~£200, it’s worth a look:

- **CPU:** Intel i5-8500T / i5-8500U / i5-8250U (or newer)
- **RAM:** 16 GB
- **Storage:** 256–512 GB SSD (NVMe or SATA)
- **NIC:** 1× Gigabit Ethernet
- **Case:** small, vented, with a single quiet fan

That’s more than enough for:

- Jellyfin with light transcoding
- 5–10 Docker containers
- Tailscale
- a small monitoring stack
- maybe Proxmox with a couple of VMs / LXC containers

---

## 8. Things to watch out for on listings

When browsing used gear:

- “No RAM / no SSD”:
  - often fine if the barebones price is cheap
- “Fan noisy under load”:
  - common on tiny boxes; can sometimes be mitigated by:
    - cleaning dust
    - re-pasting
    - adjusting fan curves in BIOS (if available)

Be wary of:

- Passive “mini PCs” with underpowered CPUs and 4 GB RAM – fine as routers, not great as Jellyfin + homelab cores.

---

## 9. Recap: the SmallGrid mini PC rule

If it:

- idles low
- stays quiet
- has a modern-enough CPU and iGPU
- takes 16 GB RAM
- boots from SSD

…it’s probably a perfectly good homelab brain, even if it’s not flashy.
Spend the rest of the budget on storage and backups, not RGB.
