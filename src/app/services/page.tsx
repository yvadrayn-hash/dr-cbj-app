import Link from "next/link";
import { services, serviceDelivery } from "@/lib/site";

export const metadata = {
  title: "Services",
  description:
    "Explore the comprehensive psychological and behavioural services offered by Dr. Coretta Brown-Johnson, JP.",
};

export default function ServicesPage() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">Our Services</h1>
          <p className="section-subtitle max-w-3xl mx-auto">
            Comprehensive psychological and behavioural services for individuals,
            families, schools, and organisations. Each service is delivered with
            compassion, professionalism, and evidence-based practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {services.map((service) => (
            <div key={service.title} className="card hover:border-teal-200">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h2 className="text-lg font-semibold text-teal-900 mb-3">
                {service.title}
              </h2>
              <ul className="space-y-2">
                {service.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-gray-600 flex items-start gap-2"
                  >
                    <span className="text-teal-500 mt-0.5">{"\u2713"}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Service Delivery */}
        <div className="bg-teal-50 rounded-3xl p-8 md:p-12 mb-16">
          <h2 className="section-title text-center">Service Delivery</h2>
          <p className="text-center text-gray-600 mb-8">
            Flexible delivery options to meet your needs
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

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-teal-900 mb-4">
            Ready to Begin?
          </h2>
          <p className="text-gray-600 mb-8">
            Book an appointment or reach out to discuss how we can support you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book" className="btn-primary">
              Book Appointment
            </Link>
            <Link href="/contact" className="btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
