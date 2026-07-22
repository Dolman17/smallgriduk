---
title: "Proxmox Linux Bridge Explained for Beginners"
description: "Understand what vmbr0 does, how a physical network adapter connects Proxmox guests to your home network, and how to inspect bridge settings safely."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "networking", "linux-bridge", "vmbr0", "virtual-machines", "lxc"]
---

## Quick answer

A Proxmox Linux bridge is a software network switch inside the host.

The default bridge is commonly called **vmbr0**. It connects the Proxmox management interface and guest virtual network adapters to a physical Ethernet adapter.

~~~text
Home router and LAN
        |
Physical switch or cable
        |
Physical NIC: enp3s0
        |
Linux bridge: vmbr0
   +----+---------+
   |              |
Proxmox IP     VM or LXC
192.168.0.x    virtual NIC
~~~

The physical adapter normally has no IP address of its own. The Proxmox management address belongs to vmbr0, while the physical interface is listed as the bridge port.

For the wider platform context, read [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/).

## Why Proxmox uses a bridge

A physical Ethernet socket can carry traffic for more than one guest. The Linux bridge lets those virtual network adapters share the physical connection as if they were plugged into the same network switch.

In the common bridged layout:

- the router sees each guest as a separate device
- each guest has its own MAC address
- each guest can receive its own address from DHCP
- the Proxmox host keeps its own management address
- guests can normally reach the LAN and internet without host-level NAT

This is different from giving every guest the Proxmox host's IP address.

## The parts of a basic configuration

A typical network configuration may contain:

~~~text
auto lo
iface lo inet loopback

iface enp3s0 inet manual

auto vmbr0
iface vmbr0 inet static
        address 192.168.0.128/24
        gateway 192.168.0.1
        bridge-ports enp3s0
        bridge-stp off
        bridge-fd 0
~~~

The addresses above are examples. Never paste them over a working host.

| Setting | Purpose |
|---|---|
| enp3s0 | Physical Ethernet interface |
| manual | Leaves IP configuration to the bridge |
| vmbr0 | Linux bridge name |
| address | Proxmox host management address |
| gateway | Route from this network to other networks |
| bridge-ports | Physical interface attached to the bridge |
| bridge-stp | Spanning Tree setting |
| bridge-fd | Bridge forwarding delay |

Only one interface in a simple single-network host should normally define the default gateway.

## How to inspect the live bridge

Use the Proxmox shell or local console:

~~~bash
ip -brief address
ip link show
ip route
bridge link
bridge vlan show
cat /etc/network/interfaces
~~~

Also check:

~~~bash
pvesh get /nodes/$(hostname)/network
~~~

Record the current configuration before changing anything:

~~~bash
cp /etc/network/interfaces /root/interfaces.before-network-change
~~~

The copy is only useful if local console access is available and you know how to restore it.

## How a VM attaches to vmbr0

In the web interface:

1. Select the VM.
2. Open **Hardware**.
3. Select **Network Device**.
4. Check that **Bridge** is set to vmbr0.
5. Start the guest and configure networking inside its operating system.

The Proxmox setting creates the virtual cable. The guest still needs DHCP or a valid static IP, subnet, gateway and DNS configuration.

For an LXC container, the equivalent setting appears under the container's network configuration.

## Bridge names are local to the node

vmbr0 is conventional, not magical. A host may have vmbr1, vmbr2 or a differently named bridge.

Multiple bridges can separate:

- the normal home LAN
- a private guest-only network
- a management network
- VLAN-aware traffic
- storage or cluster traffic

Do not add complexity until the single-bridge layout is understood and documented.

## Safe-change procedure

A bridge mistake can remove access to the web interface and SSH.

Before changing it:

1. Confirm physical or out-of-band console access.
2. Photograph or save the current configuration.
3. Record the physical interface name.
4. Record the management IP, prefix, gateway and DNS.
5. Check for active guests and planned downtime.
6. Make one change at a time.
7. Apply it from the Proxmox network interface where possible.
8. Test the host, gateway and another LAN device.
9. Reboot only after the live configuration works.

Do not rename the physical NIC or bridge remotely without a recovery path.

## Common misunderstandings

### The physical NIC has no address

That can be correct. Its role is to carry frames for vmbr0.

### The guest shares the host address

It should not. Host and guest require separate addresses.

### vmbr0 creates Wi-Fi

It does not. It bridges interfaces already available to Linux. Bridging through Wi-Fi client mode has additional limitations and is not a drop-in replacement for wired Ethernet.

### A second bridge automatically has internet

It does not. A bridge without a physical port can be useful for an isolated network, but routing, NAT or another gateway must be designed separately.

### Changing a VM address requires editing vmbr0

Normally it does not. Change the guest's DHCP reservation or guest operating-system configuration.

## Recovery if the web interface disappears

Use the local console.

Check:

~~~bash
ip -brief address
ip route
bridge link
cat /etc/network/interfaces
systemctl status networking
journalctl -b -u networking --no-pager
~~~

Compare the live file with the saved copy. Confirm that:

- the physical interface name exists
- it is listed under bridge-ports
- the management address is on vmbr0
- the prefix is correct
- the gateway is reachable
- the cable and switch link are active

Do not repeatedly apply random examples from the internet. Restore the known configuration or correct the single identified error.

## Verification checklist

- [ ] The physical NIC is UP.
- [ ] vmbr0 is UP.
- [ ] The Proxmox IP belongs to vmbr0.
- [ ] The physical NIC is a bridge port.
- [ ] The default route uses the correct gateway.
- [ ] Another LAN device can reach the management IP.
- [ ] A test guest receives or uses a unique address.
- [ ] Host and guest recover after a controlled reboot.
- [ ] Local-console recovery has been documented.

This guide explains the standard Proxmox model; it does not claim that SmallGrid has tested every example configuration.

Next: [How Proxmox VM Networking Works](/guides/how-proxmox-vm-networking-works/).

Official reference: [Proxmox VE host network configuration](https://pve.proxmox.com/pve-docs/chapter-sysadmin.html#sysadmin_network_configuration).
