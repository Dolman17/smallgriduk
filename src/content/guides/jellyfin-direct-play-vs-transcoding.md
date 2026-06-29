---
title: "Jellyfin Direct Play vs Transcoding: What Actually Matters"
description: "Understand direct play, transcoding, Jellyfin CPU usage, buffering, file formats, and when hardware transcoding is worth it."
pubDate: 2026-06-27
tags: ["jellyfin", "transcoding", "direct-play", "low-power", "media"]
cover: "/images/guides/jellyfin-direct-play-vs-transcoding-diagram.webp"
---

## Goal

Understand why Jellyfin sometimes plays smoothly and sometimes hammers your server CPU.

The important difference is usually:

- **direct play**: the client plays the file as-is
- **transcoding**: the server converts the file while you watch

For a low-power home server, direct play is usually the better default.

---

## The default recommendation

Aim for direct play first.

Direct play solves more Jellyfin problems than a bigger CPU. It keeps the server quiet, reduces power use, avoids unnecessary heat, and makes playback more reliable on small hardware.

Use transcoding only when you actually need it, such as:

- a client cannot play the file format
