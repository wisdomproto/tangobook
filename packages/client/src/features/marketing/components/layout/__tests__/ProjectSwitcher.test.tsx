import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  makeProject('p1', '탱고북 동화책'),
  makeProject('p2', 'Alpha Project'),
];

describe('ProjectSwitcher (fixed, static)', () => {
  it('shows the selected project name', () => {
    render(<ProjectSwitcher projects={projects} selectedProjectId="p2" />);
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
  });

  it('shows avatar initial of the selected project', () => {
    render(<ProjectSwitcher projects={projects} selectedProjectId="p2" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('falls back to 탱고북 동화책 when selection is unresolved', () => {
    const others = [makeProject('p2', 'Alpha Project')];
    render(<ProjectSwitcher projects={others} selectedProjectId={null} />);
    expect(screen.getByText('탱고북 동화책')).toBeInTheDocument();
  });

  it('renders no interactive switcher (no button / dropdown)', () => {
    render(<ProjectSwitcher projects={projects} selectedProjectId="p1" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('menuitem')).toBeNull();
  });
});
