---
title: "Remote Jellyfin with Tailscale: Private Access Setup"
description: "Use Tailscale to reach Jellyfin remotely without DDNS, router changes, or a public reverse proxy."
pubDate: 2026-01-21
tags: ["jellyfin", "tailscale", "remote-access", "security"]
cover: "/images/guides/jellyfin-tailscale-remote-access-diagram.webp"
---

## Goal

Reach your Jellyfin server from your phone, laptop, tablet, or another trusted device when you are away from home.

The SmallGrid default is:

- install Tailscale on the Jellyfin server
- install Tailscale on your client devices
- connect to Jellyfin using the private Tailscale IP or MagicDNS hostname
- keep the setup simple and private

This gives you remote access without needing dynamic DNS or a public reverse proxy.
