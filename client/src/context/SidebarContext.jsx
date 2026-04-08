import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMobile = () => window.innerWidth <= 992;

  const toggle = useCallback(() => {
    if (isMobile()) {
      setMobileOpen(o => !o);
    } else {
      setCollapsed(c => !c);
    }
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close mobile sidebar on route change or resize past breakpoint
  useEffect(() => {
    const onResize = () => {
      if (!isMobile()) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
