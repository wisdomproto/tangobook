import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it } from 'vitest';
import { HomePlaySection } from './HomePlaySection';

function Location() {
  const location = useLocation();
  return <output>{location.search}</output>;
}
const show = (query = '') =>
  render(
    <MemoryRouter initialEntries={[`/library${query}`]}>
      <HomePlaySection />
      <Location />
    </MemoryRouter>
  );

it('switches all four direct links and the block picture without choosing another page', () => {
  show('?other=keep');
  const languages = screen.getByRole('group', { name: '놀이 언어' });
  expect(within(languages).getByRole('button', { name: '한글' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(within(languages).getByRole('button', { name: '영어' }));
  expect(within(languages).getByRole('button', { name: '영어' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  for (const link of screen
    .getAllByRole('link')
    .filter((link) => link.classList.contains('home-play-button')))
    expect(link.getAttribute('href')).toMatch(/\?lang=en$/);
  expect(screen.getByRole('link', { name: '골라 놀기' })).toHaveAttribute(
    'href',
    '/library/phonics/english?mode=free'
  );
  expect(screen.getByRole('link', { name: '영어 블록' }).querySelector('img')).toHaveAttribute(
    'src',
    '/images/learning/vocabulary-menu-v1/blocks-en.webp'
  );
  expect(screen.getByRole('status')).toHaveTextContent('other=keep&playLang=en');
  fireEvent.click(within(languages).getByRole('button', { name: '한글' }));
  expect(screen.getByRole('link', { name: '골라 놀기' })).toHaveAttribute(
    'href',
    '/library/phonics/korean?mode=free'
  );
  expect(screen.getByRole('link', { name: '한글 블록' })).toHaveAttribute(
    'href',
    '/library/play/blocks?lang=ko'
  );
});

it('restores English from the return URL and falls back safely for an unsupported language', () => {
  const english = show('?playLang=en');
  expect(screen.getByRole('button', { name: '영어' })).toHaveAttribute('aria-pressed', 'true');
  english.unmount();
  show('?playLang=zh');
  expect(screen.getByRole('button', { name: '한글' })).toHaveAttribute('aria-pressed', 'true');
});
