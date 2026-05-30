'use client'

import { useState, useEffect } from 'react'

interface AnimatedUserNameProps {
  name: string
  className?: string
}

export default function AnimatedUserName({ name, className = '' }: AnimatedUserNameProps) {
  const [animatingWords, setAnimatingWords] = useState<{ word: string; index: number }[]>([])

  useEffect(() => {
    if (!name) return

    const words = name.split(' ')
    let currentIndex = 0

    // Animate words appearing one by one
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setAnimatingWords(prev => [...prev, { word: words[currentIndex], index: currentIndex }])
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 300) // 300ms delay between each word

    return () => {
      clearInterval(interval)
      setAnimatingWords([])
    }
  }, [name])

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {animatingWords.map(({ word, index }) => (
        <span
          key={index}
          className="font-bold text-gray-900 inline-block"
          style={{
            animation: `slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
            animationDelay: `0s`,
          }}
        >
          {word}
        </span>
      ))}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
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
