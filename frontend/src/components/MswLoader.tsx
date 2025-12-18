// _components/MswLoader.tsx
"use client";

import { useEffect } from "react";

export default function MswLoader() {
  useEffect(() => {
    console.log("[MSW] env", process.env.NEXT_PUBLIC_MOCK);

    if (process.env.NEXT_PUBLIC_MOCK === "true") {
      import("@/_lib/mocks/browser").then(async ({ worker }) => {
        await worker.start({
          onUnhandledRequest: "bypass", // 일단 조용히 통과
        });
        console.log("[MSW] worker started");
      });
    } else {
      console.log("[MSW] disabled");
    }
  }, []);

  return null;
}