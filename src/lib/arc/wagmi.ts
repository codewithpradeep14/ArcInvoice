import { createConfig, http, injected } from "wagmi";
import { arcMainnet, arcTestnet } from "@/config/arc";

export const wagmiConfig = createConfig({
  chains: [arcMainnet, arcTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [arcMainnet.id]: http(arcMainnet.rpcUrls.default.http[0]),
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
});
