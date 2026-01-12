'use client';

import { ThumbsUp, Question, ThumbsDown } from '@phosphor-icons/react';

const verdicts = [
  {
    icon: ThumbsUp,
    verdict: 'Stay',
    color: 'text-verdict-stay',
    bg: 'bg-green-50',
    border: 'border-verdict-stay',
    description: 'No red flags. Book with confidence.',
  },
  {
    icon: Question,
    verdict: 'Questionable',
    color: 'text-verdict-depends',
    bg: 'bg-amber-50',
    border: 'border-verdict-depends',
    description: 'Trade-offs exist. Check the details.',
  },
  {
    icon: ThumbsDown,
    verdict: 'Do Not Stay',
    color: 'text-verdict-donotstay',
    bg: 'bg-red-50',
    border: 'border-verdict-donotstay',
    description: 'Deal-breakers found. Keep looking.',
  },
];

export function VerdictExplainer() {
  return (
    <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Clear Verdicts, No Guesswork
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Our AI distills hundreds of reviews into one clear recommendation
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {verdicts.map((item, index) => (
            <div
              key={index}
              className={`${item.bg} ${item.border} rounded-2xl border-2 p-8 text-center`}
            >
              <div
                className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white ${item.color}`}
              >
                <item.icon size={32} weight="bold" />
              </div>
              <h3 className={`mb-3 text-2xl font-bold ${item.color}`}>
                {item.verdict}
              </h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
