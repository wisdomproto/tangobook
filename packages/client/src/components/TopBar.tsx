import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/store/theme.store';
import { VocabTreeModal } from '@/features/vocabulary/components/VocabTreeModal';

interface ResourceItem {
  href: string;
  icon: string;
  label: string;
  desc: string;
  /** SPA 라우트 (target=_blank 대신 internal navigate). default false (정적 HTML 새 탭). */
  internal?: boolean;
}

/**
 * 📖 창작동화 전용 메뉴 — 자료실에서 뺐다.
 * 🔴 시리즈가 열을 넘어서면서 자료실 목록의 절반을 창작동화가 차지했고, 다른 라인 기획서가
 *    스크롤 아래로 밀려 안 보였다. 시리즈는 40개까지 늘어날 예정이라 자리를 따로 준다.
 */
const CHANGJAK: ResourceItem[] = [
  {
    href: '/changjak-plan.html',
    icon: '📖',
    label: '탱고북 창작동화 1000 기획서',
    desc: '시리즈 40개 × 25권 · 4~6세 · 한 시리즈 = 같은 캐스트 + 한 그림체 · 주제군 8 × 엔진 8 × 무대 생성 시스템',
  },
  {
    href: '/changjak-styles.html',
    icon: '🎨',
    label: '앵커 후보 시트',
    desc: '최근 20년 수상 일러스트 99점 · 클러스터 10종 × 주제군 필터 + 카드별 STYLE ANCHOR 프롬프트 복사',
  },
  {
    href: '/pongi-plan.html',
    icon: '🦦',
    label: '01 · 퐁이네 운하 마을',
    desc: '아기 수달 퐁이 · 네덜란드 운하 · 가족(어른 셋+아이 둘) · 페파형 · 실크스크린 · 대본+SCENE 완성',
  },
  {
    href: '/mei-plan.html',
    icon: '🐐',
    label: '02 · 메이네 산마을',
    desc: '아기 염소 메이 + 또래 넷 · 알프스 · 결점 배역제 · 대발이형 · 색연필 · 대본+SCENE 완성',
  },
  {
    href: '/coco-plan.html',
    icon: '🐭',
    label: '03 · 코코네 빵집 골목',
    desc: '아기 생쥐 코코 · 파리 뒷골목 · 엄마 일터·단골들 · 페파형 · 활판 · 대본+SCENE',
  },
  {
    href: '/dodo-plan.html',
    icon: '🦆',
    label: '04 · 도도네 물방앗간',
    desc: '오리 남매 도도·무무 · 프랑스 시골 · 형제 둘 · 페파형(아는 척 누나) · 과슈 · 글 한여울 / 그림 윤새롬',
  },
  {
    href: '/bruno-plan.html',
    icon: '🐻',
    label: '05 · 브루노 할아버지네 숲',
    desc: '아기 곰 닐스와 할아버지 · 스웨덴 숲 사계절 · 조손 둘 · 대발이형 · 크레용 · 글 배도담 / 그림 차온유',
  },
  {
    href: '/twins-plan.html',
    icon: '🐰',
    label: '06 · 쌍둥이네 바닷가',
    desc: '토끼 쌍둥이 리리·롤로 · 포르투갈 어촌 · 쌍둥이 · 페파형(둘 다 틀림) · 리소 · 글 한여울 / 그림 임푸른',
  },
  {
    href: '/mio-plan.html',
    icon: '🐱',
    label: '07 · 미오네 유치원',
    desc: '아기 고양이 미오와 반 아이들 · 독일 강마을 · 학급 · 대발이형(배역제) · 리노컷 · 글 오하람 / 그림 강마루',
  },
  {
    href: '/pipo-plan.html',
    icon: '🐶',
    label: '08 · 피포네 돌담 목장',
    desc: '강아지 피포 · 아일랜드 목장 · 아이+이웃 어른들 · 페파형 · 숯 · 글 문나래 / 그림 백서리',
  },
  {
    href: '/nono-plan.html',
    icon: '🐦',
    label: '09 · 노노네 겨울 골목',
    desc: '아기 참새 노노와 또래 둘 · 유럽 옛 골목 겨울 · 또래 셋 · 대발이형 · 찢은 종이 · 글 배도담 / 그림 노아라',
  },
  {
    href: '/lulu-plan.html',
    icon: '🫏',
    label: '10 · 룰루네 올리브 언덕',
    desc: '아기 당나귀 룰루와 대가족 · 이탈리아 · 대가족 · 페파형 · 모노타이프 · 글 문나래 / 그림 유가온',
  },
  // ── 아시아 무대 (11~15) · 🔜 SCENE 미작성 ─────────────────────────────
  {
    href: '/bung-plan.html',
    icon: '🐃',
    label: '11 · 붕이네 물 위 장터',
    desc: '아기 물소 붕이 + 말 못 하는 동생 또리 · 베트남 메콩 수상시장 · 대발이형 · 민화 목판 · 글 서윤슬 / 그림 표유담',
  },
  {
    href: '/dingding-plan.html',
    icon: '🐷',
    label: '12 · 딩딩네 계단 논',
    desc: '아기 돼지 딩딩 · 중국 남부 계단 논 · 삼대(할머니·엄마) · 페파형 · 전지 · 글 서윤슬 / 그림 송가람',
  },
  {
    href: '/taro-plan.html',
    icon: '🐒',
    label: '13 · 타로와 무무',
    desc: '아기 원숭이 타로 + 아기 사슴 무무 · 인도네시아 섬 · 단짝 둘(집이 다르다) · 페파형 · 바틱 · 글 서윤슬 / 그림 민서하',
  },
  {
    href: '/yuki-plan.html',
    icon: '🦊',
    label: '14 · 유키네 산골',
    desc: '아기 여우 유키 + 말 못 하는 개 모모 · 일본 산촌 사계절 · 대발이형 · 수묵 담채 · 글 정미르 / 그림 서지운',
  },
  {
    href: '/mina-plan.html',
    icon: '🐘',
    label: '15 · 가운데 아이 미나',
    desc: '아기 코끼리 삼 남매 라주·미나·소누 · 인도 강가 · 나이 계단 · 대발이형 · 점묘 민화 · 글 정미르 / 그림 하다온',
  },
];

const RESOURCES: ResourceItem[] = [
  {
    href: '/saenghwal-plan.html',
    icon: '🐯',
    label: '호리네 생활동화 기획서',
    desc: '아기호랑이 호리 앙상블 8인 · 45편 커리큘럼·작법 + 회차별 대본·프롬프트(탭)',
  },
  {
    href: '/yuchiwon-plan.html',
    icon: '🌈',
    label: '호리네 유치원동화 기획서',
    desc: '무지개반 + 양 선생님 · 유치원 적응·사회정서 20편 (대발이 유치원동화 역설계) + 회차별 대본(☰ 회차)',
  },
  {
    href: '/tamheom-plan.html',
    icon: '🚒',
    label: '호리네 세상 탐험 기획서',
    desc: '논픽션 발견형 · 탈것·직업·세상 · 시즌1 탈것 15편(소방차~로켓) + 회차별 대본·프롬프트(☰ 회차)',
  },
  {
    href: '/jeonrae-plan.html',
    icon: '🏮',
    label: '탱고북 전래동화 기획서',
    desc: '우리 옛이야기 순수 각색 · 5~7세 · 시장조사·순화정책·작법 + 40편(시즌1·2) 커리큘럼(인기도 순)',
  },
  {
    href: '/jeonrae-heungbu.html',
    icon: '🏠',
    label: '전래동화 1 · 흥부와 놀부',
    desc: '15스프레드 대본 + 등장인물 8(가난/부자 상태별)·핵심단어 5 + 전체 프롬프트 복사(☰ 회차)',
  },
  {
    href: '/samgukji-plan.html',
    icon: '📕',
    label: '탱고북 삼국지 기획서',
    desc: '시리즈물 · 초등 저학년 · 도원결의~오장원 24권 96장 551쪽 + 캐릭터 시트 54장(권 번호가 정하는 나이·복장 59단계) + 권별 대본·발주 프롬프트(☰ 회차)',
  },
  {
    href: '/samgukji-read.html',
    icon: '📖',
    label: '탱고북 삼국지 — 글만 읽기',
    desc: '24권 551쪽 본문을 처음부터 끝까지 한 페이지에. 삽화 지시·발주 도구 없이 이야기만',
  },
  {
    href: '/hangeul-tree-plan.html',
    icon: '🌳',
    label: '한글 나무 파닉스 동화 기획서',
    desc: '호리 앙상블 니들펠트 · 한글 파닉스 32유닛 학습 장면형 동화(8쪽) + 회차별 대본·프롬프트(☰ 유닛)',
  },
  {
    href: '/abc-tree-plan.html',
    icon: '🔤',
    label: 'ABC 나무 파닉스 동화 기획서',
    desc: '한글 나무의 영어판(같은 마을·같은 캐스트) · 영어 파닉스 39유닛 + 타겟 단어 카드 388장(☰ 유닛)',
  },
  {
    href: '/learning-comic-franchise.html',
    icon: '🗺️',
    label: '학습만화 「타임 티코」 프랜차이즈',
    desc: '카테고리 맵·볼륨 규칙·브랜드 연속성 (최상위 인덱스)',
  },
  {
    href: '/learning-comic-plan.html',
    icon: '🕰️',
    label: '타임 티코 · 시대여행 기획서',
    desc: '시즌1 12화 · 세계관·캐릭터·작법 + 회차별 콘티(탭)',
  },
  {
    href: '/learning-comic-s2-plan.html',
    icon: '🏝️',
    label: '타임 티코 · 극한생존 기획서',
    desc: '무인도 6부작 · 조상 생존술+현대과학+건강+부모감사 + 회차별 콘티(탭)',
  },
  {
    href: '/library-master',
    icon: '📚',
    label: '라이브러리 마스터',
    desc: '카테고리·책 순서·메인 표지 편집',
    internal: true,
  },
  { href: '/pitch.html', icon: '💼', label: 'Series A Pitch', desc: '투자자용 16+1장 슬라이드' },
  {
    href: '/strategy.html',
    icon: '📋',
    label: '사업 전략서 (요약)',
    desc: '투자자 narrative · 19 슬라이드',
  },
  {
    href: '/strategy-detail.html',
    icon: '📚',
    label: '사업 전략서 (상세)',
    desc: 'Deep-dive · 모든 시각화·표·mockup',
  },
  {
    href: '/business-plan.html',
    icon: '🧭',
    label: '사업계획서 (AI 무투자 모델)',
    desc: '다국어 글로벌 · 자연관찰 · 무투자 고마진 70%',
  },
  {
    href: '/seo-strategy.html',
    icon: '🔍',
    label: 'SEO 전략',
    desc: '콘텐츠 키워드·골든·6개월 로드맵',
  },
  {
    href: '/operations-playbook.html',
    icon: '🎯',
    label: '운영 플레이북',
    desc: '본질 베타 → 점진 확장 로드맵',
  },
  {
    href: '/viral-magnets-wireframes.html',
    icon: '🚀',
    label: '바이럴 자석 UI',
    desc: '5종 자석 한 클릭 공유 와이어프레임',
  },
  {
    href: '/campaign-plan.html',
    icon: '🌱',
    label: '런칭 캠페인 플랜',
    desc: '광고 카피·랜딩·채널·KPI·6주 캘린더',
  },
  {
    href: '/curriculum-master.html',
    icon: '📖',
    label: '커리큘럼 마스터',
    desc: '책 마스터플랜·DB 연동',
  },
  {
    href: '/worksheet/ko_phonics.html',
    icon: '📄',
    label: '한글 워크지 (인쇄용)',
    desc: '파닉스 32단원 · A4 · 단원 골라 인쇄',
  },
  {
    href: '/worksheet/en_phonics.html',
    icon: '🔤',
    label: '영어 파닉스 워크지 (인쇄용)',
    desc: 'Book 1~5 · 39단원 · A4 · 단원 골라 인쇄',
  },
  {
    href: '/vocabulary-master.html',
    icon: '🔤',
    label: '어휘 마스터 (영어)',
    desc: 'Cambridge Starters 매칭',
  },
  {
    href: '/vocabulary-master-ko.html',
    icon: '🇰🇷',
    label: '어휘 마스터 (한글)',
    desc: '한글 번역 + 한글 파닉스',
  },
  {
    href: '/vocabulary-table-ko.html',
    icon: '📊',
    label: '단어 마스터 표 (한글)',
    desc: '난이도 분석 · 카테고리 · 정렬',
  },
  {
    href: '/key-object-editor.html',
    icon: '✏️',
    label: '핵심단어 에디터',
    desc: '책별 한글 keyObjects 추가/삭제',
  },
  // 🔴 낱말로 만드는 그림 작업판 둘 — 목록·프롬프트만 여기서 만들고 **그림은 외부(GPT)에서**
  //    만들어 붙인다. 붙인 것은 `/api/comic-assets/<판 이름>` 으로 R2 에 남는다.
  //    ⚠️ 색칠 작업판은 CLAUDE.md 에 「자료실에 있다」고 적혀 있었는데 **실제로는 없었다**
  //       (2026-08-21에 넣음) — 문서에 적었다고 메뉴에 들어가는 게 아니다.
  {
    href: '/coloring-plan.html',
    icon: '🎨',
    label: '색칠 도안 작업판',
    desc: '낱말 2,067개 · 원본 삽화 + 프롬프트',
  },
  {
    href: '/hidden-object-plan.html',
    icon: '🔍',
    label: '숨은그림찾기 씬 작업판',
    desc: '명작 48권 × 그림체 3종 = 144장',
  },
  {
    href: '/letter-stroke-editor',
    icon: '🔠',
    label: '알파벳 stroke 편집',
    desc: 'A-Z, a-z 점 위치 일괄 조정',
    internal: true,
  },
  {
    href: '/korean-jamo-stroke-editor',
    icon: '🇰🇷',
    label: '한글 자모 stroke 편집',
    desc: '자모 ~51 base + 음절 자동 합성',
    internal: true,
  },
  {
    href: '/letter-fill-demo',
    icon: '🎨',
    label: 'Paint Mode 데모',
    desc: '글자 색칠 채점 시각화 (한/영/일)',
    internal: true,
  },
  {
    href: '/design-system.html',
    icon: '🎨',
    label: '디자인 시스템',
    desc: '색·폰트·컴포넌트 + GPT 시안 prompt',
  },
];

/** 자료실·창작동화 공용 드롭다운. 목록만 갈아 끼운다. */
function ResourceMenu({
  items,
  label,
  tone,
}: {
  items: ResourceItem[];
  label: string;
  tone: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${tone}`}
        title={label}
      >
        {label} <span className="text-[10px]">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        // 🔴 목록이 화면 높이를 넘는다. `overflow-hidden` 만 있으면 아래쪽이 스크롤 없이 잘려서
        // 최근에 추가한 자료일수록 못 연다 → 최대 높이 + 세로 스크롤.
        <div className="absolute right-0 mt-1 w-60 max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden overscroll-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
          {items.map((item) => {
            const className =
              'flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0';
            const inner = (
              <>
                <span className="text-base mt-0.5">{item.icon}</span>
                <span>
                  <span className="block font-semibold text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </span>
                </span>
              </>
            );
            if (item.internal) {
              // SPA 라우트 — same-tab navigate
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    setOpen(false);
                    navigate(item.href);
                  }}
                  className={`${className} text-left w-full`}
                >
                  {inner}
                </button>
              );
            }
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className={className}
              >
                {inner}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const { isDark, toggle } = useThemeStore();
  const [vocabOpen, setVocabOpen] = useState(false);

  return (
    <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
          TangoBook Author
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={isDark ? '라이트 모드' : '다크 모드'}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
        <ResourceMenu
          items={CHANGJAK}
          label="📖 창작동화"
          tone="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30"
        />
        <ResourceMenu
          items={RESOURCES}
          label="📁 자료실"
          tone="text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30"
        />
        <button
          onClick={() => setVocabOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          어휘 DB
        </button>
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          동화책 뷰어
        </button>
      </div>
      <VocabTreeModal open={vocabOpen} onClose={() => setVocabOpen(false)} />
    </header>
  );
}
