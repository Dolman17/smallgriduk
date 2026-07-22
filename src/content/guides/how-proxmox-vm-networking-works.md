---
title: "How Proxmox VM Networking Works"
description: "Learn how a Proxmox virtual NIC, vmbr0, DHCP, gateways and DNS work together, with a simple path for checking each networking layer."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "networking", "virtual-machines", "vmbr0", "dhcp", "dns"]
---

## Quick answer

A Proxmox VM normally connects to the home network through a virtual network adapter attached to a Linux bridge.

~~~text
Application in VM
        |
Guest IP configuration
        |
Virtual NIC: net0
        |
Proxmox bridge: vmbr0
        |
Physical NIC
        |
Router, LAN and internet
~~~

Proxmox provides the virtual adapter and connection to the bridge. The guest operating system controls its own IP address, gateway, DNS and firewall.

Start with [Proxmox Linux Bridge Explained](/guides/proxmox-linux-bridge-explained/) and the [Proxmox beginner cornerstone](/guides/what-is-proxmox-ve-home-server/).

## The five networking layers

| Layer | Example | Where to check |
|---|---|---|
| Physical | Cable, switch and NIC | Proxmox node |
| Bridge | vmbr0 | Proxmox network settings |
| Virtual adapter | net0, VirtIO | VM Hardware |
| Guest network | DHCP or static IP | Inside the VM |
| Service | SSH, web server, Docker port | Guest and application |

Troubleshooting is faster when these layers are checked in order.

## The Proxmox virtual network device

Open:

**VM → Hardware → Network Device**

Important fields include:

- **Bridge:** commonly vmbr0
- **Model:** commonly VirtIO for modern supported guests
- **MAC address:** the guest's virtual hardware address
- **VLAN tag:** blank on a simple untagged home network
- **Firewall:** connects the adapter to Proxmox firewall processing when enabled
- **Disconnect:** deliberately removes the virtual link

VirtIO generally provides efficient virtual networking, but the guest must have a compatible driver. Linux normally does. Windows may need VirtIO drivers.

## DHCP: the simplest starting point

With DHCP, the guest asks the normal home router for its network details.

The router normally supplies:

- an IP address
- subnet or prefix
- default gateway
- DNS servers
- lease duration

Inside an Ubuntu guest, inspect the result:

~~~bash
ip -brief address
ip route
resolvectl status
~~~

A working example might show:

~~~text
ens18    UP    192.168.0.150/24
default via 192.168.0.1 dev ens18
~~~

These are examples, not values to copy.

## What the gateway does

The gateway is the router used to reach destinations outside the guest's local subnet.

A guest may reach another 192.168.0.x device without a working default gateway, yet fail to reach the internet.

Check:

~~~bash
ip route
ping -c 3 192.168.0.1
~~~

Replace the example gateway with the verified router address.

## What DNS does

DNS converts names such as example.com into IP addresses.

A guest can have working network connectivity but appear offline when DNS is broken.

Separate the tests:

~~~bash
ping -c 3 1.1.1.1
getent hosts example.com
resolvectl status
~~~

Using a public address for a diagnostic ping does not mean it should become the permanent DNS server.

## How traffic reaches the VM

On a normal bridged network, the VM appears as another LAN device.

~~~text
Laptop 192.168.0.20 ----+
Proxmox 192.168.0.128 ---+--- Home router
VM 192.168.0.150 --------+
~~~

The laptop connects to the VM's address, not the Proxmox host's address.

If a web service listens on port 8080 inside the VM, the LAN URL is normally:

~~~text
http://VM-IP:8080
~~~

Docker port publishing, the guest firewall and the application listener must still allow the connection.

## Check a VM from the Proxmox host

Find the VM configuration:

~~~bash
qm list
qm config 101
~~~

Replace 101 with the verified VM ID.

Look for a line similar to:

~~~text
net0: virtio=...,bridge=vmbr0
~~~

Check the bridge:

~~~bash
ip link show vmbr0
bridge link
ip route
~~~

Do not edit the VM configuration file by hand merely to test connectivity.

## Check from inside the guest

Run:

~~~bash
ip -brief link
ip -brief address
ip route
resolvectl status
ping -c 3 <gateway-address>
getent hosts example.com
ss -lntup
~~~

Interpretation:

| Result | Likely area |
|---|---|
| Interface DOWN | Guest config or disconnected virtual NIC |
| No IP address | DHCP or guest configuration |
| IP but no gateway | Guest route |
| Gateway works, public IP fails | Router, upstream or firewall |
| Public IP works, names fail | DNS |
| VM can browse, service unreachable | Listener or firewall |

## DHCP reservation versus guest static IP

A DHCP reservation is often the simplest home-server choice.

The router assigns the same address to the VM's MAC address, while the guest remains configured for DHCP.

Advantages:

- central address management
- less chance of an address conflict
- gateway and DNS updates stay automatic
- easy rollback to ordinary DHCP

A static configuration inside the guest can also work, but it must be outside the router's dynamic allocation pool or explicitly excluded.

The next guide covers both approaches.

## VLANs and multiple bridges

A VLAN tag should not be added just because the option exists.

It only works when the bridge, physical switch and router are configured for the same VLAN design. A wrong tag can make the guest appear completely disconnected.

Similarly, attaching a VM to an isolated bridge may intentionally provide no gateway or internet.

Record the intended network before troubleshooting it as a fault.

## Safe change and recovery

Before changing the host bridge remotely:

- keep a local console available
- save the existing host configuration
- change one layer at a time
- avoid changing the host and guest simultaneously
- test access from a second device
- keep the old IP until the new path is proven

A VM networking mistake normally affects one guest. A vmbr0 mistake can affect the entire host and every guest.

## Verification checklist

- [ ] The physical host link is active.
- [ ] vmbr0 is UP.
- [ ] The VM adapter is connected to the intended bridge.
- [ ] The guest interface is UP.
- [ ] The guest has a unique address and correct prefix.
- [ ] The default gateway is present.
- [ ] The gateway responds.
- [ ] DNS resolves a hostname.
- [ ] The intended service is listening.
- [ ] Guest and Proxmox firewall rules were checked.
- [ ] Connectivity survives a guest reboot.

This is general guidance based on the Proxmox networking model, not a claim of a completed SmallGrid VM network test.

Next: [How to Give a Proxmox VM a Static IP](/guides/give-proxmox-vm-static-ip/).

Official reference: [Proxmox VE QEMU network device options](https://pve.proxmox.com/pve-docs/qm.1.html).
