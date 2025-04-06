// server.ts or app.ts
import express from 'express';
import { RegisterRoutes } from './routes'; // path to the generated routes file

const app = express();
app.use(express.json());

// Register all TSOA routes
RegisterRoutes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
