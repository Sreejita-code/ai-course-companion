import { type CSSProperties } from 'react';

export function generateTheme(topic: string): CSSProperties {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = topic.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate base hue (0-360)
  const h = Math.abs(hash % 360);
  // Complementary hue for accents
  const hAccent = (h + 30) % 360;

  return {
    // Override Shadcn/Tailwind CSS variables
    '--primary': `${h} 70% 35%`,
    '--primary-foreground': '0 0% 100%',
    '--secondary': `${h} 30% 96%`,
    '--secondary-foreground': `${h} 70% 20%`,
    '--accent': `${hAccent} 85% 60%`,
    '--accent-foreground': '0 0% 100%',
    '--ring': `${h} 70% 35%`,
    
    // Custom variables for gradients if needed
    '--gold-gradient-start': `${hAccent} 80% 60%`,
    '--gold-gradient-end': `${hAccent} 90% 40%`,
  } as CSSProperties;
}