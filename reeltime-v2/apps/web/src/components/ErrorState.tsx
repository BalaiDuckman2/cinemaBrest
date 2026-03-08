interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Warning triangle icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="mb-6 h-16 w-16 text-rouge-cinema/60"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>

      <p className="text-center font-crimson text-body text-rouge-cinema">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded bg-rouge-cinema px-4 py-2 font-bebas text-label text-creme-ecran transition-colors hover:bg-bordeaux-profond"
      >
        Reessayer
      </button>
    </div>
  );
}
