// Turns collected GitHub data into SVG files. Pure: no network, no file system.

import { DEFAULT_LANGUAGE_COLOR, aggregateLanguages, computeWeeklyStreaks } from "./calculations.mjs";
import { config as defaultConfig, themes } from "./config.mjs";
import { renderSession } from "./terminal_session.mjs";

function toRepositoryItem(repository) {
  let badge = "Public";

  if (repository.isArchived) {
    badge = "Archived";
  } else if (repository.isTemplate) {
    badge = "Template";
  }

  return {
    title: repository.name,
    description: repository.description,
    badge,
    language: repository.primaryLanguage?.name,
    languageColor: repository.primaryLanguage?.color ?? DEFAULT_LANGUAGE_COLOR,
    stars: repository.stargazerCount,
    forks: repository.forkCount,
  };
}

function toGistItem(gist) {
  const file = gist.files?.[0];

  return {
    title: file?.name ?? gist.name,
    description: gist.description,
    badge: gist.isPublic ? "Gist" : "Secret",
    language: file?.language?.name,
    languageColor: file?.language?.color ?? DEFAULT_LANGUAGE_COLOR,
    stars: gist.stargazerCount,
    forks: gist.forks?.totalCount ?? 0,
  };
}

// The terminal session for one color scheme and layout; see terminal_session.mjs.
export function buildSession(data, config, theme, { compact = false } = {}) {
  const languages = aggregateLanguages(data.repositories, {
    excludedRepositories: config.excludedRepositories,
    excludedLanguages: config.excludedLanguages,
    limit: config.languagesCount,
  });

  return renderSession(
    {
      config,
      repositories: data.pins.map(toRepositoryItem),
      gists: data.gists.map((gist) => ({
        ...toGistItem(gist),
        url: `https://gist.github.com/${config.username}/${config.gists.find((item) => item.key === gist.key)?.id ?? ""}`,
      })),
      stats: data.stats,
      languages,
      streak: computeWeeklyStreaks(data.days),
    },
    theme,
    { compact },
  );
}

// data: { stats, repositories, pins, gists, days }. Returns [{ name, svg }]:
// every piece of the terminal session, in both layouts and both color schemes.
export function buildCards(data, config = defaultConfig) {
  const cards = [];

  for (const [themeName, theme] of Object.entries(themes)) {
    for (const compact of [false, true]) {
      for (const band of buildSession(data, config, theme, { compact }).bands) {
        for (const piece of band.pieces) {
          cards.push({ name: `${piece.name}${compact ? "_compact" : ""}_${themeName}.svg`, svg: piece.svg });
        }
      }
    }
  }

  return cards;
}
