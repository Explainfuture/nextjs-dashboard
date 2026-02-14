'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordReset } from '@/app/lib/actions';
import { lusitana } from '@/app/ui/fonts';
import { Button } from './button';

export default function ForgotPasswordForm() {
  const [message, formAction, isPending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>Reset password</h1>
        <p className="mb-3 text-sm text-gray-600">Enter your email and we will send a reset link.</p>

        <label className="mb-2 block text-xs font-medium text-gray-900" htmlFor="forgot-email">
          Email
        </label>
        <input
          className="block w-full rounded-md border border-gray-200 px-3 py-[9px] text-sm placeholder:text-gray-500"
          id="forgot-email"
          type="email"
          name="email"
          placeholder="Enter your email address"
          required
        />

        <Button type="submit" className="mt-4 w-full justify-center" aria-disabled={isPending}>
          Send reset link
        </Button>

        <div className="mt-2 min-h-8">
          {message ? <p className="text-sm text-gray-700">{message}</p> : null}
        </div>

        <p className="text-sm text-gray-600">
          Back to{' '}
          <Link className="text-blue-600 hover:underline" href="/login">
            login
          </Link>
        </p>
      </div>
    </form>
  );
}
