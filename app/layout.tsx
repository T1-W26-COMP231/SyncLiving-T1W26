import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncLiving — Find Your Perfect Roommate",
  description: "Compatibility-first roommate matching based on lifestyle, habits, and values.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="antialiased font-sans">
        {children}
        {modal}
      </body>
    </html>
  );
}
