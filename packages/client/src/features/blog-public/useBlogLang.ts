// 공개 블로그 전용 언어 훅.
// 블로그는 공개 SEO 페이지라 **URL 의 :lang 이 표시 언어를 정한다**(사용자 UI 언어 설정과 무관).
// 전역 언어를 바꾸지 않도록 setUiLanguage 대신 getFixedT 로 그 언어만 고정해 쓴다.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import i18n, { AVAILABLE_UI_LANGS, loadLanguage } from '@/i18n';

const DATE_LOCALE: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  vi: 'vi-VN',
  zh: 'zh-CN',
  th: 'th-TH',
};

export function useBlogLang() {
  const { lang: rawLang } = useParams();
  const lang = rawLang && AVAILABLE_UI_LANGS.includes(rawLang) ? rawLang : 'ko';
  // lazy 로드 완료 시 리렌더 (로드 전엔 ko 폴백 문구가 잠깐 보임)
  const [loaded, setLoaded] = useState(lang === 'ko');

  useEffect(() => {
    if (lang === 'ko') {
      setLoaded(true);
      return;
    }
    let alive = true;
    void loadLanguage(lang).then(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [lang]);

  const t = i18n.getFixedT(lang, 'blog');
  return {
    lang,
    /** ko 는 bare, 그 외 /:lang — 블로그 내부 링크용 */
    pre: lang === 'ko' ? '' : `/${lang}`,
    t,
    loaded,
    fmtDate(iso: string | null): string {
      if (!iso) return '';
      const d = new Date(iso);
      return Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleDateString(DATE_LOCALE[lang] ?? 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
    },
  };
}
