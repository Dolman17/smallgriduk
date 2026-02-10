---
title: "How Much Power Is My Homelab Using? (And What It Costs)"
description: "Measure and estimate power usage for your home server, and turn watts into monthly cost in real money."
pubDate: 2026-01-21
tags: ["power", "low-power", "homelab", "costs"]
cover: "/images/guides/power-hero.svg"
---

## Goal

Work out:

- how many **watts** your homelab actually uses
- what that means in **£/month**
- where the easiest wins are to bring it down

No spreadsheets of shame required (unless you want them).

---

## 1. The one tool that makes this easy

Get a **smart plug / power meter** that can show real-time watt usage.

Examples:

- Cheap inline watt meter with a display
- Smart plug with an app that shows W and kWh

Plug your **server or power strip** into it, then:

- note idle watts
- note watts under light load (e.g. streaming something)

---

## 2. Turning watts into £/month

You mainly care about **idle or average load**, not the absolute peak.

Let’s say:

- Idle: 18 W
- Light load average over the day: ~25 W

Rough daily kWh:

```text
W / 1000 * 24
25 / 1000 * 24 = 0.6 kWh/day
Monthly (30 days):

text
Copy code
0.6 * 30 = 18 kWh/month
If your kWh price is ~£0.30:

text
Copy code
18 * 0.30 = £5.40/month
So that small box costs you roughly the price of one takeaway side per month to run.

3. Where the power goes
Most of the baseline draw is:

CPU + chipset

RAM

drives (especially 3.5" HDDs)

fans / PSUs

Rough rules:

Spinning HDDs: 3–8 W each when spun up

SSDs / NVMe: usually <1–2 W at idle

Old desktop hardware: often 40–80 W idle

Modern mini PC / low TDP CPU: often 5–20 W idle

If you want low power:

fewer 3.5" HDDs

modern low-TDP platforms

no giant gaming GPU sitting there at 30–50 W idle

4. Quick wins for lower idle
4.1 Kill the zombie gear
Unplug / power off:

old, unused routers / switches

“temporary” extra machines that never got decommissioned

screens / monitors that stay on

Each of these might be 5–15 W of background noise.

4.2 Spin-down policies for HDDs
For bulk media drives, it can be worth setting:

HDD spin-down after X minutes of inactivity

On Linux with hdparm (careful, test first):

bash
Copy code
sudo hdparm -S 60 /dev/sdX
60 means 5 minutes in hdparm’s weird units.

Don’t go too aggressive, or you’ll just thrash the drives with spin-up/down cycles.

5. Smarter scheduling
If you run things like:

backup jobs

heavy transcoding / conversions

scrapers

Schedule them for night or specific windows, so the box spends more time at low load.

Example: cron job at 02:30 daily:

bash
Copy code
30 2 * * * /usr/local/bin/nightly-backup.sh
6. Compare options with real numbers
If you’re thinking about upgrading hardware, compare like this:

Example A: Old desktop
Idle: 65 W

Cost (30 days, £0.30/kWh):

text
Copy code
0.065 * 24 * 30 * 0.30 ≈ £14.04/month
Example B: Mini PC
Idle: 12 W

Cost:

text
Copy code
0.012 * 24 * 30 * 0.30 ≈ £2.59/month
Difference: ~£11.50/month, or ~£138/year.

Suddenly that cheap used mini PC looks a lot more attractive.

7. Recap: SmallGrid power rule
Measure, don’t guess.

Care about idle / average, not peak.

If a change saves 20–30 W 24/7, it’s probably worth doing.

Your homelab should be fun to tinker with, not a secret second energy bill.
