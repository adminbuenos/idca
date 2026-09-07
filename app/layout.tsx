import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Indore Division Cricket Association",
  description: "Official website of Indore Division Cricket Association",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>

        <Footer />
      </body>
    </html>
  );
}