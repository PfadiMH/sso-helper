import { NextFunction, RequestHandler, Response } from "express";
import { OpenidRequest } from "express-openid-connect";

/**
 * Creates an Express middleware function that checks if the authenticated user's claims
 * include a specific claim key with one of the allowed values.
 * Assumes express-openid-connect has populated req.oidc.user with claims.
 *
 * @param claimKey The name of the claim property to check in req.oidc.user.
 * @param allowedValues An array of string values that are considered valid for the claim.
 * @returns An Express middleware function (req, res, next).
 */
export function hasClaim(
  claimKey: string,
  allowedValues: string[]
): RequestHandler {
  // Input validation
  if (typeof claimKey !== "string" || claimKey.length === 0) {
    // Using Error subclass or just Error is fine
    throw new Error(
      "hasClaim middleware requires a non-empty string for claimKey."
    );
  }
  if (!Array.isArray(allowedValues) || allowedValues.length === 0) {
    // Throwing indicates a configuration error in the middleware usage.
    throw new Error(
      "hasClaim middleware requires a non-empty array for allowedValues."
    );
  }

  // Return the actual middleware function
  return (req: OpenidRequest, res: Response, next: NextFunction): void => {
    // Access user claims safely using optional chaining
    const userClaims = req.oidc?.user;

    // 1. Check if user claims exist (user is authenticated via express-openid-connect)
    // If auth() middleware runs before this, this check might be redundant but is a safeguard.
    if (!userClaims) {
      console.warn("hasClaim middleware called on unauthenticated request.");
      // 401 Unauthorized might be more appropriate if authentication is the primary missing step,
      // but 403 Forbidden works if this is a permissions check post-auth. Let's stick to 403 as requested.
      res.sendStatus(403);
      return;
    }

    // 2. Access the specific claim value. Use type assertion if necessary based on your expected claim types.
    // We expect the claim value to be a string or an array of strings.
    const userClaimValue: string | string[] | undefined | null =
      userClaims[claimKey];

    // 3. Check if the user has the required claim key or if its value is null/undefined
    if (userClaimValue === undefined || userClaimValue === null) {
      console.warn(
        `User is missing required claim or claim is null/undefined: "${claimKey}"`
      );
      res.sendStatus(403); // Forbidden
      return;
    }

    // 4. Check if the user's claim value(s) match any of the allowed values
    let hasRequiredValue = false;

    if (Array.isArray(userClaimValue)) {
      // User's claim is an array (e.g., "roles": ["admin", "editor"])
      // Ensure array items are treated as strings for includes check (type assertion)
      const userClaimArray: string[] = userClaimValue.map(String); // Convert all items to string just in case

      // Check if ANY of the user's claim values are in the allowedValues list
      hasRequiredValue = userClaimArray.some((claim) =>
        allowedValues.includes(claim)
      );
    } else {
      // User's claim is a single value (e.g., "role": "admin")
      // Ensure single value is treated as string
      const userClaimString: string = String(userClaimValue); // Convert to string

      // Check if this single value is in the allowedValues list
      hasRequiredValue = allowedValues.includes(userClaimString);
    }

    // 5. Proceed or deny based on the check
    if (hasRequiredValue) {
      next(); // User has the required claim value, proceed to the route handler
    } else {
      console.warn(
        `User claim "${claimKey}" with value(s) "${JSON.stringify(
          userClaimValue
        )}" does not match any of the allowed values "${allowedValues.join(
          ", "
        )}"`
      );
      res.sendStatus(403); // Forbidden
    }
  };
}
