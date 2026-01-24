'use client';

import { ThumbsUp, Question, ThumbsDown } from '@phosphor-icons/react';

const verdicts = [
  {
    icon: ThumbsUp,
    verdict: 'Stay',
    color: 'text-verdict-stay',
    bg: 'bg-verdict-stay-light',
    border: 'border-verdict-stay',
    shadow: 'shadow-lg shadow-verdict-stay/20',
    description: 'No dealbreakers. Book confidently.',
  },
  {
    icon: Question,
    verdict: 'Questionable',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    shadow: '',
    description: 'Trade-offs exist. Check the details.',
  },
  {
    icon: ThumbsDown,
    verdict: 'Do Not Stay',
    color: 'text-verdict-donotstay',
    bg: 'bg-verdict-donotstay-light',
    border: 'border-verdict-donotstay',
    shadow: 'shadow-lg shadow-verdict-donotstay/20',
    description: 'Deal-breakers found. Keep looking.',
  },
];

export function VerdictExplainer() {
  return (
    <section className="bg-muted -mt-22 px-4 py-30 pt-44 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            No Guesswork
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Our AI distills hundreds of reviews into one clear recommendation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {verdicts.map((item, index) => (
            <div
              key={index}
              className={`${item.bg} ${item.border} ${item.shadow} rounded-2xl border-2 p-8 text-center`}
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
          ))}
        </div>
      </div>
    </section>
  );
}
