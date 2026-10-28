// Pure helpers: aggregation, streak calculation and number/date formatting.
// Nothing in this file touches the network or the file system.

export const DEFAULT_LANGUAGE_COLOR = "#8B949E";

const numberFormat = new Intl.NumberFormat("en-US");
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function formatNumber(value) {
  return numberFormat.format(value ?? 0);
}

export function addDays(dateString, amount) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

// GitHub contribution calendars start their weeks on Sunday.
export function startOfWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  return addDays(dateString, -date.getUTCDay());
}

export function formatDateRange(start, end) {
  if (!start || !end) {
    return "No streak yet";
  }

  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);

  if (start === end) {
    return longDate.format(startDate);
  }

  if (startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
    return `${shortDate.format(startDate)} – ${longDate.format(endDate)}`;
  }

  return `${longDate.format(startDate)} – ${longDate.format(endDate)}`;
}

function emptyStreak() {
  return { length: 0, start: null, end: null };
}

// Calculates weekly streaks from daily contribution counts.
//
// A week counts when it holds at least one contribution. The current week is
// still in progress, so it only extends the current streak when it already has
// a contribution; an empty current week does not break the streak yet.
//
// days: [{ date: "YYYY-MM-DD", count: number }] in any order.
export function computeWeeklyStreaks(days) {
  const weeks = new Map();

  for (const { date, count } of days) {
    const key = startOfWeek(date);
    const week = weeks.get(key) ?? { start: key, count: 0, firstActive: null, lastActive: null };

    week.count += count;

    if (count > 0) {
      if (!week.firstActive || date < week.firstActive) {
        week.firstActive = date;
      }

      if (!week.lastActive || date > week.lastActive) {
        week.lastActive = date;
      }
    }

    weeks.set(key, week);
  }

  const ordered = [...weeks.values()].sort((a, b) => (a.start < b.start ? -1 : 1));

  let longest = emptyStreak();
  let run = null;
  let previous = null;

  for (const week of ordered) {
    const isNextWeek = previous !== null && week.start === addDays(previous.start, 7);

    if (week.count > 0) {
      run =
        run && isNextWeek
          ? { length: run.length + 1, start: run.start, end: week.lastActive }
          : { length: 1, start: week.firstActive, end: week.lastActive };

      // On a tie the most recent streak wins.
      if (run.length >= longest.length) {
        longest = { ...run };
      }
    } else {
      run = null;
    }

    previous = week;
  }

  let current = emptyStreak();
  let index = ordered.length - 1;

  if (index >= 0 && ordered[index].count === 0) {
    index -= 1;
  }

  while (index >= 0 && ordered[index].count > 0) {
    const week = ordered[index];

    current = {
      length: current.length + 1,
      start: week.firstActive,
      end: current.end ?? week.lastActive,
    };

    const older = ordered[index - 1];

    if (!older || older.start !== addDays(week.start, -7)) {
      break;
    }

    index -= 1;
  }

  return { current, longest };
}

export function sumStars(repositories) {
  return repositories.reduce((total, repository) => total + (repository.stargazerCount ?? 0), 0);
}

// Combines the language sizes of all repositories and returns the largest
// ones. Percentages are relative to the languages that are returned, so they
// add up to 100.
export function aggregateLanguages(
  repositories,
  { excludedRepositories = [], excludedLanguages = [], limit = 6 } = {},
) {
  const skippedRepositories = new Set(excludedRepositories.map((name) => name.toLowerCase()));
  const skippedLanguages = new Set(excludedLanguages.map((name) => name.toLowerCase()));
  const totals = new Map();

  for (const repository of repositories) {
    if (skippedRepositories.has(repository.name.toLowerCase())) {
      continue;
    }

    for (const { size, node } of repository.languages?.edges ?? []) {
      if (skippedLanguages.has(node.name.toLowerCase())) {
        continue;
      }

      const entry = totals.get(node.name) ?? {
        name: node.name,
        color: node.color ?? DEFAULT_LANGUAGE_COLOR,
        size: 0,
      };

      entry.size += size;
      totals.set(node.name, entry);
    }
  }

  const top = [...totals.values()].sort((a, b) => b.size - a.size || a.name.localeCompare(b.name)).slice(0, limit);
  const total = top.reduce((sum, language) => sum + language.size, 0);

  return top.map((language) => ({ ...language, percent: total > 0 ? (language.size / total) * 100 : 0 }));
}

// "shell-script" -> "shell_script", used for file names.
export function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
