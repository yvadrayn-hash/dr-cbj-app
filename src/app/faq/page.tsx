import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FaqAccordion from "@/components/FaqAccordion";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Dr. CBJ Mental Wellness services.",
};

export default async function FaqPage() {
  const faqs = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">Frequently Asked Questions</h1>
          <p className="section-subtitle">
            Find answers to common questions about our services and how we can
            support you.
          </p>
        </div>

        <FaqAccordion
          items={faqs.map((faq) => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
          }))}
        />

        <div className="mt-12 text-center bg-teal-50 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-teal-900 mb-2">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            We're here to help. Reach out to us or book an appointment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              Contact Us
            </Link>
            <Link href="/book" className="btn-secondary">
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}