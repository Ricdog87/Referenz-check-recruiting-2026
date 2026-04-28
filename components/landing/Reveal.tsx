'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import { useRef } from 'react'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
  duration?: number
}

const variants: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

export function Reveal({ children, delay = 0, y = 30, className, once = true, duration = 0.7 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: { opacity: 0, y, filter: 'blur(8px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)' },
      }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.08,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  y = 24,
}: {
  children: React.ReactNode
  className?: string
  y?: number
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y, filter: 'blur(6px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
