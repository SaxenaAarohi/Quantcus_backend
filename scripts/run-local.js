const { spawnSync } = require("child_process");
const path = require("path");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

async function main() {
  console.log("Starting in-memory MongoDB replica set (first run downloads mongod)...");
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri("product_intelligence");
  process.env.DATABASE_URL = uri;
  console.log("MongoDB ready:", uri);

  const serverDir = path.join(__dirname, "..");
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const node = process.execPath;

  console.log("Pushing Prisma schema...");
  const push = spawnSync(npx, ["prisma", "db", "push", "--skip-generate"], {
    cwd: serverDir,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (push.status !== 0) {
    console.error("prisma db push failed.");
    process.exit(1);
  }

  console.log("Seeding sample data...");
  spawnSync(node, ["prisma/seed.js"], {
    cwd: serverDir,
    stdio: "inherit",
    env: process.env,
  });

  console.log("Starting API...");
  require("../src/index.js");

  const stop = async () => {
    await replSet.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
