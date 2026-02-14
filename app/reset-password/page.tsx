import AcmeLogo from '@/app/ui/acme-logo';
import ResetPasswordForm from '@/app/ui/reset-password-form';

export default async function ResetPasswordPage(props: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[420px] flex-col space-y-2.5 p-4 md:-mt-24">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-28">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-lg bg-gray-50 px-6 py-8 text-sm text-red-500">
            Invalid reset link. Please request a new one.
          </div>
        )}
      </div>
    </main>
  );
}
