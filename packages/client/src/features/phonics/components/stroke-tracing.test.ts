import { describe, expect, it } from 'vitest';
import { beginTrace, makeTracePath, moveTrace, tracePassed, strokeOwners } from './stroke-tracing';
import type { StrokePoint, VowelGuideStroke } from './vowel-stroke-guide';
const line: VowelGuideStroke = { from: { x: 120, y: 60 }, to: { x: 120, y: 330 } };
function trace(stroke: VowelGuideStroke, points: StrokePoint[]) {
  const path = makeTracePath(stroke);
  let attempt = beginTrace(path, points[0]);
  if (!attempt) return false;
  for (const point of points.slice(1)) attempt = moveTrace(path, attempt, point);
  return tracePassed(path, attempt);
}
describe('획 단위의 관대한 따라쓰기', () => {
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
});
