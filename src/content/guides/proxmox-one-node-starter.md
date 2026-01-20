---
title: "Proxmox for Normal Humans: One-Node Starter Setup"
description: "A clean one-node Proxmox setup for small homelabs: simple layout, backups, and low-power defaults."
pubDate: 2026-01-20
tags: ["proxmox", "virtualisation", "homelab", "low-power"]
---

## Why Proxmox at home?
Because it’s a tidy way to run a few services without turning the host OS into a mystery stew.

## The SmallGrid layout
- 1 node (don’t overthink clusters)
- 1 VM for “core services” (or LXC containers)
- Backups to an external disk or NAS

## Basic steps
1) Install Proxmox VE
2) Create a VM for your main server workloads
3) Keep the host lean: don’t install random stuff on the Proxmox host

## Backups (don’t skip)
Use Proxmox backup scheduling to an external target. Test restore at least once. Future-you will be smug.
