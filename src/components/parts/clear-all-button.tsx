"use client";

type ClearAllButtonProps = {
  action: (formData: FormData) => Promise<void>;
};

const ClearAllButton = ({ action }: ClearAllButtonProps) => {
  return (
    <form
      action={action}
      method="post"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Are you sure you want to clear all parts purchases? This cannot be undone.",
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-full bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
      >
        Clear all
      </button>
    </form>
  );
};

export default ClearAllButton;
