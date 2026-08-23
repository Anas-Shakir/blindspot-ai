"use client";

import React, { useState, useEffect } from "react";

export interface RobotCompanionWrapperProps {
  isFast?: boolean;
}

export default function RobotCompanionWrapper({
  isFast = false,
}: RobotCompanionWrapperProps) {
  const [Component, setComponent] = useState<React.ComponentType<{
    isFast?: boolean;
    className?: string;
  }> | null>(null);

  useEffect(() => {
    let isMounted = true;
    import("./RobotCompanion").then((mod) => {
      if (isMounted) {
        setComponent(() => mod.default);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!Component) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border border-blue-500/20 bg-blue-500/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <Component isFast={isFast} className="w-full h-full min-h-[300px]" />
    </div>
  );
}
