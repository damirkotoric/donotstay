import { Check } from '@phosphor-icons/react/dist/ssr';
import { LogoFull } from '@/components/Logo';

export default function CheckoutSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50 gap-12">
      <div className="mb-6 flex justify-center">
        <LogoFull height={32} />
      </div>
      <div className="max-w-md p-8 rounded-xl bg-white shadow-sm">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check size={28} weight="bold" className="text-white" />
        </div>
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
