'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { resetPassword } from '@/app/lib/actions';
import { lusitana } from '@/app/ui/fonts';
import { Button } from './button';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [message, formAction, isPending] = useActionState(resetPassword, undefined);
  const isSuccess = Boolean(message && message.toLowerCase().includes('password updated'));

  return (
    <form action={formAction} className="space-y-3">
      <div className="rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>Set new password</h1>
        <input type="hidden" name="token" value={token} />

        <label className="mb-2 mt-3 block text-xs font-medium text-gray-900" htmlFor="new-password">
          New password
        </label>
        <input
          className="block w-full rounded-md border border-gray-200 px-3 py-[9px] text-sm placeholder:text-gray-500"
          id="new-password"
          type="password"
          name="password"
          placeholder="Enter new password"
          required
          minLength={6}
        />

        <label className="mb-2 mt-3 block text-xs font-medium text-gray-900" htmlFor="confirm-password">
          Confirm password
        </label>
        <input
          className="block w-full rounded-md border border-gray-200 px-3 py-[9px] text-sm placeholder:text-gray-500"
          id="confirm-password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm new password"
          required
          minLength={6}
        />

        <Button type="submit" className="mt-4 w-full justify-center" aria-disabled={isPending}>
          Update password
        </Button>

        <div className="mt-2 min-h-8">
          {message ? (
            <p className={`text-sm ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
          ) : null}
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
