/** Contenedores de entrada en stagger (fade + slide-up), respetando reduced-motion. */

import { motion, type Variants } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function Stagger({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<typeof motion.div>) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" {...props}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<typeof motion.div>) {
  return (
    <motion.div variants={item} {...props}>
      {children}
    </motion.div>
  );
}

export { item as staggerItemVariants };
