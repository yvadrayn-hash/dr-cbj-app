import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { siteConfig, services, serviceDelivery } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [testimonials, resources] = await Promise.all([
    prisma.testimonial.findMany({
      where: { isApproved: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    prisma.wellnessResource.findMany({
      where: { isActive: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-lavender-400 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <p className="text-teal-300 font-medium mb-4">
                {siteConfig.organization}
              </p>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {siteConfig.name}
              </h1>

              <p className="text-xl md:text-2xl text-teal-100 mb-4 font-light">
                ... of Manor Group Health<span className="text-amber-400 font-semibold">+</span>
              </p>

              <p className="text-teal-200 mb-8 max-w-xl">
                {siteConfig.doctorName}
                <br />
                <span className="text-sm">{siteConfig.doctorTitle}</span>
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/book" className="btn-gold">
                  Book Appointment
                </Link>

                <Link
                  href="/chat"
                  className="btn-secondary !border-white !text-teal-900 hover:!bg-white/10"
                >
                  Start Chat
                </Link>

                <Link
                  href="/services"
                  className="btn-secondary !border-white !text-teal-900 hover:!bg-white/10"
                >
                  Explore Services
                </Link>
              </div>

              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-10 text-sm text-teal-200">
                <div className="flex items-center gap-3 ml-1">
                  <span className="text-white shrink-0">{"\u{1F4CD}"}</span>
                  <p>{siteConfig.address}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 ml-1">
                    <span className="text-white shrink-0">{"\u{1F4F1}"}</span>
                    <a
                      href={`tel:${siteConfig.phone.replace(/[^0-9]/g, "")}`}
                      className="hover whitespace-nowrap"
                    >
                      {siteConfig.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-white shrink-0">{"\u260E"}</span>
                    <a
                      href={`tel:${siteConfig.fixedLine.replace(/[^0-9]/g, "")}`}
                      className="hover whitespace-nowrap"
                    >
                      {siteConfig.fixedLine}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-400/30 to-lavender-400/30 rounded-3xl blur-2xl" />

                <Image
                  src="/assets/avatar.png"
                  alt={siteConfig.doctorName}
                  width={500}
                  height={600}
                  className="relative rounded-3xl shadow-2xl object-cover w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              Comprehensive psychological and behavioural services for individuals,
              families, schools, and organisations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((service) => (
              <div key={service.title} className="card hover:border-teal-200">
                <div className="text-4xl mb-4">{service.icon}</div>

                <h3 className="text-lg font-semibold text-teal-900 mb-3">
                  {service.title}
                </h3>

                <ul className="space-y-2">
                  {service.items.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-teal-500 mt-0.5">{"\u2713"}</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/services"
                  className="inline-block mt-4 text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  Learn more {"\u2192"}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services" className="btn-primary">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Service Delivery */}
      <section className="py-16 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">Service Delivery</h2>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
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
      </section>

      {/* About Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-teal-100 to-lavender-100 rounded-3xl blur-2xl" />

              <Image
                src="/assets/about-page.png"
                alt="About Dr. CBJ"
                width={600}
                height={400}
                className="relative rounded-3xl shadow-xl object-cover w-full"
              />
            </div>

            <div>
              <h2 className="section-title">About Dr. CBJ</h2>

              <p className="text-lg text-gray-600 mb-6">
                {siteConfig.doctorName} is a {siteConfig.doctorTitle} dedicated to
                providing compassionate, evidence-based psychological and behavioural
                services.
              </p>

              <p className="text-gray-600 mb-6">
                With a focus on supporting minds, strengthening families, and
                empowering communities, Dr. CBJ works with individuals, families,
                schools, and organisations to promote mental wellness and positive
                behavioural change.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  "Compassion",
                  "Confidentiality",
                  "Professionalism",
                  "Evidence-Based",
                ].map((value) => (
                  <span
                    key={value}
                    className="bg-teal-50 text-teal-700 rounded-full px-4 py-2 text-sm font-medium"
                  >
                    {value}
                  </span>
                ))}
              </div>

              <Link href="/about" className="btn-primary">
                Learn More About Dr. CBJ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-lavender-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Client Testimonials</h2>

            <p className="section-subtitle max-w-2xl mx-auto">
              Hear from those who have begun their healing journey with Dr. CBJ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="card">
                <div className="flex items-center gap-1 mb-4 text-gold-500">
                  {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                    <span key={i}>{"\u2605"}</span>
                  ))}
                </div>

                <p className="text-gray-600 mb-4 italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <p className="font-semibold text-teal-900">
                  {testimonial.displayName || testimonial.clientName}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/testimonials" className="btn-secondary">
              View All Testimonials
            </Link>
          </div>
        </div>
      </section>

      {/* Wellness Resources Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Wellness Resources</h2>

            <p className="section-subtitle max-w-2xl mx-auto">
              Explore articles, exercises, and tools to support your mental wellness
              journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <div key={resource.id} className="card">
                <span className="inline-block bg-teal-100 text-teal-700 rounded-full px-3 py-1 text-xs font-medium mb-3">
                  {resource.category}
                </span>

                <h3 className="text-lg font-semibold text-teal-900 mb-2">
                  {resource.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  {resource.summary}
                </p>

                <Link
                  href="/wellness-library"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  Read more {"\u2192"}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/wellness-library" className="btn-primary">
              Explore Wellness Library
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Begin Your Healing Journey Today
          </h2>

          <p className="text-teal-200 mb-8 text-lg">
            Take the first step towards mental wellness. Book an appointment or
            start a conversation with our AI assistant.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book" className="btn-gold">
              Book Appointment
            </Link>

            <Link
              href="/chat"
              className="btn-secondary !border-white !text-teal-900 hover:!bg-white/10"
            >
              Start Chat
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
