"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { Web3Provider } from "./web3-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Web3Provider>
        {children}
      </Web3Provider>
    </AuthProvider>
  );
}
