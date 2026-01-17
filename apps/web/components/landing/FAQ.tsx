'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

const faqs = [
  {
    question: 'What sites does it work on?',
    answer:
      'Currently, DoNotStay works on Booking.com. Support for Airbnb and Expedia is coming soon.',
  },
  {
    question: 'How does it analyze reviews?',
    answer:
      'AI reads visible reviews and looks for patterns in noise, cleanliness, safety, location, and more. It identifies red flags and weighs them against positive feedback.',
  },
  {
    question: 'Is my data stored?',
    answer:
      'We cache verdicts to speed things up. We do not store your browsing history or personal data.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Yes, within 7 days of purchase, no questions asked. Contact mail@donotsay.app and we will process your refund.',
  },
  {
    question: 'What if the verdict is wrong?',
    answer:
      'Every verdict has a "Report inaccuracy" button. We take feedback seriously and use it to improve our AI.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="px-4 sm:py-30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border bg-background"
            >
              <button
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-foreground">
                  {faq.question}
                </span>
                <CaretDown
                  size={20}
                  weight="bold"
                  className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 text-muted-foreground">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
