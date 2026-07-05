"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Set only in a post-mount effect on the client — so it never affects SSR
// output (no cross-request leak) and never runs during render.
let appMounted = false;

/**
 * Route transition. A controlled cross-fade between pages so navigation feels
 * like cutting between scenes. Opacity only (no transform/filter) so sticky
 * pinned sections keep working. The very first mount (SSR + hydration) does
 * NOT fade — keeps the LCP image from being held at opacity 0; only subsequent
 * client navigations cross-fade.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  // Capture once, at first render, whether this is the app's very first mount.
  // A lazy state initializer runs exactly once and is safe to read during render.
  const [isFirst] = useState(() => !appMounted);
  useEffect(() => {
    appMounted = true;
  }, []);

  return (
    <motion.div
      initial={isFirst ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
