"use client";

type Props = {
  hasAttachments: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function OsAnexoButton({ hasAttachments, onClick, disabled = false }: Props) {
  return (
    <button
      aria-label={hasAttachments ? "Ver anexos da OS" : "OS sem anexos"}
      className={hasAttachments ? "table-anexo table-anexo--ready" : "table-anexo table-anexo--empty"}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      title={hasAttachments ? "Ver anexos" : "Sem anexos"}
      type="button"
    >
      <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M8.5 7.5v8.25a3.5 3.5 0 1 0 7 0V7.25a2.25 2.25 0 0 0-4.5 0v8a1 1 0 1 0 2 0V8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
      Anexo
    </button>
  );
}
