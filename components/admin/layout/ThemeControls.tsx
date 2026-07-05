"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "autohaus-theme";

/** Inline pre-paint script — prevents a light/dark flash. Rendered server-side. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${KEY}');document.documentElement.classList.toggle('light', t==='light');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // localStorage is unavailable during SSR, so the stored preference can only
    // be read after mount — this sync cannot be a render-time initializer.
    const stored = localStorage.getItem(KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(KEY, next);
    document.documentElement.classList.toggle("light", next === "light");
  }

  return (
    <button
      onClick={toggle}
      className="flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
      aria-label="Превключи тема"
      title="Превключи тема"
    >
      {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
