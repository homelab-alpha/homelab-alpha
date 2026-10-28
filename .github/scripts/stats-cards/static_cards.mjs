// SVG renderers for the parts of the profile that do not come from the GitHub
// API: terminal, section headings, skills, connect and community cards. The
// content is read from config.mjs.

import { slug } from "./calculations.mjs";
import { CARD_WIDTH, INSET, MONO, escapeXml, frame, measureText, text, truncate, wrapText } from "./svg_cards.mjs";

// Width of one monospace character in em; a little wide on purpose.
const MONO_EM = 0.62;

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

  // The window ends 22 pixels below the last line.
  const height = top + 22;

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

// Group label above a row of skill chips.
export function renderSkillGroupLabel(name, theme) {
  return frame({
    width: CARD_WIDTH.full,
    height: 24,
    title: name,
    description: `Skills: ${name}`,
    theme,
    box: false,
    body: text(0, 16, name.toUpperCase(), { size: 12, weight: 600, color: theme.muted, spacing: 0.96 }),
  });
}

// Chip with a technology icon and name. `iconData` is a data URI.
export function renderSkillChip(skill, iconData, theme) {
  const height = 32;
  const width = Math.ceil(8 + 16 + 8 + measureText(skill.name, 12) + 12);
  const image = iconData ? `<image x="8" y="8" width="16" height="16" href="${iconData}"/>` : "";

  return frame({
    width,
    height,
    title: skill.name,
    description: `Skill: ${skill.name}`,
    theme,
    radius: 8,
    fill: true,
    body: [image, text(32, 20, skill.name, { size: 12, color: theme.title })].join("\n  "),
  });
}

// Link card with a name and a one line description.
export function renderConnectCard(item, theme) {
  const innerWidth = CARD_WIDTH.third - 40;

  return frame({
    width: CARD_WIDTH.third,
    height: 96,
    title: item.name,
    description: `${item.name}. ${item.description}`,
    theme,
    fill: true,
    body: [
      text(20, 38, truncate(item.name, innerWidth, 15, 600), { size: 15, weight: 600, color: theme.title }),
      text(20, 74, truncate(item.description, innerWidth, 12), { size: 12, color: theme.text }),
    ].join("\n  "),
  });
}

export function renderCommunityCard(item, theme) {
  const innerWidth = CARD_WIDTH.third - 40;
  const lines = wrapText(item.description, innerWidth, 12, 4);

  return frame({
    width: CARD_WIDTH.third,
    height: 128,
    title: item.name,
    description: `${item.name}. ${item.description}`,
    theme,
    body: [
      text(20, 36, truncate(item.name, innerWidth, 14, 600), { size: 14, weight: 600, color: theme.blue }),
      ...lines.map((line, index) => text(20, 62 + index * 18, line, { size: 12, color: theme.text })),
    ].join("\n  "),
  });
}
