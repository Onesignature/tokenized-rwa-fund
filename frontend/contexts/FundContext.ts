"use client";

import { createContext } from "react";
import type { FundContextValue } from "@/lib/fund-types";

export const FundContext = createContext<FundContextValue | null>(null);
