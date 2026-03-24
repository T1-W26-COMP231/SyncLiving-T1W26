import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
//import Navbar from '@/components/layout/Navbar';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${geistMono.variable} antialiased`}>

        {/*<Navbar userName={userName} />*/}

        {children}
        {modal}
      </body>
    </html>
  );
}
