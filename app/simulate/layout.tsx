import { Header } from "@/components/Header";
import { SimulatedFundProvider } from "@/contexts/SimulatedFundProvider";
import { TourProvider } from "@/contexts/TourContext";
import { SimulationBanner } from "@/components/SimulationBanner";
import { TourGuide } from "@/components/TourGuide";

export default function SimulateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SimulatedFundProvider>
      <TourProvider>
        <SimulationBanner />
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-32">{children}</main>
        <TourGuide />
      </TourProvider>
    </SimulatedFundProvider>
  );
}
