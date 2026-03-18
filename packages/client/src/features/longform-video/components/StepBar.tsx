interface StepBarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

const STEPS = [
  { step: 1, label: '프롬프트 분석' },
  { step: 2, label: '영상 생성' },
  { step: 3, label: '타임라인 편집' },
  { step: 4, label: '렌더링' },
];

export function StepBar({ currentStep, onStepChange }: StepBarProps) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {STEPS.map(({ step, label }) => (
        <button
          key={step}
          onClick={() => onStepChange(step)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            currentStep === step
              ? 'border-b-2 border-violet-600 text-violet-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
              currentStep === step
                ? 'bg-violet-600 text-white'
                : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {step}
          </span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
