import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/marketing/content']}>
      <Sidebar projects={[]} selectedProjectId={null} />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  it('renders all group labels', () => {
    renderSidebar();
    expect(screen.getByText('오가닉 마케팅')).toBeInTheDocument();
    expect(screen.getByText('성장')).toBeInTheDocument();
    expect(screen.getByText('유료 마케팅')).toBeInTheDocument();
    expect(screen.getByText('분석')).toBeInTheDocument();
    expect(screen.getByText('전략')).toBeInTheDocument();
  });

  it('renders all nav items', () => {
    renderSidebar();
    expect(screen.getByText('키워드 / 아이디어')).toBeInTheDocument();
    expect(screen.getByText('콘텐츠 생성')).toBeInTheDocument();
    expect(screen.getByText('발행')).toBeInTheDocument();
    expect(screen.getByText('모니터링 / 댓글')).toBeInTheDocument();
    expect(screen.getByText('광고 관리')).toBeInTheDocument();
    expect(screen.getByText('사이트 분석')).toBeInTheDocument();
    expect(screen.getByText('채널 분석')).toBeInTheDocument();
    expect(screen.getByText('경쟁사')).toBeInTheDocument();
    expect(screen.getByText('마케팅 전략')).toBeInTheDocument();
    expect(screen.getByText('프로젝트 설정')).toBeInTheDocument();
  });

  it('renders group labels with uppercase tracking class', () => {
    renderSidebar();
    const groupLabel = screen.getByText('오가닉 마케팅');
    expect(groupLabel.className).toContain('uppercase');
    expect(groupLabel.className).toContain('tracking-wider');
    expect(groupLabel.className).toContain('text-muted-foreground');
  });

  it('nav links have /marketing/ prefix', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href') ?? '');
    expect(hrefs.every((h) => h.startsWith('/marketing/'))).toBe(true);
  });

  it('renders the fixed project name (static ProjectSwitcher, no dropdown)', () => {
    renderSidebar();
    expect(screen.getByText('탱고북 동화책')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
