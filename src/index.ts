/*
 * Simple Authorization and Token Proxy Server
 * Proxies OIDC/OAuth2 authorization requests and token exchange requests
 * to modify the redirect_uri. Reads configuration directly from process.env.
 */

import cors from "cors";
import express, { Request, RequestHandler, Response } from "express";
import { auth, requiresAuth } from "express-openid-connect";
import {
  authorizeBaseUrl,
  finalAppRedirectUrl,
  proxyRedirectUri,
  tokenEndpointUrl,
} from "./config";
import { authenticate } from "./middleware/authenticate";
import { callback } from "./middleware/callback";
import { errorHandler } from "./middleware/errorHandler";
import { token } from "./middleware/token";
import { userinfo } from "./middleware/userinfo";
import { HierarchyConfigJson } from "./types/hierarchyConfig";
import { hasClaim } from "./utils/authUtils";
import {
  getHierarchyConfig,
  saveHierarchyConfig,
} from "./utils/hirarchyConfig";

// --- Express App Setup ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  auth({
    routes: {
      callback: "/proxy-admin/callback",
      login: "/proxy-admin/login",
      logout: "/proxy-admin/logout",
      postLogoutRedirect: "https://pfadimh.ch",
    },
    authorizationParams: {
      response_type: "code", // Use Authorization Code Flow
      scope: "openid profile email", // Requesting OpenID Connect scopes
    },
    authRequired: false,
  })
);

// --- /authenticate Endpoint ---
app.get("/authenticate", authenticate);

// --- /callback Endpoint ---
app.get("/callback", callback);

// --- /token Endpoint ---
app.post("/token", token);

// --- /userinfo Endpoint ---
app.get("/userinfo", userinfo);

// --- Error Handling ---
app.use(errorHandler);

// --- Configure EJS ---
app.set("view engine", "ejs");

// --- Admin Endpoints ---
app.get(
  "/proxy-admin/config",
  requiresAuth(),
  hasClaim("roles", ["Admin"]),
  (async (req: Request, res: Response) => {
    try {
      const config = await getHierarchyConfig();
      // Make sure config has the expected structure, provide default if needed
      const safeConfig = config || { groups: [] };
      res.render("index.ejs", { config: safeConfig }); // Pass config to the template
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).render("index.ejs", {
        config: { groups: [] }, // Render page even on error, maybe show error msg
        error: "Could not load configuration.",
      });
    }
  }) as RequestHandler
);

app.post(
  "/proxy-admin/config",
  requiresAuth(),
  hasClaim("roles", ["Admin"]),
  async (req: Request, res: Response) => {
    try {
      // With app.use(express.json()), req.body is already the parsed object
      const config: HierarchyConfigJson = req.body;

      // Optional: Add server-side validation here to double-check the structure/types

      await saveHierarchyConfig(config);
      res.status(200).send("Config saved successfully!");
    } catch (error) {
      console.error("Error saving config:", error);
      // Send back a more informative error if possible
      const message =
        error instanceof Error ? error.message : "Unknown error saving config.";
      res.status(500).send(`Error saving config: ${message}`);
    }
  }
);

// --- Start Server ---
app.listen(port, () => {
  console.log(
    `[${new Date().toISOString()}] Authorization Proxy Server is running on port ${port}`
  );
  console.log(`[${new Date().toISOString()}] --- Configuration ---`);
  console.log(
    `[${new Date().toISOString()}] -> IDP Authorize Base URL (AUTHORIZE_BASE_URL): ${authorizeBaseUrl}`
  );
  console.log(
    `[${new Date().toISOString()}] -> IDP Token Endpoint URL (TOKEN_ENDPOINT_URL): ${tokenEndpointUrl}`
  );
  console.log(
    `[${new Date().toISOString()}] -> Proxy Callback URL (PROXY_REDIRECT_URI): ${proxyRedirectUri}`
  );
  console.log(
    `[${new Date().toISOString()}] -> Final App Redirect URL (FINAL_APP_REDIRECT_URL): ${finalAppRedirectUrl}`
  );
});
