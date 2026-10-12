import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KoreanPhonicsHeatmap } from './KoreanPhonicsHeatmap';
import type { LearningEvent } from '@tangobook/shared';

/**
 * 🔴 회귀 가드 — 한때 `cellByKey.set(\`${row} ${col}\`)` 의 "공백"이 소스에 **보이지 않는 NULL
 *    문자**로 들어가, lookup(공백)과 안 맞아 **자음×모음 표의 모든 칸이 빈 칸**이었다. 분포 막대는
 *    statKey 를 쓰니 정상이라 아무도 눈치채지 못했다(실제 부모 리포트에도 있던 버그).
 * 이 테스트는 표 칸이 **실제로 렌더되는지**를 본다 — 이벤트가 없어도 격자엔 음절이 다 떠야 한다.
 */
describe('KoreanPhonicsHeatmap', () => {
  it('권별 완료 수에도 구형 모음 완료를 대응하며 단순 방문은 완료로 세지 않는다', () => {
    const events = ['listen-1', 'write-1'].map(
      (activityId) =>
        ({
          event_type: 'page_read',
          storybook_id: 'kr-h1-u01',
          metadata: {
            source: 'phonics',
            lang: 'ko',
            unitId: 'kr-h1-u01',
            activityId,
            activityCompleted: true,
          },
        }) as LearningEvent
    );
    events.push({
      event_type: 'page_read',
      storybook_id: 'kr-v1-u07',
      metadata: { source: 'phonics', lang: 'ko', unitId: 'kr-v1-u07' },
    } as LearningEvent);
    render(<KoreanPhonicsHeatmap events={events} storybooks={[]} />);
    expect(screen.getByText('6/10 단원 완료')).toBeInTheDocument();
  });
  it('자음×모음 표의 칸이 실제로 렌더된다 (cellByKey 키 정합)', () => {
    // hangul1 격자는 기본 펼침(openLevel="hangul1"). '갸'(ㄱ+ㅑ)는 격자에만 있는 음절이라
    // 타겟 단어와 겹치지 않는다 — cellByKey.get 이 실패하면 이 글자가 안 뜬다.
    render(<KoreanPhonicsHeatmap events={[]} storybooks={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Book 2: 자음과 기본 음절/ }));
    expect(screen.getAllByText('갸').length).toBeGreaterThan(0);
  });
});
