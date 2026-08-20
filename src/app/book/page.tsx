"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/lib/site";

const sessionTypes = [
  { value: "INITIAL_CONSULTATION", label: "Initial Consultation (45 min)" },
  { value: "FOLLOW_UP", label: "Follow-up Session (30 min)" },
  { value: "ASSESSMENT", label: "Psychological Assessment (90 min)" },
  { value: "FAMILY_SESSION", label: "Family Session (60 min)" },
  { value: "TRAINING", label: "Training/Workshop (60 min)" },
];

const sessionModes = [
  { value: "IN_PERSON", label: "In-Person", desc: "At Manor Group Health+" },
  { value: "VIRTUAL", label: "Virtual", desc: "Online via secure video" },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    sessionType: "INITIAL_CONSULTATION",
    sessionMode: "IN_PERSON",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to book appointment.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        preferredDate: "",
        preferredTime: "",
        sessionType: "INITIAL_CONSULTATION",
        sessionMode: "IN_PERSON",
        notes: "",
      });
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-green-50 rounded-3xl p-12">
            <div className="text-6xl mb-6">✓</div>
            <h1 className="section-title">Appointment Request Sent!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your booking request. Our team will review your
              details and contact you within 24 hours to confirm your
              appointment.
            </p>
            <p className="text-gray-600 mb-8">
              If you need immediate assistance, please call{" "}
              <a
                href={`tel:${siteConfig.phone.replace(/[^0-9]/g, "")}`}
                className="text-teal-600 font-medium"
              >
                {siteConfig.phone}
              </a>
              .
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="btn-primary"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">Book an Appointment</h1>
          <p className="section-subtitle">
            Fill in your details and we'll contact you to confirm your
            preferred time slot.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="label-field">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="label-field">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="(876) 000-0000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="preferredDate" className="label-field">
                  Preferred Date
                </label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  required
                  value={formData.preferredDate}
                  onChange={handleChange}
                  className="input-field"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label htmlFor="preferredTime" className="label-field">
                  Preferred Time
                </label>
                <input
                  type="time"
                  id="preferredTime"
                  name="preferredTime"
                  required
                  value={formData.preferredTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sessionType" className="label-field">
                Session Type
              </label>
              <select
                id="sessionType"
                name="sessionType"
                value={formData.sessionType}
                onChange={handleChange}
                className="input-field"
              >
                {sessionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Session Mode</label>
              <div className="flex gap-4">
                {sessionModes.map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      formData.sessionMode === mode.value
                        ? "border-teal-600 bg-teal-50"
                        : "border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sessionMode"
                      value={mode.value}
                      checked={formData.sessionMode === mode.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium text-teal-900 block">
                      {mode.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {mode.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="label-field">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                placeholder="Any specific concerns or preferences..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Sending request..." : "Request Appointment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
