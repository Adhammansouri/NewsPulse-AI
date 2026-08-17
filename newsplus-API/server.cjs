const { copyFileSync, existsSync } = require("node:fs");
const { execSync } = require("node:child_process");
const { join } = require("node:path");

const root = __dirname;

if (!existsSync(join(root, "node_modules", "fastify"))) {
  execSync("npm install --omit=dev", { cwd: root, stdio: "inherit" });
}

const hostedEnv = [
  join(root, "../../../config/.env"),
  join(root, "../../config/.env"),
].find((file) => existsSync(file));

if (hostedEnv) {
  copyFileSync(hostedEnv, join(root, ".env"));
}

require("dotenv/config");

import("./dist/server.js")
  .then(({ startServer }) => startServer())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
