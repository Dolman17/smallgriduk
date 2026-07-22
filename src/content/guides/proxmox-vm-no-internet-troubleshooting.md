---
title: "Proxmox VM Has No Internet: Troubleshooting Guide"
description: "Diagnose a Proxmox VM with no internet by checking the virtual NIC, vmbr0, DHCP, IP address, gateway, DNS and firewall in the correct order."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "networking", "troubleshooting", "vmbr0", "dns", "firewall"]
---

## Quick answer

Work from the VM outwards. Do not change the Proxmox bridge first.

Inside the guest, check:

~~~bash
ip -brief link
ip -brief address
ip route
resolvectl status
ping -c 3 <gateway-address>
ping -c 3 1.1.1.1
getent hosts example.com
~~~

Then check the VM's virtual network device, vmbr0, the physical link and any firewall rules.

Use [How Proxmox VM Networking Works](/guides/how-proxmox-vm-networking-works/) for the normal traffic path and [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/) for platform context.

## Read the symptom precisely

| Symptom | Likely layer |
|---|---|
| Guest interface missing | Driver or virtual hardware |
| Interface DOWN | Guest config or disconnected adapter |
| Address starts 169.254 | DHCP failure |
| Valid IP, no route | Guest network configuration |
| Gateway unreachable | Prefix, bridge, VLAN or physical network |
| Public IP works, names fail | DNS |
| Browsing works, one service fails | Application or port-specific firewall |
| Every guest and host fail | Host link, router or upstream connection |

Do not call a DNS failure "no internet" until IP connectivity has been tested separately.

## Step 1: check the Proxmox host first, without changing it

On the host:

~~~bash
ip -brief address
ip route
ping -c 3 <gateway-address>
pvesm status
~~~

If the Proxmox host itself cannot reach the gateway, the fault is broader than one VM.

Keep local-console access available before touching vmbr0.

## Step 2: check the VM network device

In the web interface:

**VM → Hardware → Network Device**

Confirm:

- a network device exists
- **Disconnect** is not enabled
- the bridge is correct, commonly vmbr0
- the VLAN tag is intentionally blank or correct
- the model is supported by the guest
- the MAC address does not duplicate another guest

From the host:

~~~bash
qm config 101
~~~

Replace 101 with the verified VM ID.

A normal line may contain bridge=vmbr0. Do not copy a MAC address from an example.

## Step 3: check the guest link

Inside the VM:

~~~bash
ip -brief link
ip -brief address
~~~

If the interface is DOWN:

~~~bash
sudo ip link set <interface> up
~~~

This is a temporary diagnostic action. Correct the persistent guest configuration afterwards.

If the interface does not appear, check the VM model and guest driver. Linux normally supports VirtIO; Windows may require the VirtIO network driver.

## Step 4: check DHCP

For a DHCP guest:

~~~bash
sudo netplan get
networkctl status
journalctl -b -u systemd-networkd --no-pager
~~~

Look for:

- DHCP disabled
- wrong interface name
- malformed Netplan YAML
- cloud-init overwriting the intended settings
- no DHCP server on the attached network
- wrong VLAN

Do not repeatedly add static addresses to hide a DHCP problem.

## Step 5: check the address and subnet

A guest on a 192.168.0.0/24 LAN might need an address such as 192.168.0.x/24. This is only an example.

Check:

~~~bash
ip address show
ip route
~~~

Common faults:

- wrong prefix
- duplicate address
- address from another subnet
- missing default route
- two competing default routes
- gateway configured as the guest's own address

For static address setup, use [How to Give a Proxmox VM a Static IP](/guides/give-proxmox-vm-static-ip/).

## Step 6: test the gateway

~~~bash
ping -c 3 <gateway-address>
ip neigh show
~~~

If the guest cannot reach the gateway but the host can:

- re-check VM bridge selection
- remove an accidental VLAN tag
- check guest prefix and address
- check duplicate IPs
- inspect guest and Proxmox firewall rules
- confirm the virtual adapter is connected

Packet capture can show whether DHCP or ARP leaves the guest:

~~~bash
tcpdump -ni vmbr0 arp or port 67 or port 68
~~~

Run captures only for focused diagnosis and stop them when finished.

## Step 7: separate internet routing from DNS

Test a public IP:

~~~bash
ping -c 3 1.1.1.1
~~~

Then test DNS:

~~~bash
getent hosts example.com
resolvectl query example.com
resolvectl status
~~~

Interpretation:

- gateway works, public IP fails: routing, router, upstream or firewall
- public IP works, hostname fails: DNS
- both work: test the actual application or service

A failed ping alone is not conclusive because some networks block ICMP. Use package-manager or HTTPS checks where appropriate.

## Step 8: check firewalls at every layer

Possible filtering points include:

- Proxmox Datacenter firewall
- Proxmox node firewall
- VM firewall
- virtual network device firewall flag
- guest firewall such as nftables or UFW
- router rules
- application access controls

Inspect before disabling anything.

Inside Ubuntu:

~~~bash
sudo ufw status verbose
sudo nft list ruleset
ss -lntup
~~~

On Proxmox, review firewall status and rule logs in the interface.

If testing requires a temporary rule, make it narrow, time-limited and reversible. Do not disable every firewall and leave it that way.

## Step 9: inspect vmbr0 only after guest checks

On the Proxmox host:

~~~bash
ip -brief address
ip link show vmbr0
bridge link
ip route
cat /etc/network/interfaces
~~~

Confirm:

- vmbr0 is UP
- the correct physical NIC is attached
- the Proxmox address is on the bridge
- the physical link is UP
- the default gateway is correct
- other guests on the same bridge behave as expected

If every guest is affected, a host bridge or upstream issue becomes more likely.

## Step 10: check service-level access

The VM may have internet while a hosted application remains unreachable.

Inside the guest:

~~~bash
ss -lntup
curl -I http://127.0.0.1:<port>
~~~

Then test the VM IP from another LAN device.

For Docker, also check:

~~~bash
docker ps
docker port <container-name>
~~~

A service listening only on 127.0.0.1 cannot normally be reached through the VM's LAN address.

## Safe recovery order

1. Preserve the current configuration and logs.
2. Restore the guest to DHCP if a static change caused the fault.
3. Remove an accidental VLAN tag.
4. Reconnect the virtual adapter.
5. Correct the guest route or DNS.
6. Restore the known VM firewall rules.
7. Change vmbr0 only when host evidence identifies it.
8. Use the local console for host networking recovery.

## Verification checklist

- [ ] Host reaches the gateway.
- [ ] VM adapter exists and is connected.
- [ ] Correct bridge and VLAN are selected.
- [ ] Guest link is UP.
- [ ] Guest has a unique valid address.
- [ ] Default route is present.
- [ ] Gateway is reachable.
- [ ] Public IP connectivity works.
- [ ] DNS resolves names.
- [ ] Required services listen on the expected address.
- [ ] All relevant firewall layers were checked.
- [ ] Connectivity survives a reboot.

This diagnostic sequence is guidance and does not claim that SmallGrid has reproduced every failure.

Next: [How to Access Proxmox Remotely with Tailscale](/guides/access-proxmox-remotely-tailscale/).
