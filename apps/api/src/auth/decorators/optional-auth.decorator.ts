import { SetMetadata } from "@nestjs/common";

// Marks a route as accepting anonymous requests: the global JwtAuthGuard still tries to
// resolve a user from the access token if one is present, but never rejects the request
// when the token is missing/invalid. Used by citizen-facing emergency actions (SOS,
// incident reporting) that must work before/without registering an account.
export const IS_OPTIONAL_AUTH_KEY = "isOptionalAuth";
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
