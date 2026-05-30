'use client'

import { useState, useEffect } from 'react'

interface AnimatedUserNameProps {
  name: string
  className?: string
}

export default function AnimatedUserName({ name, className = '' }: AnimatedUserNameProps) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([])

  useEffect(() => {
    if (!name) return

    const words = name.split(' ')
    let currentIndex = 0

    // Animate words appearing from right to left
    const interval = setInterval(() => {
      if (currentIndex <= words.length) {
        // Build array from right to left
        const animated = words.slice(Math.max(0, words.length - currentIndex - 1))
        setDisplayedWords(animated)
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 200) // 200ms delay between each word

    return () => clearInterval(interval)
  }, [name])

  return (
    <div className={`flex flex-wrap gap-2 justify-start items-center ${className}`}>
      {displayedWords.map((word, idx) => (
        <span
          key={idx}
          className="text-lg font-bold text-gray-900 animate-slideInRight"
          style={{
            animation: `slideInRight 0.4s ease-out forwards`,
            animationDelay: `${idx * 0.1}s`,
          }}
        >
          {word}
        </span>
      ))}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
