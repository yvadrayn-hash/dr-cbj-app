import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Testimonials",
  description:
    "Read testimonials from clients who have experienced Dr. CBJ's compassionate care.",
};

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">Client Testimonials</h1>
          <p className="section-subtitle max-w-2xl mx-auto">
            Hear from individuals and families who have begun their healing
            journey with Dr. CBJ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card">
              <div className="flex items-center gap-1 mb-4 text-gold-500">
                {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <p className="font-semibold text-teal-900">
                {testimonial.displayName || testimonial.clientName}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(testimonial.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {testimonials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No testimonials available yet.</p>
          </div>
        )}

        <div className="mt-12 text-center bg-teal-50 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-teal-900 mb-2">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-gray-600 mb-6">
            Join others who have found support and healing with Dr. CBJ.
          </p>
          <Link href="/book" className="btn-primary">
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}