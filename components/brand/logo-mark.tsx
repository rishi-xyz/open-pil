// OpenPIL mark: a petition sheet with a punched seal, filed on two ledger blocks.
// Keep in sync with app/icon.svg (favicon) and app/apple-icon.png.
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="#0A6577" />
      <path fill="#FFFFFF" fillRule="evenodd" d="M8 4h12l4 4v8H8zM16 7a3 3 0 1 0 0 6a3 3 0 1 0 0-6z" />
      <path fill="#FFFFFF" d="M8 18h16v4H8zM8 24h16v4H8z" />
    </svg>
  );
}
