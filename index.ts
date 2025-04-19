/*
 * Simple Authorization Proxy Server
 * Proxies OIDC/OAuth2 authorization requests to modify the redirect_uri.
 * Reads configuration directly from process.env.
 */

import cors from "cors";
import express from "express";

// --- Configuration ---
// Base URL of the actual Identity Provider's authorization endpoint.
const authorizeBaseUrl = process.env.AUTHORIZE_BASE_URL;
// The Redirect URI *this proxy* tells the IDP to use (must point to this server's /callback).
const proxyRedirectUri = process.env.PROXY_REDIRECT_URI;
// The final destination URL for the user after the callback (the original app's callback URL).
const finalAppRedirectUrl = process.env.FINAL_APP_REDIRECT_URL;

// --- Environment Variable Validation ---
// Check if required environment variables are set.
if (!authorizeBaseUrl) {
  throw new Error(
    "AUTHORIZE_BASE_URL environment variable is not set. Please provide the IDP's authorize endpoint."
  );
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
const port = process.env.PORT || 3000; // Use port from env if set, otherwise default to 3000

// Basic CORS handling (might not be needed depending on how you deploy/call this)
app.use(cors());

// --- /authenticate Endpoint ---
/*
 * Receives the initial authorization request from the client application.
 * Intercepts the request, modifies the redirect_uri parameter,
 * and redirects the user's browser to the actual Identity Provider's
 * authorization endpoint.
 */
app.get("/authenticate", (req, res) => {
  console.log(
    `[${new Date().toISOString()}] Received /authenticate request from client:`,
    req.query
  );

  // Get all original query parameters sent by the client.
  const originalParams = req.query;

  // Create a mutable copy of the parameters to modify.
  const modifiedParams = { ...originalParams };

  // --- Core Proxy Logic: Replace the original redirect_uri ---
  // The original redirect_uri is where the client app *wanted* the IDP to send the response.
  // We replace it with our proxy's /callback URL so the IDP sends the response here first.
  console.log(
    `[${new Date().toISOString()}] Original redirect_uri in request: ${
      modifiedParams.redirect_uri
    }`
  );
  modifiedParams.redirect_uri = proxyRedirectUri;
  console.log(
    `[${new Date().toISOString()}] Replacing redirect_uri with proxy's callback URL: ${proxyRedirectUri}`
  );

  // Construct the new URL to redirect the user to the actual Identity Provider.
  // Use URLSearchParams to correctly format and encode all parameters.
  const searchParams = new URLSearchParams(modifiedParams);
  const redirectUrlToIdp = `${authorizeBaseUrl}?${searchParams.toString()}`;

  console.log(
    `[${new Date().toISOString()}] Redirecting user to Identity Provider at: ${redirectUrlToIdp}`
  );

  // Perform the HTTP 302 redirect.
  res.redirect(302, redirectUrlToIdp);
});

// --- /callback Endpoint ---
/*
 * Receives the callback from the Identity Provider.
 * This happens after the user authenticates at the IDP, because
 * we told the IDP to redirect to PROXY_REDIRECT_URI.
 * This endpoint takes the parameters received from the IDP (like 'code', 'state', or 'error')
 * and redirects the user's browser to the final application's redirect URL.
 */
app.get("/callback", (req, res) => {
  console.log(
    `[${new Date().toISOString()}] Received /callback request from IDP:`,
    req.query
  );

  // Get all the query parameters received from the IDP.
  const queryParams = req.query;

  // Construct the query string to append to the final redirect URL.
  const queryString = new URLSearchParams(queryParams).toString();

  // Construct the final redirect URL back to the original application.
  const finalRedirectUrl = `${finalAppRedirectUrl}?${queryString}`;

  console.log(
    `[${new Date().toISOString()}] Redirecting user back to the final application at: ${finalRedirectUrl}`
  );

  // Perform the HTTP 302 redirect.
  res.redirect(302, finalRedirectUrl);
});

// --- Error Handling (Basic) ---
// Catches any errors that occur during request processing.
app.use((err, req, res, next) => {
  console.error(
    `[${new Date().toISOString()}] An error occurred:`,
    err.stack || err
  );
  res.status(500).send("Internal Server Error: Something broke!");
});

// --- Start Server ---
app.listen(port, () => {
  console.log(
    `[${new Date().toISOString()}] Authorization Proxy Server is running on port ${port}`
  );
  console.log(
    `[${new Date().toISOString()}] IDP Authorize Base URL (AUTHORIZE_BASE_URL): ${authorizeBaseUrl}`
  );
  console.log(
    `[${new Date().toISOString()}] Proxy Callback URL (PROXY_REDIRECT_URI): ${proxyRedirectUri}`
  );
  console.log(
    `[${new Date().toISOString()}] Final App Redirect URL (FINAL_APP_REDIRECT_URL): ${finalAppRedirectUrl}`
  );
});
