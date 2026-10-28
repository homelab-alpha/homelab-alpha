// Loads the technology icons as data URIs, so they can be embedded in the
// skill chips. SVG images on GitHub cannot load external files.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Returns { "bash_dark.svg": "data:image/svg+xml;base64,...", ... } for every
// icon file the skills in the config can use.
export async function loadIcons(rootDirectory, config) {
  const icons = {};

  for (const group of config.skillGroups) {
    for (const skill of group.skills) {
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
