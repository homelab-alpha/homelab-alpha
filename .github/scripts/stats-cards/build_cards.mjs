// Turns collected GitHub data into SVG files. Pure: no network, no file system.

import { DEFAULT_LANGUAGE_COLOR, aggregateLanguages, computeWeeklyStreaks } from "./calculations.mjs";
import { config as defaultConfig, themes } from "./config.mjs";
import { renderLanguagesCard, renderRepositoryCard, renderStatsCard, renderStreakCard } from "./svg_cards.mjs";

// "shell-script" -> "shell_script", used for file names.
export function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toRepositoryItem(repository) {
  let badge = "Public";

  if (repository.isArchived) {
    badge = "Archived";
  } else if (repository.isTemplate) {
    badge = "Template";
  }

  return {
    icon: "repo",
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
    icon: "gist",
    title: file?.name ?? gist.name,
    description: gist.description,
    badge: gist.isPublic ? "Gist" : "Secret",
    language: file?.language?.name,
    languageColor: file?.language?.color ?? DEFAULT_LANGUAGE_COLOR,
    stars: gist.stargazerCount,
    forks: gist.forks?.totalCount ?? 0,
  };
}

// data: { stats, repositories, pins, gists, days }. Returns [{ name, svg }].
export function buildCards(data, config = defaultConfig) {
  const languages = aggregateLanguages(data.repositories, {
    excludedRepositories: config.excludedRepositories,
    excludedLanguages: config.excludedLanguages,
    limit: config.languagesCount,
  });
  const streak = computeWeeklyStreaks(data.days);
  const cards = [];

  for (const [themeName, theme] of Object.entries(themes)) {
    const add = (name, svg) => cards.push({ name: `${name}_${themeName}.svg`, svg });
    const options = { descriptionLines: config.descriptionLines };

    for (const repository of data.pins) {
      add(`pin_${slug(repository.name)}`, renderRepositoryCard(toRepositoryItem(repository), theme, options));
    }

    for (const gist of data.gists) {
      add(`gist_${slug(gist.key)}`, renderRepositoryCard(toGistItem(gist), theme, options));
    }

    add("stats", renderStatsCard(data.stats, theme, { title: config.statsTitle }));
    add("streak", renderStreakCard(streak, theme));
    add("top_languages", renderLanguagesCard(languages, theme, { title: config.languagesTitle }));
  }

  return cards;
}
