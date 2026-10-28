// Turns collected GitHub data into SVG files. Pure: no network, no file system.

import { DEFAULT_LANGUAGE_COLOR, aggregateLanguages, computeWeeklyStreaks, slug } from "./calculations.mjs";
import { config as defaultConfig, themes } from "./config.mjs";
import { renderSession } from "./terminal_session.mjs";
import { renderActivitySideCard, renderGistCard, renderRepositoryCard, renderStatsCard } from "./svg_cards.mjs";
import {
  renderLinkCard,
  renderDisclaimerCard,
  renderCommunityTextCard,
  renderFooterParts,
  renderIntroCard,
  renderNotesCard,
  renderBadgeHeading,
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
      add(`gist_${slug(gist.key)}_compact`, renderGistCard(toGistItem(gist), theme, { compact: true }));
    }

    add("stats", renderStatsCard(data.stats, theme, { title: config.statsTitle }));
    add("activity_side", renderActivitySideCard(streak, languages, theme, { title: config.languagesTitle }));

    for (const part of renderTerminalParts(config.terminal, theme)) {
      add(part.name, part.svg);
    }

    for (const part of renderTerminalParts(config.terminal, theme, { compact: true })) {
      add(`${part.name}_compact`, part.svg);
    }

    add("intro", renderIntroCard(config.intro, theme));
    add("intro_compact", renderIntroCard(config.intro, theme, { compact: true }));

    for (const compact of [false, true]) {
      const suffix = compact ? "_compact" : "";

      add(`community_text${suffix}`, renderCommunityTextCard(config.communityText, theme, { compact }));

      for (const part of renderFooterParts(config.footer, theme, { compact })) {
        add(`${part.name}${suffix}`, part.svg);
      }
    }

    for (const compact of [false, true]) {
      for (const band of buildSession(data, config, theme, { compact }).bands) {
        for (const piece of band.pieces) {
          add(`${piece.name}${compact ? "_compact" : ""}`, piece.svg);
        }
      }
    }

    add("notes", renderNotesCard(config.notes, theme));
    add("notes_compact", renderNotesCard(config.notes, theme, { compact: true }));
    add("disclaimer", renderDisclaimerCard(config.disclaimer, theme));
    add("disclaimer_compact", renderDisclaimerCard(config.disclaimer, theme, { compact: true }));

    for (const section of config.sections) {
      if (section === config.codeOfConduct?.section) {
        for (const compact of [false, true]) {
          const options = { compact };

          for (const part of renderBadgeHeading(section, config.codeOfConduct, data.icons ?? {}, theme, themeName, options)) {
            add(compact ? `${part.name}_compact` : part.name, part.svg);
          }
        }

        continue;
      }

      add(`section_${slug(section)}`, renderSectionHeading(section, theme));
      add(`section_${slug(section)}_compact`, renderSectionHeading(section, theme, { compact: true }));
    }

    for (const group of config.skillGroups) {
      add(`skills_${slug(group.name)}`, renderSkillGroupCard(group, data.icons ?? {}, theme, themeName));
    }

    for (const item of config.connect) {
      add(`connect_${slug(item.key)}`, renderLinkCard(item, null, theme));
      add(`connect_${slug(item.key)}_compact`, renderLinkCard(item, null, theme, { compact: true }));
    }

    for (const item of config.community) {
      add(`community_${slug(item.key)}`, renderLinkCard(item, data.logos?.[item.logo], theme));
      add(
        `community_${slug(item.key)}_compact`,
        renderLinkCard(item, data.logos?.[item.logo], theme, { compact: true }),
      );
    }
  }

  return cards;
}
