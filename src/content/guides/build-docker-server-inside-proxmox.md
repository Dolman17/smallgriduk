---
title: "How to Build a Docker Server Inside Proxmox"
description: "Create an Ubuntu Server VM in Proxmox, install Docker Engine and Compose safely, organise application data and verify backup and reboot recovery."
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: ["proxmox", "docker", "ubuntu-server", "docker-compose", "virtual-machines"]
---

## What this guide builds

This project uses a dedicated Ubuntu Server VM:

~~~text
Proxmox
└── Ubuntu Server VM
    └── Docker Engine + Compose plugin
        └── application containers
~~~

It keeps Docker off the Proxmox host and creates a conventional Linux environment that follows Docker's official Ubuntu instructions.

Read [Run Docker in a Proxmox VM or LXC?](/guides/run-docker-proxmox-vm-or-lxc/) for the design decision and [How to Create an Ubuntu Virtual Machine](/guides/create-ubuntu-virtual-machine-proxmox/) for the VM wizard.

## Plan before creating the VM

Record:

- VM ID and name
- Ubuntu ISO version and checksum
- bridge, usually `vmbr0`
- DHCP reservation or static address plan
- CPU, memory and disk allocation
- Docker application-data path
- large-data or network-storage mounts
- backup destination and schedule

Resource sizes depend on the applications. Start modestly and monitor rather than copying an arbitrary large allocation. Proxmox can increase CPU, memory and disk later, although reducing disks is harder.

## Create the Ubuntu VM

In the Proxmox interface:

1. Select **Create VM**.
2. Give the VM a clear name such as `docker-server`.
3. Select the verified Ubuntu Server ISO.
4. Use a modern machine type and VirtIO devices where supported.
5. Place the system disk on suitable guest storage.
6. Allocate CPU and memory for the planned workload.
7. Attach the network device to `vmbr0`.
8. Review the summary before creating the VM.
9. Install Ubuntu Server and create a non-root administrator.
10. Install security updates and reboot.

Inside Ubuntu:

~~~bash
sudo apt update
sudo apt full-upgrade
sudo reboot
~~~

After reconnecting, record the address:

~~~bash
hostnamectl
ip -brief address
ip route
resolvectl status
~~~

Use a router reservation where practical, or configure a static address deliberately. See [How to Give a Proxmox VM a Static IP](/guides/give-proxmox-vm-static-ip/).

## Install Docker from the official repository

Docker's packages and repository instructions can change. Follow the current **Install Docker Engine on Ubuntu** page rather than a copied third-party script.

The official method installs Docker Engine plus the Compose plugin. After installation, verify:

~~~bash
sudo systemctl status docker --no-pager
sudo docker version
sudo docker compose version
sudo docker run --rm hello-world
~~~

Do not expose the Docker daemon over an unauthenticated TCP socket.

## Decide how administrators use Docker

Using `sudo docker` is the safer explicit default.

Adding a user to the `docker` group effectively grants root-level control of the host. If you choose that convenience, treat membership as privileged access:

~~~bash
getent group docker
~~~

Never add ordinary application users without understanding the consequence.

## Organise Compose projects

A simple layout is:

~~~text
/opt/containers/
├── app-one/
│   ├── compose.yaml
│   └── .env
└── app-two/
    ├── compose.yaml
    └── .env
~~~

Application data can live under a documented path such as `/srv/appdata`, while large media or shared files can be mounted separately.

Protect secrets:

~~~bash
sudo chown -R root:root /opt/containers
sudo find /opt/containers -name .env -exec chmod 600 {} \;
~~~

Adapt ownership if a non-root deployment account legitimately manages these files.

## Validate before starting a project

From its directory:

~~~bash
sudo docker compose config
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail=100
~~~

Pin important image versions deliberately. A floating tag can introduce an unexpected upgrade during a later pull.

## Add external storage safely

Do not make a container responsible for mounting host storage. Mount it in Ubuntu first, prove it is available, then pass the established path into Docker.

Check:

~~~bash
findmnt
df -hT
stat /path/to/data
~~~

If a mount is missing, a bind mount may silently expose an empty local directory to the container. Use systemd-aware mount dependencies or another deliberate startup check for important storage.

The SmallGrid permission guides explain the same boundary in more depth: [Jellyfin Docker Volume Paths Explained](/guides/jellyfin-docker-volume-paths-explained/) and [Jellyfin Docker Permissions](/guides/jellyfin-docker-permissions-media-folder/).

## Configure VM behaviour

In Proxmox:

- enable **Start at boot** if the services should recover automatically
- choose an appropriate startup order and delay
- install the QEMU guest agent in Ubuntu and enable it for the VM
- configure scheduled backups to independent storage
- document storage that is not included in the VM backup

Install the guest agent:

~~~bash
sudo apt install qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent
~~~

## Test recovery

Perform controlled tests:

1. Restart one container.
2. Reboot Ubuntu and verify all intended containers return.
3. Reboot Proxmox during a maintenance window.
4. Confirm the VM starts in the correct order.
5. Check external mounts before applications.
6. Confirm each service is reachable.
7. Create a backup.
8. Restore it to an isolated VM ID or network before calling recovery proven.

Useful checks:

~~~bash
systemctl --failed
systemctl is-active docker
sudo docker compose ls
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
findmnt
df -hT
~~~

## Common failures

### VM has no network

Check `vmbr0`, the VM network device, DHCP, gateway and DNS using [Proxmox VM Has No Internet](/guides/proxmox-vm-no-internet-troubleshooting/).

### Containers start before storage

Stop the affected project, restore the required mount, verify the path and then restart the project.

### Permission denied

Compare the process UID/GID with ownership on the Ubuntu host. Do not fix it with blanket `chmod 777`.

### VM disk is filling

Check Docker images, logs and volumes before deleting anything:

~~~bash
sudo docker system df -v
sudo du -xhd1 /var/lib/docker 2>/dev/null | sort -h
journalctl --disk-usage
~~~

## Verification checklist

- [ ] Docker is inside the Ubuntu VM, not on Proxmox.
- [ ] Ubuntu and Docker sources are documented.
- [ ] Compose validates without errors.
- [ ] Storage mounts exist before containers start.
- [ ] Secrets have restricted permissions.
- [ ] Required services recover after both guest and host reboots.
- [ ] Proxmox and application-aware backups are configured.
- [ ] An isolated restore has been tested.

These steps are a deployment method, not a claim that SmallGrid has completed this exact Proxmox Docker build.

Next: [How to Run Pi-hole in a Proxmox LXC Container](/guides/run-pi-hole-proxmox-lxc/). Return to [What Is Proxmox VE?](/guides/what-is-proxmox-ve-home-server/) for the cornerstone guide.

Official reference: [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/).
