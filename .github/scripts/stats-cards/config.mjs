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

  // Folders with the technology icons and the community project logos,
  // relative to the repository root.
  iconDirectory: "assets/icons",
  logoDirectory: "assets/community",

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
    host: "github",
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

  // Introduction below the terminal. Text between ** is printed bold.
  // The motto is shown as a file in the terminal session.
  motto: { file: "motto.js", text: "eat(); sleep(); code(); repeat();" },

  intro: [
    "Welcome to **Homelab-Alpha**! I'm GJS, a tech enthusiast who loves automation, infrastructure, and creative problem solving. My homelab is my playground: a place to test emerging technologies, fine-tune configurations, and keep finding ways to make my setup smarter and more efficient.",
    "I'm a strong believer in open source and self-hosting. My goal is to make technology more accessible and more robust for everyone. Whether I'm streamlining deployments, hardening environments, or squeezing out a little more performance, I'm always chasing a better solution.",
    "I enjoy tackling complex architecture and automating the mundane. From trying the latest gadgets to deep dives into advanced builds, I'm at my best when I'm tinkering under the hood.",
    "My repositories cover the pillars of modern self-hosting: automation, security, and system optimization. You'll find everything from Dockerized applications and OpenSSL setups to monitoring tools like Uptime Kuma, each built to power your own home lab. Have a look around, and feel free to collaborate!",
  ],


  // Text above the community project cards; the second line gets a star.
  communityText: [
    "I regularly draw inspiration from the open-source community. Here are some standout projects worth checking out:",
    "Found them interesting? Show your support by giving them a star!",
  ],

  // Footer in three clickable pieces. `compactLines` is the text on two lines
  // for narrow screens; `link` is the part of the text that looks like a link.
  footer: [
    {
      text: "© Homelab-Alpha 2024.",
      compactLines: ["© Homelab-Alpha", "2024."],
      link: "Homelab-Alpha",
      url: "https://homelab-alpha.nl",
      label: "Go to the Homelab-Alpha homepage",
    },
    {
      text: "Developed by GJS.",
      compactLines: ["Developed by", "GJS."],
      link: "GJS",
      url: "https://github.com/homelab-alpha",
      label: "Visit the Homelab-Alpha GitHub page",
    },
    {
      text: "Licensed under CC BY-NC-SA 4.0.",
      compactLines: ["Licensed under", "CC BY-NC-SA 4.0."],
      link: "CC BY-NC-SA 4.0",
      url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      label: "Read more about the CC BY-NC-SA 4.0 license",
    },
  ],

  // Badge in the "Repositories" heading that links to the code of conduct.
  // The compact label is used on narrow screens.
  codeOfConduct: {
    section: "Repositories",
    label: "Contributor Covenant 3.0",
    compactLabel: "Covenant 3.0",
    icon: "contributorcovenant",
    url: "https://github.com/homelab-alpha/homelab-alpha/blob/main/CODE_OF_CONDUCT.md",
  },

  // Section headings, in the order they appear in the README.
  sections: ["Repositories", "Activity", "Skills", "Connect", "Community projects", "Notes"],

  // Technology chips, grouped. `icon` is the file name in the icon directory
  // without extension and color scheme suffix.
  skillGroups: [
    {
      name: "Operating systems",
      skills: [
        { name: "Debian", icon: "debian" },
        { name: "Linux", icon: "linux" },
        { name: "Raspberry Pi", icon: "raspberrypi" },
        { name: "Red Hat", icon: "redhat" },
        { name: "Ubuntu", icon: "ubuntu" },
      ],
    },
    {
      name: "Containers and automation",
      skills: [
        { name: "Docker", icon: "docker" },
        { name: "GitHub Actions", icon: "githubactions" },
        { name: "Bash", icon: "bash" },
      ],
    },
    {
      name: "Version control",
      skills: [
        { name: "Git", icon: "git" },
        { name: "GitHub", icon: "github" },
        { name: "GitLab", icon: "gitlab" },
        { name: "Bitbucket", icon: "bitbucket" },
      ],
    },
    {
      name: "Editors and documentation",
      skills: [
        { name: "Visual Studio Code", icon: "vscode" },
        { name: "Microsoft Visual Studio", icon: "visualstudio" },
        { name: "Markdown", icon: "markdown" },
      ],
    },
  ],

  // Cards in the "Connect" section.
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

  // Cards in the "Community projects" section.
  community: [
    {
      key: "adguard_home",
      logo: "adguard_home.png",
      name: "AdGuard Home",
      description: "A powerful DNS server to block ads, trackers, and improve network privacy across all devices.",
      url: "https://github.com/AdguardTeam/AdGuardHome",
    },
    {
      key: "dozzle",
      logo: "dozzle.svg",
      name: "Dozzle",
      description: "Real-time Docker container log viewer, fast and incredibly helpful for live debugging.",
      url: "https://github.com/amir20/dozzle",
    },
    {
      key: "freshrss",
      logo: "freshrss.svg",
      name: "FreshRSS",
      description:
        "A self-hosted, lightweight RSS aggregator that helps you stay up to date with your favorite feeds, without the bloat.",
      url: "https://github.com/FreshRSS/FreshRSS",
    },
    {
      key: "home_assistant_os",
      logo: "home_assistant_os.png",
      name: "Home Assistant OS",
      description: "A privacy first, open-source platform that puts your smart home automation at your fingertips.",
      url: "https://github.com/home-assistant/operating-system",
    },
    {
      key: "lotus_docs",
      logo: "lotus_docs.svg",
      name: "Lotus Docs",
      description:
        "A fast, modern, and minimal documentation theme for Hugo, perfect for technical projects and clean documentation.",
      url: "https://github.com/colinwilson/lotusdocs",
    },
    {
      key: "speedtest_tracker",
      logo: "speedtest_tracker.png",
      name: "Speedtest Tracker",
      description: "A self-hosted app that logs and visualizes your internet speed using Speedtest CLI.",
      url: "https://github.com/alexjustesen/speedtest-tracker",
    },
  ],

  // Lines in the "Notes" card.
  notes: [
    "I'm always open to contributing to open-source projects. Feel free to reach out!",
    "Having issues with one of my repositories? Don't hesitate to ask for help!",
    "Follow me for more exciting projects and updates!",
    "Remember to enjoy the process and have fun along the way!",
  ],

  // Disclaimer card at the bottom of the profile.
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
