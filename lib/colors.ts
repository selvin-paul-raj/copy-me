// lib/colors.ts
export const NOTEBOOK_COLORS = [
  "border-blue-300",
  "border-green-300",
  "border-purple-300",
  "border-yellow-300",
  "border-pink-300",
  "border-indigo-300",
  "border-teal-300",
  "border-orange-300",
  "border-red-300",
  "border-cyan-300",
]

export function getNotebookColor(index: number): string {
  return NOTEBOOK_COLORS[index % NOTEBOOK_COLORS.length]
}
