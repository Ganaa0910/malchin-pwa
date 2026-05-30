export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[420px] min-h-dvh md:flex md:max-w-md md:items-center">
      <div className="w-full">{children}</div>
    </div>
  );
}
