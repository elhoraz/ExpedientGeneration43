"use client";

import React, { createContext, useContext, useMemo } from "react";

type SiteContent = {
  content_key: string;
  content_value: string;
  content_type: string;
};

type CmsContextType = {
  contents: SiteContent[];
  t: (key: string, defaultValue: string) => string;
};

const CmsContext = createContext<CmsContextType>({
  contents: [],
  t: (key, defaultValue) => defaultValue,
});

export function CmsProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode;
  initialData: SiteContent[];
}) {
  const t = useMemo(() => {
    // Create a fast lookup map
    const map = new Map<string, string>();
    initialData.forEach(c => map.set(c.content_key, c.content_value));
    
    return (key: string, defaultValue: string) => {
      return map.get(key) || defaultValue;
    };
  }, [initialData]);

  return (
    <CmsContext.Provider value={{ contents: initialData, t }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  return useContext(CmsContext);
}
