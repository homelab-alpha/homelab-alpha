// SVG renderers for the profile cards.
//
// Every renderer returns a complete, standalone SVG document as a string. The
// cards only use system fonts and inline shapes, because GitHub renders SVG
// images in a sandbox without access to external resources.

import { formatDateRange, formatNumber } from "./calculations.mjs";

export const INSET = 8;

export const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

// Rounds a coordinate to two decimals to keep the output compact and stable.
function n(value) {
  return Number(value.toFixed(2));
}

export function escapeXml(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>&"']/g, (character) => {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[character];
    });
}

// Approximate glyph widths in em. SVG has no text layout, so wrapping and
// alignment rely on this estimate. The values are deliberately on the wide side
// (close to DejaVu Sans), so text stays inside the card on systems that fall
// back to a wider font than Segoe UI or Helvetica.
function glyphWidth(character) {
  const code = character.codePointAt(0);

  if (code > 0x2e80) {
    return 1.05;
  }

  if ("iIjl.,;:'!|`".includes(character)) {
    return 0.3;
  }

  if (' ftr()[]{}-/\\"'.includes(character)) {
    return 0.4;
  }

  if ("mwMW@%".includes(character)) {
    return 0.95;
  }

  if (character >= "A" && character <= "Z") {
    return 0.72;
  }

  return 0.6;
}

export function measureText(text, fontSize, weight = 400) {
  let em = 0;

  for (const character of String(text)) {
    em += glyphWidth(character);
  }

  return em * fontSize * (weight >= 600 ? 1.1 : 1);
}

export function truncate(text, maxWidth, fontSize, weight = 400) {
  const value = String(text ?? "");

  if (measureText(value, fontSize, weight) <= maxWidth) {
    return value;
  }

  const characters = Array.from(value);

  while (characters.length > 0 && measureText(`${characters.join("")}…`, fontSize, weight) > maxWidth) {
    characters.pop();
  }

  return `${characters.join("").trimEnd()}…`;
}

// Wraps text into at most maxLines lines; the last line ends with an ellipsis
// when the text does not fit.
export function wrapText(text, maxWidth, fontSize, maxLines) {
  const words = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let index = 0;

  while (index < words.length) {
    let line = words[index];
    index += 1;

    while (index < words.length && measureText(`${line} ${words[index]}`, fontSize) <= maxWidth) {
      line = `${line} ${words[index]}`;
      index += 1;
    }

    if (lines.length === maxLines - 1) {
      lines.push(truncate([line, ...words.slice(index)].join(" "), maxWidth, fontSize));
      return lines;
    }

    lines.push(truncate(line, maxWidth, fontSize));
  }

  return lines;
}

export function text(
  x,
  y,
  content,
  { size = 13, weight = 400, color, anchor = "start", family = FONT, spacing, decoration },
) {
  const anchorAttribute = anchor === "start" ? "" : ` text-anchor="${anchor}"`;
  const spacingAttribute = spacing ? ` letter-spacing="${spacing}"` : "";
  const decorationAttribute = decoration ? ` text-decoration="${decoration}"` : "";

  return `<text x="${n(x)}" y="${n(y)}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}"${anchorAttribute}${spacingAttribute}${decorationAttribute}>${escapeXml(content)}</text>`;
}

// Wraps a card of width x height pixels (without margin) in an SVG document.
// `box` draws the card border, `fill` also fills it with the tile color.
export function frame({ width, height, title, description, theme, body, box = true, fill = false, radius = 12 }) {
  const outerWidth = width + INSET * 2;
  const outerHeight = height + INSET * 2;
  const border = box
    ? `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${fill ? theme.tile : "none"}" stroke="${theme.line}"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outerWidth}" height="${outerHeight}" viewBox="0 0 ${outerWidth} ${outerHeight}" fill="none" role="img" aria-labelledby="card-title card-description">
  <title id="card-title">${escapeXml(title)}</title>
  <desc id="card-description">${escapeXml(description)}</desc>
  <g transform="translate(${INSET} ${INSET})">
  ${border}
  ${body}
  </g>
</svg>
`;
}

export const CARD_WIDTH = { full: 800, half: 392, third: 256, quarter: 188 };

// Small uppercase label, used for tile titles, badges and group names.
function label(x, y, content, { color, size = 11, anchor = "start", spacing = 0.08 }) {
  return text(x, y, content.toUpperCase(), {
    size,
    weight: 600,
    color,
    anchor,
    spacing: n(size * spacing),
  });
}

// Repository card: title, badge, description and a footer with language, stars
// and forks.
export function renderRepositoryCard(item, theme, { descriptionLines = 2 } = {}) {
  const width = CARD_WIDTH.half;
  const height = 128;
  const paddingX = 24;
  const lineHeight = 18;
  const innerWidth = width - paddingX * 2;
  const description = item.description?.trim() ? item.description : "No description provided.";
  const lines = wrapText(description, innerWidth, 13, descriptionLines);
  const badgeWidth = measureText(item.badge.toUpperCase(), 11, 600) + 8;

  const parts = [
    text(paddingX, 41, truncate(item.title, innerWidth - badgeWidth - 12, 17, 600), {
      size: 17,
      weight: 600,
      color: theme.title,
    }),
    label(width - paddingX, 40, item.badge, { color: theme.muted, anchor: "end" }),
    ...lines.map((line, index) => text(paddingX, 66 + index * lineHeight, line, { size: 13, color: theme.text })),
  ];

  const footerY = height - 22;
  let cursor = paddingX;

  if (item.language) {
    parts.push(`<circle cx="${n(cursor + 5)}" cy="${n(footerY - 4)}" r="5" fill="${item.languageColor}"/>`);
    parts.push(text(cursor + 16, footerY, item.language, { size: 12, color: theme.muted }));
    cursor += 16 + measureText(item.language, 12) + 16;
  }

  for (const [singular, value] of [
    ["star", item.stars],
    ["fork", item.forks],
  ]) {
    const content = `${formatNumber(value)} ${singular}${value === 1 ? "" : "s"}`;

    parts.push(text(cursor, footerY, content, { size: 12, color: theme.muted }));
    cursor += measureText(content, 12) + 16;
  }

  return frame({
    width,
    height,
    title: item.title,
    description: `Repository ${item.title}. ${description}`,
    theme,
    body: parts.join("\n  "),
    fill: true,
  });
}

// Wide gist card without fill: title and description on the left, counters on
// the right.
export function renderGistCard(item, theme) {
  const width = CARD_WIDTH.full;
  const height = 88;
  const paddingX = 24;
  const counters = [
    `${formatNumber(item.stars)} ${item.stars === 1 ? "star" : "stars"}`,
    `${formatNumber(item.forks)} ${item.forks === 1 ? "fork" : "forks"}`,
  ];
  const meta = [item.badge, ...counters];

  const parts = [];
  let cursor = width - paddingX;

  for (const content of [...meta].reverse()) {
    parts.push(text(cursor, 49, content, { size: 12, color: theme.muted, anchor: "end" }));
    cursor -= measureText(content, 12) + 16;
  }

  const textWidth = cursor - paddingX;
  const description = item.description?.trim() ? item.description : "No description provided.";

  parts.push(
    text(paddingX, 36, truncate(item.title, textWidth, 16, 600), { size: 16, weight: 600, color: theme.title }),
  );
  parts.push(text(paddingX, 58, truncate(description, textWidth, 13), { size: 13, color: theme.text }));

  return frame({
    width,
    height,
    title: item.title,
    description: `Gist ${item.title}. ${description}`,
    theme,
    body: parts.join("\n  "),
  });
}

export function renderStatsCard(stats, theme, { title }) {
  const width = CARD_WIDTH.half;
  const height = 316;
  const paddingX = 24;
  const rows = [
    ["Total Stars Earned", stats.stars],
    [`Total Commits (${stats.year})`, stats.commits],
    ["Total PRs", stats.pullRequests],
    ["Total Issues", stats.issues],
    ["Contributed to (last year)", stats.contributedTo],
  ];

  const parts = [
    text(paddingX, 46, truncate(title, width - paddingX * 2, 16, 600), { size: 16, weight: 600, color: theme.title }),
  ];

  rows.forEach(([name, value], index) => {
    const top = 62 + index * 42;

    parts.push(
      `<line x1="${paddingX}" y1="${top + 0.5}" x2="${width - paddingX}" y2="${top + 0.5}" stroke="${theme.line}"/>`,
      text(paddingX, top + 26, name, { size: 13, color: theme.text }),
      text(width - paddingX, top + 26, formatNumber(value), {
        size: 13,
        weight: 600,
        color: theme.title,
        anchor: "end",
      }),
    );
  });

  return frame({
    width,
    height,
    title,
    description: rows.map(([name, value]) => `${name}: ${formatNumber(value)}`).join(". "),
    theme,
    body: parts.join("\n  "),
    fill: true,
  });
}

const PANEL_HEIGHT = 150;

// Two columns: a ring with the current streak and a number for the longest.
function streakBody(streak, theme) {
  const width = CARD_WIDTH.half;
  const height = PANEL_HEIGHT;
  const columnWidth = width / 2;
  const leftX = columnWidth / 2;
  const rightX = columnWidth + columnWidth / 2;
  const rangeWidth = columnWidth - 24;

  const column = (x, name, range) => [
    text(x, 100, name, { size: 12, weight: 600, color: theme.text, anchor: "middle" }),
    text(x, 120, truncate(formatDateRange(range.start, range.end), rangeWidth, 11), {
      size: 11,
      color: theme.muted,
      anchor: "middle",
    }),
  ];

  return [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" stroke="${theme.line}"/>`,
    `<line x1="${columnWidth}" y1="0.5" x2="${columnWidth}" y2="${height - 0.5}" stroke="${theme.line}"/>`,
    `<circle cx="${leftX}" cy="52" r="29.5" stroke="${theme.text}" stroke-width="5"/>`,
    text(leftX, 60, String(streak.current.length), { size: 22, weight: 700, color: theme.title, anchor: "middle" }),
    ...column(leftX, "Current streak", streak.current),
    text(rightX, 62, String(streak.longest.length), { size: 28, weight: 700, color: theme.title, anchor: "middle" }),
    ...column(rightX, "Longest streak", streak.longest),
  ].join("\n  ");
}

// Stacked bar plus a three column legend.
function languagesBody(languages, theme, title) {
  const width = CARD_WIDTH.half;
  const height = PANEL_HEIGHT;
  const paddingX = 24;
  const barWidth = width - paddingX * 2;
  const columnWidth = (barWidth - 20) / 3 + 10;

  const parts = [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" stroke="${theme.line}"/>`,
    text(paddingX, 36, truncate(title, barWidth, 14, 600), { size: 14, weight: 600, color: theme.title }),
    `<clipPath id="bar-clip"><rect x="${paddingX}" y="50" width="${barWidth}" height="8" rx="4"/></clipPath>`,
  ];

  let offset = paddingX;
  const segments = languages.map((language) => {
    const segmentWidth = (language.percent / 100) * barWidth;
    const segment = `<rect x="${n(offset)}" y="50" width="${n(segmentWidth)}" height="8" fill="${language.color}"/>`;

    offset += segmentWidth;
    return segment;
  });

  parts.push(`<g clip-path="url(#bar-clip)">${segments.join("")}</g>`);

  languages.forEach((language, index) => {
    const x = paddingX + (index % 3) * columnWidth;
    const y = 86 + Math.floor(index / 3) * 24;

    parts.push(`<circle cx="${n(x + 4)}" cy="${n(y - 4)}" r="4" fill="${language.color}"/>`);
    parts.push(text(x + 14, y, truncate(language.name, columnWidth - 24, 11), { size: 11, color: theme.text }));
  });

  return parts.join("\n  ");
}

// Streak and language panels stacked in one image, next to the stats card.
export function renderActivitySideCard(streak, languages, theme, { title }) {
  const streakText = `Current streak: ${streak.current.length} weeks. Longest streak: ${streak.longest.length} weeks.`;
  const languageText = languages.map((language) => `${language.name} ${language.percent.toFixed(1)}%`).join(", ");

  return frame({
    width: CARD_WIDTH.half,
    height: PANEL_HEIGHT * 2 + 16,
    title: "Streaks and languages",
    description: `${streakText} ${title}: ${languageText}.`,
    theme,
    box: false,
    body: `${streakBody(streak, theme)}\n  <g transform="translate(0 ${PANEL_HEIGHT + 16})">${languagesBody(languages, theme, title)}</g>`,
  });
}
