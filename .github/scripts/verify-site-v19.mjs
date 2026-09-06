import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const SITE_DIR = path.resolve(process.env.SLIDE14_SITE_DIR || "site");

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

function requireText(source, text, label) {
  if (!source.includes(text)) throw new Error(`Missing ${label}.`);
}

function forbidText(source, text, label) {
  if (source.includes(text)) throw new Error(`Unexpected ${label}.`);
}

const files = await walk(SITE_DIR);
const jsCandidates = [];
const cssCandidates = [];
for (const file of files) {
  if (file.endsWith(".js")) {
    const source = await readFile(file, "utf8");
    if (source.includes("orientationShown:!1") && source.includes("function eO(")) {
      jsCandidates.push([file, source]);
    }
  } else if (file.endsWith(".css")) {
    const source = await readFile(file, "utf8");
    if (source.includes(".orientation-screen{") && source.includes(".forum-water-event{")) {
      cssCandidates.push([file, source]);
    }
  }
}

if (jsCandidates.length !== 1) throw new Error(`Expected one patched game bundle; found ${jsCandidates.length}.`);
if (cssCandidates.length !== 1) throw new Error(`Expected one patched stylesheet; found ${cssCandidates.length}.`);

const [, js] = jsCandidates[0];
const [, css] = cssCandidates[0];

for (const [text, label] of [
  ["i&&e.phase>0&&1===e.cycle&&!e.orientationShown", "first-cycle-only orientation condition"],
  ["_guideOpen&&(0,r.jsx)(eO", "orientation dialog render"],
  ["【数据交换】是本次观测的任务与进度中心", "Data Exchange orientation"],
  ["章硯秋，別再拿研究會的帳號回文。", "independent Traditional forum wording"],
  ["NEW OBSERVER: PLEASE CONFIRM THE READING ORDER", "English orientation wording"],
  ['"短消息 ":"PRIVATE MESSAGES "', "English inbox toolbar label"],
  ["RINGBOARD 短消息", "forum inbox"],
  ["二食堂又停热水。晚上吃凉面？", "cold-noodle easter egg"],
  ["forum-reflecting", "water reflection state"],
  ["waterReflectionFullscreenSeen:!1", "versioned whole-page water state"],
  ["!e.waterReflectionFullscreenSeen&&!u", "whole-page water gate"],
  ["onWaterSeen:()=>q({waterReflectionSeen:!0,waterReflectionFullscreenSeen:!0})", "one-time water callback"],
  ['window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?500:1200', "motion-aware water duration"],
]) {
  requireText(js, text, label);
}

for (const [text, label] of [
  ["章砚秋，别再用研究会终端登录论坛。", "old forum wording"],
  ["卡片题名被水洗掉，边码还能读。登录号、库位与借阅日期互相矛盾。", "old Qiao email wording"],
  ["orientationDismissed", "dismiss-only orientation state"],
  ["本提示只在建立新观测员档案时显示一次。", "immersion-breaking Simplified orientation note"],
  ["本提示僅於建立新觀測員檔案時顯示一次。", "immersion-breaking Traditional orientation note"],
  ["This notice is displayed once when a new observer file is created.", "immersion-breaking English orientation note"],
]) {
  forbidText(js, text, label);
}

for (const [text, label] of [
  ["这封邮件被标为无关记录，但它是唯一明确说明 B-204 不应该有供水的档案。", "ambiguous hot-water annotation"],
  ["录音里不是泵声。每一次脉冲都是一组细胞同时放电，树状终端只是把相位差翻译成可点击的分枝。", "Zhang Yanqiu email"],
  ["从提问者还没问出口的那条分枝来。", "waterbranch forum line"],
  ["林启文的个人首页（第二份同名备份）", "Lin Qiwen second same-name backup"],
  ["不要比较文字差异；它想知道你会相信哪一份比较旧。", "Lin Qiwen no-comparison warning"],
]) {
  requireText(js, text, `frozen ${label}`);
}

const packetStart = js.indexOf("function $(");
const packetEnd = js.indexOf("function H(", packetStart);
if (packetStart < 0 || packetEnd < 0) throw new Error("Packet generator boundaries were not found.");
const packetHash = createHash("sha256").update(js.slice(packetStart, packetEnd)).digest("hex");
if (packetHash !== "07755aeacfde913f5da22b5fcb5a1c37018db55fbba38d4cca0aca4fd8fe17a0") {
  throw new Error(`Packet generator changed unexpectedly: ${packetHash}`);
}

for (const marker of [
  'body[data-archive-locale=en]{font-family:Times New Roman,Georgia,serif;font-size:15px}',
  ".orientation-screen{position:fixed;z-index:70;inset:0;display:grid;place-items:center;padding:18px;background:transparent}",
  ".forum-dialog-shade{",
  ".forum-mobile-wet{display:none",
  ".forum-mirror.forum-reflecting{overflow:visible;filter:none}",
  ".forum-water-event{position:fixed;z-index:90;inset:0;width:100vw;height:100vh",
  "@keyframes archiveSubmerge",
  "@media (prefers-reduced-motion:reduce){.forum-water-event{animation:none;-webkit-backdrop-filter:none;backdrop-filter:none}",
]) {
  requireText(css, marker, `style marker ${marker}`);
}

const localizedPages = [
  ["zh-hant", "第十四號載玻片｜聯合觀測檔案", "zh-TW"],
  ["zh-hans", "第十四号载玻片｜联合观测档案", "zh-CN"],
  ["en", "Slide Fourteen | Joint Observation Archive", "en"],
];
for (const [directory, title, locale] of localizedPages) {
  const html = await readFile(path.join(SITE_DIR, directory, "index.html"), "utf8");
  requireText(html, title, `${directory} title`);
  requireText(html, `localStorage.setItem(\"slide-fourteen-locale-v1\",\"${locale}\")`, `${directory} locale preflight`);
}

const sitemap = await readFile(path.join(SITE_DIR, "sitemap.xml"), "utf8");
requireText(sitemap, "<lastmod>2026-09-05</lastmod>", "updated sitemap date");

console.log("Verified v19 interaction state, frozen narrative text, packet integrity, locale routes and responsive styles.");
