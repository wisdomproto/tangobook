#!/bin/bash
# deploy.sh — feat/longform-video를 main에 머지하고 push (Railway 자동 배포)
set -e

BRANCH="feat/longform-video"
MAIN="main"

# 현재 브랜치 확인
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "$BRANCH" ]; then
  echo "현재 브랜치가 $BRANCH가 아닙니다 ($CURRENT). 중단합니다."
  exit 1
fi

# 커밋 안 된 변경사항 확인
if ! git diff --quiet HEAD 2>/dev/null; then
  echo "커밋되지 않은 변경사항이 있습니다. 먼저 커밋하세요."
  exit 1
fi

echo "==> $BRANCH → $MAIN 머지 및 push 시작"

git checkout "$MAIN"
git merge "$BRANCH" --no-edit
git push origin "$MAIN"
git checkout "$BRANCH"

echo "==> 배포 완료! Railway가 자동으로 빌드를 시작합니다."
