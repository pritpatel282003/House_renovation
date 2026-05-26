'use client'

import { useProjectStore } from '@/store/projectStore'
import { Check } from 'lucide-react'

const steps = [
  { number: 1, label: 'Upload' },
  { number: 2, label: 'Detect Regions' },
  { number: 3, label: 'Choose Materials' },
  { number: 4, label: 'Visualize' },
  { number: 5, label: 'Cost Estimate' },
  { number: 6, label: 'Download Report' },
]

export default function ProjectStepper() {
  const { currentStep, setStep } = useProjectStore()

  return (
    <nav className="w-full overflow-x-auto py-6">
      <ol className="flex items-center justify-between min-w-[600px]">
        {steps.map((step, i) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number
          const isClickable = step.number <= currentStep

          return (
            <li key={step.number} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => isClickable && setStep(step.number)}
                disabled={!isClickable}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                    isCompleted
                      ? 'bg-[#C4622D] border-[#C4622D] text-white'
                      : isCurrent
                        ? 'border-[#C4622D] text-[#C4622D] bg-[#C4622D]/5'
                        : 'border-[#1C2B3A]/15 text-[#1C2B3A]/30'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.number}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'text-[#C4622D]'
                      : isCompleted
                        ? 'text-[#1C2B3A]'
                        : 'text-[#1C2B3A]/30'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-3 mt-[-1.5rem] ${
                    currentStep > step.number ? 'bg-[#C4622D]' : 'bg-[#1C2B3A]/10'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
