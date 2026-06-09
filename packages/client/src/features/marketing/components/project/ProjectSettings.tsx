import {
  Paperclip,
  FileText,
  Music,
  Key,
  Globe,
  Languages,
  Link2,
  ExternalLink,
  User,
  Bot,
  MessageSquare,
  Cpu,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui';
import { useProject, useUpdateProject } from '../../api/use-projects';
import { Skeleton } from '../../ui/skeleton';
import {
  BrandInfoSection,
  MarketerSection,
  ChannelPromptsSection,
  AiModelSection,
  WritingGuideSection,
  ReferenceFilesSection,
  BgmSection,
  ApiKeysSection,
  FunnelAnalyticsSection,
  TargetLanguagesSection,
  ChannelConnectionsSection,
  PublishedSiteSection,
} from './sections';
import type { Project } from '../../types/database';

interface ProjectSettingsProps {
  projectId: string;
}

export function ProjectSettings({ projectId }: ProjectSettingsProps) {
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return <div className="p-6 text-sm text-muted-foreground">프로젝트를 찾을 수 없습니다.</div>;
  }

  const handleUpdate = (updates: Partial<Project>) => {
    updateProject.mutate({ id: project.id, updates });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">프로젝트 설정</p>
        </div>

        <Tabs defaultValue="reference-files">
          <TabsList className="flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="reference-files">
              <Paperclip size={14} className="mr-1.5" /> 참고자료
            </TabsTrigger>
            <TabsTrigger value="writing-guide">
              <FileText size={14} className="mr-1.5" /> 글쓰기가이드
            </TabsTrigger>
            <TabsTrigger value="bgm">
              <Music size={14} className="mr-1.5" /> BGM
            </TabsTrigger>
            <TabsTrigger value="api-keys">
              <Key size={14} className="mr-1.5" /> API키
            </TabsTrigger>
            <TabsTrigger value="funnel-analytics">
              <Globe size={14} className="mr-1.5" /> 퍼널·분석
            </TabsTrigger>
            <TabsTrigger value="languages">
              <Languages size={14} className="mr-1.5" /> 언어
            </TabsTrigger>
            <TabsTrigger value="channel-connections">
              <Link2 size={14} className="mr-1.5" /> 채널연동
            </TabsTrigger>
            <TabsTrigger value="published-site">
              <ExternalLink size={14} className="mr-1.5" /> 발행사이트
            </TabsTrigger>
            <TabsTrigger value="brand-info">
              <User size={14} className="mr-1.5" /> 브랜드정보
            </TabsTrigger>
            <TabsTrigger value="marketer">
              <Bot size={14} className="mr-1.5" /> 마케터
            </TabsTrigger>
            <TabsTrigger value="channel-prompts">
              <MessageSquare size={14} className="mr-1.5" /> 채널프롬프트
            </TabsTrigger>
            <TabsTrigger value="ai-model">
              <Cpu size={14} className="mr-1.5" /> AI모델
            </TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="reference-files">
              <ReferenceFilesSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="writing-guide">
              <WritingGuideSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="bgm">
              <BgmSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="api-keys">
              <ApiKeysSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="funnel-analytics">
              <FunnelAnalyticsSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="languages">
              <TargetLanguagesSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="channel-connections">
              <ChannelConnectionsSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="published-site">
              <PublishedSiteSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="brand-info">
              <BrandInfoSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="marketer">
              <MarketerSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="channel-prompts">
              <ChannelPromptsSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="ai-model">
              <AiModelSection project={project} onUpdate={handleUpdate} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
