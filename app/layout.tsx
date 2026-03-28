import type { Metadata } from "next";
import "./globals.css";
//import Navbar from '@/components/layout/Navbar';

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

  const userName = "John Doe"; // Replace with actual user data

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          rel="stylesheet"
          href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="antialiased font-sans">

        {/*<Navbar userName={userName} />*/}

        {children}
        {modal}
      </body>
    </html>
  );
}
