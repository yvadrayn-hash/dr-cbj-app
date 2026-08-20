import Image from "next/image";
import Link from "next/link";
import { siteConfig, coreValues, serviceDelivery } from "@/lib/site";

export const metadata = {
  title: "About",
  description:
    "Learn about Dr. Coretta Brown-Johnson, JP - Clinical Behavioural Specialist, Psychologist, and International Consultant.",
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-100 to-lavender-100 rounded-3xl blur-2xl" />
            <Image
              src="/assets/about-page.png"
              alt={siteConfig.doctorName}
              width={600}
              height={500}
              className="relative rounded-3xl shadow-xl object-cover w-full"
            />
          </div>
          <div>
            <h1 className="section-title">{siteConfig.doctorName}</h1>
            <p className="text-lg text-teal-700 font-medium mb-6">
              {siteConfig.doctorTitle}
            </p>
            <p className="text-gray-600 mb-4">
              {siteConfig.doctorName} is a dedicated professional committed to
              making compassionate, evidence-based psychological and behavioural
              services more accessible to individuals, families, schools, and
              organisations.
            </p>
            <p className="text-gray-600 mb-4">
              With a focus on supporting minds, strengthening families, and
              empowering communities, Dr. CBJ provides a welcoming, safe, and
              professional environment where clients can begin their healing
              journey.
            </p>
            <p className="text-gray-600">
              Practicing at Manor Group Health<span className="text-amber-500 font-semibold">+</span>, Dr. CBJ offers both
              in-person and virtual services to meet the diverse needs of her
              clients.
            </p>
          </div>
        </div>

        {/* Clinical Philosophy */}
        <div className="bg-teal-50 rounded-3xl p-8 md:p-12 mb-16">
          <h2 className="section-title">Clinical Philosophy</h2>
          <p className="text-gray-700 mb-4">
            Dr. CBJ's approach to care is rooted in compassion, respect, and
            evidence-based practice. She believes that every individual has the
            capacity for growth and healing, and that the therapeutic relationship
            is a partnership built on trust and understanding.
          </p>
          <p className="text-gray-700 mb-4">
            Her work is guided by the principle that mental wellness is essential
            to overall health, and that accessible, culturally sensitive support
            can transform lives, strengthen families, and build resilient
            communities.
          </p>
          <p className="text-gray-700">
            Dr. CBJ is committed to confidentiality, professionalism, and
            providing care that respects each client's unique background,
            values, and goals.
          </p>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="section-title text-center">Core Values</h2>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {coreValues.map((value) => (
              <span
                key={value}
                className="bg-white rounded-full px-6 py-3 text-sm font-medium text-teal-700 shadow-sm border border-teal-100"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        {/* Service Delivery */}
        <div className="bg-gradient-to-br from-teal-50 to-lavender-50 rounded-3xl p-8 md:p-12 mb-16">
          <h2 className="section-title text-center">Service Delivery</h2>
          <p className="text-center text-gray-600 mb-8">
            Flexible options to support your journey
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {serviceDelivery.map((method) => (
              <span
                key={method}
                className="bg-white rounded-full px-6 py-3 text-sm font-medium text-teal-700 shadow-sm border border-teal-100"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-teal-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 mb-6">
            Manor Group Health<span className="text-amber-500 font-semibold">+</span>
            <br />
            {siteConfig.address}
            <br />
            <a
              href={`tel:${siteConfig.phone.replace(/[^0-9]/g, "")}`}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              {siteConfig.phone}
            </a>
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book" className="btn-primary">
              Book Appointment
            </Link>
            <Link href="/contact" className="btn-secondary">
              Contact Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}