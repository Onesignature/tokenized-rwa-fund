"use client";

import { useContext } from "react";
import { FundContext } from "@/contexts/FundContext";

export function useFund() {
  const ctx = useContext(FundContext);
  if (!ctx) {
    throw new Error(
      "useFund must be used inside a LiveFundProvider or SimulatedFundProvider"
    );
  }
  return ctx;
}
