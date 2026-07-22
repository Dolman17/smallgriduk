---
title: "How to Access Proxmox Remotely with Tailscale"
description: "Reach the Proxmox web interface securely through Tailscale without forwarding port 8006, with direct-host and subnet-router options plus recovery checks."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "tailscale", "remote-access", "vpn", "security", "networking"]
---

## Quick answer

Do not expose Proxmox port 8006 directly to the public internet.

Tailscale can give authorised devices a private encrypted path to the Proxmox interface without router port forwarding.

There are two sensible designs:

| Design | Advantage | Trade-off |
|---|---|---|
| Tailscale on Proxmox host | Direct access to host's Tailscale address | Adds third-party software to the hypervisor |
| Separate Tailscale subnet router | Keeps Proxmox host cleaner | More setup and another guest must remain available |

For a small lab, direct installation is simpler. A separate subnet router better follows the principle of keeping the hypervisor minimal.

Read [Proxmox VM Has No Internet](/guides/proxmox-vm-no-internet-troubleshooting/) and [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/) for the underlying network model.

## Before you begin

You need:

- a working Proxmox web interface on the local LAN
- a Tailscale account
- an authorised remote device with Tailscale installed
- local-console access to Proxmox
- current backups and recorded network settings
- multi-factor authentication on important accounts

Prove ordinary LAN access before adding remote access.

Do not remove the local management route when Tailscale begins working.

## Option A: install Tailscale on the Proxmox host

This changes the hypervisor, so record the change and keep it updated.

Confirm the Proxmox/Debian release:

~~~bash
pveversion -v
cat /etc/os-release
~~~

Use the current official [Tailscale Linux installation instructions](https://tailscale.com/download/linux) rather than an old third-party repository example.

The official convenience installer is commonly:

~~~bash
curl -fsSL https://tailscale.com/install.sh | sh
~~~

If policy requires reviewing scripts before execution, download and inspect the installer or follow Tailscale's manual package-repository instructions instead.

Authenticate:

~~~bash
tailscale up
~~~

Open the printed sign-in URL on an authorised device, then approve the node.

Check:

~~~bash
tailscale status
tailscale ip -4
systemctl status tailscaled --no-pager
~~~

Record the assigned 100.x Tailscale address or MagicDNS name.

## Connect to the Proxmox interface

From another authorised Tailscale device, browse to:

~~~text
https://<tailscale-address>:8006
~~~

or, when MagicDNS is enabled:

~~~text
https://<tailscale-name>:8006
~~~

The browser may still warn about Proxmox's locally issued certificate. Verify that the address and certificate context are the expected Proxmox host; do not teach the browser to ignore unrelated certificate warnings.

Test SSH separately only if SSH access is intended and permitted.

## Option B: use a subnet router guest

This design lets a Tailscale guest advertise the home LAN, so remote devices can reach Proxmox at its normal LAN address.

Do not create the subnet router inside the only Proxmox host if you require it to recover that host while all guests are stopped. A separate Raspberry Pi, mini PC or router provides a better recovery boundary.

On a chosen Linux router device:

1. Install and authenticate Tailscale.
2. Enable IP forwarding as described in Tailscale's current documentation.
3. Advertise only the required LAN subnet.
4. Approve the advertised route in the Tailscale admin console.
5. Restrict access using tailnet policy.
6. Test from a remote network.

A representative command is:

~~~bash
tailscale up --advertise-routes=192.168.0.0/24
~~~

The subnet is an example. Advertising the wrong or overlapping route can disrupt access.

The full process is documented by [Tailscale subnet routers](https://tailscale.com/docs/features/subnet-routers).

## Control who can reach Proxmox

A device being in the tailnet should not automatically mean every user can administer Proxmox.

Use Tailscale grants or access controls to limit:

- source users or tagged admin devices
- destination Proxmox node
- TCP port 8006
- SSH only when required

Also keep Proxmox authentication strong:

- use individual accounts
- avoid shared root credentials
- enable two-factor authentication
- remove stale accounts and API tokens
- review authentication logs
- use the minimum necessary role

Tailscale protects the network path. It does not replace Proxmox authentication.

## Firewall considerations

Most Tailscale installations do not require an inbound port-forward on the home router.

Tailscale's current documentation says outbound HTTPS and NAT traversal normally establish connectivity; direct connections commonly use UDP, with relay fallback when direct peer-to-peer connection is unavailable.

Do not open port 8006 publicly.

If a restrictive firewall is present, use the current [Tailscale firewall guidance](https://tailscale.com/docs/reference/faq/firewall-ports) rather than a hard-coded list copied from an old guide.

If Proxmox firewall rules are enabled, explicitly allow the intended Tailscale source and management port before relying on the remote path.

## Test from a genuinely remote network

Testing while both devices are on the same Wi-Fi can hide routing mistakes.

Use an authorised phone on mobile data or another external connection.

Verify:

~~~bash
tailscale status
tailscale ping <proxmox-tailnet-name-or-ip>
~~~

Then test the web interface.

Confirm in the Tailscale status output whether the connection is direct or relayed. Relayed access can still work but may perform differently.

## Never make remote network changes without fallback

Tailscale improves access but does not make bridge changes safe.

Before changing vmbr0, the host address, firewall defaults or routing:

- arrange local-console access
- keep an existing session open
- save current configuration
- add allow rules before deny rules
- schedule a rollback
- change one layer at a time
- verify on both LAN and Tailscale

If the Tailscale service fails, local Proxmox access must remain available.

## Remove or reset Tailscale

Before removal, confirm local LAN management works.

Log the node out:

~~~bash
tailscale logout
~~~

Then remove or disable the package using the method appropriate to the installation source.

Also remove:

- stale node approval in the Tailscale admin console
- obsolete access rules
- unused auth keys
- advertised subnet routes

Do not remove the remote path during an incident unless another verified administration route exists.

## Troubleshooting

### Tailscale is offline

~~~bash
systemctl status tailscaled --no-pager
journalctl -b -u tailscaled --no-pager
tailscale status
~~~

Check host time, DNS and outbound connectivity.

### Tailscale ping works but port 8006 does not

Check:

~~~bash
ss -lntp | grep 8006
systemctl status pveproxy --no-pager
~~~

Then inspect Proxmox firewall rules and Tailscale access policy.

### Subnet route works for other devices but not Proxmox

Check:

- route approval
- advertised prefix
- tailnet policy
- overlapping local subnets
- Proxmox firewall source rules
- return routing and subnet-router availability

### Direct connection becomes relayed

Use tailscale status and current NAT/firewall guidance. Relay use is not automatically a failure.

## Verification checklist

- [ ] LAN access works independently.
- [ ] No public port-forward exposes 8006.
- [ ] Tailscale node is authorised.
- [ ] Tailnet policy restricts management access.
- [ ] Proxmox two-factor authentication is enabled where appropriate.
- [ ] Remote access works from an external network.
- [ ] Connection type is recorded.
- [ ] Local-console recovery remains possible.
- [ ] Access survives a controlled reboot.
- [ ] Package and node removal steps are documented.

This is implementation guidance, not a claim that the SmallGrid Proxmox host has completed this Tailscale setup.

Next: [Proxmox Firewall Basics for a Home Server](/guides/proxmox-firewall-basics-home-server/).
