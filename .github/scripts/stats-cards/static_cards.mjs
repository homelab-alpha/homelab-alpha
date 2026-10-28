// SVG renderers for the parts of the profile that do not come from the GitHub
// API: terminal, section headings, skills, connect, community and notes. The
// content is read from config.mjs.

import { CARD_WIDTH, MONO, escapeXml, frame, measureText, text, truncate, wrapText } from "./svg_cards.mjs";

// Width of one monospace character in em; a little wide on purpose.
const MONO_EM = 0.62;

function tspan(content, color) {
  return `<tspan fill="${color}">${escapeXml(content)}</tspan>`;
}

function monoText(x, y, spans, size = 13) {
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" xml:space="preserve">${spans.join("")}</text>`;
}

// Kali-style terminal window.
export function renderTerminalCard(terminal, theme) {
  const width = CARD_WIDTH.full;
  const paddingX = 24;
  const size = 13;
  const { user, host, directory } = terminal;

  const parts = [
    `<line x1="0" y1="36.5" x2="${width}" y2="36.5" stroke="${theme.line}"/>`,
    ...[25, 43, 61].map((x) => `<circle cx="${x}" cy="18.5" r="5" stroke="${theme.muted}"/>`),
    text(79, 22, `${user}@${host}: ${directory}`, { size: 12, color: theme.muted, family: MONO }),
  ];

  let top = 50;

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

      for (const link of block.links) {
        parts.push(text(x, outputY, link.label, { size, color: theme.blue, family: MONO, decoration: "underline" }));
        x += link.label.length * size * MONO_EM + 20;
      }
    } else {
      parts.push(text(paddingX, outputY, block.output, { size, color: theme.text, family: MONO }));
    }

    top = outputY - 15 + 20;
  });

  // The window ends 22 pixels below the last line.
  const height = top + 22;

  return frame({
    width,
    height,
    title: `${user}@${host}`,
    description: terminal.blocks
      .map(
        (block) => `${block.command}: ${block.links ? block.links.map((link) => link.label).join(", ") : block.output}`,
      )
      .join(". "),
    theme,
    body: parts.join("\n  "),
    fill: true,
  });
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

export function renderNotesCard(notes, theme) {
  return frame({
    width: CARD_WIDTH.full,
    height: 136,
    title: "Notes",
    description: notes.join(" "),
    theme,
    fill: true,
    body: notes
      .map((note, index) =>
        text(24, 38 + index * 24, truncate(note, CARD_WIDTH.full - 48, 14), { size: 14, color: theme.text }),
      )
      .join("\n  "),
  });
}
