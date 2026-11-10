import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const testsDir = path.resolve(process.cwd(), "tests");
if (!fs.existsSync(testsDir)) {
  console.error("Directory tests/ does not exist.");
  process.exit(1);
}

let testFiles = fs.readdirSync(testsDir)
  .filter((f) => f.endsWith(".test.mjs") || f.endsWith(".test.js") || f.endsWith(".test.ts"))
  .map((f) => path.join("tests", f));

const normalizePath = (p) => p.replace(/\\/g, "/").toLowerCase();
const userArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
if (userArgs.length > 0) {
  testFiles = testFiles.filter((f) => {
    const normF = normalizePath(f);
    return userArgs.some((arg) => normF.includes(normalizePath(arg)));
  });
}

if (testFiles.length === 0) {
  console.log("No matching test files found.");
  process.exit(0);
}

const envFileArgs = fs.existsSync(path.resolve(process.cwd(), ".env.local"))
  ? ["--env-file=.env.local"]
  : [];

console.log(`Running ${testFiles.length} test suites with tsx...`);

const tsxCli = require.resolve("tsx/cli");
const child = spawn(process.execPath, [tsxCli, ...envFileArgs, "--test", ...testFiles], {
  stdio: "inherit",
  shell: false,
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
