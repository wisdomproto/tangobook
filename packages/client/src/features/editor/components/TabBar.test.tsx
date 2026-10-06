import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '@/store/editor.store';
import { TabBar } from './TabBar';

afterEach(() => {
  cleanup();
  useEditorStore.getState().setActiveTab('settings');
});

describe('editor2 영상과 장면 색칠 통합', () => {
  it('두 기능을 함께 표시하고 각각의 탭으로 이동한다', () => {
    render(<TabBar videoLibrary showSceneColoring hiddenTabIds={['audiobook']} />);
    expect(screen.queryByRole('button', { name: '오디오북' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '장면 색칠' }));
    expect(useEditorStore.getState().activeTab).toBe('scene-coloring');
    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    expect(useEditorStore.getState().activeTab).toBe('longform-video');
  });

  it('기존 편집기와 파닉스에는 동화 장면 탭을 추가하지 않는다', () => {
    const { rerender } = render(<TabBar />);
    expect(screen.queryByRole('button', { name: '장면 색칠' })).toBeNull();
    expect(screen.getByRole('button', { name: '동영상 제작' })).toBeTruthy();
    rerender(<TabBar storybookType="phonics" showSceneColoring videoLibrary />);
    expect(screen.queryByRole('button', { name: '장면 색칠' })).toBeNull();
    expect(screen.getByRole('button', { name: '영상' })).toBeTruthy();
  });
});
