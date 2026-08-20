"use client";

import { useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-teal-50/50 transition-colors"
            aria-expanded={openIndex === index}
          >
            <span className="font-medium text-teal-900 pr-4">
              {item.question}
            </span>
            <span
              className={`text-teal-600 transition-transform duration-300 ${
                openIndex === index ? "rotate-45" : ""
              }`}
            >
              +
            </span>
          </button>
          {openIndex === index && (
            <div className="px-5 pb-5 text-gray-600 animate-fade-in">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}