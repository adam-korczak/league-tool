"use client";

import { useEffect, useState } from "react";

const LINES = [
  "Asking Riot nicely...",
  "Counting your deaths. This may take a while...",
  "Reviewing your ward placements. Won't take long...",
  "Blaming the jungler...",
  "Looking for your CS. It's around here somewhere...",
  "Calculating how much of this was your fault...",
];

export function LoadingQuip() {
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(Math.floor(Math.random() * LINES.length));
    const timer = setInterval(() => setI((n) => (n + 1) % LINES.length), 2000);
    return () => clearInterval(timer);
  }, []);

  return <p className="text-center text-sm text-muted italic">{LINES[i]}</p>;
}
