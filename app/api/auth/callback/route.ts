import { NextRequest, NextResponse } from 'next/server';
import { handleAuthCallback } from '@/lib/actions/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }

  // Validate required parameters
  if (!code || !state) {
    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set('error', 'Missing authorization code or state');
    return NextResponse.redirect(errorUrl);
  }

  // Handle the callback
  const result = await handleAuthCallback(code, state);

  if (!result.success) {
    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set('error', result.error || 'Authentication failed');
    return NextResponse.redirect(errorUrl);
  }

  // Redirect to the return URL or workspaces page
  const redirectUrl = new URL(result.redirectTo || '/workspaces', request.url);

  // If redirecting to root or a workspace page, add redirect param for workspace selection
  if (result.redirectTo === '/' || !result.redirectTo) {
    redirectUrl.pathname = '/workspaces';
    redirectUrl.searchParams.set('redirect', '/');
  }

  return NextResponse.redirect(redirectUrl);
}
