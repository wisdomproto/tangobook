FROM node:20-alpine

# 오디오북 생성에 필요한 시스템 의존성: Python, ffmpeg, Chromium(Remotion), 한글 폰트
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    fontconfig \
    curl \
    jpeg \
    zlib \
    freetype \
    chromium \
    nss \
    && apk add --no-cache --virtual .build-deps \
       gcc musl-dev python3-dev jpeg-dev zlib-dev freetype-dev \
    && pip3 install --break-system-packages --no-cache-dir \
       Pillow requests \
    && apk del .build-deps \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && mkdir -p /usr/share/fonts/truetype/nanum \
    && curl -L -o /usr/share/fonts/truetype/nanum/NanumGothic.ttf \
       "https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Regular.ttf" \
    && fc-cache -f

# Remotion이 시스템 Chromium을 사용하도록 설정 (자체 Chrome 다운로드 스킵)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium-browser
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/remotion/package.json packages/remotion/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN pnpm install --frozen-lockfile

COPY . .

# 클라이언트(vite) 빌드는 VITE_* 를 빌드 시점에 번들로 인라인한다.
# Railway 서비스 변수는 Docker 빌드에 build-arg 로 전달되므로 ARG 로 받아 ENV 로 노출해야
# vite build 가 인식한다. (없으면 클라가 게스트/더미 Supabase 로 빌드되어 /marketing 게이트가 동작 안 함)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN pnpm build

# tsc가 복사하지 않는 비-TS 파일 복사
RUN cp packages/server/prompt_guide.md packages/server/dist/server/prompt_guide.md \
    && mkdir -p packages/server/dist/server/scripts \
    && cp packages/server/scripts/generate_longform.py packages/server/dist/server/scripts/

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "packages/server/dist/server/src/server.js"]
