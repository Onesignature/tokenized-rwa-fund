import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, hardhat } from "wagmi/chains";
import { http } from "viem";

const network = process.env.NEXT_PUBLIC_NETWORK ?? "localhost";

export const wagmiConfig = getDefaultConfig({
  appName: "Tokenized RWA Fund",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo_project_id",
  chains: network === "sepolia" ? [sepolia] : [hardhat, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(),
  },
  ssr: true,
});
