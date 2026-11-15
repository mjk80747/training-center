import { motion, type HTMLMotionProps } from "framer-motion";

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles = variant === 'primary'
    ? 'bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white shadow-md shadow-violet-950/15 hover:brightness-105 focus-visible:outline-violet-400'
    : 'border border-violet-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-violet-400';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
      className={`min-h-11 rounded-[11px] px-4 py-2 font-semibold transition-all duration-200 ${styles} ${className}`}
    />
  );
}
