/**
 * Root loading state: instant feedback on every navigation — a calm
 * skeleton in the app's light style instead of a blank screen.
 */
export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col gap-4 bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <div className="flex items-center justify-between">
        <span className="size-10 animate-pulse rounded-full bg-[#e9e2ef]" />
        <span className="h-4 w-32 animate-pulse rounded-full bg-[#e9e2ef]" />
        <span className="size-10 animate-pulse rounded-full bg-[#e9e2ef]" />
      </div>
      <div className="mt-2 h-44 animate-pulse rounded-[1.8rem] bg-gradient-to-br from-[#e6ddf0] to-[#f0e4ec]" />
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-[#e9e2ef]" />
      <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#e9e2ef]" />
      <div className="mt-2 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-white" />
        <div className="h-20 animate-pulse rounded-2xl bg-white" />
        <div className="h-20 animate-pulse rounded-2xl bg-white" />
      </div>
    </main>
  );
}
