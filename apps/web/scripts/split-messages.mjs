/**
 * One-time splitter: monolith en.json/am.json → shared/public/staff bundles.
 * Run: node scripts/split-messages.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "messages");

const NAV_PUBLIC_KEYS = new Set([
  "home",
  "publicPortal",
  "submitComplaint",
  "trackStatus",
  "login",
  "menu",
  "openMenu",
]);

function splitNav(nav) {
  const navPublic = {};
  const navStaff = {};
  for (const [key, value] of Object.entries(nav)) {
    if (NAV_PUBLIC_KEYS.has(key)) {
      navPublic[key] = value;
    } else {
      navStaff[key] = value;
    }
  }
  return { navPublic, navStaff };
}

async function splitLocale(locale) {
  const mono = JSON.parse(
    await readFile(path.join(root, `${locale}.json`), "utf8"),
  );

  const { navPublic, navStaff } = splitNav(mono.nav);

  const writes = [
    ["shared/common", mono.common],
    ["shared/errors", mono.errors],
    ["public/nav-public", navPublic],
    ["public/public", mono.public],
    ["public/faq", mono.faq],
    ["public/complaintSubmit", mono.complaintSubmit],
    ["public/complaintTrack", mono.complaintTrack],
    ["public/complaintRecover", mono.complaintRecover],
    ["public/complaintRecoverManual", mono.complaintRecoverManual],
    ["public/chatbot", mono.chatbot],
    ["public/contactForm", mono.contactForm],
    ["staff/auth", mono.auth],
    ["staff/nav-staff", navStaff],
    ["staff/staff", mono.staff],
    ["staff/recoveryInquiries", mono.recoveryInquiries],
    ["staff/admin", {}],
    ["staff/reports", {}],
  ];

  for (const [rel, data] of writes) {
    const dir = path.join(root, path.dirname(rel));
    await mkdir(dir, { recursive: true });
    const file = path.join(root, `${rel}.${locale}.json`);
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`wrote ${path.relative(root, file)}`);
  }
}

await splitLocale("en");
await splitLocale("am");
console.log("done");
