import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منيو بيت الدالة",
  description: "قائمة أسعار منتجات بيت الدالة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Cairo', sans-serif;
          }
        `}</style>
      </head>
      <body className="antialiased selection:bg-coffee-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
