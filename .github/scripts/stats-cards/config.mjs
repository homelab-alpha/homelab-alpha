// Configuration for the self-hosted profile cards.
//
// Everything that is specific to this profile lives here, so the generator
// itself stays generic. Output file names are derived from the keys below.

export const config = {
  // GitHub account the statistics are collected for.
  username: "homelab-alpha",

  // Branch that receives the generated SVG files, and the folder inside it.
  branch: "stats",
  outputDirectory: "cards",

  // Repositories shown as pinned cards (names without the owner).
  pinnedRepositories: ["docker", "openssl", "shell-script", "kairos"],

  // Gists shown as cards. The key is used in the output file name.
  gists: [{ key: "notifications", id: "e0f265a9c9b20ca786bce2327ce87060" }],

  // Number of description lines reserved on repository and gist cards.
  descriptionLines: 3,

  // Statistics card.
  statsTitle: "Homelab-Alpha's GitHub Stats",

  // Top languages card.
  languagesTitle: "Most Used Languages",
  languagesCount: 6,
  excludedRepositories: [],
  excludedLanguages: [],
};

// Colors per color scheme. Background is transparent on purpose, so the cards
// blend in with the GitHub light and dark themes.
export const themes = {
  dark: {
    border: "#353A3F",
    title: "#DFE2E6",
    text: "#AEB5BC",
    icon: "#3955CD",
    ring: "#AEB5BC",
    fire: "#3955CD",
  },
  light: {
    border: "#CFD4D9",
    title: "#3D4255",
    text: "#6E757C",
    icon: "#3955CD",
    ring: "#6E757C",
    fire: "#3955CD",
  },
};
