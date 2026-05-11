import { Header } from "@/components/Header";
import { LiveFundProvider } from "@/contexts/LiveFundProvider";
import { NotDeployedBanner } from "@/components/NotDeployedBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LiveFundProvider>
      <NotDeployedBanner />
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20">{children}</main>
    </LiveFundProvider>
  );
}
