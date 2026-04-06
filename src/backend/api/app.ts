import express, {
  Response as ExResponse,
  Request as ExRequest,
  NextFunction,
} from "express";
import { RegisterRoutes } from "./routes"; // path to the generated routes file
import { ValidateError } from "tsoa";
import { NotFoundError } from "../utils/errors/not-found-error";
import { ForbiddenError } from "../utils/errors/forbidden-error";
import { ConflictError } from "../utils/errors/conflict-error";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

let app: express.Application;
export async function createApp() {
  app = express();
  app.use(express.json());
  app.use(cors());

  // Register all TSOA routes
  RegisterRoutes(app);

  app.use(
    "/docs",
    swaggerUi.serve,
    async (_req: ExRequest, res: ExResponse) => {
      return res.send(swaggerUi.generateHTML(await import("./swagger.json")));
    }
  );

  // A catch-all handler which catches any requests that do not match any defined routes and return a 404 response.
  app.use(function notFoundHandler(_req, res: ExResponse) {
    res.status(404).send({
      message: "Not Found",
    });
  });

  // Error handling middleware for TSOA validation errors and other errors thrown within defined routes.
  app.use(function errorHandler(
    err: unknown,
    req: ExRequest,
    res: ExResponse,
    next: NextFunction
  ): ExResponse | void {
    if (err instanceof ValidateError) {
      console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
      return res.status(422).json({
        message: "Validation Failed",
        details: err?.fields,
      });
    }
    if (err instanceof NotFoundError) {
      return res.status(err.statusCode).json({
        message: err.message,
      });
    }
    if (err instanceof ForbiddenError) {
      return res.status(err.statusCode).json({
        message: err.message,
      });
    }
    if (err instanceof ConflictError) {
      return res.status(err.statusCode).json({
        message: err.message,
      });
    }
    if (err instanceof Error) {
      console.error(`Internal Server Error: ${err.message}`);
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    next();
  });
  return app;
}
