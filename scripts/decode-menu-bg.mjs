import { existsSync, readFileSync, writeFileSync } from "node:fs";

const jpg = new URL("../public/menu-bg.jpg", import.meta.url);
const b64 = new URL("../public/menu-bg.b64", import.meta.url);
if (!existsSync(b64)) process.exit(0);
const buf = Buffer.from(readFileSync(b64, "utf8").trim(), "base64");
if (buf.length < 1000 || buf[0] !== 0xff || buf[1] !== 0xd8) {
  console.error("menu-bg.b64 is not a jpeg");
  process.exit(1);
}
writeFileSync(jpg, buf);
