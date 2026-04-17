import { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  /** Array of lines to type sequentially */
  lines: string[];
  /** Milliseconds per character (default 50) */
  delay?: number;
  /** Pause between lines in ms (default 300) */
  linePause?: number;
  /** CSS class for the container */
  className?: string;
  /** Called once when ALL lines finish typing */
  onComplete?: () => void;
}

export function Typewriter({
  lines,
  delay = 50,
  linePause = 300,
  className = "",
  onComplete,
}: TypewriterProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Type character by character
  useEffect(() => {
    if (allDone) return;

    const fullText = lines[currentLine];

    // If we've typed all chars in this line
    if (charIndex >= fullText.length) {
      if (currentLine === lines.length - 1) {
        // Stop completely at the very end
        setAllDone(true);
        onCompleteRef.current?.();
        return;
      }
      
      // Pause then advance to next line
      const timer = setTimeout(() => {
        setCurrentLine(prev => prev + 1);
        setCharIndex(0);
      }, linePause);
      return () => clearTimeout(timer);
    }

    // Type next character
    const timer = setTimeout(() => {
      setCharIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentLine, charIndex, lines, delay, linePause, allDone]);

  return (
    <span className={`grid ${className}`}>
      {/* Hidden layer pre-allocates exact maximum bounding box to prevent layout shifts */}
      <span className="invisible col-start-1 row-start-1 pointer-events-none" aria-hidden="true">
        {lines.map((line, i) => (
          <span key={`hidden-${i}`} className="block">{line}</span>
        ))}
      </span>
      
      {/* Visible typing layer */}
      <span className="col-start-1 row-start-1">
        {lines.map((line, i) => {
          // If we are past this line, render it fully
          if (i < currentLine) {
            return <span key={i} className="block">{line}</span>;
          }
          // If we are currently typing this line
          if (i === currentLine) {
            return (
              <span key={i} className="block">
                {line.slice(0, charIndex)}
                {/* Native font-metric cursor prevents line-height divergence */}
                {!allDone && (
                  <span
                    className="inline-block ml-1 font-mono align-baseline"
                    style={{ animation: "twBlink 1s step-start infinite" }}
                  >
                    |
                  </span>
                )}
              </span>
            );
          }
          // If we haven't reached this line yet, render nothing
          return null;
        })}
      </span>
      <style>{`
        @keyframes twBlink {
          0%, 100% { opacity: 1 }
          50% { opacity: 0 }
        }
      `}</style>
    </span>
  );
}
