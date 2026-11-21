export function LoadingIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2" role="status">
      <span aria-hidden="true" className="size-5 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />
      {label}
    </span>
  );
}
