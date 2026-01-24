// Main auth exports - import everything from here
// Following AudioStoryV2 pattern for clean imports

// Core NextAuth exports
export { auth, signIn, signOut, handlers } from './config';

// Session helpers
export { getSession, getUser, checkAuth, isAuthenticated } from './helpers';

// Server actions
export {
  loginAction,
  logoutAction,
  logoutAndRedirect,
  initiateKeycloakLogin,
  initiateLogin, // Alias for initiateKeycloakLogin
  registerUser,
  checkAuthAction,
  getCurrentAuthUser,
  type LoginState,
  type RegisterResult,
} from './actions';

// Route configuration
export {
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
  protectedRoutes,
  authRoutes,
  isPublicRoute,
  isProtectedRoute,
  requiresWorkspaceContext,
} from './routes';
