import { LogoFull } from '@/components/Logo';

export default function CheckoutSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
      <div className="max-w-md p-8 rounded-xl bg-white shadow-sm">
        <div className="mb-6">
          <LogoFull height={32} />
        </div>
        <div className="text-5xl mb-4 text-emerald-500">&#10003;</div>
        <h1 className="text-2xl font-semibold mb-4 text-gray-900">
          Payment Successful!
        </h1>
        <p className="text-gray-700 mb-4">
          Your credits have been added to your account.
        </p>
        <p className="text-sm text-gray-500">
          You can close this tab and return to the extension.
        </p>
      </div>
    </div>
  );
}
