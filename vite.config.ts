import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Read the full raw request body into a single Buffer.
 */
async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Dev-server middleware that proxies browser API calls to external services.
 * The browser only ever talks to `/api-proxy?url=<encoded-target>`, so no
 * third-party CORS proxy is needed while developing. Works for GET and POST
 * (e.g. AudD multipart uploads) and forwards the raw request body verbatim.
 */
function devApiProxy(): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url || "", "http://localhost");
      const target = url.searchParams.get("url");
      if (!target) {
        res.statusCode = 400;
        res.end("Missing ?url= parameter");
        return;
      }

      const body = await readBody(req);

      const headers: Record<string, string> = {};
      const skip = new Set(["host", "connection", "content-length"]);
      for (const [key, value] of Object.entries(req.headers)) {
        if (!skip.has(key.toLowerCase())) {
          headers[key] = Array.isArray(value) ? value.join(", ") : String(value ?? "");
        }
      }

      const upstream = await fetch(target, {
        method: req.method || "GET",
        headers,
        body: body.length > 0 ? body : undefined,
      });

      const data = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = upstream.status;
      res.setHeader("Access-Control-Allow-Origin", "*");
      const skipResponse = new Set([
        "content-encoding",
        "content-length",
        "transfer-encoding",
        "connection",
      ]);
      upstream.headers.forEach((value, key) => {
        if (!skipResponse.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.end(data);
    } catch (error) {
      res.statusCode = 502;
      res.end(String(error));
    }
  };

  return {
    name: "api-proxy",
    configureServer(server) {
      server.middlewares.use("/api-proxy", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api-proxy", handler);
    },
  };
}

/**
 * Server-side AudD recognition endpoint.
 *
 * The browser posts the raw audio to `/api/audd?return=apple_music&market=IN`
 * and the API token is appended HERE, on the server — it never ships in the
 * frontend bundle. The multipart body is forwarded verbatim.
 */
function auddProxy(auddApiToken: string): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (!auddApiToken) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            status: "error",
            error: {
              error_code: 900,
              error_message: "Song recognition is not configured on the server.",
            },
          }),
        );
        return;
      }

      const body = await readBody(req);
      const url = new URL(req.url || "", "http://localhost");

      const target = new URL("https://api.audd.io/");
      target.searchParams.set("api_token", auddApiToken);
      for (const [key, value] of url.searchParams) {
        if (key !== "api_token" && value) target.searchParams.set(key, value);
      }

      const headers: Record<string, string> = { Accept: "application/json" };
      const contentType = req.headers["content-type"];
      if (contentType) {
        headers["Content-Type"] = Array.isArray(contentType)
          ? contentType.join(", ")
          : String(contentType);
      }

      const upstream = await fetch(target.toString(), {
        method: "POST",
        headers,
        body: body.length > 0 ? body : undefined,
      });

      const data = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = upstream.status;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") || "application/json",
      );
      res.end(data);
    } catch (error) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          status: "error",
          error: { error_code: 0, error_message: String(error) },
        }),
      );
    }
  };

  return {
    name: "audd-proxy",
    configureServer(server) {
      server.middlewares.use("/api/audd", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/audd", handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side env (not exposed to the browser): .env / .env.local etc.
  const env = loadEnv(mode, process.cwd(), "");
  const auddApiToken = env.AUDD_API_KEY || "";

  return {
    plugins: [react(), devApiProxy(), auddProxy(auddApiToken)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"],
            motion: ["framer-motion"],
            icons: ["lucide-react"],
          },
        },
      },
    },
  };
});
