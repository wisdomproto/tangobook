import type { Storybook, LongformProject, LongformScene } from '@tangobook/shared';

function makeDefaultProject(): LongformProject {
  return {
    id: `lf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '새 롱폼 영상',
    aspectRatio: '16:9',
    language: 'ko',
    scenes: [],
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 28,
      position: 'bottom',
      textColor: '#ffffff',
      outlineColor: '#000000',
      bgColor: '#00000080',
    },
    createdAt: new Date().toISOString(),
  };
}

export function useLongformProject(storybook: Storybook, onSave: (s: Storybook) => void) {
  const projects = storybook.longformProjects ?? [];

  function addProject(): LongformProject {
    const newProject = makeDefaultProject();
    const updated: Storybook = {
      ...storybook,
      longformProjects: [...projects, newProject],
    };
    onSave(updated);
    return newProject;
  }

  function updateProject(projectId: string, updates: Partial<Omit<LongformProject, 'id'>>) {
    const updated: Storybook = {
      ...storybook,
      longformProjects: projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
    };
    onSave(updated);
  }

  function deleteProject(projectId: string) {
    const updated: Storybook = {
      ...storybook,
      longformProjects: projects.filter((p) => p.id !== projectId),
    };
    onSave(updated);
  }

  function updateScene(
    projectId: string,
    sceneId: string,
    updates: Partial<Omit<LongformScene, 'id'>>
  ) {
    const updated: Storybook = {
      ...storybook,
      longformProjects: projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          scenes: p.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s)),
        };
      }),
    };
    onSave(updated);
  }

  function reorderScenes(projectId: string, fromIndex: number, toIndex: number) {
    const updated: Storybook = {
      ...storybook,
      longformProjects: projects.map((p) => {
        if (p.id !== projectId) return p;
        const scenes = [...p.scenes];
        const [moved] = scenes.splice(fromIndex, 1);
        scenes.splice(toIndex, 0, moved);
        // Update order fields to reflect new positions
        const reordered = scenes.map((s, idx) => ({ ...s, order: idx }));
        return { ...p, scenes: reordered };
      }),
    };
    onSave(updated);
  }

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    updateScene,
    reorderScenes,
  };
}
