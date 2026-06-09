import { useState } from 'react';
import React from 'react';
import {
  Search,
  Play,
  MessageCircle,
  Sparkles,
  Camera,
  Eye,
  EyeOff,
  Check,
  HelpCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Label,
  Input,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '../../../ui';
import type { Project, ProjectApiKeys } from '../../../types/database';

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  help: string;
}

interface ApiConfig {
  provider: keyof ProjectApiKeys;
  label: string;
  description: string;
  icon: React.ElementType;
  fields: FieldConfig[];
}

const API_CONFIGS: ApiConfig[] = [
  {
    provider: 'naver',
    label: '네이버 검색광고',
    description: '키워드 검색량, 경쟁률 분석에 사용',
    icon: Search,
    fields: [
      {
        key: 'licenseKey',
        label: 'License Key (API Key)',
        placeholder: 'API 라이선스 키',
        help: '네이버 검색광고 > 도구 > API 사용 관리에서 발급',
      },
      {
        key: 'secretKey',
        label: 'Secret Key',
        placeholder: '시크릿 키',
        help: 'License Key 발급 시 함께 생성되는 시크릿 키',
      },
      {
        key: 'customerId',
        label: 'Customer ID',
        placeholder: '고객 ID (숫자)',
        help: '네이버 검색광고 대시보드 우측 상단에 표시되는 숫자 ID',
      },
    ],
  },
  {
    provider: 'naverDatalab',
    label: '네이버 DataLab',
    description: '검색 트렌드 분석에 사용',
    icon: Search,
    fields: [
      {
        key: 'clientId',
        label: 'Client ID',
        placeholder: '클라이언트 ID',
        help: 'developers.naver.com > 애플리케이션 등록 후 발급',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        placeholder: '클라이언트 시크릿',
        help: '애플리케이션 등록 시 함께 발급',
      },
    ],
  },
  {
    provider: 'instagram',
    label: 'Instagram (Meta)',
    description: '인스타그램 자동 게시, 인사이트 조회',
    icon: Camera,
    fields: [
      {
        key: 'appId',
        label: 'Meta App ID',
        placeholder: 'Meta 앱 ID',
        help: 'developers.facebook.com > 내 앱 > 대시보드에서 App ID 확인',
      },
      {
        key: 'appSecret',
        label: 'App Secret',
        placeholder: '앱 시크릿',
        help: '앱 대시보드 > 설정 > 기본 설정에서 확인',
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        placeholder: '액세스 토큰',
        help: 'Graph API Explorer에서 발급 (장기 토큰 교환 권장)',
      },
    ],
  },
  {
    provider: 'threads',
    label: 'Threads (Meta)',
    description: '스레드 자동 게시',
    icon: MessageCircle,
    fields: [
      {
        key: 'appId',
        label: 'Meta App ID',
        placeholder: 'Meta 앱 ID',
        help: 'Instagram과 동일한 Meta 앱 사용',
      },
      {
        key: 'appSecret',
        label: 'App Secret',
        placeholder: '앱 시크릿',
        help: 'Instagram 앱과 동일한 App Secret',
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        placeholder: '액세스 토큰',
        help: 'Threads API 전용 토큰 (threads_basic, threads_content_publish 권한)',
      },
    ],
  },
  {
    provider: 'youtube',
    label: 'YouTube',
    description: '유튜브 영상 업로드, 분석',
    icon: Play,
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        placeholder: 'YouTube Data API 키',
        help: 'Google Cloud Console > API 키 만들기. YouTube Data API v3 활성화 필요',
      },
      {
        key: 'clientId',
        label: 'OAuth Client ID',
        placeholder: 'OAuth 클라이언트 ID',
        help: 'Google Cloud Console > OAuth 2.0 클라이언트 ID 만들기',
      },
      {
        key: 'clientSecret',
        label: 'OAuth Client Secret',
        placeholder: 'OAuth 클라이언트 시크릿',
        help: 'OAuth 클라이언트 ID 생성 시 함께 발급',
      },
      {
        key: 'refreshToken',
        label: 'Refresh Token',
        placeholder: 'OAuth 리프레시 토큰',
        help: 'OAuth 인증 플로우를 통해 발급 (access_type=offline 필요)',
      },
    ],
  },
  {
    provider: 'perplexity',
    label: 'Perplexity',
    description: '팩트체크, 리서치',
    icon: Sparkles,
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        placeholder: 'Perplexity API 키',
        help: 'perplexity.ai > Settings > API > API Keys에서 생성',
      },
    ],
  },
];

function ApiKeyCard({
  config,
  values,
  onSave,
}: {
  config: ApiConfig;
  values: Record<string, string>;
  onSave: (provider: string, data: Record<string, string>) => void;
}) {
  const Icon = config.icon;
  const [localValues, setLocalValues] = useState<Record<string, string>>(values);
  const [showValues, setShowValues] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasValues = Object.values(values).some((v) => v);
  const hasChanges = JSON.stringify(localValues) !== JSON.stringify(values);

  const handleSave = () => {
    onSave(config.provider, localValues);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon size={18} /> {config.label}
          </CardTitle>
          <Badge
            variant={hasValues ? 'default' : 'secondary'}
            className={hasValues ? 'bg-emerald-600 text-white' : ''}
          >
            {hasValues ? '연결됨' : '미연결'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {config.fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <div className="flex items-center gap-1">
              <Label className="text-xs">{field.label}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HelpCircle size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {field.help}
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type={showValues ? 'text' : 'password'}
              placeholder={field.placeholder}
              value={localValues[field.key] ?? ''}
              onChange={(e) => setLocalValues({ ...localValues, [field.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setShowValues(!showValues)}>
            {showValues ? (
              <>
                <EyeOff size={14} className="mr-1" />
                숨기기
              </>
            ) : (
              <>
                <Eye size={14} className="mr-1" />
                보기
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges && !saved}>
            {saved ? (
              <>
                <Check size={14} className="mr-1" />
                저장됨
              </>
            ) : (
              '저장'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ApiKeysSection({ project, onUpdate }: Props) {
  const apiKeys = (project.api_keys ?? {}) as ProjectApiKeys;

  const handleSave = (provider: string, data: Record<string, string>) => {
    const updated = { ...apiKeys, [provider]: data };
    onUpdate({ api_keys: updated });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
        API 키는 프로젝트 설정에 저장됩니다. 민감한 키는 팀원과 공유하지 마세요.
      </div>
      {API_CONFIGS.map((config) => {
        const values: Record<string, string> = {};
        const providerData = apiKeys[config.provider];
        if (providerData && typeof providerData === 'object') {
          for (const field of config.fields) {
            values[field.key] = (providerData as Record<string, string>)[field.key] ?? '';
          }
        }
        return (
          <ApiKeyCard key={config.provider} config={config} values={values} onSave={handleSave} />
        );
      })}
    </div>
  );
}
