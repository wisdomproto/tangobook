FROM node:20-alpine

# 오디오북 생성에 필요한 시스템 의존성: Python, ffmpeg, 한글 폰트
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    fontconfig \
    curl \
    jpeg \
    zlib \
    freetype \
    && apk add --no-cache --virtual .build-deps \
       gcc musl-dev python3-dev jpeg-dev zlib-dev freetype-dev \
    && pip3 install --break-system-packages --no-cache-dir \
       moviepy Pillow requests \
    && apk del .build-deps \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && mkdir -p /usr/share/fonts/truetype/nanum \
    && curl -L -o /usr/share/fonts/truetype/nanum/NanumGothic.ttf \
       "https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Regular.ttf" \
    && fc-cache -f

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# tsc가 복사하지 않는 비-TS 파일 복사
RUN cp packages/server/prompt_guide.md packages/server/dist/server/prompt_guide.md \
    && mkdir -p packages/server/dist/server/scripts \
    && cp packages/server/scripts/generate_audiobook.py packages/server/dist/server/scripts/

EXPOSE 3000

CMD ["node", "packages/server/dist/server/src/server.js"]
