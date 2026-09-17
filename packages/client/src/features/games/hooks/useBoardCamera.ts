import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { voteWord, VOTE_WINDOW } from '../lib/board-camera/vote';

/**
 * 카메라로 실물 탱고 블록을 읽는다.
 *
 * 인식은 하지 않는다 — `public/tango-reco.js` 가 한다. 🔴 **그 파일이 유일한 원본**이고
 * 저작도구의 실험실 화면(`tango-board-3d.html`)도 같은 파일을 쓴다. 여기 사본을 만들면
 * 실험실에서 잰 숫자가 배포본 숫자가 아니게 된다.
 *
 * 이 훅이 하는 일은 넷뿐이다: 스크립트·형판 받기 · 카메라 열기 · 250ms 마다 한 장 읽기 ·
 * 다수결로 가라앉히기.
 */

interface RecoResult {
  word?: string;
  /** 카드마다 한 줄 — `잘림` 은 그 카드가 화면 가장자리에 걸렸다는 뜻이다. */
  detail?: Array<{ ch?: string; 잘림?: number }>;
}
interface TangoRecoApi {
  load(opts: { set: string }): Promise<boolean>;
  read(rgba: Uint8ClampedArray, w: number, h: number): RecoResult | null;
  grab(
    video: HTMLVideoElement | HTMLCanvasElement,
    canvas: HTMLCanvasElement,
    rotDeg?: number
  ): { rgba: Uint8ClampedArray; W: number; H: number } | null;
  onCvProgress: ((frac: number | null) => void) | null;
  tune: Record<string, unknown> & { recoEveryMs?: number };
}
declare global {
  interface Window {
    TangoReco?: TangoRecoApi;
  }
}

const SCRIPT_SRC = '/tango-reco.js';
const READ_EVERY_MS = 250;

let scriptPromise: Promise<TangoRecoApi> | null = null;
function loadScript(): Promise<TangoRecoApi> {
  if (window.TangoReco) return Promise.resolve(window.TangoReco);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TangoRecoApi>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.onload = () =>
      window.TangoReco ? resolve(window.TangoReco) : reject(new Error('TangoReco 없음'));
    el.onerror = () => reject(new Error('tango-reco.js 를 못 받았다'));
    document.head.appendChild(el);
  }).catch((e) => {
    scriptPromise = null; // 🔴 실패를 캐시하지 않는다 — 다시 켜면 다시 받아 본다
    throw e;
  });
  return scriptPromise;
}

export interface BoardCameraOptions {
  /** 형판 집합 — 한글과 영어를 섞지 않는다(`o`/`ㅇ`, `i`/`ㅣ` 가 같은 그림이다). */
  set: 'ko' | 'en';
  enabled: boolean;
  /** 거치가 달라졌을 때 눈으로 맞추는 손잡이. 기본 0 = 재서 맞춘 방향. */
  rotDeg?: number;
}

export interface BoardCameraState {
  /** opencv + 형판 + 카메라가 다 준비됐나. */
  ready: boolean;
  /** opencv 내려받는 중일 때 0~1, 아니면 null. */
  cvProgress: number | null;
  error: string | null;
  /** 다수결을 거친 낱말 — 화면과 소리는 이걸 본다. */
  word: string;
  /** 이번 프레임이 읽은 날것. 디버그 줄에만 쓴다. */
  raw: string;
  /** 칸 크기·카드 수 같은 진단값. 디버그 줄에만 쓴다. */
  info: Record<string, unknown> | null;
  /**
   * 화면 가장자리에 걸린 카드 수.
   *
   * 🔴 **기기마다 다른 건 해상도가 아니라 화각이다.** 짧은 변 240~2400px 을 훑어도(10배) 낱말이
   *    한 글자도 안 달라졌다 — `detW` 가 긴 변을 맞추고 관문이 전부 칸 배수·넓이 비율이라 흡수된다.
   *    반대로 판이 화면 밖으로 나가면 그 카드는 **정보가 없어서** 못 읽는다(실측: 세로를 60% 로
   *    자르니 「티뷰」가 「티」, 「달비뮤쟝」이 「다비뮤쟝」이 됐다).
   *    그러니 고칠 것은 알고리즘이 아니라 **잘렸다고 말해 주는 것**이다.
   */
  clipped: number;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  /** 📤 지금 프레임을 서버로 — 폰에서 뭐가 잘못됐는지는 그 화면의 프레임이 있어야 안다. */
  sendFrame: () => Promise<boolean>;
}

export function useBoardCamera({ set, enabled, rotDeg = 0 }: BoardCameraOptions): BoardCameraState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const histRef = useRef<string[]>([]);
  const [ready, setReady] = useState(false);
  const [cvProgress, setCvProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [raw, setRaw] = useState('');
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [clipped, setClipped] = useState(0);

  // 🔴 집합이 바뀌면 지난 판의 낱말을 물려주지 않는다.
  useEffect(() => {
    histRef.current = [];
    setWord('');
    setRaw('');
  }, [set]);

  useEffect(() => {
    if (!enabled) return;
    let dead = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      let api: TangoRecoApi;
      try {
        api = await loadScript();
      } catch (e) {
        if (!dead) setError((e as Error).message);
        return;
      }
      if (dead) return;
      api.onCvProgress = (f) => {
        if (!dead) setCvProgress(f);
      };
      try {
        await api.load({ set });
      } catch (e) {
        if (!dead) setError((e as Error).message);
        return;
      }
      if (dead) return;

      /* 🔴 앞쪽 카메라를 쓴다 — 거치대에 얹으면 화면과 같은 쪽 렌즈가 판을 본다.
         🔴 **가로·세로 비율을 지정하지 않는다.** `width:1280 + height:720` 을 같이 걸면 크롬이
            비율까지 맞추려고 `resizeMode:'crop-and-scale'` 로 **프레임을 잘라 낸다** — 세로로
            세운 태블릿에서 1212x2160 이 1212x720 이 되어 판의 대부분이 사라진다(실측: 카드
            4장 중 2장만 남았다). 태블릿을 어느 방향으로 두든 읽혀야 하므로 비율은 기기에 맡긴다.
         🔴 **그래도 해상도는 계속 요구한다.** 조건을 통째로 버리면 폰 기본값 640x480 으로 조용히
            떨어지고, 그러면 칸이 38px → 25.5px 라 마스크가 거칠어져 자모가 통째로 틀린다.
            그래서 짧은 변(`width`)만 걸고 긴 변은 안 건드린다. */
      /* 🔴 타입 주석(`MediaStreamConstraints[]`)을 달지 않는다 — 린터가 DOM 타입을 전역으로
         안 들고 있어 `no-undef` 로 막는다. 추론에 맡기면 같은 걸 검사하면서 통과한다. */
      const tries = [
        {
          video: {
            facingMode: { ideal: 'user' },
            width: { min: 960, ideal: 1280 },
            frameRate: { ideal: 15 },
          },
          audio: false,
        },
        { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 } }, audio: false },
        { video: { width: { ideal: 1280 } }, audio: false },
        { video: true, audio: false },
      ];
      for (const c of tries) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch {
          /* 다음 조건으로 */
        }
      }
      if (dead) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!stream) {
        setError('카메라를 열 수 없어요');
        return;
      }
      const v = videoRef.current;
      if (!v) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      v.srcObject = stream;
      try {
        await v.play();
      } catch {
        /* 자동재생 거절 — 아래에서 크기를 기다리다 포기한다 */
      }
      if (dead) return;
      setReady(true);

      timer = setInterval(() => {
        const vid = videoRef.current;
        if (!vid || !vid.videoWidth) return;
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
        const g = api.grab(vid, canvasRef.current, rotDeg);
        if (!g) return;
        const r = api.read(g.rgba, g.W, g.H);
        const w = (r && r.word) || '';
        setRaw(w);
        const voted = voteWord(histRef.current, w);
        histRef.current = [...histRef.current, w].slice(-VOTE_WINDOW);
        setWord(voted);
        setClipped((r?.detail ?? []).filter((d) => d.잘림).length);
        const dbg = (window as unknown as { reco?: { legoInfo?: Record<string, unknown> } }).reco;
        setInfo(dbg?.legoInfo ?? null);
      }, READ_EVERY_MS);
    })();

    return () => {
      dead = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
      const v = videoRef.current;
      if (v) v.srcObject = null;
      setReady(false);
      setCvProgress(null);
    };
  }, [enabled, set, rotDeg]);

  /**
   * 📤 지금 프레임을 서버로. 두 장을 올린다 — `p…` 는 카메라가 본 것, `s…` 는 우리가 그걸
   * 어떻게 봤는지(검출 버퍼 + 진단 숫자). 🔴 원본만 올리면 「왜 못 읽었나」를 못 짚는다.
   *
   * 🔴 **누르고 2초 뒤에 찍는다.** 누르자마자 찍으면 누른 손가락이 판 위에 있고, 살색 띠가
   *    인식부 안으로 들어와 문턱을 끌고 가서 그 프레임은 통째로 못 읽는다(실측).
   * 🔴 올라가는 `p…` 는 **거울을 되돌린 뒤**의 그림이다 — 실험실 하네스가 그렇게 전제하므로
   *    원본 그대로 올리면 나중에 그 프레임으로 한 시험이 실시간을 대신하지 못한다.
   */
  const sendFrame = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const v = videoRef.current;
    const api = window.TangoReco;
    if (!v || !v.videoWidth || !api) return false;

    const shot = document.createElement('canvas');
    shot.width = v.videoWidth;
    shot.height = v.videoHeight;
    const sx = shot.getContext('2d');
    if (!sx) return false;
    sx.translate(shot.width, 0);
    sx.scale(-1, 1);
    sx.drawImage(v, 0, 0);

    const stamp = Date.now();
    const post = (key: string, dataUrl: string) =>
      fetch('/api/comic-assets/tango-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, dataUrl }),
      }).then((r) => r.json());

    try {
      const ok = await post(`p${stamp}`, shot.toDataURL('image/jpeg', 0.85));
      if (!ok?.success) return false;
      // 진단 한 장 — 이번에 읽은 그림 위에 칸·카드 수를 얹는다.
      const dbg = canvasRef.current;
      if (dbg && dbg.width) {
        const d2 = document.createElement('canvas');
        d2.width = dbg.width;
        d2.height = dbg.height;
        const dx = d2.getContext('2d');
        if (dx) {
          dx.drawImage(dbg, 0, 0);
          const size = Math.max(14, (d2.width / 60) | 0);
          dx.font = `600 ${size}px ui-monospace, monospace`;
          dx.textBaseline = 'top';
          const text = `${raw || '∅'}  ${JSON.stringify(info ?? {})}`;
          dx.fillStyle = 'rgba(0,0,0,.6)';
          dx.fillRect(8, 7, dx.measureText(text).width + 12, size + 8);
          dx.fillStyle = '#dff3ea';
          dx.fillText(text, 14, 10);
          await post(`s${stamp}`, d2.toDataURL('image/jpeg', 0.8));
        }
      }
      return true;
    } catch {
      return false;
    }
  }, [raw, info]);

  return { ready, cvProgress, error, word, raw, info, clipped, videoRef, sendFrame };
}
