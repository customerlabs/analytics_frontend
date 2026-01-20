export const apiAuthPrefix = "/api";
export const DEFAULT_LOGIN_REDIRECT = "/";


export const protectedRoutes = [
    "/favorite",
    "/history",
    "/account",
    "/account/history",
    "/account/profile",
    "/account/following",
    "/track",
    "/queue",
    "/listen-with-friends",
    "/recently-played",
    "/upload"
];

export const authRoutes = [
    "/login",
    "/get-started",
    "/forget-password",
    "/sign-up",
    "/verification", // Add verification route so it's accessible without login
];

/**
 * An array of main app routes for the application
 */
export const appRoutes = [
    "/",
    "/album",
    "/artist",
    "/chart",
    "/episode",
    "/label",
    "/mix",
    "/collections",
    "/search",
    "/show",
    "/song",
  ];