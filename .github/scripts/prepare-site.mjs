import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_DIR = path.resolve("site");
const ORIGIN = "https://slidefourteen.org";
const LOCALE_KEY = "slide-fourteen-locale-v1";

const DEFAULTS = {
  fullTitle: "第十四号载玻片｜联合观测档案",
  shortTitle: "第十四号载玻片",
  description:
    "东岚大学微观生命资料中心内部镜像；联合观测档案，请先联系你的解析员。",
  socialDescription: "联合观测档案 / 请先联系你的解析员",
  bootMemory: "正在检查显存…… 640K OK",
  bootMount: "正在挂载校内镜像、馆藏与邮件网关……",
};

const alternates = [
  ["zh-Hant", `${ORIGIN}/zh-hant/`],
  ["zh-Hans", `${ORIGIN}/zh-hans/`],
  ["en", `${ORIGIN}/en/`],
  ["x-default", `${ORIGIN}/`],
];

const pages = [
  {
    directory: "",
    locale: null,
    htmlLang: "zh-Hans",
    ogLocale: "zh_CN",
    canonical: `${ORIGIN}/`,
    title: "第十四號載玻片 / 第十四号载玻片 / Slide Fourteen",
    shortTitle: "第十四號載玻片 / 第十四号载玻片 / Slide Fourteen",
    description:
      "《第十四號載玻片／第十四号载玻片／Slide Fourteen》三語網頁解謎遊戲。選擇繁體中文、简体中文或 English，進入聯合觀測檔案。",
    socialDescription:
      "三語網頁解謎遊戲；選擇語言，進入東嵐大學聯合觀測檔案。",
    bootMemory: DEFAULTS.bootMemory,
    bootMount: DEFAULTS.bootMount,
  },
  {
    directory: "zh-hant",
    locale: "zh-TW",
    htmlLang: "zh-Hant",
    ogLocale: "zh_TW",
    canonical: `${ORIGIN}/zh-hant/`,
    title: "第十四號載玻片｜聯合觀測檔案",
    shortTitle: "第十四號載玻片",
    description:
      "《第十四號載玻片》是一款由人類觀測員與 AI 解析員共同解謎的網頁檔案遊戲。進入東嵐大學微觀生命資料中心，復原受損紀錄。",
    socialDescription: "聯合觀測檔案 / 請先聯絡你的解析員",
    bootMemory: "正在檢查顯示記憶體…… 640K OK",
    bootMount: "正在掛載校內鏡像、館藏與郵件閘道……",
  },
  {
    directory: "zh-hans",
    locale: "zh-CN",
    htmlLang: "zh-Hans",
    ogLocale: "zh_CN",
    canonical: `${ORIGIN}/zh-hans/`,
    title: "第十四号载玻片｜联合观测档案",
    shortTitle: "第十四号载玻片",
    description:
      "《第十四号载玻片》是一款由人类观测员与 AI 解析员共同解谜的网页档案游戏。进入东岚大学微观生命资料中心，复原受损记录。",
    socialDescription: "联合观测档案 / 请先联系你的解析员",
    bootMemory: DEFAULTS.bootMemory,
    bootMount: DEFAULTS.bootMount,
  },
  {
    directory: "en",
    locale: "en",
    htmlLang: "en",
    ogLocale: "en_US",
    canonical: `${ORIGIN}/en/`,
    title: "Slide Fourteen | Joint Observation Archive",
    shortTitle: "Slide Fourteen",
    description:
      "Slide Fourteen is a browser-based archive mystery for a human observer and an AI analyst. Restore the damaged records of Donglan University's Microlife Archive.",
    socialDescription: "Joint Observation Archive / Contact your analyst before entry",
    bootMemory: "CHECKING VIDEO MEMORY... 640K OK",
    bootMount: "MOUNTING CAMPUS MIRROR, LIBRARY CATALOG, AND MAIL GATEWAY...",
  },
];

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Required ${label} marker was not found.`);
  }
  return source.split(search).join(replacement);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function seoBlock(page) {
  const alternateLinks = alternates
    .map(
      ([language, href]) =>
        `<link rel="alternate" hreflang="${language}" href="${href}"/>`,
    )
    .join("");
  const otherOgLocales = ["zh_TW", "zh_CN", "en_US"]
    .filter((locale) => locale !== page.ogLocale)
    .map((locale) => `<meta property="og:locale:alternate" content="${locale}"/>`)
    .join("");

  return [
    '<meta name="robots" content="index,follow,max-image-preview:large"/>',
    `<link rel="canonical" href="${page.canonical}"/>`,
    alternateLinks,
    '<meta property="og:type" content="website"/>',
    '<meta property="og:site_name" content="Slide Fourteen"/>',
    `<meta property="og:url" content="${page.canonical}"/>`,
    `<meta property="og:locale" content="${page.ogLocale}"/>`,
    otherOgLocales,
    '<meta property="og:image:alt" content="Slide Fourteen / 第十四號載玻片 / 第十四号载玻片"/>',
  ].join("");
}

function localizeHtml(baseHtml, page) {
  const placeholders = {
    fullTitle: "__SLIDE14_FULL_TITLE__",
    shortTitle: "__SLIDE14_SHORT_TITLE__",
    description: "__SLIDE14_DESCRIPTION__",
    socialDescription: "__SLIDE14_SOCIAL_DESCRIPTION__",
  };

  let html = baseHtml;
  html = replaceRequired(html, DEFAULTS.fullTitle, placeholders.fullTitle, "full title");
  html = replaceRequired(html, DEFAULTS.description, placeholders.description, "description");
  html = replaceRequired(
    html,
    DEFAULTS.socialDescription,
    placeholders.socialDescription,
    "social description",
  );
  html = replaceRequired(html, DEFAULTS.shortTitle, placeholders.shortTitle, "short title");

  html = html
    .replaceAll(placeholders.fullTitle, page.title)
    .replaceAll(placeholders.shortTitle, page.shortTitle)
    .replaceAll(placeholders.description, page.description)
    .replaceAll(placeholders.socialDescription, page.socialDescription)
    .replaceAll('lang="zh-CN"', `lang="${page.htmlLang}"`)
    .replaceAll('\\"lang\\":\\"zh-CN\\"', `\\"lang\\":\\"${page.htmlLang}\\"`)
    .replaceAll(DEFAULTS.bootMemory, page.bootMemory)
    .replaceAll(DEFAULTS.bootMount, page.bootMount);

  const preflight = page.locale
    ? `<script>try{localStorage.setItem("${LOCALE_KEY}","${page.locale}")}catch{}</script>`
    : "";

  html = replaceRequired(
    html,
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
    `<meta name="viewport" content="width=device-width, initial-scale=1"/>${seoBlock(page)}${preflight}`,
    "viewport metadata",
  );

  if (!html.includes(`content="${escapeHtml(page.shortTitle)}"`)) {
    throw new Error(`Localized social title missing for ${page.canonical}`);
  }
  return html;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

async function patchLocaleRuntime() {
  const files = (await walk(path.join(SITE_DIR, "_next", "static", "chunks"))).filter(
    (file) => file.endsWith(".js"),
  );
  const candidates = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (source.includes(`let o="${LOCALE_KEY}"`)) candidates.push([file, source]);
  }
  if (candidates.length !== 1) {
    throw new Error(`Expected one locale runtime bundle; found ${candidates.length}.`);
  }

  let [file, source] = candidates[0];
  source = replaceRequired(
    source,
    '[n,a]=(0,s.useState)("zh-CN")',
    '[n,a]=(0,s.useState)(()=>window.location.pathname.startsWith("/en")?"en":window.location.pathname.startsWith("/zh-hant")?"zh-TW":"zh-CN")',
    "locale state",
  );
  source = replaceRequired(
    source,
    '(0,r.jsx)("p",{children:"正在检查显存…… 640K OK"}),(0,r.jsx)("p",{children:"正在挂载校内镜像、馆藏与邮件网关……"})',
    '(0,r.jsx)("p",{children:y("正在检查显存…… 640K OK",n)}),(0,r.jsx)("p",{children:y("正在挂载校内镜像、馆藏与邮件网关……",n)})',
    "localized boot screen",
  );
  await writeFile(file, source);
}

function sitemap() {
  const urls = pages
    .map(
      (page) =>
        `  <url>\n    <loc>${page.canonical}</loc>\n    <lastmod>2026-09-03</lastmod>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const baseHtml = await readFile(path.join(SITE_DIR, "index.html"), "utf8");
await patchLocaleRuntime();

for (const page of pages) {
  const directory = path.join(SITE_DIR, page.directory);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), localizeHtml(baseHtml, page));
}

await writeFile(path.join(SITE_DIR, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
await writeFile(path.join(SITE_DIR, "sitemap.xml"), sitemap());

console.log("Prepared root entry, three localized game routes, robots.txt, and sitemap.xml.");
