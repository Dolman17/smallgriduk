---
title: "How to Run Pi-hole in a Proxmox LXC Container"
description: "Plan and install Pi-hole in an unprivileged Proxmox LXC container with a stable address, safe DNS migration, verification and rollback steps."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "pi-hole", "lxc", "dns", "networking", "home-server"]
---

## Quick answer

Pi-hole is a good fit for a small, unprivileged Debian or Ubuntu LXC container because it does not normally need its own kernel.

The critical part is not the installation. It is DNS migration. Give the container a stable address, prove Pi-hole works from one test device, then change DHCP or router DNS. Keep the old DNS settings written down so you can roll back quickly.

Start with [How to Create an Ubuntu LXC Container](/guides/create-ubuntu-lxc-container-proxmox/) and [How Proxmox VM Networking Works](/guides/how-proxmox-vm-networking-works/).

## Plan the DNS change

Record:

- container ID and hostname
- bridge and VLAN, if used
- fixed IPv4 address and subnet
- gateway
- upstream DNS provider
- router or DHCP-server DNS settings before the change
- local domain behaviour
- whether IPv6 DNS is in use
- emergency rollback values

The address must not conflict with DHCP. Prefer a DHCP reservation or an address deliberately excluded from the pool.

Pi-hole must be available whenever clients need DNS. Consider a second DNS server only if it provides the filtering and local-name behaviour you intend; many clients will use an advertised secondary server independently rather than only during failure.

## Create an unprivileged LXC

Download a current, supported Debian or Ubuntu template from Proxmox. Pi-hole supports actively maintained releases of several Linux distributions; verify the current list before choosing.

Create the container with:

- **Unprivileged container** enabled
- a clear hostname such as `pihole`
- modest CPU, memory and disk resources
- network attached to `vmbr0`
- the planned stable address
- **Start at boot** enabled after testing

Do not enable nesting, privileged mode or extra devices unless a specific requirement justifies them.

Start the container and verify its identity and network:

~~~bash
cat /etc/os-release
ip -brief address
ip route
resolvectl status 2>/dev/null || cat /etc/resolv.conf
ping -c 3 192.168.0.1
getent hosts pi-hole.net
~~~

Replace the gateway example if your network is different.

## Check port 53 before installing

DNS needs TCP and UDP port 53. Confirm nothing unexpected is listening:

~~~bash
sudo ss -lntup | grep ':53 '
~~~

Some distributions use a local resolver stub. Follow Pi-hole's current prerequisites and installer guidance rather than disabling services blindly.

## Install Pi-hole from the official source

Update the container first:

~~~bash
sudo apt update
sudo apt full-upgrade
sudo reboot
~~~

Then use the installation method currently published by Pi-hole. Read the official script or use its documented alternative methods if you do not want to pipe a remote script directly into a shell.

During setup, record:

- selected interface
- fixed address
- upstream DNS choice
- blocklists
- privacy/logging choices
- web interface option
- administrator credential handling

Do not publish the password or store it in the guide notes.

## Test Pi-hole before changing the whole network

From the container:

~~~bash
pihole status
sudo ss -lntup | grep -E ':53 |:80 |:443 '
~~~

From one client, query the Pi-hole address directly:

~~~bash
nslookup example.com PIHOLE_IP
nslookup pi.hole PIHOLE_IP
~~~

Or with `dig`:

~~~bash
dig @PIHOLE_IP example.com
~~~

Replace `PIHOLE_IP` with the actual address. Confirm the query appears in Pi-hole's query log and that an intended blocked domain behaves as configured.

## Migrate clients safely

Use this order:

1. Save screenshots or notes of the existing DHCP and DNS configuration.
2. Point one test device to Pi-hole manually.
3. Test ordinary sites, local names and important services.
4. Change the router or DHCP server to advertise Pi-hole.
5. Renew one client's lease.
6. Confirm the client actually received the new DNS address.
7. Expand to the remaining network.
8. Keep rollback settings available.

Client checks:

~~~bash
resolvectl status
ipconfig /all
nslookup example.com
~~~

Use the command appropriate to the client operating system.

## IPv6 can bypass the plan

If the router advertises an IPv6 DNS server independently, clients may continue using it. Decide deliberately whether Pi-hole will serve IPv6 DNS and inspect the DNS servers clients actually receive.

Do not assume an IPv4-only change covers the whole network.

## Back up Pi-hole and the container

Use Pi-hole's settings export where available and create a Proxmox backup to independent storage.

Record:

- Pi-hole settings export location
- container backup schedule
- address reservation
- upstream DNS
- router rollback settings

Test restoring the container under an isolated address before allowing it to answer production DNS.

## Common failures

### Clients still use the old resolver

Renew DHCP, clear the client's DNS cache and inspect all IPv4 and IPv6 DNS servers.

### The web interface works but DNS fails

Check TCP and UDP port 53, the Pi-hole service, Proxmox firewall and guest firewall.

### Pi-hole resolves public names but not local hosts

Configure conditional forwarding or local DNS records deliberately. Avoid creating a loop between Pi-hole and the router.

### The network loses DNS after a Proxmox reboot

Check container start-at-boot settings, startup order, address conflicts and Pi-hole service status. Keep a known public resolver written down for temporary recovery.

## Verification checklist

- [ ] The LXC is unprivileged.
- [ ] The address is fixed and excluded or reserved.
- [ ] TCP and UDP port 53 are available.
- [ ] Direct queries to Pi-hole succeed.
- [ ] A test client uses Pi-hole before network-wide migration.
- [ ] IPv6 DNS behaviour is understood.
- [ ] DNS survives a controlled container and Proxmox reboot.
- [ ] Pi-hole settings and the LXC are backed up.
- [ ] Previous router settings are retained for rollback.

This is a safe implementation plan. It does not claim that SmallGrid has migrated its recorded Pi-hole service into Proxmox.

Next: [How to Run Home Assistant in Proxmox](/guides/run-home-assistant-proxmox/). Return to [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

Official references: [Pi-hole prerequisites](https://docs.pi-hole.net/main/prerequisites/) and [Pi-hole installation](https://docs.pi-hole.net/main/basic-install/).
