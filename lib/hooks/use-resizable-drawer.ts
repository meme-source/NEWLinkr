"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizableDrawerOptions {
  defaultWidth: number;
  maxWidthPx?: number;
  maxWidthVw?: number;
}

export function useResizableDrawer({
  defaultWidth,
  maxWidthPx,
  maxWidthVw = 95,
}: UseResizableDrawerOptions) {
  const [width, setWidth] = useState(defaultWidth);
  const draggingRef = useRef(false);

  const startResize = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!draggingRef.current) return;
      const viewportWidth = window.innerWidth;
      const next = viewportWidth - event.clientX;
      const ceiling = maxWidthPx
        ? Math.min(maxWidthPx, viewportWidth * (maxWidthVw / 100))
        : viewportWidth * (maxWidthVw / 100);
      const clamped = Math.min(Math.max(next, defaultWidth), ceiling);
      setWidth(clamped);
    };

    const handleUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [defaultWidth, maxWidthPx, maxWidthVw]);

  return { width, startResize };
}
