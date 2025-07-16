"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"

interface LineNumberedTextareaProps extends TextareaProps {
  value: string
}

const LineNumberedTextarea = React.forwardRef<HTMLTextAreaElement, LineNumberedTextareaProps>(
  ({ value, className, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const lineNumbersRef = React.useRef<HTMLDivElement>(null)

    const lines = value.split("\n")
    const lineCount = lines.length
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

    const handleScroll = () => {
      if (textareaRef.current && lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
      }
    }

    React.useImperativeHandle(ref, () => textareaRef.current!)

    return (
      <div className="relative flex h-full w-full overflow-hidden rounded-md border border-input bg-background">
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 overflow-hidden pr-2 text-right text-sm text-muted-foreground select-none py-2 font-mono"
          style={{ width: `${Math.max(3, String(lineCount).length + 1)}ch` }} // Dynamic width based on line count
        >
          {lineNumbers.map((num) => (
            <div key={num} className="h-[1.25rem] leading-5">
              {num}
            </div> // Adjust height/leading to match textarea line-height
          ))}
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onScroll={handleScroll}
          className={cn(
            "flex-1 resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 text-sm font-mono leading-5", // Ensure font-mono and matching line-height
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)
LineNumberedTextarea.displayName = "LineNumberedTextarea"

export { LineNumberedTextarea }
