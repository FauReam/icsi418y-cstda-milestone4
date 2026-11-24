import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createApp } from "./app.js";
try {
  const { client, db } = await connectDatabase(
    config.mongoUri,
    config.database,
  );
  const app = await createApp(db, config);
  const server = app.listen(config.port, config.host, () =>
    console.log(`CSTDA: http://${config.host}:${config.port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () =>
      server.close(async () => {
        await client.close();
        process.exit(0);
      }),
    );
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
}
