import { cn } from "~/utils/styling"

export type Step = {
  id: number
  name: string
}

export type ProgressIndicatorProps = {
  steps: readonly Step[]
  currentStepId: number
  className?: string
}

export function ProgressIndicator({
  steps,
  currentStepId,
  className,
}: ProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStepId)
  const currentStep = steps[currentStepIndex]
  const totalSteps = steps.length
  const progressPercentage = (currentStepIndex / (totalSteps - 1)) * 100

  return (
    <div className={cn("space-y-2", className)}>
      {/* Step information */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-lg text-primary-700">
          {currentStep?.name}
        </h3>
        <span className="font-semibold text-zinc-600">
          {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 overflow-hidden rounded-full bg-zinc-50">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step markers */}
        <div className="absolute top-0 flex h-2 w-full justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "-translate-y-1/6 size-3 rounded-full border-2 transition-colors duration-200",
                index <= currentStepIndex
                  ? "border-accent-700 bg-accent-700"
                  : "border-zinc-400/50 bg-white",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
