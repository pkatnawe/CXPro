"use client";

import { createContext, useContext, useState } from "react";

interface BreadcrumbLabelContextValue {
  entityLabel: string | null;
  setEntityLabel: (label: string | null) => void;
}

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue>({
  entityLabel: null,
  setEntityLabel: () => {},
});

export function BreadcrumbLabelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entityLabel, setEntityLabel] = useState<string | null>(null);
  return (
    <BreadcrumbLabelContext.Provider value={{ entityLabel, setEntityLabel }}>
      {children}
    </BreadcrumbLabelContext.Provider>
  );
}

export function useBreadcrumbLabel() {
  return useContext(BreadcrumbLabelContext);
}
