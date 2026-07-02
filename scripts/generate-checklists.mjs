import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "downloads", "checklists");

const checklists = [
  {
    file: "jellyfin-media-not-showing-checklist.pdf",
    title: "Jellyfin Media Not Showing Checklist",
    subtitle: "Quick checks for empty libraries, missing files, scans, paths, mounts, and permissions.",
    sections: [
      {
        heading: "Path checks",
        items: [
          "Confirm the media folder exists on the server.",
          "Confirm the path in Jellyfin exactly matches the real Linux path.",
          "Check uppercase and lowercase letters in the path.",
          "Avoid adding a temporary mount path that disappears after reboot.",
        ],
      },
      {
        heading: "Permission checks",
        items: [
          "Run: sudo -u jellyfin ls -la /mnt/media",
          "Run the same test against movies, tv, and music subfolders.",
          "If the test shows permission denied, fix folder access before rescanning.",
          "Avoid chmod -R 777 as the first fix.",
        ],
      },
      {
        heading: "Mount and scan checks",
        items: [
          "Run findmnt or lsblk to confirm external disks or NAS shares are mounted.",
          "Reboot once and confirm the media path still contains files.",
          "Run Dashboard > Libraries > Scan All Libraries.",
          "Check recent logs for permission denied, path not found, or inaccessible mount.",
        ],
      },
    ],
  },
  {
    file: "jellyfin-folder-permissions-checklist.pdf",
    title: "Jellyfin Folder Permissions Checklist",
    subtitle: "A safe Ubuntu checklist for giving Jellyfin read access to your media folders.",
    sections: [
      {
        heading: "Confirm the Jellyfin user",
        items: [
          "Run: id jellyfin",
          "Confirm Jellyfin is running as the jellyfin user on a native Ubuntu install.",
          "Confirm your media path, for example /mnt/media.",
        ],
      },
      {
        heading: "Test access before changing anything",
        items: [
          "Run: sudo -u jellyfin ls -la /mnt/media",
          "Test each library folder separately.",
          "If the command works, permissions may not be the problem.",
          "If the command fails, fix access at the folder or mount level.",
        ],
      },
      {
        heading: "Apply safer ACL access",
        items: [
          "Install ACL support: sudo apt install -y acl",
          "Grant read/execute: sudo setfacl -R -m u:jellyfin:rx /mnt/media",
          "Set default ACL: sudo setfacl -R -d -m u:jellyfin:rx /mnt/media",
          "Restart Jellyfin and rescan the library.",
        ],
      },
    ],
  },
  {
    file: "jellyfin-docker-permissions-checklist.pdf",
    title: "Jellyfin Docker Permissions Checklist",
    subtitle: "Fix host paths, container paths, bind mounts, user IDs, and read-only media access.",
    sections: [
      {
        heading: "Path mapping checks",
        items: [
          "Find the host media path, for example /srv/media.",
          "Find the container media path, for example /media.",
          "In Jellyfin, add the container path, not the host path.",
          "Check docker-compose.yml for the exact bind mount.",
        ],
      },
      {
        heading: "Container access checks",
        items: [
          "Run: docker exec -it jellyfin bash",
          "Inside the container, run: ls -la /media",
          "If /media is empty, fix the Docker volume mount.",
          "If files appear but Jellyfin still cannot scan, check user permissions.",
        ],
      },
      {
        heading: "Safer Docker setup",
        items: [
          "Use read-only media mounts when Jellyfin only needs to read files.",
          "Example: /srv/media:/media:ro",
          "Restart with docker compose down and docker compose up -d.",
          "Check logs with docker logs --tail=100 jellyfin.",
        ],
      },
    ],
  },
  {
    file: "jellyfin-direct-play-checklist.pdf",
    title: "Jellyfin Direct Play Checklist",
    subtitle: "Reduce unnecessary transcoding by checking file formats, audio, subtitles, clients, and server settings.",
    sections: [
      {
        heading: "Playback checks",
        items: [
          "Open the Jellyfin dashboard while a file is playing.",
          "Check whether playback is direct play, direct stream, or transcoding.",
          "Read the reason Jellyfin gives for transcoding.",
          "Test the same file on a dedicated Jellyfin app, not only a browser.",
        ],
      },
      {
        heading: "Format checks",
        items: [
          "Prefer H.264 for widest 1080p compatibility.",
          "Use H.265/HEVC only where your clients support it directly.",
          "Use AAC or AC3 audio where possible.",
          "Use SRT subtitles where possible to avoid subtitle burn-in.",
        ],
      },
      {
        heading: "4K checks",
        items: [
          "Do not rely on real-time 4K software transcoding on a small server.",
          "Use clients that direct play 4K files.",
          "Avoid image-based subtitles for 4K playback.",
          "Consider keeping a separate 1080p copy for remote playback.",
        ],
      },
    ],
  },
  {
    file: "jellyfin-mini-pc-buying-checklist.pdf",
    title: "Jellyfin Mini PC Buying Checklist",
    subtitle: "A practical checklist for choosing a quiet low-power mini PC for Jellyfin.",
    sections: [
      {
        heading: "Core specs",
        items: [
          "Intel 8th gen Core i3/i5 or newer is a sensible used baseline.",
          "Intel Quick Sync is useful if you expect transcoding.",
          "8GB RAM is a minimum; 16GB is better for Docker, Proxmox, or extra services.",
          "Use an SSD for the operating system and Jellyfin metadata.",
        ],
      },
      {
        heading: "Connectivity and storage",
        items: [
          "Use wired Gigabit Ethernet where possible.",
          "Check USB 3 ports if using external media drives.",
          "Confirm whether the mini PC has space for internal storage.",
          "Make sure the power adapter is included with used systems.",
        ],
      },
      {
        heading: "Buying checks",
        items: [
          "Confirm the exact CPU model before buying.",
          "Check RAM and SSD are included or easy to upgrade.",
          "Avoid machines with locked-down BIOS settings if possible.",
          "Prioritise low idle power and quiet operation over headline CPU speed.",
        ],
      },
    ],
  },
];

function pdfEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text, maxChars = 82) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function addText(commands, text, x, y, size = 10, font = "F1") {
  commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`);
}

function addCheckbox(commands, x, y) {
  commands.push(`${x} ${y - 2} 9 9 re S`);
}

function addRule(commands, y) {
  commands.push(`48 ${y} m 548 ${y} l S`);
}

function buildPages(checklist) {
  const pages = [];
  let commands = [];
  let y = 760;

  const newPage = () => {
    if (commands.length) pages.push(commands);
    commands = [];
    y = 760;
  };

  const ensureSpace = (needed = 70) => {
    if (y < needed) newPage();
  };

  addText(commands, "SmallGrid.uk", 48, y, 11, "F2");
  y -= 30;
  addText(commands, checklist.title, 48, y, 20, "F2");
  y -= 24;
  for (const line of wrapText(checklist.subtitle, 76)) {
    addText(commands, line, 48, y, 10, "F1");
    y -= 14;
  }
  y -= 12;
  addRule(commands, y);
  y -= 30;

  for (const section of checklist.sections) {
    ensureSpace(90);
    addText(commands, section.heading, 48, y, 14, "F2");
    y -= 22;

    for (const item of section.items) {
      const lines = wrapText(item, 78);
      ensureSpace(36 + lines.length * 12);
      addCheckbox(commands, 50, y + 2);
      addText(commands, lines[0], 66, y, 10, "F1");
      y -= 13;
      for (const extraLine of lines.slice(1)) {
        addText(commands, extraLine, 66, y, 10, "F1");
        y -= 13;
      }
      y -= 6;
    }
    y -= 10;
  }

  ensureSpace(80);
  addRule(commands, y);
  y -= 22;
  addText(commands, "Related guides", 48, y, 12, "F2");
  y -= 18;
  addText(commands, "Find the full walkthroughs at https://smallgrid.uk/guides/", 48, y, 9, "F1");
  y -= 14;
  addText(commands, "Tiny tools. Solid systems.", 48, y, 9, "F1");

  if (commands.length) pages.push(commands);
  return pages;
}

function makePdf(checklist) {
  const pages = buildPages(checklist);
  const objects = [];

  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pageTreeId = addObject("PAGES_PLACEHOLDER");
  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];

  for (const pageCommands of pages) {
    const stream = `0.2 w\n${pageCommands.join("\n")}`;
    const streamId = addObject(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pageTreeId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  }

  objects[pageTreeId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return pdf;
}

await mkdir(outputDir, { recursive: true });

for (const checklist of checklists) {
  const pdf = makePdf(checklist);
  await writeFile(path.join(outputDir, checklist.file), pdf, "utf8");
  console.log(`Generated ${checklist.file}`);
}