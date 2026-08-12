import fs from 'fs';
const ROOT = 'C:/projects/tangobook/.claude/worktrees/wizardly-feynman-3ee1cb';

// ① index.json 맨 앞에 기획서 — saenghwal 과 같은 형식이라야 ☰ 사이드바에서 기획서로 갈 수 있다
{
  const p = `${ROOT}/packages/client/public/pongi-index.json`;
  const idx = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (idx[0]?.file !== 'pongi-plan.html') {
    idx.unshift({ file: 'pongi-plan.html', label: '📘 기획서' });
    fs.writeFileSync(p, JSON.stringify(idx, null, 1));
  }
  console.log(`index ${idx.length}항목 (기획서 + 회차 ${idx.length - 1})`);
}

// ② 생성기도 같이 — 재생성해도 기획서가 안 사라지게
{
  const p = `${ROOT}/packages/client/scripts/build-pongi-html.mjs`;
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes("pongi-plan.html")) {
    s = s.replace(
      "fs.writeFileSync(`${OUT}/pongi-index.json`, JSON.stringify(index, null, 1));",
      "index.unshift({ file: 'pongi-plan.html', label: '📘 기획서' }); // ☰ 사이드바 첫 항목\nfs.writeFileSync(`${OUT}/pongi-index.json`, JSON.stringify(index, null, 1));"
    );
    fs.writeFileSync(p, s);
  }
  console.log('생성기 반영:', s.includes('pongi-plan.html'));
}

// ③ 자료실 메뉴 — 창작동화 1000 기획서 바로 뒤
{
  const p = `${ROOT}/packages/client/src/components/TopBar.tsx`;
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('/pongi-plan.html')) {
    const anchor = `  {
    href: '/changjak-styles.html',`;
    const entry = `  {
    href: '/pongi-plan.html',
    icon: '🦦',
    label: '창작동화 1번세트 · 퐁이네 운하 마을',
    desc: '아기 수달 퐁이 · 네덜란드 운하 마을 · 25권 250쪽 대본+SCENE 완성 · 페파형(웃음 착지) · 앵커 4종(실크스크린/활판/리소/리노컷) + 캐스트 시트 프롬프트·붙여넣기(☰ 회차)',
  },
`;
    s = s.replace(anchor, entry + anchor);
    fs.writeFileSync(p, s);
  }
  console.log('자료실 등록:', s.includes('/pongi-plan.html'));
}
