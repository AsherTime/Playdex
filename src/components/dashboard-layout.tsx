export function DashboardLayout({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}) {
  return (
    <div className={`grid gap-6 ${rightSidebar ? "xl:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
      <div className="min-w-0">{children}</div>
      {rightSidebar ? <div className="hidden xl:block">{rightSidebar}</div> : null}
    </div>
  );
}
