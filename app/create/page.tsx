import AcmeLogo from '@/app/ui/acme-logo';
import CreateAccountForm from '@/app/ui/create-account-form';

export default function CreatePage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[420px] flex-col space-y-2.5 p-4 md:-mt-24">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-28">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <CreateAccountForm />
      </div>
    </main>
  );
}
