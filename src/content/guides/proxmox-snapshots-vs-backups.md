---
title: "Proxmox Snapshots vs Backups: What Beginners Get Wrong"
description: "Understand the difference between Proxmox snapshots and backups, when to use each one, and why snapshots are not a recovery plan on their own."
pubDate: 2026-06-27
tags: ["proxmox", "snapshots", "backups", "homelab"]
cover: "/images/guides/proxmox-snapshots-vs-backups-diagram.webp"
---

## Goal

Understand the difference between Proxmox snapshots and Proxmox backups.

They sound similar, but they solve different problems:

- **snapshots** help you roll back a recent change
