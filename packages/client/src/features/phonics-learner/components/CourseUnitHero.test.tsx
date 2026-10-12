import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getKoreanUnit } from '../lib/korean-phonics-units';
import { CourseUnitHero } from './CourseUnitHero';
import type { CourseActivityItem } from './CourseActivitySection';

afterEach(cleanup);
const unit = getKoreanUnit('kr-h1-u01')!;
const item = (key: string, done: boolean): CourseActivityItem => ({
  key,
  done,
  href: `/activity/${key}`,
  title: key,
  order: 1,
  mode: 'listen',
  preview: [],
});
function show(completed: string[], items: CourseActivityItem[]) {
  render(
    <MemoryRouter>
      <CourseUnitHero
        language="korean"
        unit={unit}
        required={['first', 'second']}
        completed={completed}
        items={items}
      />
    </MemoryRouter>
  );
}
describe('단원에서 이어 할 활동과 진행', () => {
  it('선택 활동 완료를 필수 진행에 더하지 않고 실제 다음 활동으로 연결한다', () => {
    show(
      ['first', 'optional'],
      [item('first', true), item('second', false), item('optional', true)]
    );
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50');
    expect(screen.getByRole('link', { name: /이어서 하기/ }).getAttribute('href')).toBe(
      '/activity/second'
    );
  });
  it('표시 가능한 활동만 받아 연결하고 모두 마치면 다시 시작할 수 있다', () => {
    show(['first', 'second'], [item('first', true), item('second', true)]);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    expect(screen.getByRole('link', { name: /다시 해보기/ }).getAttribute('href')).toBe(
      '/activity/first'
    );
  });
});
