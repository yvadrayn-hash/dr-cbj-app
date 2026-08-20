"use client";

import { useState } from "react";
import Link from "next/link";

export default function IntakePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
    emergencyContact: "",
    reasonForVisit: "",
    currentSymptoms: "",
    medications: "",
    previousTreatment: "",
    goals: "",
    consentGiven: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not submit intake form.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Could not submit intake form.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="card">
            <div className="text-5xl mb-4">{"\u2713"}</div>

            <h1 className="section-title">
              Intake Form Submitted
            </h1>

            <p className="text-gray-600 mb-8">
              Your intake information has been securely submitted.
            </p>

            <Link href="/dashboard" className="btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            {"\u2190"} Back to Dashboard
          </Link>

          <h1 className="section-title mt-4">
            Client Intake Form
          </h1>

          <p className="text-gray-600">
            Please provide the information below before your appointment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label-field" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field" htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label
                className="label-field"
                htmlFor="emergencyContact"
              >
                Emergency Contact
              </label>
              <input
                id="emergencyContact"
                name="emergencyContact"
                type="text"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label-field" htmlFor="reasonForVisit">
              Reason for Visit
            </label>
            <textarea
              id="reasonForVisit"
              name="reasonForVisit"
              rows={4}
              value={formData.reasonForVisit}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label-field" htmlFor="currentSymptoms">
              Current Symptoms or Concerns
            </label>
            <textarea
              id="currentSymptoms"
              name="currentSymptoms"
              rows={4}
              value={formData.currentSymptoms}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field" htmlFor="medications">
              Current Medications
            </label>
            <textarea
              id="medications"
              name="medications"
              rows={3}
              value={formData.medications}
              onChange={handleChange}
              className="input-field"
              placeholder="List any current medications, or enter None."
            />
          </div>

          <div>
            <label
              className="label-field"
              htmlFor="previousTreatment"
            >
              Previous Psychological or Behavioural Treatment
            </label>
            <textarea
              id="previousTreatment"
              name="previousTreatment"
              rows={3}
              value={formData.previousTreatment}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field" htmlFor="goals">
              Goals for Treatment
            </label>
            <textarea
              id="goals"
              name="goals"
              rows={4}
              value={formData.goals}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="consentGiven"
              checked={formData.consentGiven}
              onChange={handleChange}
              className="mt-1"
              required
            />

            <span className="text-sm text-gray-600">
              I confirm that the information provided is accurate
              and consent to its use for clinical and administrative
              purposes related to my care.
            </span>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Intake Form"}
          </button>
        </form>
      </div>
    </div>
  );
}