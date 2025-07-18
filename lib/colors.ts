// lib/colors.ts
export const NOTEBOOK_COLORS = [
  "border-blue-500",
  "border-green-500",
  "border-purple-500",
  "border-orange-500",
  "border-red-500",
  "border-teal-500",
  "border-indigo-500",
  "border-pink-500",
]

export const getNotebookColor = (index: number): string => {
  return NOTEBOOK_COLORS[index % NOTEBOOK_COLORS.length]
}
