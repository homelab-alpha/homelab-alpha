// The whole profile as one terminal session: a Kali-style window in which the
// introduction, repositories, statistics, skills, links, community projects,
// notes, disclaimer and license are the output of commands.
//
// The session is drawn once and cut into horizontal bands. A band that holds a
// link is its own image, so the README can wrap it in an anchor (an SVG image
// cannot hold links); the other lines are cut into bigger bands without a link.
// The regular (800 pixels) and the compact (392 pixels) layout always have the
// same bands, so the README can use one set of <img> tags for both.

import { formatNumber } from "./calculations.mjs";
import { CARD_WIDTH, INSET, MONO, escapeXml } from "./svg_cards.mjs";

// Width of one monospace character in em; a little wide on purpose.
const MONO_EM = 0.62;

// A band is at least this high, so the line the browser reserves for an image
// (about 24 pixels) never shows a gap between two bands.
const MIN_BAND = 40;

// Percentages for a row of pieces that are cut at `shares`; they add up to 100.
export function widthsOf(shares) {
  const parts = [shares[0], ...shares.slice(1).map((share, index) => share - shares[index]), 1 - shares.at(-1)];
  const floored = parts.map((part) => Math.floor(part * 10000) / 100);
  const sum = floored.slice(0, -1).reduce((total, part) => total + part, 0);

  floored[floored.length - 1] = Math.round((100 - sum) * 100) / 100;

  return floored.map((part) => `${part}%`);
}

// Splits `**bold**` markup into words: [{ word, bold }].
function toWords(content) {
  const words = [];

  String(content)
    .split(/(\*\*[^*]+\*\*)/)
    .forEach((part) => {
      const bold = part.startsWith("**");

      for (const word of (bold ? part.slice(2, -2) : part).split(/\s+/).filter(Boolean)) {
        words.push({ word, bold });
      }
    });

  return words;
}

// Wraps words into lines of at most `maxCharacters` characters.
function wrapWords(words, maxCharacters, maxLines = Infinity) {
  const lines = [];
  let line = [];
  let length = 0;

  for (const item of words) {
    const next = length + (line.length > 0 ? 1 : 0) + item.word.length;

    if (line.length > 0 && next > maxCharacters) {
      lines.push(line);
      line = [item];
      length = item.word.length;
    } else {
      line.push(item);
      length = next;
    }
  }

  if (line.length > 0) {
    lines.push(line);
  }

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1];
    const text = last.map((item) => item.word).join(" ");

    kept[maxLines - 1] = [{ word: `${text.slice(0, Math.max(maxCharacters - 1, 1))}…`, bold: false }];

    return kept;
  }

  return lines;
}

const plain = (content, maxCharacters, maxLines) =>
  wrapWords(toWords(content.replaceAll("**", "")), maxCharacters, maxLines);

// Segments: [{ t, color?, bold?, underline? }] drawn as one text element.
function segmentsText(x, y, segments, { size, anchor = "start", color }) {
  const anchorAttribute = anchor === "start" ? "" : ` text-anchor="${anchor}"`;
  const spans = segments
    .map((segment) => {
      const attributes = [
        segment.color ? ` fill="${segment.color}"` : "",
        segment.bold ? ' font-weight="600"' : "",
        segment.underline ? ' text-decoration="underline"' : "",
      ].join("");

      return attributes
        ? `<tspan${attributes}>${escapeXml(segment.t)}</tspan>`
        : escapeXml(segment.t);
    })
    .join("");

  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${color}"${anchorAttribute} xml:space="preserve">${spans}</text>`;
}

// Words of a wrapped line as segments; bold words use the title color.
const wordSegments = (line, theme, color) =>
  line.flatMap((item, index) => [
    ...(index > 0 ? [{ t: " " }] : []),
    { t: item.word, bold: item.bold, color: item.bold ? theme.title : color },
  ]);

// data: { config, repositories, gists, stats, languages, streak }. Returns
// { bands: [{ pieces: [{ name, svg, href?, label?, alt, width }] }] }.
export function renderSession(data, theme, { compact = false } = {}) {
  const { config } = data;
  const width = compact ? CARD_WIDTH.compact : CARD_WIDTH.full;
  const pad = compact ? 16 : 24;
  const size = compact ? 12 : 13;
  const lineHeight = 19;
  const charWidth = size * MONO_EM;
  const maxCharacters = Math.floor((width - pad * 2) / charWidth);
  const { user, host } = config.terminal;
  const elements = [];
  const items = [];
  const commands = [];
  let y = 50;

  const baseline = (top, index = 0) => top + 14 + index * lineHeight;
  const add = (item) => {
    items.push(item);
  };

  // ┌──(user@host)-[dir] and └─$ command; the output starts 36 pixels lower.
  function prompt(command, directory = "~", cursor = false) {
    const segment = (parts) => segmentsText(pad, 0, parts, { size, color: theme.text });
    const upper = [
      { t: "┌──(", color: theme.red },
      { t: user, color: theme.title },
      { t: "@", color: theme.gold },
      { t: host, color: theme.blue },
      { t: ")-[", color: theme.red },
      { t: directory, color: theme.green },
      { t: "]", color: theme.red },
    ];
    const lower = [
      { t: "└─", color: theme.red },
      { t: "$", color: theme.gold },
      { t: command ? ` ${command}` : " ", color: theme.title },
    ];

    elements.push(segment(upper).replace('y="0"', `y="${y + 11}"`), segment(lower).replace('y="0"', `y="${y + 27}"`));

    if (cursor) {
      elements.push(
        `<rect x="${pad + charWidth * 4}" y="${y + 15}" width="${n(charWidth * 0.9)}" height="15" fill="${theme.text}"/>`,
      );
    }

    if (command) {
      commands.push(command);
    }

    add({ kind: "static", y0: y, y1: y + 31, alt: `$ ${command}` });
    y += 36;
  }

  // Wrapped paragraphs (each a list of word lines) without a link.
  function paragraphs(list, { color = theme.text, gap = 12, last = 14 } = {}) {
    const texts = [];
    const top = y;

    list.forEach((lines, index) => {
      lines.forEach((line, lineIndex) => {
        elements.push(segmentsText(pad, baseline(y, lineIndex), wordSegments(line, theme, color), { size, color }));
      });
      texts.push(lines.map((line) => line.map((item) => item.word).join(" ")).join(" "));
      y += lines.length * lineHeight + (index < list.length - 1 ? gap : 0);
    });

    add({ kind: "static", y0: top, y1: y, alt: texts.join(" ") });
    y += last;
  }

  // Lines made of segments, without a link.
  function staticLines(lineSpecs, alt, { last = 14 } = {}) {
    const top = y;

    lineSpecs.forEach((segments, index) => {
      elements.push(segmentsText(pad, baseline(top, index), segments, { size, color: theme.text }));
    });
    y = top + lineSpecs.length * lineHeight;
    add({ kind: "static", y0: top, y1: y, alt });
    y += last;
  }

  // The license line: one sentence with three links. The pieces are cut at the
  // same share in both layouts, so the cuts sit between the links in both.
  function sentence() {
    const parts = config.footer;
    const texts = (isCompact) => {
      if (!isCompact) {
        return parts.map((part) => part.text);
      }

      return [
        parts[0].text.replace(/\.$/, ""),
        parts[1].text.replace("Developed by ", "").replace(/\.$/, ""),
        parts[2].text.replace("Licensed under ", "").replace(/\.$/, ""),
      ];
    };
    const build = (isCompact) => {
      const separator = isCompact ? " · " : " ";
      const pieces = texts(isCompact);
      const text = pieces.join(separator);
      const links = parts.map((part, index) => {
        const start = pieces.slice(0, index).join(separator).length + (index > 0 ? separator.length : 0) + pieces[index].indexOf(part.link);

        return { start, end: start + part.link.length };
      });

      return { text, links };
    };
    const modes = [true, false].map((isCompact) => ({
      isCompact,
      layout: build(isCompact),
      size: isCompact ? 12 : 13,
      edge: (isCompact ? 16 : 24) + INSET,
      unit: isCompact ? 1 : 0.5,
    }));
    const cuts = [0, 1].map((index) => {
      const lower = Math.max(...modes.map((mode) => (mode.edge + mode.layout.links[index].end * mode.size * MONO_EM) * mode.unit)) + 2;
      const upper = Math.min(...modes.map((mode) => (mode.edge + mode.layout.links[index + 1].start * mode.size * 0.6) * mode.unit)) - 2;

      if (lower > upper) {
        throw new Error(`The license links cannot be cut apart (${lower} > ${upper}).`);
      }

      return Math.round((lower + upper) / 2);
    });
    const shares = cuts.map((cut) => cut / (CARD_WIDTH.compact + INSET * 2));
    const mine = modes.find((mode) => mode.isCompact === compact);
    const { text, links } = mine.layout;
    const segments = [];
    let at = 0;

    links.forEach((range, index) => {
      segments.push({ t: text.slice(at, range.start) }, link(text.slice(range.start, range.end)));
      at = range.end;
    });
    segments.push({ t: text.slice(at) });

    const top = y;
    const total = width + INSET * 2;

    elements.push(segmentsText(pad, baseline(top, 0), segments, { size, color: theme.text }));

    const bottom = top + 32;

    add({
      kind: "inline",
      y0: top,
      y1: bottom,
      shares,
      cells: parts.map((part) => ({ href: part.url, label: part.label, alt: part.text })),
      cuts: shares.map((share) => Math.round(share * total) - INSET),
    });
    y = bottom + 16;
  }

  // Output of `ls -lah` for the home directory (sizes follow the real content).
  function listing() {
    const bytes = (text) => Buffer.byteLength(text, "utf8");
    const human = (value) => (value < 1024 ? `${value}` : `${(value / 1024).toFixed(1)}K`).padStart(4);
    const entries = [
      [".", "d", 4096],
      ["..", "d", 4096],
      ["about.md", "f", bytes(config.intro.join("\n\n"))],
      ["activity", "d", 4096],
      ["community", "d", 4096],
      ["connect", "d", 4096],
      ["DISCLAIMER", "f", bytes(`${config.disclaimer.title} ${config.disclaimer.text}`)],
      ["gists", "d", 4096],
      ["LICENSE", "f", bytes(config.footer.map((item) => item.text).join("\n"))],
      [config.motto.file, "f", bytes(`${config.motto.text}\n`)],
      ["notes.txt", "f", bytes(config.notes.join("\n"))],
      ["repos", "d", 4096],
      ["skills", "d", 4096],
    ];
    const specs = [[muted(`total ${entries.length * 4}`)]];

    for (const [name, type, value] of entries) {
      const directory = type === "d";
      const group = compact ? "" : ` ${user}`;
      const date = compact ? "" : " Jan  1";

      specs.push([
        muted(`${directory ? "drwxr-xr-x" : "-rw-r--r--"} ${directory ? 2 : 1} ${user}${group} ${human(value)}${date} `),
        directory ? { t: name, color: theme.blue, bold: true } : { t: name, color: theme.title },
      ]);
    }

    staticLines(specs, `Home directory: ${entries.map(([name]) => name).join(", ")}.`);
  }

  // A vim window (read-only): numbered raw lines, `~` filler, status line and
  // the command line. `paragraphs` are raw strings, so markdown shows as typed.
  function vim(fileName, texts) {
    const gutter = 4;
    const columns = maxCharacters - gutter;
    const top = y;
    const rows = [];
    let logical = 0;

    texts.forEach((text, index) => {
      const lines = wrapWords(text.split(/\s+/).filter(Boolean).map((word) => ({ word, bold: false })), columns);

      logical += 1;
      lines.forEach((line, lineIndex) => rows.push({ number: lineIndex === 0 ? logical : null, line }));

      if (index < texts.length - 1) {
        logical += 1;
        rows.push({ number: logical, line: [] });
      }
    });

    rows.forEach((row, index) => {
      const segments = [{ t: row.number === null ? "    " : String(row.number).padStart(3) + " ", color: theme.gold }];

      row.line.forEach((item, wordIndex) => {
        segments.push({ t: wordIndex > 0 ? ` ${item.word}` : item.word, color: item.word.includes("**") ? theme.title : theme.text, bold: item.word.includes("**") });
      });
      elements.push(segmentsText(pad, baseline(top, index), segments, { size, color: theme.text }));
    });

    let row = rows.length;

    for (let filler = 0; filler < 2; filler += 1) {
      elements.push(segmentsText(pad, baseline(top, row), [{ t: "~", color: theme.blue }], { size, color: theme.text }));
      row += 1;
    }

    const barTop = top + row * lineHeight + 4;

    elements.push(
      `<rect x="${pad - 8}" y="${barTop}" width="${width - pad * 2 + 16}" height="${lineHeight}" rx="3" fill="${theme.line}"/>`,
      segmentsText(pad, barTop + 14, [{ t: `${fileName} [RO]`, color: theme.title }], { size, color: theme.title }),
      segmentsText(width - pad, barTop + 14, [{ t: "1,1   All", color: theme.title }], { size, anchor: "end", color: theme.title }),
      segmentsText(
        pad,
        barTop + lineHeight + 14,
        [{ t: ":q", color: theme.title }],
        { size, color: theme.title },
      ),
    );

    y = barTop + lineHeight * 2 + 2;
    add({ kind: "static", y0: top, y1: y, alt: texts.join(" ") });
    y += 14;
  }

  // Output of `less`: the text and the reverse-video "(END)" bar.
  function less(fileName, lines) {
    const top = y;

    lines.forEach((line, index) => {
      elements.push(segmentsText(pad, baseline(top, index), [{ t: line.map((word) => word.word).join(" ") }], { size, color: theme.text }));
    });

    const barTop = top + lines.length * lineHeight + 4;

    elements.push(
      `<rect x="${pad - 8}" y="${barTop}" width="${n(charWidth * (fileName.length + 6) + 16)}" height="${lineHeight}" rx="3" fill="${theme.line}"/>`,
      segmentsText(pad, barTop + 14, [{ t: `${fileName} (END)`, color: theme.title }], { size, color: theme.title }),
    );
    y = barTop + lineHeight + 2;
    add({ kind: "static", y0: top, y1: y, alt: lines.map((line) => line.map((word) => word.word).join(" ")).join(" ") });
    y += 14;
  }

  // A vim window (read-only): numbered raw lines, `~` filler, status line and
  // the command line. `paragraphs` are raw strings, so markdown shows as typed.
  function vim(fileName, texts) {
    const gutter = 4;
    const columns = maxCharacters - gutter;
    const top = y;
    const rows = [];
    let logical = 0;

    texts.forEach((text, index) => {
      const lines = wrapWords(text.split(/\s+/).filter(Boolean).map((word) => ({ word, bold: false })), columns);

      logical += 1;
      lines.forEach((line, lineIndex) => rows.push({ number: lineIndex === 0 ? logical : null, line }));

      if (index < texts.length - 1) {
        logical += 1;
        rows.push({ number: logical, line: [] });
      }
    });

    rows.forEach((row, index) => {
      const segments = [{ t: row.number === null ? "    " : String(row.number).padStart(3) + " ", color: theme.gold }];

      row.line.forEach((item, wordIndex) => {
        segments.push({ t: wordIndex > 0 ? ` ${item.word}` : item.word, color: item.word.includes("**") ? theme.title : theme.text, bold: item.word.includes("**") });
      });
      elements.push(segmentsText(pad, baseline(top, index), segments, { size, color: theme.text }));
    });

    let row = rows.length;

    for (let filler = 0; filler < 2; filler += 1) {
      elements.push(segmentsText(pad, baseline(top, row), [{ t: "~", color: theme.blue }], { size, color: theme.text }));
      row += 1;
    }

    const barTop = top + row * lineHeight + 4;

    elements.push(
      `<rect x="${pad - 8}" y="${barTop}" width="${width - pad * 2 + 16}" height="${lineHeight}" rx="3" fill="${theme.line}"/>`,
      segmentsText(pad, barTop + 14, [{ t: `${fileName} [RO]`, color: theme.title }], { size, color: theme.title }),
      segmentsText(width - pad, barTop + 14, [{ t: "1,1   All", color: theme.title }], { size, anchor: "end", color: theme.title }),
      segmentsText(
        pad,
        barTop + lineHeight + 14,
        [{ t: ":q", color: theme.title }],
        { size, color: theme.title },
      ),
    );

    y = barTop + lineHeight * 2 + 2;
    add({ kind: "static", y0: top, y1: y, alt: texts.join(" ") });
    y += 14;
  }

  // Output of `less`: the text and the reverse-video "(END)" bar.
  function less(fileName, lines) {
    const top = y;

    lines.forEach((line, index) => {
      elements.push(segmentsText(pad, baseline(top, index), [{ t: line.map((word) => word.word).join(" ") }], { size, color: theme.text }));
    });

    const barTop = top + lines.length * lineHeight + 4;

    elements.push(
      `<rect x="${pad - 8}" y="${barTop}" width="${n(charWidth * (fileName.length + 6) + 16)}" height="${lineHeight}" rx="3" fill="${theme.line}"/>`,
      segmentsText(pad, barTop + 14, [{ t: `${fileName} (END)`, color: theme.title }], { size, color: theme.title }),
    );
    y = barTop + lineHeight + 2;
    add({ kind: "static", y0: top, y1: y, alt: lines.map((line) => line.map((word) => word.word).join(" ")).join(" ") });
    y += 14;
  }

  // Output of `neofetch`: header, key/value rows and the color palette.
  function neofetch() {
    const { stats, languages } = data;
    const top = y;
    const rows = [
      ["User", config.terminal.blocks[0].output],
      ["Role", config.terminal.blocks[1].output.split("|")[0].trim()],
      ["Repos", `${data.repositories.length} pinned`],
      ["Stars", formatNumber(stats.stars)],
      ["Languages", languages.slice(0, 3).map((language) => language.name).join(", ")],
      ["Shell", "zsh"],
      ["Editor", "vim"],
    ];
    const specs = [
      [{ t: user, color: theme.title, bold: true }, { t: "@", color: theme.gold }, { t: host, color: theme.blue, bold: true }],
      [muted("-".repeat(user.length + host.length + 1))],
      ...rows.map(([key, value]) => [{ t: key, color: theme.blue, bold: true }, { t: `: ${value}`, color: theme.text }]),
    ];

    specs.forEach((segments, index) => {
      elements.push(segmentsText(pad, baseline(top, index), segments, { size, color: theme.text }));
    });

    const paletteTop = top + specs.length * lineHeight + 8;

    [theme.red, theme.gold, theme.green, theme.blue, theme.title, theme.muted].forEach((color, index) => {
      elements.push(`<rect x="${pad + index * 22}" y="${paletteTop}" width="22" height="14" fill="${color}"/>`);
    });

    y = paletteTop + 14;
    add({ kind: "static", y0: top, y1: y, alt: `${user}@${host}. ${rows.map(([key, value]) => `${key}: ${value}`).join(". ")}.` });
    y += 14;
  }

  // Output of `tree -L 2` for the skills.
  function tree() {
    const specs = [[{ t: ".", color: theme.blue, bold: true }]];
    let files = 0;

    config.skillGroups.forEach((group, groupIndex) => {
      const lastGroup = groupIndex === config.skillGroups.length - 1;

      specs.push([
        muted(lastGroup ? "└── " : "├── "),
        { t: group.name.toLowerCase().replaceAll(" ", "-"), color: theme.blue, bold: true },
      ]);

      group.skills.forEach((skill, skillIndex) => {
        const lastSkill = skillIndex === group.skills.length - 1;

        files += 1;
        specs.push([
          muted(`${lastGroup ? "    " : "│   "}${lastSkill ? "└── " : "├── "}`),
          { t: skill.name, color: theme.title },
        ]);
      });
    });

    specs.push([]);
    specs.push([muted(`${config.skillGroups.length} directories, ${files} files`)]);

    staticLines(
      specs,
      config.skillGroups.map((group) => `${group.name}: ${group.skills.map((skill) => skill.name).join(", ")}`).join(". "),
    );
  }

  // A block of lines that is one link. `lineSpecs` are segment lists.
  function linkBlock(lineSpecs, { href, label, alt }) {
    const top = y;

    lineSpecs.forEach((segments, index) => {
      elements.push(segmentsText(pad, baseline(top, index), segments, { size, color: theme.text }));
    });

    const bottom = top + Math.max(lineSpecs.length * lineHeight, 32);

    add({ kind: "link", y0: top, y1: bottom, href, label, alt });
    y = bottom + 16;
  }

  const link = (t) => ({ t, color: theme.blue, underline: true });
  const muted = (t) => ({ t, color: theme.muted });
  const bold = (t) => ({ t, color: theme.title, bold: true });

  // --- the session -------------------------------------------------------
  {
    // The Unix epoch: Thursday, January 1, 1970, at 00:00:00 UTC.
    const login = `Last login: Thu Jan  1 00:00:00 1970${compact ? "" : " from 192.168.1.1"}`;

    staticLines([[muted(login)]], login, { last: 12 });
  }

  prompt("whoami");
  paragraphs([[[{ word: config.terminal.blocks[0].output, bold: false }]]]);

  prompt(`cat ${config.motto.file}`);
  paragraphs([plain(config.motto.text, maxCharacters)]);

  prompt("ls -lah");
  listing();

  prompt("vim -R about.md");
  vim("about.md", config.intro);

  prompt("cd repos");
  prompt("gh repo list --pinned", "~/repos");

  for (const item of data.repositories) {
    const description = plain(item.description?.trim() || "No description provided.", maxCharacters - 2, 3);

    linkBlock(
      [
        [
          bold(item.title),
          muted(" · "),
          { t: item.language ?? "n/a", color: item.languageColor ?? theme.text },
          muted(` · ${formatNumber(item.stars)} stars · ${formatNumber(item.forks)} forks`),
        ],
        ...description.map((line) => [muted(`  ${line.map((word) => word.word).join(" ")}`)]),
      ],
      {
        href: `https://github.com/${config.username}/${item.title}`,
        label: `${item.title} repository`,
        alt: `${item.title}. ${item.description ?? ""}`,
      },
    );
  }

  linkBlock([[muted("Code of conduct: "), link(config.codeOfConduct.label)]], {
    href: config.codeOfConduct.url,
    label: "Read the Contributor Covenant Code of Conduct",
    alt: `Code of conduct: ${config.codeOfConduct.label}`,
  });

  prompt("cd ../gists", "~/repos");
  prompt("gh gist list", "~/gists");

  for (const item of data.gists) {
    const description = plain(item.description?.trim() || "No description provided.", maxCharacters - 2, 3);

    linkBlock(
      [
        [bold(item.title), muted(` · ${formatNumber(item.stars)} stars · ${formatNumber(item.forks)} forks`)],
        ...description.map((line) => [muted(`  ${line.map((word) => word.word).join(" ")}`)]),
      ],
      { href: item.url, label: `Gist ${item.title}`, alt: `Gist ${item.title}. ${item.description ?? ""}` },
    );
  }

  prompt("cd ../activity", "~/gists");
  prompt(`gh stats --user ${config.username} --year ${data.stats.year}`, "~/activity");

  {
    const { stats, streak, languages } = data;
    const rows = [
      ["Total Stars Earned", formatNumber(stats.stars)],
      [`Total Commits (${stats.year})`, formatNumber(stats.commits)],
      ["Total PRs", formatNumber(stats.pullRequests)],
      ["Total Issues", formatNumber(stats.issues)],
      ["Contributed to (last year)", formatNumber(stats.contributedTo)],
      ["Current streak", `${streak.current.length} weeks`],
      ["Longest streak", `${streak.longest.length} weeks`],
    ];
    const top = y;

    rows.forEach(([name, value], index) => {
      const rowY = baseline(top + index * 24);

      elements.push(
        segmentsText(pad, rowY, [{ t: name }], { size, color: theme.text }),
        segmentsText(width - pad, rowY, [{ t: value, bold: true, color: theme.title }], {
          size,
          anchor: "end",
          color: theme.text,
        }),
        `<line x1="${pad}" y1="${rowY + 6.5}" x2="${width - pad}" y2="${rowY + 6.5}" stroke="${theme.line}" stroke-dasharray="2 3"/>`,
      );
    });

    y = top + rows.length * 24 + 6;

    const barWidth = width - pad * 2;
    let offset = pad;

    elements.push(`<clipPath id="session-bar"><rect x="${pad}" y="${y}" width="${barWidth}" height="8" rx="4"/></clipPath>`);
    elements.push(
      `<g clip-path="url(#session-bar)">${languages
        .map((language) => {
          const segmentWidth = (language.percent / 100) * barWidth;
          const rect = `<rect x="${n(offset)}" y="${y}" width="${n(segmentWidth)}" height="8" fill="${language.color}"/>`;

          offset += segmentWidth;
          return rect;
        })
        .join("")}</g>`,
    );
    y += 22;

    // Legend: language names in their own color, wrapped over lines.
    const entries = languages.map((language) => ({ text: `${language.name} ${language.percent.toFixed(0)}%`, color: language.color }));
    const legendLines = [];
    let current = [];
    let length = 0;

    for (const entry of entries) {
      const next = length + (current.length > 0 ? 2 : 0) + entry.text.length;

      if (current.length > 0 && next > maxCharacters) {
        legendLines.push(current);
        current = [entry];
        length = entry.text.length;
      } else {
        current.push(entry);
        length = next;
      }
    }

    if (current.length > 0) {
      legendLines.push(current);
    }

    legendLines.forEach((line, index) => {
      elements.push(
        segmentsText(
          pad,
          baseline(y, index),
          line.flatMap((entry, entryIndex) => [...(entryIndex > 0 ? [{ t: "  " }] : []), { t: entry.text, color: entry.color }]),
          { size, color: theme.text },
        ),
      );
    });

    const alt = `${rows.map(([name, value]) => `${name} ${value}`).join(". ")}. Languages: ${entries.map((entry) => entry.text).join(", ")}.`;

    add({ kind: "static", y0: top, y1: y + legendLines.length * lineHeight, alt });
    y += legendLines.length * lineHeight + 14;
  }

  prompt("cd ../skills", "~/activity");
  prompt("tree -L 2", "~/skills");
  tree();

  prompt("cd ../connect", "~/skills");
  prompt("head -n 1 *", "~/connect");

  for (const item of config.connect) {
    linkBlock(
      [
        [{ t: "==> ", color: theme.muted }, link(item.key), { t: " <==", color: theme.muted }],
        ...plain(item.description, maxCharacters).map((line) => [muted(line.map((word) => word.word).join(" "))]),
      ],
      { href: item.url, label: item.name, alt: `${item.name}. ${item.description}` },
    );
  }

  prompt("cd ../community", "~/connect");
  prompt("cat README.md", "~/community");
  paragraphs([plain(config.communityText[0], maxCharacters)]);

  prompt("head -n 1 projects/*", "~/community");

  for (const item of config.community) {
    linkBlock(
      [
        [{ t: "==> ", color: theme.muted }, link(item.key.replaceAll("_", "-")), { t: " <==", color: theme.muted }],
        ...plain(item.description, maxCharacters, 4).map((line) => [muted(line.map((word) => word.word).join(" "))]),
      ],
      { href: item.url, label: `${item.name} repository page`, alt: `${item.name}. ${item.description}` },
    );
  }

  prompt("tail -n 1 README.md", "~/community");

  {
    const lines = plain(config.communityText[1], maxCharacters - 2);
    const top = y;

    elements.push(
      `<path transform="translate(${pad} ${top + 3})" d="M5 0 6.5 3.5 10 3.8 7.3 6.2 8.2 10 5 8 1.8 10 2.7 6.2 0 3.8 3.5 3.5Z" fill="${theme.gold}"/>`,
    );
    lines.forEach((line, index) => {
      elements.push(
        segmentsText(pad + 16, baseline(top, index), [{ t: line.map((word) => word.word).join(" "), color: theme.muted }], { size, color: theme.text }),
      );
    });
    add({ kind: "static", y0: top, y1: top + lines.length * lineHeight, alt: config.communityText[1] });
    y = top + lines.length * lineHeight + 14;
  }

  prompt("cd ~", "~/community");
  prompt("cat -n notes.txt", "~");
  paragraphs(config.notes.map((note, index) => plain(`${index + 1}  ${note}`, maxCharacters)), { gap: 4 });

  prompt("less DISCLAIMER");
  less("DISCLAIMER", plain(`${config.disclaimer.title} ${config.disclaimer.text}`, maxCharacters));

  prompt("cat LICENSE");
  sentence();

  prompt("history | tail -n 5");
  {
    const list = commands.slice(-5);

    staticLines(
      list.map((command, index) => [muted(`${String(1000 + commands.length - list.length + index + 1).padStart(5)}  `), { t: command, color: theme.text }]),
      `History: ${list.join(", ")}.`,
    );
  }

  prompt("", "~", true);

  const height = y + 4;

  // --- cut the drawing into bands ----------------------------------------
  const middle = (first, second) => Math.round((first.y1 + second.y0) / 2);
  const bands = [];
  let start = -INSET;
  let index = 0;

  while (index < items.length) {
    const item = items[index];

    if (item.kind === "static") {
      let last = index;

      while (last + 1 < items.length && items[last + 1].kind === "static") {
        last += 1;
      }

      const end = last + 1 < items.length ? middle(items[last], items[last + 1]) : height + INSET;

      bands.push({
        kind: "static",
        y0: start,
        y1: end,
        alt: items
          .slice(index, last + 1)
          .map((entry) => entry.alt)
          .join(" "),
      });
      start = end;
      index = last + 1;
    } else {
      const end = index + 1 < items.length ? middle(item, items[index + 1]) : height + INSET;

      bands.push({ ...item, y0: start, y1: end });
      start = end;
      index += 1;
    }
  }

  const frame = [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" fill="${theme.tile}" stroke="${theme.line}"/>`,
    `<line x1="0" y1="36.5" x2="${width}" y2="36.5" stroke="${theme.line}"/>`,
    ...[25, 43, 61].map((x) => `<circle cx="${x}" cy="18.5" r="5" stroke="${theme.muted}"/>`),
    segmentsText(79, 22, [{ t: `${user}@${host}: ~`, color: theme.muted }], { size: 12, color: theme.muted }),
  ];
  const drawing = [...frame, ...elements].join("\n  ");
  const view = (title, description, x0, y0, x1, y1) => {
    const viewWidth = x1 - x0;
    const viewHeight = y1 - y0;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${viewHeight}" viewBox="${x0} ${y0} ${viewWidth} ${viewHeight}" preserveAspectRatio="none" fill="none" role="img" aria-labelledby="card-title card-description">
  <title id="card-title">${escapeXml(title)}</title>
  <desc id="card-description">${escapeXml(description)}</desc>
  ${drawing}
</svg>
`;
  };

  const result = bands.map((band, bandIndex) => {
    if (band.y1 - band.y0 < MIN_BAND) {
      throw new Error(`Terminal band ${bandIndex} is only ${band.y1 - band.y0} pixels high.`);
    }

    const name = `session_${bandIndex + 1}`;

    if (band.kind === "inline") {
      const edges = [-INSET, ...band.cuts, width + INSET];
      const percentages = widthsOf(band.shares);

      return {
        pieces: band.cells.map((cell, cellIndex) => ({
          name: `${name}_${cellIndex + 1}`,
          svg: view(cell.label, cell.alt ?? cell.label, edges[cellIndex], band.y0, edges[cellIndex + 1], band.y1),
          href: cell.href,
          label: cell.label,
          alt: cell.alt ?? cell.label,
          width: percentages[cellIndex],
        })),
      };
    }

    return {
      pieces: [
        {
          name,
          svg: view(band.alt ?? name, band.alt ?? name, -INSET, band.y0, width + INSET, band.y1),
          href: band.href,
          label: band.label,
          alt: band.alt ?? "",
          width: "100%",
        },
      ],
    };
  });

  return { bands: result, height };
}

function n(value) {
  return Number(value.toFixed(2));
}
