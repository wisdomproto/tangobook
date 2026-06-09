import { ExternalLink, ThumbsUp, MessageCircle, Eye, TrendingUp } from 'lucide-react';
import type { YTVideo, TrendItem } from '../../api/use-ideas';

interface TrendingFeedProps {
  youtube: YTVideo[];
  googleTrends: TrendItem[];
  naverTrends: TrendItem[];
  onSelectTopic: (topic: string) => void;
}

export function TrendingFeed({
  youtube,
  googleTrends,
  naverTrends,
  onSelectTopic,
}: TrendingFeedProps) {
  return (
    <div className="space-y-6">
      {/* YouTube Video Grid */}
      {youtube.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            유튜브 인기 영상
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {youtube.map((video) => (
              <div
                key={video.id}
                className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => onSelectTopic(video.title)}
              >
                {video.thumbnail && (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-2.5 space-y-1.5">
                  <p className="text-xs font-medium line-clamp-2 leading-snug">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {video.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {video.comments.toLocaleString()}
                    </span>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto hover:text-foreground"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    키워드: {video.keyword}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Naver Trend List */}
      {naverTrends.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            네이버 키워드 트렌드
          </h3>
          <div className="space-y-2">
            {naverTrends.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-md border hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onSelectTopic(item.keyword)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium">{item.keyword}</span>
                  {item.trend === 'data' &&
                    item.totalSearches !== undefined &&
                    item.totalSearches > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({item.totalSearches.toLocaleString()}/월)
                      </span>
                    )}
                </div>
                {item.compIdx && (
                  <span className="text-xs text-muted-foreground">경쟁: {item.compIdx}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Google Trend List */}
      {googleTrends.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Google 트렌드 (참고)
          </h3>
          <div className="space-y-2">
            {googleTrends.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-md border hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onSelectTopic(item.keyword)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium">{item.keyword}</span>
                </div>
                <span className="text-xs text-green-600">
                  {item.trend === 'rising' ? '↑ 상승' : item.trend}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {youtube.length === 0 && naverTrends.length === 0 && googleTrends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
          <TrendingUp className="w-8 h-8 opacity-40" />
          <p>트렌드 데이터가 없습니다</p>
          <p className="text-xs">키워드를 입력하고 분석 버튼을 눌러주세요</p>
        </div>
      )}
    </div>
  );
}
