// Configuration for the self-hosted profile cards.
//
// Everything that is specific to this profile lives here, so the generator
// itself stays generic. The README shows the profile as one terminal session;
// the generator cuts that session into the SVG pieces the README embeds.

export const config = {
  // GitHub account the statistics are collected for.
  username: "homelab-alpha",

  // Branch that receives the generated SVG files, and the folder inside it.
  branch: "stats",
  outputDirectory: "cards",

  // Repositories listed by `gh repo list --pinned` (names without the owner).
  pinnedRepositories: ["docker", "openssl", "shell-script", "kairos"],

  // Gists listed in the session. The id is used for the link.
  gists: [{ key: "notifications", id: "e0f265a9c9b20ca786bce2327ce87060" }],

  // Languages shown in the activity output.
  languagesCount: 6,
  excludedRepositories: [],
  excludedLanguages: [],

  // Prompt of the terminal session. The output of the first two blocks is
  // printed as the name and the role (the part before the first `|`).
  terminal: {
    user: "homelab-alpha",
    host: "github",
    blocks: [
      { command: "whoami", output: "GJS" },
      { command: "cat about.txt", output: "Tech Enthusiast | Open-Source Advocate | Homelab | 🇳🇱" },
    ],
  },

  // The motto is shown as a file in the terminal session.
  motto: { file: "motto.js", text: "eat(); sleep(); code(); repeat();" },

  // Introduction (about.md). Text between ** is printed bold.
  intro: [
    "Welcome to **Homelab-Alpha**! I'm GJS, a tech enthusiast who loves automation, infrastructure, and creative problem solving. My homelab is my playground: a place to test emerging technologies, fine-tune configurations, and keep finding ways to make my setup smarter and more efficient.",
    "I'm a strong believer in open source and self-hosting. My goal is to make technology more accessible and more robust for everyone. Whether I'm streamlining deployments, hardening environments, or squeezing out a little more performance, I'm always chasing a better solution.",
    "I enjoy tackling complex architecture and automating the mundane. From trying the latest gadgets to deep dives into advanced builds, I'm at my best when I'm tinkering under the hood.",
    "My repositories cover the pillars of modern self-hosting: automation, security, and system optimization. You'll find everything from Dockerized applications and OpenSSL setups to monitoring tools like Uptime Kuma, each built to power your own home lab. Have a look around, and feel free to collaborate!",
  ],

  // Text around the community projects; the second line gets a star.
  communityText: [
    "I regularly draw inspiration from the open-source community. Here are some standout projects worth checking out:",
    "Found them interesting? Show your support by giving them a star!",
  ],

  // License line in three clickable pieces. `link` is the part of the text
  // that looks like a link.
  footer: [
    {
      text: "© Homelab-Alpha 2024.",
      link: "Homelab-Alpha",
      url: "https://homelab-alpha.nl",
      label: "Go to the Homelab-Alpha homepage",
    },
    {
      text: "Developed by GJS.",
      link: "GJS",
      url: "https://github.com/homelab-alpha",
      label: "Visit the Homelab-Alpha GitHub page",
    },
    {
      text: "Licensed under CC BY-NC-SA 4.0.",
      link: "CC BY-NC-SA 4.0",
      url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      label: "Read more about the CC BY-NC-SA 4.0 license",
    },
  ],

  // Skills, grouped; printed as the output of `tree -L 2`.
  skillGroups: [
    {
      name: "Operating systems",
      skills: [
        { name: "Debian" },
        { name: "Linux" },
        { name: "Raspberry Pi" },
        { name: "Red Hat" },
        { name: "Ubuntu" },
      ],
    },
    {
      name: "Containers and automation",
      skills: [{ name: "Docker" }, { name: "GitHub Actions" }, { name: "Bash" }],
    },
    {
      name: "Version control",
      skills: [{ name: "Git" }, { name: "GitHub" }, { name: "GitLab" }, { name: "Bitbucket" }],
    },
    {
      name: "Editors and documentation",
      skills: [{ name: "Visual Studio Code" }, { name: "Microsoft Visual Studio" }, { name: "Markdown" }],
    },
  ],

  // Links in the `connect` directory.
  connect: [
    {
      key: "github",
      name: "GitHub",
      description: "Latest contributions and repositories",
      url: "https://github.com/homelab-alpha?tab=repositories&q=&type=&language=&sort=stargazers",
    },
    {
      key: "documentation",
      name: "Documentation",
      description: "Docs for all repositories",
      url: "https://homelab-alpha.nl/docs",
    },
    {
      key: "gists",
      name: "GitHub Gist",
      description: "Code snippets and shared utilities",
      url: "https://gist.github.com/homelab-alpha",
    },
  ],

  // Links in the `community` directory.
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

  // Lines of notes.txt.
  notes: [
    "I'm always open to contributing to open-source projects. Feel free to reach out!",
    "Having issues with one of my repositories? Don't hesitate to ask for help!",
    "Follow me for more exciting projects and updates!",
    "Remember to enjoy the process and have fun along the way!",
  ],

  // Disclaimer shown at the bottom of the session.
  disclaimer: {
    title: "Disclaimer.",
    text: 'The content on the Homelab-Alpha website and Homelab-Alpha GitHub repositories is based on my personal experience and is provided "as-is." Use it at your own discretion and risk. For further details, please refer to the following sections in the repository: README, CODE OF CONDUCT, CONTRIBUTING, CODE STYLE AND STANDARDS GUIDES, SECURITY, and LICENSE.',
  },
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
    line: "#C3C9CF",
    tile: "#eaeef2",
    title: "#3D4255",
    text: "#59636e",
    muted: "#656C73",
    accent: "#3955CD",
    red: "#c4231f",
    gold: "#8a6a2e",
    green: "#1f8a34",
    blue: "#1f6fe0",
  },
};
