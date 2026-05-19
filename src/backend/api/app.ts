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
import crypto from "crypto";
import {
  LOCAL_API_AUTH_HEADER,
  LOCAL_API_AUTH_TOKEN_ENV,
} from "../../shared/backendConfig";

let app: express.Application;

type CreateAppOptions = {
  localApiAuthToken?: string | null;
};

function isAllowedLocalOrigin(origin?: string) {
  if (!origin || origin === "null" || origin === "file://") {
    return true;
  }

  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function buildCorsOptions(): cors.CorsOptions {
  return {
    origin(origin, callback) {
      callback(null, isAllowedLocalOrigin(origin) ? origin || true : false);
    },
    allowedHeaders: ["Content-Type", LOCAL_API_AUTH_HEADER],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  };
}

function tokensMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function requireLocalApiAuth(
  expectedToken: string | null | undefined
) {
  return (req: ExRequest, res: ExResponse, next: NextFunction) => {
    const normalizedExpectedToken = expectedToken?.trim();
    if (!normalizedExpectedToken || req.method === "OPTIONS") {
      next();
      return;
    }

    const actualToken = req.header(LOCAL_API_AUTH_HEADER)?.trim() ?? "";
    if (actualToken && tokensMatch(actualToken, normalizedExpectedToken)) {
      next();
      return;
    }

    res.status(401).json({
      message: "Unauthorized local API request",
    });
  };
}

export async function createApp(options: CreateAppOptions = {}) {
  app = express();
  const localApiAuthToken = Object.prototype.hasOwnProperty.call(
    options,
    "localApiAuthToken"
  )
    ? options.localApiAuthToken
    : process.env[LOCAL_API_AUTH_TOKEN_ENV];

  app.use(cors(buildCorsOptions()));
  app.use(requireLocalApiAuth(localApiAuthToken));
  app.use(express.json());

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
