import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';

/**
 * Paint mode (LetterFillCanvas) 데모 — 한글/영어/일본어 등 다양한 글자에서 채움 채점 검증.
 *
 * 좌측: 글자 그룹 list (자모 / 음절 / 단어 / 알파벳 / 일본어).
 * 우측: 선택된 글자의 큰 paint 캔버스. 사용자가 색칠해서 통과 / 미통과 확인.
 *
 * 같은 컴포넌트가 모든 언어 / 글자에 작동 — 폰트만 자동 감지 (한글=NanumSquareRound / 외 =system-ui).
 */

const GROUPS: Array<{ title: string; chars: string[] }> = [
  {
    title: '🇰🇷 한글 자모',
    chars: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅏ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'],
  },
  { title: '🇰🇷 한글 음절 — 받침 X', chars: ['가', '나', '다', '고', '구', '도', '나', '바'] },
  { title: '🇰🇷 한글 음절 — 받침 O', chars: ['각', '간', '갓', '국', '굴', '돈', '문', '발'] },
  { title: '🇰🇷 한글 단어 (첫 글자)', chars: ['꽃', '별', '거', '사', '나', '강', '물', '책'] },
  { title: '🇺🇸 영어 알파벳', chars: ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd', 'g', 'p', 'q', 'y'] },
  { title: '🇯🇵 일본어 (참고)', chars: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'ま', 'ん'] },
];

export default function LetterFillDemoPage() {
  const [currentChar, setCurrentChar] = useState<string>('가');
  const [threshold, setThreshold] = useState<number>(0.95);
  const [results, setResults] = useState<Record<string, { passed: boolean; coverage: number }>>({});

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <Link to="/library" className="text-sm text-slate-600 hover:text-slate-900">
          ← 라이브러리
        </Link>
        <h1 className="text-lg font-bold text-ink-900">🎨 Paint Mode 데모</h1>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <label className="font-bold text-ink-600">통과 기준:</label>
          <input
            type="range"
            min={0.3}
            max={0.9}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="font-black text-coral-600 w-12 text-center">
            {Math.round(threshold * 100)}%
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 p-6 max-w-[1200px] mx-auto">
        {/* 좌측: 글자 list */}
        <aside className="space-y-5">
          <p className="text-sm text-ink-600 leading-relaxed">
            글자 클릭 → 우측 캔버스에서 손가락/마우스로 색칠. 글자 영역 안만 채워짐 (밖은 자동
            무시). 채움 % 가 통과 기준 도달 시 ✓.
          </p>
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold text-ink-500 uppercase mb-2">{group.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                {group.chars.map((ch) => {
                  const r = results[ch];
                  const active = currentChar === ch;
                  return (
                    <button
                      key={ch}
                      onClick={() => setCurrentChar(ch)}
                      className={`relative w-12 h-12 rounded-lg text-xl font-black transition-all ${
                        active
                          ? 'bg-coral-500 text-white shadow-pop ring-2 ring-white scale-105'
                          : r?.passed
                            ? 'bg-emerald-500 text-white shadow-soft'
                            : r
                              ? 'bg-amber-100 text-ink-700 shadow-soft'
                              : 'bg-white text-ink-700 shadow-soft hover:bg-peach-50'
                      }`}
                    >
                      {ch}
                      {r?.passed && <span className="absolute -top-1 -right-1 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* 우측: paint 캔버스 */}
        <main>
          <div className="bg-white rounded-3xl shadow-pop p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-4xl font-black text-ink-900">
                <span className="text-coral-500">{currentChar}</span>
                <span className="text-ink-500 ml-3">색칠하기</span>
              </h2>
              <button
                onClick={() => {
                  setResults((prev) => {
                    const next = { ...prev };
                    delete next[currentChar];
                    return next;
                  });
                  // canvas 의 onClear 가 자기 state reset — 외부에선 key 변경으로 강제 remount
                  setCurrentChar((c) => {
                    // dummy reset trick: 같은 글자 재선택은 noop. force remount key 는 LetterFillCanvas key 가 처리.
                    return c;
                  });
                }}
                className="text-sm font-bold text-coral-600 hover:text-coral-800"
              >
                🔄 결과 초기화
              </button>
            </div>
            <LetterFillCanvas
              // threshold 또는 char 변경 시 강제 remount — 새 글자 mask 다시 계산
              key={`${currentChar}-${threshold}`}
              letter={currentChar}
              threshold={threshold}
              autoCheck
              onResult={(passed, coverage) => {
                setResults((prev) => ({ ...prev, [currentChar]: { passed, coverage } }));
              }}
            />
            <p className="text-xs text-ink-500 mt-4 leading-relaxed text-center">
              💡 한글은 NanumSquareRound, 영어는 system-ui, 일본어는 시스템 기본 — 폰트는 글자에
              따라 자동 감지.
              <br />
              composite mode `source-atop` 으로 글자 영역 안만 painted — 폰트 fidelity 100% 보장.
            </p>
          </div>

          {/* 결과 요약 */}
          {Object.keys(results).length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-soft p-5">
              <h3 className="text-sm font-bold text-ink-500 mb-3">테스트 결과</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(results).map(([ch, r]) => (
                  <div
                    key={ch}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      r.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <span className="text-lg font-black">{ch}</span>
                    <span className="font-bold">{Math.round(r.coverage * 100)}%</span>
                    <span>{r.passed ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
