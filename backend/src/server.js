import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  // Startup log only.
  console.log(`YS Store API listening on port ${env.port}`);
});
