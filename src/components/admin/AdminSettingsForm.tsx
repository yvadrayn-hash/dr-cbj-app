"use client";

import { useState } from "react";

export default function AdminSettingsForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not update settings.");
        return;
      }

      setMessage(
        "Settings updated. If you changed the email or password, sign out and log back in."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not update settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <label className="label-field" htmlFor="admin-email">
          Admin Email
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="label-field" htmlFor="current-password">
          Current Password
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="label-field" htmlFor="new-password">
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-field"
          placeholder="Leave blank to keep current password"
        />
      </div>

      <div>
        <label className="label-field" htmlFor="confirm-password">
          Confirm New Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}