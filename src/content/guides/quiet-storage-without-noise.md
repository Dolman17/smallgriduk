Here’s a full pasteover for
`src/content/guides/quiet-storage-without-noise.md`
in the same style as your other upgraded guides:

```markdown
---
title: "Quiet Storage: Add Disks Without Turning Your Home Into a Datacentre"
description: "How to expand storage quietly: enclosures, placement, power, and why vibration is the real villain."
pubDate: 2026-01-20
tags: ["storage", "nas", "quiet", "low-power"]
---

## Goal

Add more storage to your homelab **without**:

- turning your office into a white-noise generator  
- filling the room with annoying hums and rattles  
- accidentally cooking your drives  

Quiet storage is mostly about **vibration, airflow, and placement** — not magic hardware.

---

## Why storage gets loud (the real enemies)

There are three main culprits:

1. **Vibration**  
   Spinning drives are basically tiny wobble machines. When that vibration couples into:
   - thin metal cases  
   - cheap desks  
   - floorboards  

   …you get hums, rattles, and “why is it buzzing at 2am?”.

2. **Heat**  
   Drives and CPUs get hot → fans spin faster → everything gets louder.  
   Restricted airflow or dust usually makes this much worse.

3. **Resonance**  
   Certain surfaces and cases have “bad frequencies” where even small vibrations get amplified.
   That’s why just moving the same box to a different shelf sometimes makes it dramatically quieter.

---

## Step 1: baseline your current noise

Before you change anything, get a feel for the “before”.

- Put your ear near the case and listen:  
  - is it mostly **whoosh** (fans)?  
  - or **brrrrr / rattling** (drives + vibration)?
- Gently press on the case side or top:
  - if the noise drops when you press, it’s **vibration** coupling into the case

You can also check drive temps to see if fans are working too hard.

<div class="terminal">
  <div class="terminal__bar">
    <div class="terminal__dots">
      <span class="terminal__dot red"></span>
      <span class="terminal__dot amber"></span>
      <span class="terminal__dot green"></span>
    </div>
    <div class="terminal__title">Check drive temperatures (smartctl)</div>
  </div>

  <pre><code>$ sudo smartctl -A /dev/sdX | grep -i temperature    # replace sdX with your drive

# Example output line:
# 194 Temperature_Celsius     0x0022   035  050  000    25 (Min/Max 20/45)</code></pre>
</div>

If your drives sit somewhere in the **mid-20s to mid-30s °C** most of the time, you’re usually fine.
If they’re living in the 40s+ constantly, fans may be working extra hard to keep up.

---

## Step 2: decouple and dampen (cheap, big win)

This is the fastest way to drop perceived noise without buying new hardware.

**Simple wins:**

- Put the box on something that absorbs vibration:
  - rubber feet  
  - a mouse mat  
  - a dense foam pad  
- Avoid hollow or resonant surfaces:
  - thin IKEA desks are louder than solid wood or a sturdy shelf  
- Move the box:
  - lower shelves often sound quieter than at ear height  
  - avoid corners where sound bounces

If an external drive/enclosure rattles, try:

- laying it flat vs standing it upright  
- putting it on a bit of foam or rubber  
- moving it off the desk and onto a different, more solid surface  

Tiny changes here can be surprisingly effective.

---

## Step 3: drive choices that don’t scream

If you’re expanding storage, pick drives that aren’t naturally noisy:

- Prefer **5400–5900 RPM** drives for bulk storage  
- Avoid mixing a single loud 7200 RPM drive in an otherwise quiet box  
- Use NAS/“quiet” lines where possible; they’re often tuned for lower vibration

And, for sanity and reliability:

- Stick to **CMR** drives for general NAS use  
- Avoid cheap, high-capacity **SMR** drives for constant-write workloads (they can get hot, slow, and sad)

You don’t have to replace everything you own — just avoid making new noise with the next purchase.

---

## Step 4: external storage strategies (that stay quiet)

Three common options that fit the SmallGrid vibe:

### 4.1 Single-drive USB enclosure

- **Pros:** cheap, simple, easy to move  
- **Cons:** usually one drive, quality of enclosure matters for noise  

Good for:

- media storage  
- backing up another box  
- putting the noisy bit somewhere else (another room / cupboard)

### 4.2 DAS (direct-attached storage)

- Multiple drives, one cable  
- Connects via USB/Thunderbolt to your server  

Quietness depends on:

- drive selection  
- internal dampening  
- fan quality (if it has fans)

You can put the DAS a little further away from your ears than the main box.

### 4.3 NAS (self-contained network storage)

- Sits somewhere else on your network  
- Can live in a hallway / cupboard / spare room  

This is often the best “my office is too loud” solution:

- your main workstation can stay almost silent  
- the noisy spinning bits live in a different physical place

---

## Step 5: spin behaviour and power (careful tuning)

Drives don’t need to be spinning 24/7 for light home use.
But aggressive spin-down settings can cause more problems than they solve.

**Principles:**

- Avoid spindown timers shorter than ~10–20 minutes  
- Too frequent spin-up/down cycles can **wear drives faster** and sound worse  
- For always-in-use workloads (active NAS), it’s often better to keep drives spinning gently

If you want to experiment, you can use `hdparm` — but be conservative and document what you change.

Example (check spindown setting):

~~~bash
sudo hdparm -B -S /dev/sdX
~~~

> If you don’t fully understand what a value does, don’t set it.  
> Spindown tuning is “optional advanced mode”, not required for quiet.

A safer first step is making sure **unneeded services** aren’t constantly touching the disk:

- noisy or chatty logging  
- indexing services  
- badly configured monitoring  

Reducing pointless disk activity often lowers both power and noise.

---

## Step 6: airflow and fan curves (without cooking drives)

Quieter storage also comes from **not needing fans to scream**.

- Keep intake and exhaust vents clear  
- Clean dust filters regularly  
- Make sure cables aren’t blocking front-to-back airflow  

If your BIOS or fan controller supports it, set a **reasonable fan curve**:

- fans idle slower at low temps  
- ramp up only when drives/CPU cross a sensible threshold  

You’re aiming for:

- **drives** mostly in the 25–40 °C range  
- **fans** spending most of their life at lower duty cycles

Don’t chase silence to the point where everything is roasting. Quiet and cool can coexist.

---

## Example quiet layouts (SmallGrid-style)

A few practical patterns that work well:

### Layout A — Desk-friendly box

- Mini PC / NUC on the desk  
- Single USB enclosure with a large 5400 RPM drive  
- Both sitting on a rubber mat  

Result: your homelab is **nearby, but not buzzing**.

---

### Layout B — NAS in the hallway

- NAS with 2–4 drives in a cupboard or hallway  
- Main PC or mini server in your office, mostly SSD-only  
- Networked over wired Ethernet  

Result: all the “spinny, clicky” stuff lives **outside** the room you care about.

---

### Layout C — DAS under the stairs

- Proxmox / main server with SSD-only internal storage  
- Multi-bay DAS or external enclosure under the stairs / in a side room  
- Mounted over USB or Thunderbolt to the server  

Result: you get big storage and decent performance, but the noise is **off-axis from your ears**.

---

## SmallGrid rule

If the storage upgrade makes you dread being in the same room as your server, it’s not an upgrade.

Start with:

- decoupling and damping  
- better placement  
- cooler, smoother airflow  

Then only spend money where it actually makes the experience quieter, not just the spec sheet longer.  
```
