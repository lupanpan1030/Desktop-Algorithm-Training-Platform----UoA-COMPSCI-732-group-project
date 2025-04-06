import express, { Response as ExResponse, Request as ExRequest } from 'express';
import { RegisterRoutes } from './routes'; // path to the generated routes file
import swaggerUi from 'swagger-ui-express';

const app = express();
app.use(express.json());

// Register all TSOA routes
RegisterRoutes(app);

app.use("/docs", swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
    return res.send(
      swaggerUi.generateHTML(await import("./swagger.json"))
    );
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
