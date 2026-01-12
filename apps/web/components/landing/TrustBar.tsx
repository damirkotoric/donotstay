export function TrustBar() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Works on:</span>
            <span className="font-semibold text-gray-900">Booking.com</span>
          </div>
          <div className="hidden h-4 w-px bg-gray-300 sm:block" />
          <div className="flex items-center gap-2 text-sm">
            <span>Coming soon:</span>
            <span className="text-gray-400">Airbnb</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400">Expedia</span>
          </div>
        </div>
      </div>
    </section>
  );
}
