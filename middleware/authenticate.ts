import { Request, Response } from "express";
import { authorizeBaseUrl, proxyRedirectUri } from "../config";

export const authenticate = (req: Request, res: Response) => {
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
  const redirectUrlToIdp = `${
    authorizeBaseUrl ?? ""
  }?${searchParams.toString()}`;

  console.log(
    `[${new Date().toISOString()}] Redirecting user to Identity Provider Authorize endpoint at: ${redirectUrlToIdp}`
  );
  res.redirect(302, redirectUrlToIdp);
};
