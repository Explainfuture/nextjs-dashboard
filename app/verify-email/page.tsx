import Link from 'next/link';
import AcmeLogo from '@/app/ui/acme-logo';
import { verifyEmailByToken } from '@/app/lib/auth-db';

export default async function VerifyEmailPage(props: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token;
  const isVerified = token ? await verifyEmailByToken(token) : false;

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[420px] flex-col space-y-2.5 p-4 md:-mt-24">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-28">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 px-6 py-8">
          <p className={`text-sm ${isVerified ? 'text-green-700' : 'text-red-500'}`}>
            {isVerified
              ? 'Email verified successfully. You can now log in.'
              : 'Verification link is invalid or expired.'}
          </p>
          <Link className="mt-4 inline-block text-sm text-blue-600 hover:underline" href="/login">
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}
