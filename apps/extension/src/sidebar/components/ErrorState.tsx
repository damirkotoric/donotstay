interface ErrorStateProps {
  message: string;
}

function ErrorState({ message }: ErrorStateProps) {
  const handleRetry = () => {
    window.parent.postMessage({ type: 'RETRY_ANALYSIS' }, '*');
  };

  return (
    <div className="flex flex-col items-center justify-center py-15 px-5 text-center">
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-2xl text-red-600 dark:text-red-400 mb-4">
        !
      </div>
      <div className="text-base text-foreground mb-4">{message}</div>
      <button
        className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-none py-3.5 px-7 rounded-xl text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30"
        onClick={handleRetry}
      >
        Try Again
      </button>
    </div>
  );
}

export default ErrorState;
