import { Mascot } from '@/components/Mascot';

export default function ParentReportsPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <Mascot state="sleeping" size="lg" character="hori" />
      <p className="text-2xl font-black text-ink-900">곧 공개돼요 🚧</p>
      <p className="text-ink-500">학습 리포트는 다음 업데이트에 만들어요</p>
    </div>
  );
}
