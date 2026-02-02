"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface PortalNavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    href?: string;
}

export interface PortalNavConfig {
    title: string;
    items: PortalNavItem[];
    activeId: string;
    onItemClick: (id: string) => void;
}

interface MobileNavContextType {
    portalNavConfig: PortalNavConfig | null;
    setPortalNavConfig: (config: PortalNavConfig | null) => void;
    clearPortalNav: () => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export const useMobileNav = () => {
    const context = useContext(MobileNavContext);
    if (!context) {
        throw new Error("useMobileNav must be used within a MobileNavProvider");
    }
    return context;
};

interface MobileNavProviderProps {
    children: ReactNode;
}

export const MobileNavProvider = ({ children }: MobileNavProviderProps) => {
    const [portalNavConfig, setPortalNavConfigState] = useState<PortalNavConfig | null>(null);

    const setPortalNavConfig = useCallback((config: PortalNavConfig | null) => {
        setPortalNavConfigState(config);
    }, []);

    const clearPortalNav = useCallback(() => {
        setPortalNavConfigState(null);
    }, []);

    return (
        <MobileNavContext.Provider
            value={{
                portalNavConfig,
                setPortalNavConfig,
                clearPortalNav,
            }}
        >
            {children}
        </MobileNavContext.Provider>
    );
};

export default MobileNavContext;
