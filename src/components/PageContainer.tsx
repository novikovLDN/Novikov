interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * When true, the container grows to a real dashboard width on lg+
   * (max-w-7xl, ~1280px) while staying narrow on mobile/tablet.
   * Use this on multi-pane screens like the dashboard.
   */
  wide?: boolean;
}

export default function PageContainer({ children, className = "", wide = false }: PageContainerProps) {
  const max = wide
    ? "max-w-2xl lg:max-w-[1240px]"
    : "max-w-2xl";
  const pad = wide
    ? "px-4 sm:px-6 lg:px-10"
    : "px-4 sm:px-6";
  return (
    <main className={`flex-1 ${pad} pb-6 ${max} mx-auto w-full ${className}`}>
      {children}
    </main>
  );
}
