/*
 * Simple Authorization and Token Proxy Server
 * Proxies OIDC/OAuth2 authorization requests and token exchange requests
 * to modify the redirect_uri. Reads configuration directly from process.env.
 */

import cors from "cors";
import express from "express";
import { auth, claimIncludes } from "express-openid-connect";
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

// --- Express App Setup ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  auth({
    routes: {
      callback: "/auth/callback",
      login: "/auth/login",
      logout: "/auth/logout",
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

// --- Admin Endpoints ---
app.get("/proxy-admin", claimIncludes("roles", "Admin"), (req, res) => {
  res.status(200).json({
    message: "Admin access granted",
    user: req.oidc.user,
  });
});

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
