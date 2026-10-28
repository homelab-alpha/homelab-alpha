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

  // Folder with the technology icons, relative to the repository root.
  iconDirectory: "assets/icons",

  // Repositories shown as pinned cards (names without the owner).
  pinnedRepositories: ["docker", "openssl", "shell-script", "kairos"],

  // Gists shown as cards. The key is used in the output file name.
  gists: [{ key: "notifications", id: "e0f265a9c9b20ca786bce2327ce87060" }],

  // Number of description lines reserved on repository cards.
  descriptionLines: 2,

  // Statistics card.
  statsTitle: "Homelab-Alpha's GitHub Stats",

  // Top languages card.
  languagesTitle: "Most Used Languages",
  languagesCount: 6,
  excludedRepositories: [],
  excludedLanguages: [],

  // Terminal card at the top of the profile. A block with `links` prints
  // underlined links, any other block prints its `output`.
  terminal: {
    user: "homelab-alpha",
    host: "github-server",
    directory: "~",
    blocks: [
      { command: "whoami", output: "GJS" },
      { command: "cat about.txt", output: "Tech Enthusiast | Open-Source Advocate | Homelab | 🇳🇱" },
      {
        command: "ls links/",
        links: [
          { label: "GitHub", url: "https://github.com/homelab-alpha" },
          { label: "Documentation", url: "https://homelab-alpha.nl/docs" },
          { label: "Gists", url: "https://gist.github.com/homelab-alpha" },
          { label: "Website", url: "https://homelab-alpha.nl" },
        ],
      },
    ],
  },

  // Section headings, in the order they appear in the README.
  sections: ["Repositories", "Activity", "Skills", "Connect", "Community projects", "Notes"],

  // Technology chips, grouped. `icon` is the file name in the icon directory
  // without extension and color scheme suffix.
  skillGroups: [
    {
      name: "Operating systems",
      skills: [
        { name: "Debian", icon: "debian", url: "https://www.debian.org/" },
        { name: "Linux", icon: "linux", url: "https://kernel.org/" },
        { name: "Raspberry Pi", icon: "raspberrypi", url: "https://www.raspberrypi.com/" },
        { name: "Red Hat", icon: "redhat", url: "https://www.redhat.com/" },
        { name: "Ubuntu", icon: "ubuntu", url: "https://ubuntu.com/" },
      ],
    },
    {
      name: "Containers and automation",
      skills: [
        { name: "Docker", icon: "docker", url: "https://www.docker.com/" },
        { name: "GitHub Actions", icon: "githubactions", url: "https://github.com/features/actions/" },
        { name: "Bash", icon: "bash", url: "https://www.gnu.org/software/bash/" },
      ],
    },
    {
      name: "Version control",
      skills: [
        { name: "Git", icon: "git", url: "https://git-scm.com/" },
        { name: "GitHub", icon: "github", url: "https://github.com/" },
        { name: "GitLab", icon: "gitlab", url: "https://gitlab.com/" },
        { name: "Bitbucket", icon: "bitbucket", url: "https://bitbucket.org/" },
      ],
    },
    {
      name: "Editors and documentation",
      skills: [
        { name: "Visual Studio Code", icon: "vscode", url: "https://code.visualstudio.com/" },
        { name: "Microsoft Visual Studio", icon: "visualstudio", url: "https://visualstudio.microsoft.com/" },
        { name: "Markdown", icon: "markdown", url: "https://daringfireball.net/projects/markdown/" },
      ],
    },
  ],

  // Cards in the "Connect" section.
  connect: [
    {
      key: "github",
      name: "GitHub",
      description: "Contributions and repositories",
      url: "https://github.com/homelab-alpha?tab=repositories&q=&type=&language=&sort=stargazers",
    },
    {
      key: "documentation",
      name: "Documentation",
      description: "Documentation for all repositories",
      url: "https://homelab-alpha.nl/docs",
    },
    {
      key: "gists",
      name: "Gists",
      description: "Code snippets and shared utilities",
      url: "https://gist.github.com/homelab-alpha",
    },
  ],

  // Cards in the "Community projects" section.
  community: [
    {
      key: "adguard_home",
      name: "AdGuard Home",
      description: "A powerful DNS server to block ads, trackers, and improve network privacy across all devices.",
      url: "https://github.com/AdguardTeam/AdGuardHome",
    },
    {
      key: "dozzle",
      name: "Dozzle",
      description: "Real-time Docker container log viewer, fast and incredibly helpful for live debugging.",
      url: "https://github.com/amir20/dozzle",
    },
    {
      key: "freshrss",
      name: "FreshRSS",
      description:
        "A self-hosted, lightweight RSS aggregator that helps you stay up to date with your favorite feeds, without the bloat.",
      url: "https://github.com/FreshRSS/FreshRSS",
    },
    {
      key: "home_assistant_os",
      name: "Home Assistant OS",
      description: "A privacy first, open-source platform that puts your smart home automation at your fingertips.",
      url: "https://github.com/home-assistant/operating-system",
    },
    {
      key: "lotus_docs",
      name: "Lotus Docs",
      description:
        "A fast, modern, and minimal documentation theme for Hugo, perfect for technical projects and clean documentation.",
      url: "https://github.com/colinwilson/lotusdocs",
    },
    {
      key: "speedtest_tracker",
      name: "Speedtest Tracker",
      description: "A self-hosted app that logs and visualizes your internet speed using Speedtest CLI.",
      url: "https://github.com/alexjustesen/speedtest-tracker",
    },
  ],
};

// Colors per color scheme. The cards have no page background, so they blend in
// with the GitHub light and dark themes. `tile` fills the raised cards.
export const themes = {
  dark: {
    line: "#353A3F",
    tile: "#151b23",
    title: "#DFE2E6",
    text: "#AEB5BC",
    muted: "#8b949e",
    accent: "#3955CD",
    red: "#df3733",
    gold: "#bb935a",
    green: "#3fbc51",
    blue: "#398cfe",
  },
  light: {
    line: "#CFD4D9",
    tile: "#f6f8fa",
    title: "#3D4255",
    text: "#59636e",
    muted: "#6E757C",
    accent: "#3955CD",
    red: "#c4231f",
    gold: "#8a6a2e",
    green: "#1f8a34",
    blue: "#1f6fe0",
  },
};
