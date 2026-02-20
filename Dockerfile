FROM node:20-alpine

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
RUN cp packages/server/prompt_guide.md packages/server/dist/server/prompt_guide.md

EXPOSE 3000

CMD ["node", "packages/server/dist/server/src/server.js"]
