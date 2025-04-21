import { Request, Response } from "express";
import { finalAppRedirectUrl } from "../config";

export const callback = (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] Received GET /callback request from IDP:`,
    req.query
  );

  const queryParams = req.query;
  const queryString = new URLSearchParams(queryParams).toString();

  const finalRedirectUrlResult = `${finalAppRedirectUrl ?? ""}?${queryString}`;

  console.log(
    `[${new Date().toISOString()}] Redirecting user back to the final application at: ${finalRedirectUrlResult}`
  );
  res.redirect(302, finalRedirectUrlResult);
};
