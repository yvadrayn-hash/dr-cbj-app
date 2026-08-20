"use client";

import { useState } from "react";

interface Resource {
  id: string;
  title: string;
  category: string;
  type: string;
  content: string;
  summary: string | null;
}

const categories = [
  "All",
  "Articles",
  "Breathing Exercises",
  "Meditation",
  "Stress Management",
  "Mindfulness",
  "Sleep Hygiene",
  "Emotional Regulation",
  "Coping Skills",
  "Parenting Resources",
  "Neurodiversity Resources",
];

export default function WellnessLibrary({ resources }: { resources: Resource[] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredResources =
    activeCategory === "All"
      ? resources
      : resources.filter((r) => r.category === activeCategory);

  return (
    <div>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === category
                ? "bg-teal-600 text-white shadow-md"
                : "bg-white text-teal-700 border border-teal-200 hover:bg-teal-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <div key={resource.id} className="card flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-block bg-teal-100 text-teal-700 rounded-full px-3 py-1 text-xs font-medium">
                {resource.category}
              </span>
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {resource.type.toLowerCase()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-teal-900 mb-2">
              {resource.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              {resource.summary}
            </p>
            <button
              onClick={() =>
                setExpandedId(expandedId === resource.id ? null : resource.id)
              }
              className="text-sm font-medium text-teal-600 hover:text-teal-700 text-left"
            >
              {expandedId === resource.id ? "Show less ↑" : "Read more ↓"}
            </button>
            {expandedId === resource.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 animate-fade-in">
                {resource.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No resources in this category yet.</p>
        </div>
      )}
    </div>
  );
}