import { useState } from 'react';
import { Mascot } from '@/components/Mascot';

const GREETINGS = [
  '안녕! 오늘은 뭐 할까? 👋',
  '다시 왔네, 반가워!',
  '어떤 책이 기다릴까?',
  '오늘도 즐겁게 읽어보자!',
];

function pickGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

interface WelcomeHeaderProps {
  bookCount: number;
}

export function WelcomeHeader({ bookCount }: WelcomeHeaderProps) {
  const [greeting] = useState(pickGreeting);
  return (
    <div className="bg-gradient-to-br from-peach-100 to-peach-200 rounded-lg p-6 flex items-center gap-5 mb-6">
      <Mascot state="waving" size="lg" />
      <div>
        <h1 className="text-2xl font-black text-ink-900 font-display">{greeting}</h1>
        <p className="text-ink-700 font-semibold mt-1">{bookCount}권이 너를 기다려</p>
      </div>
    </div>
  );
}
