import { useState, useEffect } from 'react';

interface Breakpoints {
  lg?: number;
  md?: number;
  sm: number;
}

export function useResponsiveColumns(breakpoints: Breakpoints): number {
  const getColumns = () => {
    const width = window.innerWidth;
    if (breakpoints.lg && width >= 1024) return breakpoints.lg;
    if (breakpoints.md && width >= 768) return breakpoints.md;
    return breakpoints.sm;
  };

  const [columns, setColumns] = useState(getColumns);

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints.lg, breakpoints.md, breakpoints.sm]);

  return columns;
}
