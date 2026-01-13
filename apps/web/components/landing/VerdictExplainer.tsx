'use client';

import { ThumbsUp, Question, ThumbsDown } from '@phosphor-icons/react';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';

const verdicts = [
  {
    icon: ThumbsUp,
    verdict: 'Stay',
    color: 'text-verdict-stay',
    bg: 'bg-verdict-stay-light',
    border: 'border-verdict-stay',
    description: 'No red flags. Book with confidence.',
    animated: true,
    gradientStart: 'rgb(220, 252, 239)', // lighter green
    gradientEnd: 'rgb(236, 253, 245)', // #ECFDF5
    // Very light greens for subtle effect
    firstColor: '167, 243, 208', // #A7F3D0
    secondColor: '167, 243, 208', // #A7F3D0
    thirdColor: '209, 250, 229', // #D1FAE5
    fourthColor: '209, 250, 229', // #D1FAE5
    fifthColor: '167, 243, 208', // #A7F3D0
    pointerColor: '167, 243, 208', // #A7F3D0
  },
  {
    icon: Question,
    verdict: 'Questionable',
    color: 'text-foreground-secondary',
    bg: 'bg-background-subtle',
    border: 'border-border',
    description: 'Trade-offs exist. Check the details.',
    animated: false,
  },
  {
    icon: ThumbsDown,
    verdict: 'Do Not Stay',
    color: 'text-verdict-donotstay',
    bg: 'bg-verdict-donotstay-light',
    border: 'border-verdict-donotstay',
    description: 'Deal-breakers found. Keep looking.',
    animated: false,
  },
];

export function VerdictExplainer() {
  return (
    <section className="bg-background-subtle -mt-22 px-4 py-30 pt-44 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            No Guesswork
          </h2>
          <p className="mt-4 text-xl text-foreground-secondary">
            Our AI distills hundreds of reviews into one clear recommendation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {verdicts.map((item, index) =>
            item.animated ? (
              <BackgroundGradientAnimation
                key={index}
                gradientBackgroundStart={item.gradientStart}
                gradientBackgroundEnd={item.gradientEnd}
                firstColor={item.firstColor}
                secondColor={item.secondColor}
                thirdColor={item.thirdColor}
                fourthColor={item.fourthColor}
                fifthColor={item.fifthColor}
                pointerColor={item.pointerColor}
                size="200%"
                blendingValue="soft-light"
                interactive={false}
                containerClassName={`rounded-2xl border-2 ${item.border} p-8 text-center`}
              >
                <div
                  className={`mb-4 inline-flex h-16 w-16 items-center justify-center ${item.color}`}
                >
                  <item.icon size={32} weight="bold" />
                </div>
                <h3 className={`mb-3 text-2xl font-bold ${item.color}`}>
                  {item.verdict}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </BackgroundGradientAnimation>
            ) : (
              <div
                key={index}
                className={`${item.bg} ${item.border} rounded-2xl border-2 p-8 text-center`}
              >
                <div
                  className={`mb-4 inline-flex h-16 w-16 items-center justify-center ${item.color}`}
                >
                  <item.icon size={32} weight="bold" />
                </div>
                <h3 className={`mb-3 text-2xl font-bold ${item.color}`}>
                  {item.verdict}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
