import type { CSSProperties } from "react";

/** React Bits Blur Text effect adapted to CSS and the existing reveal observer.
 * Reference: https://reactbits.dev/text-animations/blur-text
 */
export function BlurText({ text }: { text: string }) {
  return (
    <span className="hero-blur-text">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((word, index) =>
          /^\s+$/.test(word) ? word : (
            <span
              key={index}
              className="hero-blur-word"
              style={{ "--blur-delay": `${Math.min(index / 2, 8) * 90}ms` } as CSSProperties}
            >
              {word}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
