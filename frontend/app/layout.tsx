import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Tokenized RWA Fund",
  description:
    "A tokenized feeder fund that issues stablecoin-denominated tokens against off-chain hedge fund units.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 pb-20">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
