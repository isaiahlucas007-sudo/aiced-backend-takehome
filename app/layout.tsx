export const metadata = {
  title: "Take-home sandbox",
  description: "Backend developer take-home",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
