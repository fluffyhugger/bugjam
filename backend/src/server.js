import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureBucket } from "./config/minio.js";
import { ensureElevatedUser } from "./config/bootstrapAdmin.js";
import { ensureDefaultProject, renameScreenshotsField } from "./config/bootstrapProject.js";

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await ensureBucket();
  await ensureElevatedUser();
  await ensureDefaultProject();
  await renameScreenshotsField();
  app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
