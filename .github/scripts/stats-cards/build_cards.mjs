// Turns collected GitHub data into SVG files. Pure: no network, no file system.

import { DEFAULT_LANGUAGE_COLOR, aggregateLanguages, computeWeeklyStreaks, slug } from "./calculations.mjs";
import { config as defaultConfig, themes } from "./config.mjs";
import { renderActivitySideCard, renderGistCard, renderRepositoryCard, renderStatsCard } from "./svg_cards.mjs";
import {
  renderCommunityCard,
  renderConnectCard,
  renderDisclaimerCard,
  renderNotesCard,
  renderSectionHeading,
  renderSkillGroupCard,
  renderTerminalParts,
} from "./static_cards.mjs";

export { slug };

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

// data: { stats, repositories, pins, gists, days, icons, logos }. Returns
// [{ name, svg }].
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
      add(`gist_${slug(gist.key)}`, renderGistCard(toGistItem(gist), theme));
    }

    add("stats", renderStatsCard(data.stats, theme, { title: config.statsTitle }));
    add("activity_side", renderActivitySideCard(streak, languages, theme, { title: config.languagesTitle }));

    for (const part of renderTerminalParts(config.terminal, theme)) {
      add(part.name, part.svg);
    }

    add("notes", renderNotesCard(config.notes, theme));
    add("disclaimer", renderDisclaimerCard(config.disclaimer, theme));

    for (const section of config.sections) {
      add(`section_${slug(section)}`, renderSectionHeading(section, theme));
    }

    for (const group of config.skillGroups) {
      add(`skills_${slug(group.name)}`, renderSkillGroupCard(group, data.icons ?? {}, theme, themeName));
    }

    for (const item of config.connect) {
      add(`connect_${slug(item.key)}`, renderConnectCard(item, theme));
    }

    for (const item of config.community) {
      add(`community_${slug(item.key)}`, renderCommunityCard(item, data.logos?.[item.logo], theme));
    }
  }

  return cards;
}
