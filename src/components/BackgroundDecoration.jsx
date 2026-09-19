import React from 'react';

export default function BackgroundDecoration({ theme }) {
  const themes = {
    'gudang': ['🧅', '🌶️', '🥬', '🌾', '☕', '🍵', '🥩', '🍗', '🧂', '🥦', '🥕', '🧄'],
    'resep': ['🍛', '☕', '🍢', '🍟', '🍔', '🍕', '🍜', '🍰', '🍣', '🥐', '🍦', '🍹'],
    'operasional': ['🏪', '⚡', '💧', '🔥', '💡', '🧹', '🧾', '🛒', '🛵', '📦', '📱', '📉'],
    'laba-rugi': ['💰', '💵', '💳', '🏦', '📈', '🤑', '💎', '🪙', '📊', '💸', '🧧', '🏧'],
    'dashboard': ['🍔', '💰', '🥬', '⚡', '🍜', '💳', '🌶️', '💡', '☕', '📈', '🥩', '🏪']
  };

  const emojis = themes[theme] || themes.dashboard;

  const positions = [
    // Kiri (Left Column) - Agak ke tengah sedikit
    { left: '4%', top: '5%', size: 'text-5xl', rotate: 'rotate-12' },
    { left: '10%', top: '15%', size: 'text-4xl', rotate: '-rotate-12', extraClass: 'hidden md:block' },
    { left: '6%', top: '25%', size: 'text-6xl', rotate: 'rotate-45' },
    { left: '14%', top: '35%', size: 'text-5xl', rotate: '-rotate-6', extraClass: 'hidden lg:block' },
    { left: '5%', top: '45%', size: 'text-4xl', rotate: 'rotate-12' },
    { left: '11%', top: '55%', size: 'text-6xl', rotate: '-rotate-12' },
    { left: '7%', top: '65%', size: 'text-5xl', rotate: 'rotate-6', extraClass: 'hidden md:block' },
    { left: '13%', top: '75%', size: 'text-4xl', rotate: '-rotate-45' },
    { left: '4%', top: '85%', size: 'text-6xl', rotate: 'rotate-12' },
    { left: '15%', top: '92%', size: 'text-5xl', rotate: '-rotate-12', extraClass: 'hidden lg:block' },

    // Kanan (Right Column) - Agak ke tengah sedikit
    { right: '5%', top: '8%', size: 'text-6xl', rotate: '-rotate-12' },
    { right: '12%', top: '18%', size: 'text-5xl', rotate: 'rotate-12', extraClass: 'hidden md:block' },
    { right: '4%', top: '28%', size: 'text-4xl', rotate: '-rotate-45' },
    { right: '14%', top: '38%', size: 'text-6xl', rotate: 'rotate-6', extraClass: 'hidden lg:block' },
    { right: '6%', top: '48%', size: 'text-5xl', rotate: '-rotate-12' },
    { right: '13%', top: '58%', size: 'text-4xl', rotate: 'rotate-12' },
    { right: '7%', top: '68%', size: 'text-6xl', rotate: '-rotate-6', extraClass: 'hidden md:block' },
    { right: '11%', top: '78%', size: 'text-5xl', rotate: 'rotate-45' },
    { right: '5%', top: '88%', size: 'text-4xl', rotate: '-rotate-12' },
    { right: '15%', top: '95%', size: 'text-6xl', rotate: 'rotate-12', extraClass: 'hidden lg:block' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex justify-center">
      <div className="w-full h-full relative">
        {positions.map((pos, i) => (
          <div 
            key={i} 
            className={`absolute opacity-20 ${pos.size} ${pos.rotate} select-none transition-transform duration-1000 ${pos.extraClass || ''}`}
            style={{ 
              left: pos.left, 
              right: pos.right, 
              top: pos.top
            }}
          >
            {emojis[i % emojis.length]}
          </div>
        ))}
      </div>
    </div>
  );
}
