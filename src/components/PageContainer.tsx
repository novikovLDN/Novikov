interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <main className={`flex-1 px-4 sm:px-6 pb-6 max-w-2xl mx-auto w-full ${className}`}>
      {children}
    </main>
  );
}
