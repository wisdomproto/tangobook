import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSwitcher } from '../ProjectSwitcher';
import type { Project } from '../../../types/database';

// Minimal Project fixture — only fields used by ProjectSwitcher
function makeProject(id: string, name: string): Project {
  return {
    id,
    user_id: 'u1',
    name,
    description: null,
    cover_image_url: null,
    industry: null,
    brand_name: null,
    brand_description: null,
    target_audience: null,
    usp: null,
    brand_tone: null,
    banned_keywords: null,
    brand_logo_url: null,
    marketer_name: null,
    marketer_expertise: null,
    marketer_style: null,
    marketer_phrases: null,
    sns_goal: null,
    blog_tone_prompt: null,
    blog_image_style_prompt: null,
    instagram_tone_prompt: null,
    instagram_image_style_prompt: null,
    threads_tone_prompt: null,
    youtube_tone_prompt: null,
    youtube_image_style_prompt: null,
    ai_model_settings: null,
    writing_guide_global: null,
    writing_guide_blog: null,
    writing_guide_instagram: null,
    writing_guide_threads: null,
    writing_guide_youtube: null,
    api_keys: null,
    target_languages: ['ko'],
    saved_keywords: null,
    reference_files: null,
    bgm_files: null,
    reference_summary: null,
    funnel_config: null,
    ga4_config: null,
    imported_strategy: null,
    wp_credentials: null,
    meta_credentials: null,
    published_site: null,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
}

const projects: Project[] = [
  makeProject('p1', '탱고북 마케팅'),
  makeProject('p2', 'Alpha Project'),
];

describe('ProjectSwitcher', () => {
  it('shows selected project name in trigger', () => {
    render(
      <ProjectSwitcher
        projects={projects}
        selectedProjectId="p1"
        onSelect={vi.fn()}
        onCreateNew={vi.fn()}
      />
    );
    expect(screen.getByText('탱고북 마케팅')).toBeInTheDocument();
  });

  it('shows "프로젝트 선택" when selectedProjectId is null', () => {
    render(
      <ProjectSwitcher
        projects={projects}
        selectedProjectId={null}
        onSelect={vi.fn()}
        onCreateNew={vi.fn()}
      />
    );
    expect(screen.getByText('프로젝트 선택')).toBeInTheDocument();
  });

  it('shows avatar initial of selected project', () => {
    render(
      <ProjectSwitcher
        projects={projects}
        selectedProjectId="p2"
        onSelect={vi.fn()}
        onCreateNew={vi.fn()}
      />
    );
    // The avatar div shows first char of name
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('lists all projects in dropdown after clicking trigger', async () => {
    const user = userEvent.setup();
    render(
      <ProjectSwitcher
        projects={projects}
        selectedProjectId="p1"
        onSelect={vi.fn()}
        onCreateNew={vi.fn()}
      />
    );
    // Open dropdown by clicking the trigger button
    await user.click(screen.getByRole('button', { name: /탱고북|선택|프로젝트/i }));
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
  });

  it('calls onSelect with project id when a project item is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <ProjectSwitcher
        projects={projects}
        selectedProjectId="p1"
        onSelect={onSelect}
        onCreateNew={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button'));
    // Click the second project
    const menuItems = screen.getAllByRole('menuitem');
    const alphaItem = menuItems.find((el) => el.textContent?.includes('Alpha Project'));
    expect(alphaItem).toBeTruthy();
    await user.click(alphaItem!);
    expect(onSelect).toHaveBeenCalledWith('p2');
  });

  it('calls onCreateNew when "새 프로젝트" is clicked', async () => {
    const onCreateNew = vi.fn();
    const user = userEvent.setup();
    render(
      <ProjectSwitcher
        projects={projects}
        selectedProjectId="p1"
        onSelect={vi.fn()}
        onCreateNew={onCreateNew}
      />
    );
    await user.click(screen.getByRole('button'));
    const createItem = screen.getByText('새 프로젝트').closest('[role="menuitem"]');
    expect(createItem).toBeTruthy();
    await user.click(createItem!);
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it('shows checkmark next to selected project', async () => {
    const user = userEvent.setup();
    render(
      <ProjectSwitcher
        projects={projects}
        selectedProjectId="p1"
        onSelect={vi.fn()}
        onCreateNew={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button'));
    // The selected project row should have a check icon (lucide renders svg)
    const menuItems = screen.getAllByRole('menuitem');
    const tangobookItem = menuItems.find((el) => el.textContent?.includes('탱고북 마케팅'));
    expect(tangobookItem).toBeTruthy();
    // Check icon is an SVG inside the selected item
    expect(tangobookItem!.querySelector('svg')).not.toBeNull();
  });

  it('shows "프로젝트가 없습니다" when projects list is empty', async () => {
    const user = userEvent.setup();
    render(
      <ProjectSwitcher
        projects={[]}
        selectedProjectId={null}
        onSelect={vi.fn()}
        onCreateNew={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('프로젝트가 없습니다')).toBeInTheDocument();
  });
});
