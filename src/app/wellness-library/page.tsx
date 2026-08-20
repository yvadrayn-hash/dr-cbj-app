import { prisma } from "@/lib/prisma";
import WellnessLibrary from "@/components/WellnessLibrary";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wellness Library",
  description:
    "Explore articles, breathing exercises, meditation guides, and wellness resources.",
};

export default async function WellnessLibraryPage() {
  const resources = await prisma.wellnessResource.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">Wellness Library</h1>
          <p className="section-subtitle max-w-2xl mx-auto">
            Explore articles, exercises, and tools to support your mental
            wellness journey.
          </p>
        </div>

        <WellnessLibrary
          resources={resources.map((r) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            type: r.type,
            content: r.content,
            summary: r.summary,
          }))}
        />
      </div>
    </div>
  );
}