'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { registerWithEmail } from '@/app/lib/actions';
import { lusitana } from '@/app/ui/fonts';
import { Button } from './button';

export default function CreateAccountForm() {
  const [message, formAction, isPending] = useActionState(registerWithEmail, undefined);
  const isError = Boolean(message && !message.toLowerCase().includes('account created'));

  return (
    <form action={formAction} className="space-y-3">
      <div className="rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>Create account</h1>

        <label className="mb-2 mt-3 block text-xs font-medium text-gray-900" htmlFor="register-name">
          Name
        </label>
        <input
          className="block w-full rounded-md border border-gray-200 px-3 py-[9px] text-sm placeholder:text-gray-500"
          id="register-name"
          type="text"
          name="name"
          placeholder="Enter your name"
          required
          minLength={2}
        />

        <label className="mb-2 mt-3 block text-xs font-medium text-gray-900" htmlFor="register-email">
          Email
        </label>
        <input
          className="block w-full rounded-md border border-gray-200 px-3 py-[9px] text-sm placeholder:text-gray-500"
          id="register-email"
          type="email"
          name="email"
          placeholder="Enter your email address"
          required
        />

        <label className="mb-2 mt-3 block text-xs font-medium text-gray-900" htmlFor="register-password">
          Password
        </label>
        <input
          className="block w-full rounded-md border border-gray-200 px-3 py-[9px] text-sm placeholder:text-gray-500"
          id="register-password"
          type="password"
          name="password"
          placeholder="Create a password"
          required
          minLength={6}
        />

        <Button type="submit" className="mt-4 w-full justify-center" aria-disabled={isPending}>
          Register
        </Button>

        <div className="mt-2 min-h-8">
          {message ? (
            <p className={`flex items-center gap-2 text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>
              {isError ? <ExclamationCircleIcon className="h-4 w-4" /> : null}
              {message}
            </p>
          ) : null}
        </div>

        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link className="text-blue-600 hover:underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
