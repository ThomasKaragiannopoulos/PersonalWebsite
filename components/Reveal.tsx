"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = HTMLMotionProps<"section"> & {
  children: ReactNode;
  delay?: number;
};

export function RevealSection({
  children,
  delay = 0,
  transition,
  ...props
}: RevealProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as const,
        delay,
        ...transition,
      }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

type HoverCardProps = HTMLMotionProps<"article"> & {
  children: ReactNode;
};

export function HoverCard({
  children,
  className,
  transition,
  ...props
}: HoverCardProps) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1] as const,
        ...transition,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.article>
  );
}
