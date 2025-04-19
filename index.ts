/*
 * Simple Authorization Proxy Server
 * Proxies OIDC/OAuth2 authorization requests to modify the redirect_uri.
 */

import cors from "cors";
import "dotenv/config"; // Load environment variables from .env file
import express from "express";

// --- Configuration ---
// Base URL of the actual Identity Provider's authorization endpoint.
const authorizeBaseUrl = process.env.AUTHORIZE_BASE_URL;
// The Redirect URI *this proxy* tells the IDP to use (must point to this server's /callback).
const proxyRedirectUri = process.env.PROXY_REDIRECT_URI;
// The final destination URL for the user after the callback (the original app's callback URL).
const finalAppRedirectUrl = process.env.FINAL_APP_REDIRECT_URL;

// --- Environment Variable Validation ---
if (!authorizeBaseUrl) {
  throw new Error("AUTHORIZE_BASE_URL environment variable is not set.");
}
if (!proxyRedirectUri) {
  throw new Error(
    "PROXY_REDIRECT_URI environment variable is not set. Should point to this server's /callback."
  );
}
if (!finalAppRedirectUrl) {
  throw new Error(
    "FINAL_APP_REDIRECT_URL environment variable is not set. The final destination for the client app."
  );
}

// --- Express App Setup ---
const app = express();
const port = process.env.PORT || 3000;
app.use(cors()); // Basic CORS handling

// --- /authenticate Endpoint ---
// Receives the initial authorization request from the client app.
// Modifies the redirect_uri and redirects the user to the actual IDP.
app.get("/authenticate", (req, res) => {
  console.log("Received /authenticate request:", req.query);

  const originalParams = req.query;
  const modifiedParams = { ...originalParams };

  // --- Core Proxy Logic: Replace the original redirect_uri with the proxy's callback ---
  // This ensures the IDP redirects the user back to *this* proxy server after authentication.
  console.log(
    `Replacing redirect_uri ${modifiedParams.redirect_uri} with proxy's callback: ${proxyRedirectUri}`
  );
  modifiedParams.redirect_uri = proxyRedirectUri;

  // Reconstruct the query string for the redirect to the IDP.
  const searchParams = new URLSearchParams(modifiedParams);
  const redirectUrlToIdp = `${authorizeBaseUrl}?${searchParams.toString()}`;

  console.log("Redirecting user to Identity Provider:", redirectUrlToIdp);
  res.redirect(302, redirectUrlToIdp); // Redirect the user's browser
});

// --- /callback Endpoint ---
// Receives the callback from the Identity Provider (with code/state or error).
// Forwards the parameters to the final application redirect URL.
app.get("/callback", (req, res) => {
  console.log("Received /callback request from IDP:", req.query);

  // Get the query parameters received from the IDP (e.g., code, state, error).
  const queryParams = req.query;
  const queryString = new URLSearchParams(queryParams).toString();

  // Construct the final redirect URL back to the original application.
  const finalRedirectUrl = `${finalAppRedirectUrl}?${queryString}`;

  console.log(
    "Redirecting user back to the final application:",
    finalRedirectUrl
  );
  res.redirect(302, finalRedirectUrl); // Redirect the user's browser
});

// --- Error Handling (Basic) ---
app.use((err, req, res, next) => {
  console.error("An error occurred:", err.stack || err);
  res.status(500).send("Something broke!");
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Authorization Proxy Server is running on port ${port}`);
  console.log(
    `IDP Authorize Base URL (AUTHORIZE_BASE_URL): ${authorizeBaseUrl}`
  );
  console.log(`Proxy Callback URL (PROXY_REDIRECT_URI): ${proxyRedirectUri}`);
  console.log(
    `Final App Redirect URL (FINAL_APP_REDIRECT_URL): ${finalAppRedirectUrl}`
  );
});
