'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { AtSymbolIcon, ExclamationCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import { authenticate, signInWithGitHub, signInWithGoogle } from '@/app/lib/actions';
import { lusitana } from '@/app/ui/fonts';
import { Button } from './button';
import { useSearchParams } from 'next/navigation';

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 2.5 3.3 1.8.1-.7.4-1.2.7-1.4-2.7-.3-5.6-1.3-5.6-6a4.7 4.7 0 0 1 1.2-3.2c-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.2-1.5 3.2-1.2 3.2-1.2.7 1.7.3 2.9.2 3.2a4.7 4.7 0 0 1 1.2 3.2c0 4.8-2.9 5.7-5.6 6 .4.3.8 1 .8 2.1v3.1c0 .4.2.7.8.6A12 12 0 0 0 12 .5"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v4.1h5.7c-.2 1.3-1.6 3.9-5.7 3.9A6.2 6.2 0 1 1 12 5.8c2.2 0 3.7.9 4.6 1.8l3.1-3A10.3 10.3 0 1 0 22.2 12c0-.7-.1-1.2-.2-1.8H12z" />
      <path fill="#34A853" d="M3.2 7.3l3.4 2.5A6.2 6.2 0 0 1 12 5.8c2.2 0 3.7.9 4.6 1.8l3.1-3A10.2 10.2 0 0 0 3.2 7.3z" />
      <path fill="#FBBC05" d="M12 22.2c2.8 0 5.1-.9 6.8-2.5l-3.2-2.6c-.8.6-2 1.1-3.6 1.1-2.8 0-5.2-1.9-6-4.5L2.6 16A10.3 10.3 0 0 0 12 22.2z" />
      <path fill="#4285F4" d="M22.2 12c0-.7-.1-1.2-.2-1.8H12v4.1h5.7c-.3 1.2-1.2 2.2-2.1 2.9l3.2 2.6c1.8-1.6 2.9-4.1 2.9-7.8z" />
    </svg>
  );
}

export default function LoginForm({
  githubEnabled,
  googleEnabled,
}: {
  githubEnabled: boolean;
  googleEnabled: boolean;
}) {
  const searchParams = useSearchParams();
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const oauthError = searchParams.get('oauth');
  const oauthHint =
    oauthError === 'github_not_configured'
      ? 'GitHub login is not configured yet.'
      : oauthError === 'google_not_configured'
        ? 'Google login is not configured yet.'
        : null;

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>Please log in to continue.</h1>
        <div className="w-full">
          <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              required
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
              id="password"
              type="password"
              name="password"
              placeholder="Enter password"
              required
              minLength={6}
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <Button className="mt-4 w-full" aria-disabled={isPending}>
          Log in <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>

        <div className="mt-3 flex items-center justify-between text-sm">
          <Link className="text-blue-600 hover:underline" href="/create">
            Create account
          </Link>
          <Link className="text-blue-600 hover:underline" href="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <div className="flex min-h-8 items-end space-x-1">
          {errorMessage ? (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          ) : null}
        </div>

        <div className="my-4 h-px bg-gray-200" />
        <p className="mb-3 text-sm text-gray-600">Other sign in methods</p>
        <div className="flex items-center gap-3">
          {githubEnabled ? (
            <button
              type="submit"
              aria-label="Continue with GitHub"
              formAction={signInWithGitHub}
              formNoValidate
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-800 transition-colors hover:bg-gray-100"
            >
              <GitHubIcon />
            </button>
          ) : null}
          {googleEnabled ? (
            <button
              type="submit"
              aria-label="Continue with Google"
              formAction={signInWithGoogle}
              formNoValidate
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 transition-colors hover:bg-gray-100"
            >
              <GoogleIcon />
            </button>
          ) : null}
          {!githubEnabled && !googleEnabled ? (
            <p className="text-xs text-gray-500">No social provider configured.</p>
          ) : null}
        </div>
        {oauthHint ? <p className="mt-2 text-xs text-red-500">{oauthHint}</p> : null}
      </div>
    </form>
  );
}
