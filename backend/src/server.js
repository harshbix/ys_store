import app from './app.js';
import { env } from './config/env.js';

const PORT = Number(process.env.PORT || env.port || 4000);

app.listen(PORT, () => {
  // Startup log only.
  console.log(`YS Store API listening on port ${PORT}`);
});
