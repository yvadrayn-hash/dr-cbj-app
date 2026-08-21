import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description:
    "Contact Dr. CBJ Mental Wellness at Manor Group Health+ in Kingston, Jamaica.",
};

export default function ContactPage() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">Contact Us</h1>
          <p className="section-subtitle max-w-2xl mx-auto">
            We're here to support you. Reach out with any questions or to
            begin your healing journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-teal-50 rounded-3xl p-8 mb-8">
              <h2 className="text-xl font-bold text-teal-900 mb-6">
                Office Information
              </h2>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{"\u{1F3E2}"}</span>
                  <div>
                    <p className="font-semibold text-teal-900">
                      Manor Group Health<span className="text-amber-500 font-semibold">+</span>
                    </p>
                    <p className="text-gray-600">{siteConfig.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">{"\u{1F4F1}"}</span>
                  <div>
                    <p className="font-semibold text-teal-900">Mobile</p>
                    <a
                      href={`tel:${siteConfig.phone.replace(/[^0-9]/g, "")}`}
                      className="text-gray-600 hover:text-teal-700"
                    >
                      {siteConfig.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">{"\u{260E}"}</span>
                  <div>
                    <p className="font-semibold text-teal-900">Fixed Line</p>
                    <a
                      href={`tel:${siteConfig.fixedLine.replace(/[^0-9]/g, "")}`}
                      className="text-gray-600 hover:text-teal-700"
                    >
                      {siteConfig.fixedLine}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">{"\u{2709}"}</span>
                  <div>
                    <p className="font-semibold text-teal-900">Email</p>
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="text-gray-600 hover:text-teal-700 break-all"
                    >
                      {siteConfig.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">{"\u{1F4F7}"}</span>
                  <div>
                    <p className="font-semibold text-teal-900">Instagram</p>
                    <p className="text-gray-600 break-all">
                      {siteConfig.instagram}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-lavender-50 rounded-3xl p-8">
              <h2 className="text-xl font-bold text-teal-900 mb-4">
                Service Delivery
              </h2>

              <p className="text-gray-600 mb-4">
                We offer flexible service delivery options to meet your needs:
              </p>

              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">{"\u2713"}</span>
                  In-Person Consultations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">{"\u2713"}</span>
                  Virtual Sessions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">{"\u2713"}</span>
                  Assessments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">{"\u2713"}</span>
                  Workshops and Training
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">{"\u2713"}</span>
                  Professional Consultation
                </li>
              </ul>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-teal-900 mb-6">
              Send a Message
            </h2>

            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="label-field">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input-field"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="label-field">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label-field">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="input-field"
                  placeholder="(876) 000-0000"
                />
              </div>

              <div>
                <label htmlFor="subject" className="label-field">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="input-field"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="label-field">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="input-field"
                  placeholder="Tell us how we can support you..."
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl font-bold text-teal-900 mb-4">
            Prefer to Book Directly?
          </h2>
          <Link href="/book" className="btn-gold">
            Book an Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}