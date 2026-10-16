import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/index.css';
import '@/lib/audio-unlock';
import { StrokeTraceCanvas } from '@/features/phonics/components/StrokeTraceCanvas';
import { getLetterGuideStrokes } from '@/features/phonics/components/letter-stroke-guide';
import {
  guidePath,
  type StrokePoint,
  type VowelGuideStroke,
} from '@/features/phonics/components/vowel-stroke-guide';
import {
  beginTrace,
  makeTracePath,
  moveTrace,
  strokeOwners,
  tracePassed,
  type TracePath,
} from '@/features/phonics/components/stroke-tracing';
import './alphabet-writing-check.css';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LETTERS = [...UPPER, ...UPPER.toLowerCase()];
const FACE = 'system-ui, sans-serif';
type Scenario = 'exact' | 'wobble' | 'sparse' | 'ninety' | 'reverse' | 'half' | 'shortcut' | 'far';
const SCENARIOS: Record<Scenario, string> = {
  exact: '정확한 경로',
  wobble: '12px 흔들림',
  sparse: '드문 입력 + 흔들림',
  ninety: '90%에서 손 떼기',
  reverse: '역방향',
  half: '절반만 쓰기',
  shortcut: '시작→끝 직선',
  far: '점 바깥 누르기',
};
type Check = {
  stroke: number;
  scenario: Scenario;
  passed: boolean;
  expected: boolean | null;
  remaining: number;
  offPath: number;
  variant?: string;
};
type Report = {
  letter: string;
  strokes: number;
  checks: Check[];
  extended?: Check[];
  fills?: string[];
  inkGaps?: number[];
  issues: number;
  error?: string;
};

/** Same font/mask setup as the live component. No learner stores, APIs or progress writes. */
async function prepare(letter: string) {
  await document.fonts.load(`bold 340px ${FACE}`, letter);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas를 사용할 수 없습니다.');
  let size = 340;
  ctx.font = `bold ${size}px ${FACE}`;
  while (ctx.measureText(letter).width > 380 && size > 32) {
    size -= 4;
    ctx.font = `bold ${size}px ${FACE}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e0e6da';
  ctx.fillText(letter, 200, 200);
  const mask = ctx.getImageData(0, 0, 400, 400);
  const glyph = canvas.toDataURL('image/png');
  const guides = getLetterGuideStrokes(letter, mask);
  const paths = guides.map(makeTracePath);
  const owners = strokeOwners(mask, paths, { completeJoins: true });
  // A passing trace must also leave its entire centreline painted at completion.
  const inkGaps = paths.map(
    (path, step) =>
      path.points.filter((p) => {
        const at = Math.round(p.y) * 400 + Math.round(p.x);
        return mask.data[at * 4 + 3] >= 128 && owners[at] > step;
      }).length
  );
  const fills = guides.map((_, step) => {
    const image = ctx.createImageData(400, 400);
    for (let p = 0; p < owners.length; p++) {
      const filled = owners[p] <= step;
      image.data[p * 4] = filled ? 40 : 224;
      image.data[p * 4 + 1] = filled ? 147 : 230;
      image.data[p * 4 + 2] = filled ? 108 : 218;
      image.data[p * 4 + 3] = mask.data[p * 4 + 3];
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  });
  return { guides, glyph, fills, inkGaps };
}

function inputFor(path: TracePath, scenario: Scenario): StrokePoint[] {
  if (path.dot) {
    const p = path.points[0];
    return [{ x: p.x + (scenario === 'far' ? 45 : scenario === 'wobble' ? 12 : 0), y: p.y }];
  }
  if (scenario === 'reverse') return [...path.points].reverse();
  if (scenario === 'half')
    return path.points.slice(0, Math.max(1, Math.floor(path.points.length / 2)));
  if (scenario === 'ninety') {
    const length = path.length * 0.9;
    const end = path.distances.findIndex((n) => n >= length);
    const a = path.points[end - 1],
      b = path.points[end];
    const fraction =
      (length - path.distances[end - 1]) / (path.distances[end] - path.distances[end - 1]);
    return [
      ...path.points.slice(0, end),
      { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction },
    ];
  }
  if (scenario === 'shortcut') return [path.points[0], path.points[path.points.length - 1]];
  const pts =
    scenario === 'sparse'
      ? path.points.filter((_, i) => i % 3 === 0 || i === path.points.length - 1)
      : path.points;
  return pts.map((p, i) =>
    scenario === 'exact'
      ? p
      : { x: p.x + Math.sin(i * 0.25) * 12, y: p.y + Math.cos(i * 0.25) * 12 }
  );
}

function check(
  path: TracePath,
  stroke: number,
  scenario: Scenario,
  input = inputFor(path, scenario)
): Check {
  let attempt = beginTrace(path, input[0]);
  if (attempt)
    for (const p of input.slice(1)) attempt = moveTrace(path, attempt, p, { softTurns: true });
  const chord = Math.hypot(
    path.points[0].x - path.points.at(-1)!.x,
    path.points[0].y - path.points.at(-1)!.y
  );
  // Straight bars should accept a straight swipe; small bends can fall inside the intentional tolerance.
  const expected =
    scenario === 'shortcut'
      ? path.length - chord > 70
        ? false
        : null
      : !['reverse', 'half', 'far'].includes(scenario);
  return {
    stroke,
    scenario,
    passed: !!attempt && tracePassed(path, attempt, { softEnd: true, completionRatio: 0.9 }),
    expected,
    remaining: Math.round(attempt ? path.length - path.distances[attempt.index] : path.length),
    offPath: Math.round(attempt?.offPath ?? 0),
  };
}

function report(letter: string, guides: VowelGuideStroke[]): Report {
  const checks = guides.flatMap((g, i) => {
    const scenarios: Scenario[] = g.dot
      ? ['exact', 'wobble', 'far']
      : ['exact', 'wobble', 'sparse', 'ninety', 'reverse', 'half', 'shortcut'];
    return scenarios.map((s) => check(makeTracePath(g), i + 1, s));
  });
  const extended = guides.flatMap((g, i) => {
    if (g.dot) return [];
    const path = makeTracePath(g),
      result: Check[] = [];
    for (const amplitude of [8, 12, 16])
      for (const stride of [1, 3, 5])
        for (const rate of [0.15, 0.25])
          for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
            const points = path.points
              .filter((_, n) => n % stride === 0 || n === path.points.length - 1)
              .map((p, n) => ({
                x: p.x + Math.sin(n * rate + phase) * amplitude,
                y: p.y + Math.cos(n * rate + phase) * amplitude,
              }));
            result.push({
              ...check(path, i + 1, 'wobble', points),
              variant: `${amplitude}px / 간격${stride} / 속도${rate} / 위상${Math.round((phase * 180) / Math.PI)}°`,
            });
          }
    return result;
  });
  return {
    letter,
    strokes: guides.length,
    checks,
    extended,
    issues: guides.length
      ? [...checks, ...extended].filter((c) => c.expected !== null && c.passed !== c.expected)
          .length
      : 1,
  };
}

function AlphabetWritingCheck() {
  const [letter, setLetter] = useState('i');
  const [paper, setPaper] = useState(384);
  const [reset, setReset] = useState(0);
  const [manualDone, setManualDone] = useState(false);
  const [guides, setGuides] = useState<VowelGuideStroke[]>([]);
  const [glyph, setGlyph] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('exact');
  const [stroke, setStroke] = useState(0);
  const [trail, setTrail] = useState<StrokePoint[]>([]);
  const [simulation, setSimulation] = useState<Check | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [error, setError] = useState('');
  const animation = useRef(0);
  useEffect(() => {
    let active = true;
    cancelAnimationFrame(animation.current);
    setPreparing(true);
    setGuides([]);
    setGlyph('');
    setTrail([]);
    setSimulation(null);
    setStroke(0);
    setError('');
    void prepare(letter).then(
      (g) => {
        if (active) {
          setGuides(g.guides);
          setGlyph(g.glyph);
          setPreparing(false);
        }
      },
      (e) => {
        if (active) {
          setError(String(e));
          setPreparing(false);
        }
      }
    );
    return () => {
      active = false;
      cancelAnimationFrame(animation.current);
    };
  }, [letter]);
  useEffect(() => {
    cancelAnimationFrame(animation.current);
    setTrail([]);
    setSimulation(null);
  }, [stroke, scenario]);
  const choose = (next: string) => {
    setLetter(next);
    setManualDone(false);
    setReset((n) => n + 1);
  };
  const selected = reports.find((r) => r.letter === letter);
  const inspect = async (all: boolean) => {
    setRunning(true);
    const results: Report[] = [];
    try {
      for (const char of all ? LETTERS : [letter]) {
        try {
          const prepared = await prepare(char);
          const result = report(char, prepared.guides);
          results.push({
            ...result,
            fills: prepared.fills,
            inkGaps: prepared.inkGaps,
            issues: result.issues + prepared.inkGaps.filter((n) => n > 0).length,
          });
        } catch (e) {
          results.push({ letter: char, strokes: 0, checks: [], issues: 1, error: String(e) });
        }
        setReports((prev) => [
          ...prev.filter((r) => !results.some((n) => n.letter === r.letter)),
          ...results,
        ]);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    } finally {
      setRunning(false);
    }
  };
  const simulate = () => {
    const guide = guides[stroke];
    if (!guide) return;
    cancelAnimationFrame(animation.current);
    const path = makeTracePath(guide),
      points = inputFor(path, scenario);
    setSimulation(null);
    setTrail([]);
    const start = performance.now();
    const frame = (now: number) => {
      const count = Math.min(
        points.length,
        Math.max(1, Math.ceil(((now - start) / 1400) * points.length))
      );
      setTrail(points.slice(0, count));
      if (count < points.length) animation.current = requestAnimationFrame(frame);
      else setSimulation(check(path, stroke + 1, scenario));
    };
    animation.current = requestAnimationFrame(frame);
  };
  const exportReport = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              checkedAt: new Date().toISOString(),
              font: FACE,
              kind: 'pure-path-and-ink-simulation',
              reports,
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      )
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alphabet-writing-check.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="alphabet-check">
      <header className="audit-heading">
        <div>
          <span className="audit-eyebrow">TANGOBOOK · LOCAL QA</span>
          <h1>알파벳 쓰기 검수</h1>
          <p>직접 쓰기와 모의 판정을 별도로 확인합니다. 학습 진도는 저장하지 않습니다.</p>
        </div>
        <a href="/library/phonics/english?mode=free">자유모드 열기 ↗</a>
      </header>
      <nav className="audit-alphabets" aria-label="검수할 알파벳">
        {[UPPER, UPPER.toLowerCase()].map((row) => (
          <div key={row}>
            {[...row].map((char) => (
              <button
                key={char}
                aria-pressed={letter === char}
                onClick={() => choose(char)}
                data-check={
                  reports.find((r) => r.letter === char)?.issues === 0
                    ? 'ok'
                    : reports.some((r) => r.letter === char)
                      ? 'bad'
                      : undefined
                }
              >
                {char}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="audit-workspace">
        <section className="audit-panel audit-manual">
          <div className="audit-panel-heading">
            <h2>
              직접 따라쓰기 <b>{letter}</b>
            </h2>
            <button
              onClick={() => {
                setReset((n) => n + 1);
                setManualDone(false);
              }}
            >
              다시 쓰기
            </button>
          </div>
          <div className="audit-options">
            <label>
              종이 크기{' '}
              <select value={paper} onChange={(e) => setPaper(Number(e.target.value))}>
                {[108, 192, 300, 384].map((n) => (
                  <option key={n} value={n}>
                    {n}px
                  </option>
                ))}
              </select>
            </label>
            <span role="status" className={manualDone ? 'audit-success' : ''}>
              {manualDone ? '✓ 직접 쓰기 완료' : '시작점부터 따라 써 보세요'}
            </span>
          </div>
          <div className="audit-manual-stage">
            <div style={{ width: paper, maxWidth: '100%' }}>
              <StrokeTraceCanvas
                key={`${letter}-${reset}`}
                letter={letter}
                guidance="hint"
                compact
                onResult={() => setManualDone(true)}
              />
            </div>
          </div>
          <p className="audit-note">
            운영과 같은 쓰기 컴포넌트입니다. i·j는 몸통을 끝내면 점 버튼이 나옵니다.
          </p>
        </section>
        <section className="audit-panel">
          <div className="audit-panel-heading">
            <h2>경로 모의 검사</h2>
            <span className="audit-tag">실제 손 입력 아님</span>
          </div>
          <div className="audit-options">
            <label>
              획{' '}
              <select
                value={stroke}
                disabled={preparing}
                onChange={(e) => {
                  setStroke(Number(e.target.value));
                  setScenario('exact');
                  setTrail([]);
                  setSimulation(null);
                }}
              >
                {guides.map((g, i) => (
                  <option key={i} value={i}>
                    {i + 1}획{g.dot ? ' · 점' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              입력{' '}
              <select value={scenario} onChange={(e) => setScenario(e.target.value as Scenario)}>
                {Object.entries(SCENARIOS)
                  .filter(([s]) =>
                    guides[stroke]?.dot ? ['exact', 'wobble', 'far'].includes(s) : s !== 'far'
                  )
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            <button disabled={preparing || !guides.length} onClick={simulate}>
              입력 재생
            </button>
          </div>
          <div className="audit-simulation-stage">
            <svg viewBox="0 0 400 400" role="img" aria-label={`${letter} 모의 입력 경로`}>
              {glyph && <image href={glyph} width="400" height="400" />}
              {guides.map((g, i) => (
                <path
                  key={i}
                  d={guidePath(g)}
                  fill="none"
                  stroke={i === stroke ? '#22694f' : '#b5bfb3'}
                  strokeWidth="3"
                  strokeDasharray="4 6"
                />
              ))}
              {trail.length > 0 && (
                <>
                  <path
                    d={trail.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')}
                    stroke="#ed724b"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx={trail.at(-1)!.x} cy={trail.at(-1)!.y} r="10" fill="#ed724b" />
                </>
              )}
            </svg>
          </div>
          <p role="status" className="audit-sim-status">
            {error ||
              (preparing
                ? '글꼴 준비 중…'
                : simulation
                  ? `${simulation.passed ? '통과' : '미통과'} · 남은 경로 ${simulation.remaining}px · 경로 밖 ${simulation.offPath}px${simulation.expected !== null ? ` · 기대 결과 ${simulation.expected ? '통과' : '거절'}` : ' · 참고용 (직선/작은 굴곡은 통과 가능)'}`
                  : '획과 입력을 골라 재생해 보세요.')}
          </p>
        </section>
      </div>
      <section className="audit-panel audit-report">
        <div className="audit-panel-heading">
          <h2>판정 결과</h2>
          <div className="audit-actions">
            <button disabled={running} onClick={() => void inspect(false)}>
              현재 글자 검사
            </button>
            <button disabled={running} onClick={() => void inspect(true)}>
              {running ? `검사 중 · ${reports.length}/52` : '52자 전체 검사'}
            </button>
            <button disabled={!reports.length || running} onClick={exportReport}>
              JSON 저장
            </button>
          </div>
        </div>
        <p role="status">
          {reports.length
            ? `${reports.length}자 검사 · 확인 필요 ${
                reports
                  .filter((r) => r.issues > 0)
                  .map((r) => r.letter)
                  .join(', ') || '없음'
              }`
            : '정확·흔들림·드문 입력은 통과, 역방향·반쪽·점 바깥 입력은 거절되는지 확인합니다.'}
        </p>
        {selected?.error && <p role="alert">{selected.error}</p>}
        {reports.some((r) => r.fills) && (
          <details className="audit-ink-previews">
            <summary>획별 실제 채움 미리보기 · 판정 검사와 별도로 육안 확인</summary>
            <div className="audit-ink-grid">
              {reports.flatMap(
                (r) =>
                  r.fills?.map((src, step) => (
                    <figure key={`${r.letter}-${step}`}>
                      <img src={src} alt={`${r.letter} ${step + 1}획까지 채움`} />
                      <figcaption>
                        {r.letter} · {step + 1}/{r.strokes}획 완료 · 미채움 중심{' '}
                        {r.inkGaps?.[step] ?? '미검사'}
                      </figcaption>
                    </figure>
                  )) ?? []
              )}
            </div>
          </details>
        )}
        {selected && (
          <div className="audit-table-wrap">
            <table>
              <caption>
                {letter} · {selected.strokes}획 · 실제 글꼴 경로에 대한 모의 판정
              </caption>
              <thead>
                <tr>
                  <th>획</th>
                  <th>입력</th>
                  <th>기대</th>
                  <th>판정</th>
                  <th>남은 길이</th>
                  <th>확인</th>
                </tr>
              </thead>
              <tbody>
                {[...selected.checks, ...(selected.extended ?? []).filter((c) => !c.passed)].map(
                  (c) => (
                    <tr key={`${c.stroke}-${c.scenario}-${c.variant ?? ''}`}>
                      <td>{c.stroke}</td>
                      <td>{c.variant ?? SCENARIOS[c.scenario]}</td>
                      <td>{c.expected === null ? '참고' : c.expected ? '통과' : '거절'}</td>
                      <td>{c.passed ? '통과' : '미통과'}</td>
                      <td>{c.remaining}px</td>
                      <td>
                        {c.expected === null
                          ? '—'
                          : c.passed === c.expected
                            ? '✓ 정상'
                            : '⚠ 확인 필요'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
        {selected?.extended && (
          <p className="audit-note">
            확장 흔들림 {selected.extended.length}건 중{' '}
            {selected.extended.filter((c) => c.passed).length}건 통과 · 8/12/16px, 입력
            간격·속도·흔들리는 방향을 바꿔 검사합니다. 실패한 확장 입력은 위 표에 추가하고 전체
            결과는 JSON에 보존합니다.
          </p>
        )}
        <p className="audit-note">
          운영 배포 여부·아이의 손가락/스타일러스 사용성은 이 모의 검사만으로 확인되지 않습니다.
          새로고침하면 검수 상태만 초기화됩니다.
        </p>
      </section>
    </main>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<AlphabetWritingCheck />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
