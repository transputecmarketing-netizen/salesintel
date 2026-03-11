"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimeAgoProps {
  date: string | Date;
  className?: string;
}

export default function TimeAgo({ date, className }: TimeAgoProps) {
  const [text, setText] = useState(() => timeAgo(date));

  useEffect(() => {
    setText(timeAgo(date));
    const interval = setInterval(() => setText(timeAgo(date)), 60_000);
    return () => clearInterval(interval);
  }, [date]);

  return (
    <time
      dateTime={typeof date === "string" ? date : date.toISOString()}
      className={cn("text-xs text-[var(--text-tertiary)]", className)}
      title={new Date(date).toLocaleString()}
    >
      {text}
    </time>
  );
}
