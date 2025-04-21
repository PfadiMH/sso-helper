import axios from "axios";
import { Request, Response } from "express";
import { proxyRedirectUri, tokenEndpointUrl } from "../config";

export const token = async (req: Request, res: Response) => {
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
      `[${new Date().toISOString()}] Error during token exchange proxy call to ${
        tokenEndpointUrl ?? ""
      }:`,
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "proxy_internal_error",
      error_description: `Failed to communicate with upstream token endpoint: ${error.message}`,
    });
  }
};
