import { describe, expect, it } from 'vitest';
import { beginTrace, makeTracePath, moveTrace, tracePassed, strokeOwners } from './stroke-tracing';
import type { StrokePoint, VowelGuideStroke } from './vowel-stroke-guide';
import curveEnds from './__fixtures__/english-curve-ends.json';
import turnPaths from './__fixtures__/english-turn-paths.json';
const line: VowelGuideStroke = { from: { x: 120, y: 60 }, to: { x: 120, y: 330 } };
function trace(stroke: VowelGuideStroke, points: StrokePoint[], softEnd = false) {
  const path = makeTracePath(stroke);
  let attempt = beginTrace(path, points[0]);
  if (!attempt) return false;
  for (const point of points.slice(1))
    attempt = moveTrace(path, attempt, point, { softTurns: softEnd });
  return tracePassed(path, attempt, { softEnd });
}
describe('획 단위의 관대한 따라쓰기', () => {
  it('반듯해진 짧은 t 가로획도 허용된 양끝 흔들림으로 짧아진 전진 입력을 받되 반쪽/역방향은 거절한다', () => {
    const bar = { from: { x: 192, y: 149 }, to: { x: 233, y: 149 } };
    const path = makeTracePath(bar);
    const input = path.points.map((p, n) => ({
      x: p.x + Math.sin(n * 0.25 + Math.PI / 2) * 16,
      y: p.y + Math.cos(n * 0.25 + Math.PI / 2) * 16,
    }));
    expect(trace(bar, input, true)).toBe(true);
    expect(trace(bar, path.points.slice(0, 5), true)).toBe(false);
    expect(trace(bar, [bar.to, bar.from], true)).toBe(false);
    expect(trace(bar, [bar.from, bar.from], true)).toBe(false);
  });
  it('긴 곡선도 경로의90%에서 떼면 마무리하고, 중간/역방향/지름길은 마무리하지 않는다', () => {
    const stroke = {
      from: { x: 100, y: 50 },
      to: { x: 100, y: 350 },
      points: [
        { x: 100, y: 50 },
        { x: 260, y: 50 },
        { x: 300, y: 150 },
        { x: 300, y: 250 },
        { x: 260, y: 350 },
        { x: 100, y: 350 },
      ],
    };
    const path = makeTracePath(stroke);
    const attemptFor = (pts: StrokePoint[]) => {
      let attempt = beginTrace(path, pts[0]);
      if (!attempt) return null;
      for (const p of pts.slice(1)) attempt = moveTrace(path, attempt, p, { softTurns: true });
      return attempt;
    };
    const prefix = (fraction: number) =>
      path.points.filter((_, n) => path.distances[n] <= path.length * fraction);
    const ninety = attemptFor(prefix(0.9))!;
    expect(tracePassed(path, ninety, { softEnd: true })).toBe(false);
    expect(tracePassed(path, ninety, { softEnd: true, completionRatio: 0.9 })).toBe(true);
    for (const pts of [prefix(0.5), prefix(0.75), [stroke.from, stroke.to]]) {
      const a = attemptFor(pts)!;
      expect(tracePassed(path, a, { softEnd: true, completionRatio: 0.9 })).toBe(false);
    }
    expect(attemptFor([...path.points].reverse())).toBeNull();
  });
  it.each(Object.entries(turnPaths))(
    '%s 실제 폰트의 짧은 획·꺾임은 입력 간격과 흔들리는 방향이 바뀌어도 이어간다',
    (_, paths) => {
      for (const svg of paths) {
        const values = svg.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
        const points = Array.from({ length: values.length / 2 }, (_, i) => ({
          x: values[i * 2],
          y: values[i * 2 + 1],
        }));
        const stroke = { from: points[0], to: points.at(-1)!, points },
          path = makeTracePath(stroke);
        for (const amplitude of [8, 12, 16])
          for (const stride of [1, 3, 5])
            for (const rate of [0.15, 0.25])
              for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
                const input = path.points
                  .filter((_, n) => n % stride === 0 || n === path.points.length - 1)
                  .map((p, n) => ({
                    x: p.x + Math.sin(n * rate + phase) * amplitude,
                    y: p.y + Math.cos(n * rate + phase) * amplitude,
                  }));
                expect(
                  trace(stroke, input, true),
                  `${svg.slice(0, 14)} / ${amplitude} / ${stride} / ${rate} / ${phase}`
                ).toBe(true);
              }
        expect(trace(stroke, path.points.slice(0, Math.floor(path.points.length / 2)), true)).toBe(
          false
        );
        expect(trace(stroke, [...path.points].reverse(), true)).toBe(false);
        if (path.length - Math.hypot(stroke.to.x - stroke.from.x, stroke.to.y - stroke.from.y) > 70)
          expect(trace(stroke, [stroke.from, stroke.to], true)).toBe(false);
      }
    }
  );
  it.each(Object.entries(curveEnds))(
    '%s 실제 폰트 곡선의 흔들린 끝부분을 받아주고 반쪽/지름길은 거절한다',
    (_, svg) => {
      const values = svg.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      const points = Array.from({ length: values.length / 2 }, (_, i) => ({
        x: values[i * 2],
        y: values[i * 2 + 1],
      }));
      const stroke = { from: points[0], to: points.at(-1)!, points };
      const path = makeTracePath(stroke);
      const input = path.points.map((p, i) => ({
        x: p.x + Math.sin(i * 0.25) * 12,
        y: p.y + Math.cos(i * 0.25) * 12,
      }));
      expect(trace(stroke, input)).toBe(false); // The previous Korean/default ending remains unchanged.
      expect(trace(stroke, input, true)).toBe(true);
      expect(trace(stroke, [...path.points].reverse(), true)).toBe(false);
      expect(trace(stroke, path.points.slice(0, Math.floor(path.points.length / 2)), true)).toBe(
        false
      );
      expect(trace(stroke, [stroke.from, stroke.to], true)).toBe(false);
    }
  );
  it('영어의 부드러운 끝맺음도 끝점·이동량·순서를 지키며 한글 기본값은 바꾸지 않는다', () => {
    const slightlyShort = [line.from, { x: 126, y: 305 }];
    expect(trace(line, slightlyShort)).toBe(false);
    expect(trace(line, slightlyShort, true)).toBe(true);
    for (const input of [
      [line.to, line.from],
      [line.from, { x: 120, y: 170 }],
      [line.from, { x: 170, y: 330 }],
    ])
      expect(trace(line, input, true)).toBe(false);
  });
  it('i/j의 점은 톡 찍기만 허용하고 떨어진 위치·지나가는 선은 거절한다', () => {
    const path = makeTracePath({ from: { x: 200, y: 60 }, to: { x: 201, y: 60 }, dot: true });
    const tap = beginTrace(path, { x: 206, y: 65 })!;
    expect(tracePassed(path, tap)).toBe(true);
    expect(beginTrace(path, { x: 200, y: 130 })).toBeNull();
    expect(tracePassed(path, moveTrace(path, tap, { x: 260, y: 60 }))).toBe(false);
    const swipe = makeTracePath({ from: { x: 200, y: 60 }, to: { x: 200, y: 260 } });
    expect(tracePassed(swipe, beginTrace(swipe, { x: 200, y: 60 })!)).toBe(false);
  });
  it('느린 짧은 획은 체크포인트 반올림으로 실제 이동량을 잃지 않는다', () => {
    for (const length of [8, 12, 40, 60, 62, 79, 120]) {
      const stroke = { from: { x: 120, y: 180 }, to: { x: 120 + length, y: 180 } };
      const path = makeTracePath(stroke);
      const input = path.points.map((p, i) => ({
        x: p.x + Math.sin(i * 0.3) * 8,
        y: p.y + Math.cos(i * 0.3) * 8,
      }));
      expect(trace(stroke, input), `length ${length}`).toBe(true);
      expect(trace(stroke, [stroke.to, stroke.from]), `reverse ${length}`).toBe(false);
      expect(trace(stroke, [stroke.from, stroke.from]), `tap ${length}`).toBe(false);
    }
  });
  it('정확히 칠하지 않아도 시작에서 끝까지 약간 삐뚤게 쓰면 통과한다', () => {
    expect(
      trace(line, [
        { x: 105, y: 66 },
        { x: 131, y: 130 },
        { x: 101, y: 220 },
        { x: 130, y: 322 },
      ])
    ).toBe(true);
  });
  it('점/역방향/반쪽만 쓰기/멀리 벗어나서 끝점만 찍기는 통과하지 않는다', () => {
    expect(trace(line, [line.from, line.from])).toBe(false);
    expect(trace(line, [line.to, line.from])).toBe(false);
    expect(trace(line, [line.from, { x: 120, y: 170 }])).toBe(false);
    expect(trace(line, [line.from, { x: 310, y: 200 }, line.to])).toBe(false);
  });
  it('ㄱ 꺾인 획의 대각선 지름길을 거절하고 굽어서 따라오면 통과한다', () => {
    const bent = {
      from: { x: 70, y: 80 },
      to: { x: 290, y: 310 },
      points: [
        { x: 70, y: 80 },
        { x: 290, y: 80 },
        { x: 290, y: 310 },
      ],
    };
    expect(trace(bent, [bent.from, bent.to])).toBe(false);
    expect(trace(bent, [bent.from, { x: 280, y: 90 }, bent.to])).toBe(true);
  });
  it('짧은 획도 점만 찍어서는 완료되지 않는다', () => {
    const short = { from: { x: 150, y: 180 }, to: { x: 210, y: 180 } };
    expect(
      trace(short, [
        { x: 176, y: 180 },
        { x: 190, y: 180 },
      ])
    ).toBe(false);
    expect(
      trace(short, [
        { x: 150, y: 185 },
        { x: 206, y: 175 },
      ])
    ).toBe(true);
  });
  it('교차하는 획은 각자 영역을 가지며 모든 글자 픽셀에 주인이 있다', () => {
    const mask = { width: 400, height: 400, data: new Uint8ClampedArray(400 * 400 * 4) };
    for (let y = 60; y < 331; y++)
      for (let x = 112; x < 129; x++) mask.data[(y * 400 + x) * 4 + 3] = 255;
    for (let y = 190; y < 207; y++)
      for (let x = 120; x < 241; x++) mask.data[(y * 400 + x) * 4 + 3] = 255;
    const owners = strokeOwners(mask, [
      makeTracePath(line),
      makeTracePath({ from: { x: 120, y: 198 }, to: { x: 240, y: 198 } }),
    ]);
    expect(owners[100 * 400 + 120]).toBe(0);
    expect(owners[198 * 400 + 220]).toBe(1);
    expect(owners.length).toBe(400 * 400);
  });
  it('둥근 획과 맞닿은 세로획도 삼각형이 패이지 않고 반듯한 폭으로 채워진다', () => {
    const mask = { width: 100, height: 100, data: new Uint8ClampedArray(100 * 100 * 4) };
    for (let y = 4; y <= 95; y++)
      for (let x = 5; x <= 16; x++) mask.data[(y * 100 + x) * 4 + 3] = 255;
    const owners = strokeOwners(mask, [
      makeTracePath({ from: { x: 10, y: 10 }, to: { x: 10, y: 90 } }),
      makeTracePath({
        from: { x: 10, y: 10 },
        to: { x: 10, y: 90 },
        points: [
          { x: 10, y: 10 },
          { x: 80, y: 20 },
          { x: 80, y: 80 },
          { x: 10, y: 90 },
        ],
      }),
    ]);
    for (let y = 4; y <= 95; y++) for (let x = 5; x <= 16; x++) expect(owners[y * 100 + x]).toBe(0);
  });
  it.each(['curved shoulder', 'curved foot'])(
    'f/t의 %s에서도 가로획이 세로 기둥을 가져가지 않는다',
    (shape) => {
      const mask = { width: 400, height: 400, data: new Uint8ClampedArray(400 * 400 * 4) };
      const fill = (left: number, top: number, right: number, bottom: number) => {
        for (let y = top; y <= bottom; y++)
          for (let x = left; x <= right; x++) mask.data[(y * 400 + x) * 4 + 3] = 255;
      };
      fill(180, 80, 220, 300);
      fill(180, 60, 250, 95);
      fill(160, 135, 250, 155);
      const main =
        shape === 'curved shoulder'
          ? [
              { x: 240, y: 76 },
              { x: 200, y: 76 },
              { x: 200, y: 280 },
            ]
          : [
              { x: 200, y: 76 },
              { x: 200, y: 280 },
              { x: 240, y: 280 },
            ];
      const owners = strokeOwners(mask, [
        makeTracePath({
          from: main[0],
          to: main.at(-1)!,
          points: main,
        }),
        makeTracePath({ from: { x: 165, y: 145 }, to: { x: 245, y: 145 } }),
      ]);
      for (let y = 175; y <= 300; y++)
        for (let x = 180; x <= 220; x++) expect(owners[y * 400 + x]).toBe(0);
      expect(owners[145 * 400 + 165]).toBe(1);
      expect(owners[145 * 400 + 245]).toBe(1);
      expect(owners[145 * 400 + 200]).toBe(0); // First downstroke stays continuous across the bar.
      if (shape === 'curved shoulder') expect(owners[76 * 400 + 240]).toBe(0);
    }
  );
});
