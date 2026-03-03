import { useState } from 'react';
import type { Storybook, BlogPost, BlogGenerateConfig } from '@tangobook/shared';
import { BlogPostCard } from './BlogPostCard';
import { BlogConfigForm } from './BlogConfigForm';
import { blogApi } from '../api/blog.api';
import { computeSeoScore } from '../utils/seo-score';

interface BlogTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function BlogTab({ storybook, onUpdate, onSave }: BlogTabProps) {
  const posts = storybook.blogPosts ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(posts[0]?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);

  const handleGenerate = async (config: BlogGenerateConfig) => {
    setGenerating(true);
    try {
      const newPost = await blogApi.generate(config);
      // SEO 점수 계산
      const seoResult = computeSeoScore(newPost, config.keywords);
      newPost.seoScore = seoResult.total;
      onUpdate((draft) => {
        if (!draft.blogPosts) draft.blogPosts = [];
        draft.blogPosts.push(newPost);
      });
      onSave();
      setExpandedId(newPost.id);
      setShowConfigForm(false);
    } catch (err) {
      alert(`블로그 생성 실패: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  const updatePost = (postId: string, patch: Partial<BlogPost>) => {
    onUpdate((draft) => {
      const post = draft.blogPosts?.find((p) => p.id === postId);
      if (post) Object.assign(post, patch);
    });
    onSave();
  };

  const deletePost = (postId: string) => {
    onUpdate((draft) => {
      draft.blogPosts = draft.blogPosts?.filter((p) => p.id !== postId);
    });
    onSave();
    if (expandedId === postId) setExpandedId(null);
  };

  if (showConfigForm) {
    return (
      <div className="space-y-4">
        <BlogConfigForm
          storybookId={storybook.id}
          storybookTitle={storybook.title}
          onGenerate={handleGenerate}
          onCancel={() => setShowConfigForm(false)}
          generating={generating}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-white">
          블로그 글 ({posts.length}개)
        </h2>
        <button
          onClick={() => setShowConfigForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          ✨ 새 글 생성
        </button>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">동화책 내용으로 네이버 블로그 글을 자동 생성합니다.</p>
          <p className="text-xs mt-1">&quot;새 글 생성&quot; 버튼을 클릭하여 시작하세요.</p>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <BlogPostCard
            key={post.id}
            post={post}
            storybook={storybook}
            expanded={expandedId === post.id}
            onToggle={() => setExpandedId(expandedId === post.id ? null : post.id)}
            onUpdatePost={(patch) => updatePost(post.id, patch)}
            onDelete={() => deletePost(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
