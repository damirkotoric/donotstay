function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-15 px-5 text-center">
      <div className="w-12 h-12 border-3 border-border border-t-destructive rounded-full animate-spin mb-4" />
      <div className="text-base text-muted-foreground">Analyzing reviews...</div>
    </div>
  );
}

export default LoadingState;
