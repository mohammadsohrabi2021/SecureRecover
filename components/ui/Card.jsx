"use client";

import { motion } from "framer-motion";

export default function Card({ children, className = "", animate = true }) {
  const Comp = animate ? motion.div : "div";
  
  const animateProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};
  
  return (
    <Comp
      {...animateProps}
      className={`bg-white rounded-2xl shadow-xl p-8 ${className}`}
    >
      {children}
    </Comp>
  );
}