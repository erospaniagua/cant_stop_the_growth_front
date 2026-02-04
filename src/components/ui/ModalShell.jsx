export default function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-[min(900px,92vw)] max-h-[85vh] overflow-auto rounded-xl
                      bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            {title}
          </h2>
          <button
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
