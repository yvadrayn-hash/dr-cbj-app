import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-teal-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4 mb-4">
              <Image
                src="/assets/Dr. CBJ Logo.png"
                alt="Dr. CBJ Mental Wellness"
                width={64}
                height={64}
                className="rounded-full object-contain"
              />

              <div>
                <h3 className="text-lg font-bold">
                  Dr. CBJ Mental Wellness
                </h3>
                <p className="text-xs text-teal-200">
                  ... of Manor Group Health<span className="text-amber-400 font-semibold">+</span>
                </p>
              </div>
            </div>

            <p className="text-sm text-teal-100 mb-4 max-w-xl">
              {siteConfig.description}
            </p>

            <p className="text-sm text-teal-200">
              {siteConfig.doctorName}
              <br />
              {siteConfig.doctorTitle}
            </p>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold mb-4 text-teal-200">
              Quick Links
            </h4>

            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-teal-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-teal-300 transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-teal-300 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-teal-300 transition-colors">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-teal-300 transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/wellness-library" className="hover:text-teal-300 transition-colors">
                  Wellness Library
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-sm font-semibold mb-4 text-teal-200">
              Contact
            </h4>

            <ul className="space-y-2 text-sm text-teal-100">
              <li>{siteConfig.organization}</li>
              <li>{siteConfig.address}</li>

              <li>
                Mobile:{" "}
                <a
                  href={`tel:${siteConfig.phone.replace(/[^0-9]/g, "")}`}
                  className="hover:text-teal-300 transition-colors"
                >
                  {siteConfig.phone}
                </a>
              </li>

              <li>
                Fixed Line:{" "}
                <a
                  href={`tel:${siteConfig.fixedLine.replace(/[^0-9]/g, "")}`}
                  className="hover:text-teal-300 transition-colors"
                >
                  {siteConfig.fixedLine}
                </a>
              </li>

              <li>
                Email:{" "}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-teal-300 transition-colors break-all"
                >
                  {siteConfig.email}
                </a>
              </li>

              <li>
                Instagram:{" "}
                <span className="text-teal-100">
                  {siteConfig.instagram}
                </span>
              </li>
            </ul>

            <h4 className="text-sm font-semibold mt-6 mb-3 text-teal-200">
              Opening Hours
            </h4>

            <ul className="space-y-2 text-sm text-teal-100">
              {siteConfig.openingHours.map((item) => (
                <li
                  key={item.days}
                  className="flex flex-col sm:flex-row sm:justify-between sm:gap-6"
                >
                  <span className="font-medium">{item.days}</span>
                  <span className="sm:text-right">{item.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-teal-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-teal-300 self-stretch text-left md:self-auto">
            <span className="block">Created by Rayan Omarí Davy</span>
            (c) {new Date().getFullYear()} Dr. CBJ Mental Wellness. All rights reserved.
          </p>

          <p className="text-xs text-teal-300 self-stretch text-left md:self-auto">
            ... of Manor Group Health<span className="text-amber-400 font-semibold">+</span> - {siteConfig.phone}
          </p>
        </div>
      </div>
    </footer>
  );
}

