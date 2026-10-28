// SVG renderers for the parts of the profile that do not come from the GitHub
// API: terminal, section headings, skills, connect, community, notes and
// disclaimer cards. The
// content is read from config.mjs.

import { slug } from "./calculations.mjs";
import { pickIcon } from "./icons.mjs";
import {
  CARD_WIDTH,
  FONT,
  INSET,
  MONO,
  escapeXml,
  frame,
  measureText,
  text,
  truncate,
  wrapText,
} from "./svg_cards.mjs";

// Width of one monospace character in em; a little wide on purpose.
const MONO_EM = 0.62;

// The window keeps some empty room below the last line, like a real terminal.
const TERMINAL_MIN_HEIGHT = 280;

function tspan(content, color) {
  return `<tspan fill="${color}">${escapeXml(content)}</tspan>`;
}

function monoText(x, y, spans, size = 13) {
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" xml:space="preserve">${spans.join("")}</text>`;
}

// Draws the Kali-style terminal window in card coordinates (0..800 wide) and
// returns the SVG elements plus where the last line with links sits.
function drawTerminal(terminal, theme) {
  const width = CARD_WIDTH.full;
  const paddingX = 24;
  const size = 13;
  const { user, host, directory } = terminal;

  const parts = [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="HEIGHT" rx="12" fill="${theme.tile}" stroke="${theme.line}"/>`,
    `<line x1="0" y1="36.5" x2="${width}" y2="36.5" stroke="${theme.line}"/>`,
    ...[25, 43, 61].map((x) => `<circle cx="${x}" cy="18.5" r="5" stroke="${theme.muted}"/>`),
    text(79, 22, `${user}@${host}: ${directory}`, { size: 12, color: theme.muted, family: MONO }),
  ];

  let top = 50;
  let links = null;

  terminal.blocks.forEach((block, index) => {
    if (index > 0) {
      top += 8;
    }

    parts.push(
      monoText(paddingX, top + 11, [
        tspan("┌──(", theme.red),
        tspan(user, theme.title),
        tspan("@", theme.gold),
        tspan(host, theme.blue),
        tspan(")-[", theme.red),
        tspan(directory, theme.green),
        tspan("]", theme.red),
      ]),
      monoText(paddingX, top + 27, [
        tspan("└─", theme.red),
        tspan("$", theme.gold),
        tspan(` ${block.command}`, theme.title),
      ]),
    );

    const outputY = top + 14 + 2 + 14 + 6 + 15;

    if (block.links) {
      let x = paddingX;

      links = { top: outputY - 15, items: [] };

      for (const link of block.links) {
        parts.push(text(x, outputY, link.label, { size, color: theme.blue, family: MONO, decoration: "underline" }));
        links.items.push({ ...link, x });
        x += link.label.length * size * MONO_EM + 20;
      }
    } else {
      parts.push(text(paddingX, outputY, block.output, { size, color: theme.text, family: MONO }));
    }

    top = outputY - 15 + 20;
  });

  // The window ends 22 pixels below the last line, with a minimum height.
  const height = Math.max(top + 22, TERMINAL_MIN_HEIGHT);

  return { body: parts.join("\n  ").replace("HEIGHT", String(height - 1)), height, links };
}

// One cropped view of the terminal drawing. All views use the same drawing and
// the same integer coordinates, so they line up without gaps in the README.
function terminalView(drawing, terminal, theme, { name, x0, y0, x1, y1, description }) {
  const width = x1 - x0;
  const height = y1 - y0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x0} ${y0} ${width} ${height}" fill="none" role="img" aria-labelledby="card-title card-description">
  <title id="card-title">${escapeXml(name)}</title>
  <desc id="card-description">${escapeXml(description)}</desc>
  ${drawing.body}
</svg>
`;
}

// The terminal is delivered in pieces: the window down to the last prompt, one
// clickable piece per link, and the bottom edge. An SVG image cannot hold
// links, so each link gets its own image that the README wraps in an anchor.
// Returns [{ name, svg, link? }] with names relative to the card name prefix.
export function renderTerminalParts(terminal, theme) {
  const drawing = drawTerminal(terminal, theme);
  const { height, links } = drawing;
  const edge = INSET;
  const left = -edge;
  const right = CARD_WIDTH.full + edge;
  const description = terminal.blocks
    .map(
      (block) => `${block.command}: ${block.links ? block.links.map((link) => link.label).join(", ") : block.output}`,
    )
    .join(". ");
  const title = `${terminal.user}@${terminal.host}`;

  if (!links) {
    return [
      {
        name: "terminal_top",
        svg: terminalView(drawing, terminal, theme, {
          name: title,
          x0: left,
          y0: -edge,
          x1: right,
          y1: height + edge,
          description,
        }),
      },
    ];
  }

  const linkTop = Math.round(links.top);
  const lineHeight = 20;
  const parts = [
    {
      name: "terminal_top",
      svg: terminalView(drawing, terminal, theme, {
        name: title,
        x0: left,
        y0: -edge,
        x1: right,
        y1: linkTop,
        description,
      }),
    },
  ];

  // Link pieces split halfway between two links.
  const boundaries = links.items.map((item, index) => (index === 0 ? left : Math.round(item.x - 10)));

  links.items.forEach((item, index) => {
    const x1 = index === links.items.length - 1 ? right : boundaries[index + 1];

    parts.push({
      name: `terminal_link_${slug(item.label)}`,
      link: item,
      svg: terminalView(drawing, terminal, theme, {
        name: item.label,
        x0: boundaries[index],
        y0: linkTop,
        x1,
        y1: linkTop + lineHeight,
        description: `Link: ${item.label}`,
      }),
    });
  });

  parts.push({
    name: "terminal_bottom",
    svg: terminalView(drawing, terminal, theme, {
      name: title,
      x0: left,
      y0: linkTop + lineHeight,
      x1: right,
      y1: height + edge,
      description: "Bottom edge of the terminal window",
    }),
  });

  return parts;
}

// Section heading: accent bar, uppercase label and a line to the right edge.
export function renderSectionHeading(name, theme) {
  const width = CARD_WIDTH.full;
  const y = 28;
  const content = name.toUpperCase();
  const labelWidth = measureText(content, 12, 600) + content.length * 12 * 0.12;

  return frame({
    width,
    height: 48,
    title: name,
    description: `Section: ${name}`,
    theme,
    box: false,
    body: [
      `<rect x="0" y="${y - 2}" width="24" height="4" rx="2" fill="${theme.accent}"/>`,
      text(36, y + 4, content, { size: 12, weight: 600, color: theme.title, spacing: 1.44 }),
      `<line x1="${Math.ceil(36 + labelWidth + 12)}" y1="${y + 0.5}" x2="${width}" y2="${y + 0.5}" stroke="${theme.line}"/>`,
    ].join("\n  "),
  });
}

// Card with the technologies of one group as chips. `icons` holds data URIs.
export function renderSkillGroupCard(group, icons, theme, themeName) {
  const width = CARD_WIDTH.half;
  const paddingX = 24;
  const chipHeight = 32;
  const gap = 8;
  const parts = [
    text(paddingX, 36, group.name.toUpperCase(), { size: 12, weight: 400, color: theme.muted, spacing: 0.96 }),
  ];

  let x = paddingX;
  let y = 52;

  for (const skill of group.skills) {
    const chipWidth = Math.ceil(8 + 16 + 8 + measureText(skill.name, 12) * 0.92 + 12);

    if (x + chipWidth > width - paddingX && x > paddingX) {
      x = paddingX;
      y += chipHeight + gap;
    }

    const iconData = pickIcon(icons, skill.icon, themeName);

    parts.push(
      `<rect x="${x + 0.5}" y="${y + 0.5}" width="${chipWidth - 1}" height="${chipHeight - 1}" rx="8" fill="${theme.tile}" stroke="${theme.line}"/>`,
      iconData ? `<image x="${x + 8}" y="${y + 8}" width="16" height="16" href="${iconData}"/>` : "",
      text(x + 32, y + 20, skill.name, { size: 12, color: theme.title }),
    );
    x += chipWidth + gap;
  }

  return frame({
    width,
    height: 150,
    title: group.name,
    description: `${group.name}: ${group.skills.map((skill) => skill.name).join(", ")}`,
    theme,
    body: parts.join("\n  "),
  });
}

// Link card with a name and a one line description, both underlined like a link.
export function renderConnectCard(item, theme) {
  return frame({
    width: CARD_WIDTH.third,
    height: 96,
    title: item.name,
    description: `${item.name}. ${item.description}`,
    theme,
    fill: true,
    body: [
      text(20, 38, item.name, { size: 15, weight: 600, color: theme.title, decoration: "underline" }),
      text(20, 74, item.description, { size: 12, color: theme.text, decoration: "underline" }),
    ].join("\n  "),
  });
}

// Project card with its logo, an underlined name and a short description.
export function renderCommunityCard(item, logo, theme) {
  const innerWidth = CARD_WIDTH.third - 40;
  const lines = wrapText(item.description, innerWidth, 12, 4);

  return frame({
    width: CARD_WIDTH.third,
    height: 128,
    title: item.name,
    description: `${item.name}. ${item.description}`,
    theme,
    body: [
      logo ? `<image x="20" y="16" width="16" height="16" href="${logo}"/>` : "",
      text(44, 30, truncate(item.name, innerWidth - 24, 14, 600), {
        size: 14,
        weight: 600,
        color: theme.blue,
        decoration: "underline",
      }),
      ...lines.map((line, index) => text(20, 56 + index * 18, line, { size: 12, color: theme.text })),
    ].join("\n  "),
  });
}

// Card with one bullet per note.
export function renderNotesCard(notes, theme) {
  return frame({
    width: CARD_WIDTH.full,
    height: 136,
    title: "Notes",
    description: notes.join(" "),
    theme,
    fill: true,
    body: notes
      .map((note, index) => {
        const y = 38 + index * 24;

        return `<circle cx="28" cy="${y - 4}" r="2" fill="${theme.text}"/>\n  ${text(40, y, truncate(note, CARD_WIDTH.full - 64, 14), { size: 14, color: theme.text })}`;
      })
      .join("\n  "),
  });
}

// Disclaimer card: a bold title followed by wrapped text.
export function renderDisclaimerCard(disclaimer, theme) {
  const paddingX = 24;
  const lines = wrapText(`${disclaimer.title} ${disclaimer.text}`, CARD_WIDTH.full - paddingX * 2, 12, 6);
  const height = 32 + lines.length * 18;

  const body = lines.map((line, index) => {
    const y = 16 + 13 + index * 18;

    if (index === 0 && line.startsWith(disclaimer.title)) {
      const rest = line.slice(disclaimer.title.length);

      return `<text x="${paddingX}" y="${y}" font-family="${FONT}" font-size="12" fill="${theme.muted}" xml:space="preserve"><tspan font-weight="600" fill="${theme.text}">${escapeXml(disclaimer.title)}</tspan>${escapeXml(rest)}</text>`;
    }

    return text(paddingX, y, line, { size: 12, color: theme.muted });
  });

  return frame({
    width: CARD_WIDTH.full,
    height,
    title: disclaimer.title,
    description: `${disclaimer.title} ${disclaimer.text}`,
    theme,
    body: body.join("\n  "),
  });
}
