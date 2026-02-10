---
title: "Remote Jellyfin Without Port Forwarding: Tailscale + SmallGrid Setup"
description: "Use Tailscale to reach your Jellyfin server from anywhere without opening ports or wrestling with DDNS."
pubDate: 2026-01-21
tags: ["jellyfin", "tailscale", "remote-access", "security"]
cover: "/images/guides/tailscale-hero.svg"
---

##Goal

Reach your Jellyfin server from anywhere (phone, laptop, TV) by:

installing Tailscale on the server and your devices

using the private tailnet IP instead of opening ports

avoiding DDNS, random reverse proxies, and “hope the router behaves”

No port forwarding, no exposed services.

---

1. What Tailscale actually does here

Tailscale creates a private mesh network (a “tailnet”) between:

your Jellyfin server

your laptop / phone / other clients

Each device gets a stable private IP, e.g.:

100.89.21.37 (Jellyfin server on Tailscale)

100.71.10.22 (your phone)

You then connect to Jellyfin over that private IP and port:

http://100.89.21.37:8096


Even if you’re on 5G in another city.

2. Install Tailscale on your Jellyfin server (Ubuntu)

Assuming Jellyfin is on Ubuntu.

curl -fsSL https://tailscale.com/install.sh | sh

sudo tailscale up


The first tailscale up will print a URL.
Open that URL in a browser, log in with your Tailscale account (Google, Microsoft, GitHub, etc.), and authorise the device.

Once that’s done, check status:

tailscale status


You should see an entry for this server with:

a 100.x.x.x IP

a name like jellyfin-server or similar

3. Grab the Tailscale IP for Jellyfin

Run:

tailscale ip


You’ll get something like:

100.89.21.37
fd7a:115c:a1e0:ab12:4843:cd96:624d:1234


The first one (100.x.x.x) is what you care about.

Call it:

TAIL_IP_SERVER = 100.89.21.37 (example)

4. Install Tailscale on your client devices
4.1 Laptop / desktop

Download Tailscale for your OS from their site.

Install, log in with the same account you used on the server.

Once connected, you can run:

tailscale status


You should see both your laptop and the Jellyfin server in the list.

4.2 Phone / tablet

Install the Tailscale app from the iOS/Android store.

Log in with the same account.

Connect.

All of these devices now share the same private network.

5. Connect to Jellyfin over Tailscale

On any Tailscale-connected device:

Open a browser.

Go to:

http://TAIL_IP_SERVER:8096


Using the example:

http://100.89.21.37:8096


You should see the Jellyfin login page just like at home, even if you’re on 4G/5G or a hotel Wi-Fi.

Log in with your usual Jellyfin account.

6. Make the URL less ugly (optional, but nice)

You don’t have to keep typing an IP address.

6.1 Use the Tailscale MagicDNS hostname

In the Tailscale admin page:

Enable MagicDNS.

You’ll see hostnames like:

jellyfin-server.tailnet-name.ts.net

Then you can use:

http://jellyfin-server.tailnet-name.ts.net:8096


That works from any device on your tailnet.

7. Lock down Jellyfin to local / tailnet only

If you currently have Jellyfin bound to 0.0.0.0 and exposed via port forwarding, you can:

remove the port forwarding rule from your router

keep Jellyfin bound to LAN addresses only (no direct WAN exposure)

In Jellyfin’s Networking settings, you can:

Make sure it’s listening on your LAN IP and/or 0.0.0.0,

But not exposed via router → internet.

Tailscale handles the “from wherever” part.

8. Multiple services? No problem

Once Tailscale is in place, you can access other self-hosted bits the same way:

Proxmox UI: https://TAIL_IP_SERVER:8006

Home Assistant: http://TAIL_IP_SERVER:8123

Dockerised dashboards, etc.

Everything stays private to your tailnet.

9. Recap: SmallGrid remote access rule

No random port forwarding.

One well-behaved mesh VPN (Tailscale).

Use private IP/hostnames for all your self-hosted services.

Jellyfin becomes “the thing you watch stuff on”, not “the thing you worry about being on Shodan.”
