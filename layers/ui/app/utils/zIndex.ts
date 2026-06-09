export const Z = {
  overlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const

export type ZLevel = keyof typeof Z
