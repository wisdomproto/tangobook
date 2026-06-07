import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

const mockMutate = vi.fn();
const mockUseProject = vi.fn();

vi.mock('../../../api/use-projects', () => ({
  useProject: (id: string) => mockUseProject(id),
  useUpdateProject: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// dnd-kit requires a PointerSensor which needs a real DOM — mock it for vitest
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: import('react').ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: import('react').ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

import { ProjectSettings } from '../ProjectSettings';
import type { Project } from '../../../types/database';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROJECT_FIXTURE: Project = {
  id: 'proj-1',
  user_id: 'user-1',
  name: '테스트 프로젝트',
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
  reference_files: null,
  bgm_files: null,
  reference_summary: null,
  funnel_config: null,
  ga4_config: null,
  imported_strategy: null,
  meta_credentials: null,
  published_site: null,
  wp_credentials: null,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderProjectSettings() {
  return render(<ProjectSettings projectId="proj-1" />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectSettings', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockUseProject.mockReturnValue({ data: PROJECT_FIXTURE, isLoading: false });
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseProject.mockReturnValue({ data: undefined, isLoading: true });
    renderProjectSettings();
    // Skeletons use aria role=none but they should be present in DOM
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no project found', () => {
    mockUseProject.mockReturnValue({ data: undefined, isLoading: false });
    renderProjectSettings();
    expect(screen.getByText('프로젝트를 찾을 수 없습니다.')).toBeTruthy();
  });

  it('renders project name as heading', () => {
    renderProjectSettings();
    expect(screen.getByText('테스트 프로젝트')).toBeTruthy();
  });

  it('renders all 12 tab triggers', () => {
    renderProjectSettings();
    const tabTriggers = [
      '참고자료',
      '글쓰기가이드',
      'BGM',
      'API키',
      '퍼널·분석',
      '언어',
      '채널연동',
      '발행사이트',
      '브랜드정보',
      '마케터',
      '채널프롬프트',
      'AI모델',
    ];
    for (const label of tabTriggers) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('switches to 브랜드정보 tab when clicked', async () => {
    const user = userEvent.setup();
    renderProjectSettings();
    const brandTab = screen.getByText('브랜드정보');
    await user.click(brandTab);
    // BrandInfoSection renders "브랜드 정보" card title
    expect(screen.getByText('브랜드 정보')).toBeTruthy();
  });

  it('switches to 마케터 tab and shows marketer profile card', async () => {
    const user = userEvent.setup();
    renderProjectSettings();
    await user.click(screen.getByText('마케터'));
    expect(screen.getByText('마케터 프로필')).toBeTruthy();
  });

  it('switches to AI모델 tab and shows model section', async () => {
    const user = userEvent.setup();
    renderProjectSettings();
    await user.click(screen.getByText('AI모델'));
    expect(screen.getByText('AI 모델 선택')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// BrandInfoSection field → onUpdate mapping
// ---------------------------------------------------------------------------

describe('BrandInfoSection field → onUpdate', () => {
  it('calls onUpdate with brand fields on save', async () => {
    const user = userEvent.setup();
    mockUseProject.mockReturnValue({ data: PROJECT_FIXTURE, isLoading: false });

    renderProjectSettings();

    // Switch to brand-info tab
    await user.click(screen.getByText('브랜드정보'));

    // The 저장 button calls handleSave → onUpdate → mutate
    const saveBtn = screen.getByRole('button', { name: '저장' });
    await user.click(saveBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'proj-1',
        updates: expect.objectContaining({
          brand_name: null,
          brand_description: null,
          brand_tone: null,
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// TargetLanguagesSection — ko pinned + reorder
// ---------------------------------------------------------------------------

describe('TargetLanguagesSection', () => {
  const projectWithLangs: Project = {
    ...PROJECT_FIXTURE,
    target_languages: ['ko', 'en', 'th'],
  };

  beforeEach(() => {
    mockMutate.mockClear();
    mockUseProject.mockReturnValue({ data: projectWithLangs, isLoading: false });
  });

  it('renders ko as pinned with 기본 badge', async () => {
    const user = userEvent.setup();
    render(<ProjectSettings projectId="proj-1" />);
    await user.click(screen.getByText('언어'));
    expect(screen.getByText('한국어')).toBeTruthy();
    expect(screen.getByText('기본')).toBeTruthy();
  });

  it('ko remove button is not rendered (ko non-removable)', async () => {
    const user = userEvent.setup();
    render(<ProjectSettings projectId="proj-1" />);
    await user.click(screen.getByText('언어'));
    // The ko row has no X button (it uses Badge not SortableLangItem)
    const removeButtons = screen.queryAllByLabelText('한국어 제거');
    expect(removeButtons).toHaveLength(0);
  });

  it('removes a non-ko language', async () => {
    const user = userEvent.setup();
    render(<ProjectSettings projectId="proj-1" />);
    await user.click(screen.getByText('언어'));
    const removeEnBtn = screen.getByLabelText('English 제거');
    await user.click(removeEnBtn);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        updates: expect.objectContaining({
          target_languages: ['ko', 'th'],
        }),
      })
    );
  });
});
