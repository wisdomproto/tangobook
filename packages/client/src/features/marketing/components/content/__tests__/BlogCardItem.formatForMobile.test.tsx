import { describe, it, expect } from 'vitest';
import { formatForMobile } from '../BlogCardItem';

describe('formatForMobile', () => {
  it('splits a long <p> (>200 chars) at sentence boundaries into multiple <p>', () => {
    const sentence = '가나다라마바사아자차카타파하 짧은 문장입니다. ';
    const long = sentence.repeat(20); // >200 chars
    const out = formatForMobile(`<p>${long}</p>`);
    const div = document.createElement('div');
    div.innerHTML = out;
    expect(div.querySelectorAll('p').length).toBeGreaterThan(1);
  });

  it('leaves a short <p> as a single <p> and injects margin-bottom', () => {
    const out = formatForMobile('<p>짧은 문단</p>');
    const div = document.createElement('div');
    div.innerHTML = out;
    const ps = div.querySelectorAll('p');
    expect(ps.length).toBe(1);
    expect((ps[0] as HTMLElement).style.marginBottom).toBe('0.8em');
  });

  it('is idempotent for already-short paragraphs (count stable)', () => {
    const once = formatForMobile('<p>한 문단</p><p>또 한 문단</p>');
    const twice = formatForMobile(once);
    const d1 = document.createElement('div');
    d1.innerHTML = once;
    const d2 = document.createElement('div');
    d2.innerHTML = twice;
    expect(d2.querySelectorAll('p').length).toBe(d1.querySelectorAll('p').length);
  });
});
