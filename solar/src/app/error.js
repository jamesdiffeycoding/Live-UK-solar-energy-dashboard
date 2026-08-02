"use client";

// Catches anything the data layer in page.js did not anticipate, so an
// unexpected error renders a readable page instead of a white screen.
export default function Error({ error, reset }) {
  return (
    <>
      <div className="backgroundGradient -z-30"></div>
      <main className="flex h-screen flex-col items-center justify-center p-8 text-center">
        {/* AWESUN with "esun" struck out and "ful" added reads as AWFUL. */}
        <h1 className="text-3xl font-bold" aria-label="Awful">
          <span aria-hidden="true">
            AW
            <span className="struck-out">ESUN</span>
            FUL
          </span>
        </h1>
        <p className="pt-4">Something went wrong loading the solar data.</p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-700"
        >
          Try again
        </button>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-6 max-w-xl overflow-auto text-left text-xs text-slate-200">
            {error?.message}
          </pre>
        )}
      </main>
    </>
  );
}
