---
title: "How to Give a Proxmox VM a Static IP"
description: "Give a Proxmox VM a reliable address using a DHCP reservation or Ubuntu Netplan, while avoiding duplicate IPs, wrong gateways and remote lockouts."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "networking", "static-ip", "dhcp", "ubuntu", "netplan"]
---

## Quick answer

For most home networks, reserve an IP address in the router for the VM's virtual MAC address. Leave the guest set to DHCP.

This gives the VM a predictable address without hard-coding gateway and DNS settings inside it.

Use a guest-level static IP only when you understand the router's DHCP range and can guarantee that the chosen address will not be assigned elsewhere.

This guide changes the **VM address**, not the Proxmox host management address. Read [How Proxmox VM Networking Works](/guides/how-proxmox-vm-networking-works/) and [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/) first.

## Record the current network

Inside the VM:

~~~bash
ip -brief address
ip route
resolvectl status
~~~

In Proxmox, open:

**VM → Hardware → Network Device**

Record:

- VM ID and name
- interface name inside the guest
- virtual MAC address
- bridge, normally vmbr0
- current IP and prefix
- default gateway
- DNS servers
- router DHCP range

Do not guess the interface name. An Ubuntu VM commonly uses ens18, but it may differ.

## Method 1: DHCP reservation

This is the recommended beginner method.

1. Leave the guest network set to DHCP.
2. Sign in to the home router.
3. Find DHCP reservations, static leases or address reservation.
4. Select the VM by its current address or virtual MAC.
5. Choose an unused address outside ordinary dynamic allocation, according to the router's rules.
6. Save the reservation.
7. Renew the guest lease or reboot the VM.
8. Verify the address.

Commands inside Ubuntu:

~~~bash
sudo netplan apply
ip -brief address
ip route
resolvectl status
~~~

Some routers require the old lease to expire or be removed before the reservation takes effect.

### Why the MAC address matters

The reservation follows the VM's virtual MAC address.

If the Proxmox network device is deleted and recreated with a new MAC, the reservation no longer matches. Preserve or update the reservation during VM cloning and network-device replacement.

## Method 2: static IP inside Ubuntu

Use this only after confirming an unused address.

Before making the change:

- open the Proxmox guest console
- keep the current SSH session open
- back up the Netplan file
- confirm the exact YAML filename
- confirm whether NetworkManager or systemd-networkd renders the configuration

List files:

~~~bash
ls -l /etc/netplan
sudo netplan get
~~~

Back up the actual file, for example:

~~~bash
sudo cp /etc/netplan/50-cloud-init.yaml /etc/netplan/50-cloud-init.yaml.before-static
~~~

Do not assume this example filename exists.

An example Netplan configuration is:

~~~yaml
network:
  version: 2
  ethernets:
    ens18:
      dhcp4: false
      addresses:
        - 192.168.0.150/24
      routes:
        - to: default
          via: 192.168.0.1
      nameservers:
        addresses:
          - 192.168.0.1
~~~

Every value is illustrative. Replace:

- ens18 with the verified interface
- 192.168.0.150 with an approved unused address
- /24 with the correct prefix
- 192.168.0.1 with the verified gateway and DNS choice

YAML spacing matters. Do not use tabs.

## Test safely before committing

Use:

~~~bash
sudo netplan generate
sudo netplan try
~~~

netplan try provides a timed rollback if the change is not confirmed. Keep the Proxmox console open because network mistakes can still interrupt remote access.

Then verify:

~~~bash
ip -brief address
ip route
ping -c 3 <gateway-address>
getent hosts example.com
~~~

From another LAN device, test:

~~~bash
ping <new-vm-address>
ssh <user>@<new-vm-address>
~~~

Use only services that are already enabled and authorised.

## Avoid duplicate IP addresses

A static address must not collide with:

- another server
- a printer or camera
- another VM or LXC
- a router reservation
- the Proxmox host
- the router itself
- the active DHCP pool

Check the router's client and reservation lists.

From a Linux device, an additional check is:

~~~bash
ping -c 3 <planned-address>
ip neigh show
~~~

No ping response does not prove an address is unused. Devices may block ping or be offline. The router's allocation records are the stronger check.

## Cloud-init warning

A cloud-init-enabled VM may regenerate network configuration.

Check:

~~~bash
cloud-init status
grep -R "network:" /etc/cloud/cloud.cfg.d /etc/cloud/cloud.cfg 2>/dev/null
~~~

If Proxmox cloud-init manages the network, update the VM's cloud-init settings rather than fighting generated files inside the guest.

Do not disable cloud-init casually; it may also manage users, SSH keys and other provisioning data.

## DNS choices

Possible DNS sources include:

- the home router
- a local Pi-hole or AdGuard Home service
- an approved public resolver

If the VM depends only on one local DNS service hosted on the same Proxmox machine, that service may be unavailable during startup or recovery. Plan a fallback according to the network's privacy and availability requirements.

## Roll back a failed guest static IP

Use the Proxmox console.

Inspect:

~~~bash
ip -brief address
ip route
sudo netplan get
sudo journalctl -b -u systemd-networkd --no-pager
~~~

Restore the saved file, using its real name:

~~~bash
sudo cp /etc/netplan/50-cloud-init.yaml.before-static /etc/netplan/50-cloud-init.yaml
sudo netplan generate
sudo netplan apply
~~~

If the guest originally used DHCP, restore dhcp4: true in the correct configuration source.

## Verification checklist

- [ ] The chosen address is unique.
- [ ] The correct VM MAC is recorded.
- [ ] The correct guest interface is configured.
- [ ] The prefix and gateway match the LAN.
- [ ] DNS resolution works.
- [ ] The VM is reachable from another LAN device.
- [ ] Required services work on the new address.
- [ ] The old address and DNS records have been cleaned up.
- [ ] The address survives a guest reboot.
- [ ] The recovery console remains available.

This is a safe planning and configuration method, not a claim that SmallGrid has tested the example address.

Next: [Proxmox VM Has No Internet: Troubleshooting Guide](/guides/proxmox-vm-no-internet-troubleshooting/).
