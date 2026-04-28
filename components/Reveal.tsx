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
      viewport={{ once: false, amount: 0.05 }}
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.05 }}
      whileHover={{ y: -3 }}
      transition={{
        duration: 0.45,
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

type RevealListProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

export function RevealList({
  children,
  transition,
  ...props
}: RevealListProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.05 }}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.06,
            ...transition,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type RevealItemProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

export function RevealItem({
  children,
  transition,
  ...props
}: RevealItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1] as const,
            ...transition,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
