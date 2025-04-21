/*
 * Simple Authorization and Token Proxy Server
 * Proxies OIDC/OAuth2 authorization requests and token exchange requests
 * to modify the redirect_uri. Reads configuration directly from process.env.
 */

import axios from "axios";
import cors from "cors";
import express from "express";
import { translateUserinfoData } from "./transaltor";

// --- Configuration ---
const authorizeBaseUrl = process.env.AUTHORIZE_BASE_URL;
const tokenEndpointUrl = process.env.TOKEN_ENDPOINT_URL;
const userinfoEndpointUrl = process.env.USERINFO_ENDPOINT_URL;
const proxyRedirectUri = process.env.PROXY_REDIRECT_URI;
const finalAppRedirectUrl = process.env.FINAL_APP_REDIRECT_URL;

// --- Environment Variable Validation ---
if (!authorizeBaseUrl) {
  throw new Error("AUTHORIZE_BASE_URL environment variable is not set.");
}
if (!tokenEndpointUrl) {
  throw new Error("TOKEN_ENDPOINT_URL environment variable is not set.");
}
if (!userinfoEndpointUrl) {
  throw new Error("USERINFO_ENDPOINT_URL environment variable is not set.");
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

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- /authenticate Endpoint ---
app.get("/authenticate", (req, res) => {
  console.log(
    `[${new Date().toISOString()}] Received GET /authenticate request from client:`,
    req.query
  );

  const originalParams = req.query;
  const modifiedParams = { ...originalParams };

  // --- Core Proxy Logic: Replace the original redirect_uri ---
  console.log(
    `[${new Date().toISOString()}] Original redirect_uri in /authenticate request: ${
      modifiedParams.redirect_uri
    }`
  );
  modifiedParams.redirect_uri = proxyRedirectUri;
  console.log(
    `[${new Date().toISOString()}] Replacing redirect_uri with proxy's callback URL: ${proxyRedirectUri}`
  );

  const searchParams = new URLSearchParams(modifiedParams);
  const redirectUrlToIdp = `${authorizeBaseUrl}?${searchParams.toString()}`;

  console.log(
    `[${new Date().toISOString()}] Redirecting user to Identity Provider Authorize endpoint at: ${redirectUrlToIdp}`
  );
  res.redirect(302, redirectUrlToIdp);
});

// --- /callback Endpoint ---
app.get("/callback", (req, res) => {
  console.log(
    `[${new Date().toISOString()}] Received GET /callback request from IDP:`,
    req.query
  );

  const queryParams = req.query;
  const queryString = new URLSearchParams(queryParams).toString();

  const finalRedirectUrl = `${finalAppRedirectUrl}?${queryString}`;

  console.log(
    `[${new Date().toISOString()}] Redirecting user back to the final application at: ${finalRedirectUrl}`
  );
  res.redirect(302, finalRedirectUrl);
});

// --- /token Endpoint ---
app.post("/token", async (req, res) => {
  console.log(
    `[${new Date().toISOString()}] Received POST /token request from Keycloak:`,
    req.body
  );

  const originalParams = req.body;
  const modifiedParams = { ...originalParams };

  // --- Core Proxy Logic: Replace the original redirect_uri in the POST body ---
  console.log(
    `[${new Date().toISOString()}] Original redirect_uri in /token POST body: ${
      modifiedParams.redirect_uri
    }`
  );
  modifiedParams.redirect_uri = proxyRedirectUri;
  console.log(
    `[${new Date().toISOString()}] Replacing redirect_uri with proxy's callback URL: ${proxyRedirectUri}`
  );

  if (
    !modifiedParams.grant_type ||
    !modifiedParams.client_id ||
    !modifiedParams.client_secret ||
    !modifiedParams.code ||
    !modifiedParams.redirect_uri
  ) {
    console.error(
      `[${new Date().toISOString()}] Error: Missing one or more required OAuth2 parameters in /token request body.`
    );
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters for token exchange.",
    });
  }

  try {
    const tokenResponse = await axios.post(
      tokenEndpointUrl,
      new URLSearchParams(modifiedParams).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        validateStatus: (status) => status >= 200 && status < 600,
      }
    );

    console.log(
      `[${new Date().toISOString()}] Received response from actual token endpoint (Status: ${
        tokenResponse.status
      }):`,
      tokenResponse.data
    );
    res.status(tokenResponse.status).json(tokenResponse.data);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error during token exchange proxy call to ${tokenEndpointUrl}:`,
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "proxy_internal_error",
      error_description: `Failed to communicate with upstream token endpoint: ${error.message}`,
    });
  }
});
// --- /userinfo Endpoint ---
app.get("/userinfo", async (req, res) => {
  console.log(
    `[${new Date().toISOString()}] Received GET /userinfo request from Keycloak:`,
    req.query
  );
  const accessToken = req.headers["authorization"]?.split(" ")[1];
  if (!accessToken) {
    console.error(
      `[${new Date().toISOString()}] Error: Missing access token in Authorization header.`
    );
    return res.status(401).json({
      error: "invalid_token",
      error_description: "Missing access token in Authorization header.",
    });
  }
  try {
    const userinfoResponse = await axios.get(userinfoEndpointUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      validateStatus: (status) => status >= 200 && status < 600,
    });

    console.log(
      `[${new Date().toISOString()}] Received response from actual userinfo endpoint (Status: ${
        userinfoResponse.status
      }):`,
      userinfoResponse.data
    );

    // -- Response Transformation --
    const transformedUserinfo = translateUserinfoData(userinfoResponse.data);

    res.status(userinfoResponse.status).json(transformedUserinfo);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error during userinfo proxy call to ${userinfoEndpointUrl}:`,
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "proxy_internal_error",
      error_description: `Failed to communicate with upstream userinfo endpoint: ${error.message}`,
    });
  }
});

// --- Error Handling (Basic) ---
app.use((err, req, res, next) => {
  console.error(
    `[${new Date().toISOString()}] An unhandled error occurred:`,
    err.stack || err
  );
  if (!res.headersSent) {
    res
      .status(500)
      .send("Internal Server Error: An unexpected error occurred!");
  }
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
