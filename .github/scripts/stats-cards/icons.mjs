// Loads the technology icons as data URIs, so they can be embedded in the
// skill chips. SVG images on GitHub cannot load external files.

import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

// Returns { "bash_dark.svg": "data:image/svg+xml;base64,...", ... } for every
// icon file the skills in the config can use.
export async function loadIcons(rootDirectory, config) {
  const icons = {};

  const skills = config.skillGroups.flatMap((group) => group.skills);

  if (config.codeOfConduct) {
    skills.push({ icon: config.codeOfConduct.icon });
  }

  {
    for (const skill of skills) {
      for (const suffix of ["", "_dark", "_light"]) {
        const fileName = `${skill.icon}${suffix}.svg`;

        if (icons[fileName]) {
          continue;
        }

        try {
          const content = await readFile(join(rootDirectory, config.iconDirectory, fileName));

          icons[fileName] = `data:image/svg+xml;base64,${content.toString("base64")}`;
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }
    }
  }

  return icons;
}

// Picks the icon for a color scheme, falling back to the shared variant.
export function pickIcon(icons, icon, themeName) {
  return icons[`${icon}_${themeName}.svg`] ?? icons[`${icon}.svg`];
}

const MIME_TYPES = { ".svg": "image/svg+xml", ".png": "image/png" };

// Returns { "dozzle.svg": "data:image/svg+xml;base64,...", ... } for the logos
// of the community projects in the config.
export async function loadLogos(rootDirectory, config) {
  const logos = {};

  for (const item of config.community) {
    const mimeType = MIME_TYPES[extname(item.logo ?? "")];

    if (!mimeType) {
      continue;
    }

    const content = await readFile(join(rootDirectory, config.logoDirectory, item.logo));

    logos[item.logo] = `data:${mimeType};base64,${content.toString("base64")}`;
  }

  return logos;
}
