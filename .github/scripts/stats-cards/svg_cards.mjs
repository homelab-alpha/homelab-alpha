// SVG renderers for the profile cards.
//
// Every renderer returns a complete, standalone SVG document as a string. The
// cards only use system fonts and inline shapes, because GitHub renders SVG
// images in a sandbox without access to external resources.

import { formatDateRange, formatNumber } from "./calculations.mjs";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

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

function text(x, y, content, { size = 13, weight = 400, color, anchor = "start" }) {
  const anchorAttribute = anchor === "start" ? "" : ` text-anchor="${anchor}"`;

  return `<text x="${n(x)}" y="${n(y)}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}"${anchorAttribute}>${escapeXml(content)}</text>`;
}

function starPoints(centerX, centerY, outer, inner) {
  const points = [];

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * index - Math.PI / 2;

    points.push(`${n(centerX + radius * Math.cos(angle))},${n(centerY + radius * Math.sin(angle))}`);
  }

  return points.join(" ");
}

// Line icons on a 16 x 16 grid, drawn with the current color.
const ICONS = {
  repo: `<path d="M3 12.5V3.5A1.5 1.5 0 0 1 4.5 2H13v9H4.5A1.5 1.5 0 0 0 3 12.5Z"/><path d="M3 12.5A1.5 1.5 0 0 0 4.5 14H13"/>`,
  gist: `<path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4"/>`,
  star: `<polygon points="${starPoints(8, 8.6, 7, 2.9)}"/>`,
  commit: `<circle cx="8" cy="8" r="3"/><path d="M1 8h4M11 8h4"/>`,
  pullRequest: `<circle cx="4" cy="3.5" r="1.75"/><circle cx="4" cy="12.5" r="1.75"/><circle cx="12" cy="12.5" r="1.75"/><path d="M4 5.25v5.5M12 10.75V6a2 2 0 0 0-2-2H8.5M10 2.5 8.5 4 10 5.5"/>`,
  issue: `<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="1" fill="currentColor"/>`,
  fork: `<circle cx="4" cy="3" r="1.5"/><circle cx="12" cy="3" r="1.5"/><circle cx="8" cy="13" r="1.5"/><path d="M4 4.5v1.25A1.75 1.75 0 0 0 5.75 7.5h4.5A1.75 1.75 0 0 0 12 5.75V4.5M8 7.5v4"/>`,
};

function icon(name, x, y, color) {
  return `<g transform="translate(${n(x)} ${n(y)})" color="${color}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`;
}

// Flame drawn on a 24 x 24 grid and centered on (centerX, centerY).
function flame(centerX, centerY, size, color) {
  const scale = size / 24;

  return `<path transform="translate(${n(centerX - size / 2)} ${n(centerY - size / 2)}) scale(${n(scale)})" fill="${color}" d="M12 1.5C13.5 6 18.5 8.5 18.5 14.5a6.5 6.5 0 0 1-13 0c0-3 1.5-5 3-6.5.2 1.8 1 2.8 2.1 3C10 7.5 10.5 4.5 12 1.5Z"/>`;
}

function frame({ width, height, title, description, theme, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-labelledby="card-title card-description">
  <title id="card-title">${escapeXml(title)}</title>
  <desc id="card-description">${escapeXml(description)}</desc>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="6" stroke="${theme.border}"/>
  ${body}
</svg>
`;
}

// Repository and gist cards share one layout: title, badge, description and a
// footer with language, stars and forks.
export function renderRepositoryCard(item, theme, { descriptionLines = 3 } = {}) {
  const width = 400;
  const paddingX = 25;
  const titleSize = 18;
  const descriptionSize = 13;
  const lineHeight = 18;
  const firstLineY = 60;
  const lastLineY = firstLineY + (descriptionLines - 1) * lineHeight;
  const footerY = lastLineY + 26;
  const height = footerY + 20;

  const badgeSize = 11;
  const badgeWidth = measureText(item.badge, badgeSize) + 16;
  const titleX = paddingX + 25;
  const titleWidth = width - paddingX - badgeWidth - 12 - titleX;
  const title = truncate(item.title, titleWidth, titleSize, 600);
  const description = item.description?.trim() ? item.description : "No description provided.";
  const lines = wrapText(description, width - paddingX * 2, descriptionSize, descriptionLines);

  const parts = [
    icon(item.icon, paddingX, 20, theme.icon),
    text(titleX, 34, title, { size: titleSize, weight: 600, color: theme.title }),
    `<rect x="${n(width - paddingX - badgeWidth)}" y="19" width="${n(badgeWidth)}" height="20" rx="10" stroke="${theme.text}" stroke-opacity="0.5"/>`,
    text(width - paddingX - badgeWidth / 2, 33, item.badge, {
      size: badgeSize,
      weight: 500,
      color: theme.text,
      anchor: "middle",
    }),
    ...lines.map((line, index) =>
      text(paddingX, firstLineY + index * lineHeight, line, { size: descriptionSize, color: theme.text }),
    ),
  ];

  let cursor = paddingX;

  if (item.language) {
    parts.push(`<circle cx="${n(cursor + 6)}" cy="${n(footerY - 4)}" r="6" fill="${item.languageColor}"/>`);
    parts.push(text(cursor + 18, footerY, item.language, { size: 12, color: theme.text }));
    cursor += 18 + measureText(item.language, 12) + 22;
  }

  for (const [name, value] of [
    ["star", item.stars],
    ["fork", item.forks],
  ]) {
    const label = formatNumber(value);

    parts.push(icon(name, cursor, footerY - 12.5, theme.icon));
    parts.push(text(cursor + 21, footerY, label, { size: 12, color: theme.text }));
    cursor += 21 + measureText(label, 12) + 20;
  }

  return frame({
    width,
    height,
    title: item.title,
    description: `${item.icon === "gist" ? "Gist" : "Repository"} ${item.title}. ${description}`,
    theme,
    body: parts.join("\n  "),
  });
}

export function renderStatsCard(stats, theme, { title }) {
  const width = 440;
  const height = 195;
  const rows = [
    ["star", "Total Stars Earned", stats.stars],
    ["commit", `Total Commits (${stats.year})`, stats.commits],
    ["pullRequest", "Total PRs", stats.pullRequests],
    ["issue", "Total Issues", stats.issues],
    ["repo", "Contributed to (last year)", stats.contributedTo],
  ];

  const parts = [text(25, 35, truncate(title, width - 50, 18, 600), { size: 18, weight: 600, color: theme.title })];

  rows.forEach(([name, label, value], index) => {
    const y = 74 + index * 26;

    parts.push(icon(name, 25, y - 12.5, theme.icon));
    parts.push(text(53, y, label, { size: 14, color: theme.text }));
    parts.push(text(width - 25, y, formatNumber(value), { size: 14, weight: 600, color: theme.title, anchor: "end" }));
  });

  return frame({
    width,
    height,
    title: title,
    description: rows.map(([, label, value]) => `${label}: ${formatNumber(value)}`).join(". "),
    theme,
    body: parts.join("\n  "),
  });
}

export function renderLanguagesCard(languages, theme, { title }) {
  const width = 440;
  const paddingX = 25;
  const barWidth = width - paddingX * 2;
  const columnWidth = barWidth / 2;
  const rowCount = Math.max(1, Math.ceil(languages.length / 2));
  const height = 94 + (rowCount - 1) * 22 + 24;

  const parts = [
    text(paddingX, 35, truncate(title, barWidth, 18, 600), { size: 18, weight: 600, color: theme.title }),
    `<clipPath id="bar-clip"><rect x="${paddingX}" y="52" width="${barWidth}" height="8" rx="4"/></clipPath>`,
  ];

  let offset = paddingX;
  const segments = languages.map((language) => {
    const segmentWidth = (language.percent / 100) * barWidth;
    const segment = `<rect x="${n(offset)}" y="52" width="${n(segmentWidth)}" height="8" fill="${language.color}"/>`;

    offset += segmentWidth;
    return segment;
  });

  parts.push(`<g clip-path="url(#bar-clip)">${segments.join("")}</g>`);

  languages.forEach((language, index) => {
    const columnX = paddingX + (index % 2) * columnWidth;
    const y = 94 + Math.floor(index / 2) * 22;
    const percent = `${language.percent.toFixed(1)}%`;
    const nameWidth = columnWidth - 16 - 12 - measureText(percent, 12) - 8;

    parts.push(`<circle cx="${n(columnX + 5)}" cy="${n(y - 4)}" r="5" fill="${language.color}"/>`);
    parts.push(text(columnX + 16, y, truncate(language.name, nameWidth, 12), { size: 12, color: theme.text }));
    parts.push(
      text(columnX + columnWidth - 12, y, percent, { size: 12, weight: 600, color: theme.title, anchor: "end" }),
    );
  });

  return frame({
    width,
    height,
    title,
    description: languages.map((language) => `${language.name} ${language.percent.toFixed(1)}%`).join(", "),
    theme,
    body: parts.join("\n  "),
  });
}

function polar(centerX, centerY, radius, degrees) {
  const radians = (degrees * Math.PI) / 180;

  return [n(centerX + radius * Math.sin(radians)), n(centerY - radius * Math.cos(radians))];
}

export function renderStreakCard(streak, theme) {
  const width = 385;
  const height = 195;
  const columnWidth = width / 2;
  const leftX = columnWidth / 2;
  const rightX = columnWidth + columnWidth / 2;
  const ringY = 82;
  const ringRadius = 40;

  // The ring leaves a gap at the top where the flame sits.
  const [startX, startY] = polar(leftX, ringY, ringRadius, 32);
  const [endX, endY] = polar(leftX, ringY, ringRadius, 328);

  const rangeWidth = columnWidth - 20;
  const column = (x, value, label, range) => [
    text(x, 90, String(value), { size: 32, weight: 700, color: theme.title, anchor: "middle" }),
    text(x, 106, value === 1 ? "week" : "weeks", { size: 11, color: theme.text, anchor: "middle" }),
    text(x, 148, label, { size: 14, weight: 600, color: theme.text, anchor: "middle" }),
    text(x, 168, truncate(formatDateRange(range.start, range.end), rangeWidth, 11), {
      size: 11,
      color: theme.text,
      anchor: "middle",
    }),
  ];

  const parts = [
    `<line x1="${n(columnWidth)}" y1="28" x2="${n(columnWidth)}" y2="${height - 28}" stroke="${theme.border}"/>`,
    `<path d="M${startX} ${startY}A${ringRadius} ${ringRadius} 0 1 1 ${endX} ${endY}" stroke="${theme.ring}" stroke-width="5" stroke-linecap="round"/>`,
    flame(leftX, ringY - ringRadius, 38, theme.fire),
    ...column(leftX, streak.current.length, "Current Streak", streak.current),
    ...column(rightX, streak.longest.length, "Longest Streak", streak.longest),
  ];

  return frame({
    width,
    height,
    title: "Weekly contribution streaks",
    description: `Current streak: ${streak.current.length} weeks. Longest streak: ${streak.longest.length} weeks.`,
    theme,
    body: parts.join("\n  "),
  });
}
