// src/components/AdminInviteButton.jsx
import React, { useState } from 'react';

/**
 * AdminInviteButton
 *
 * Props:
 *  - getAuthToken: optional function to return Bearer token (if you use an AuthContext pass that)
 *  - onInviteSuccess: optional callback invoked after successful invite
 *
 * Usage:
 *  <AdminInviteButton getAuthToken={() => localStorage.getItem('token')} />
 */

const AdminInviteButton = ({ getAuthToken, onInviteSuccess }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [expiresHours, setExpiresHours] = useState(72);
  const [loading, setLoading] = useState(false);

  const getToken = () => {
    if (typeof getAuthToken === 'function') return getAuthToken();
    // fallback to localStorage
    return localStorage.getItem('token') || '';
  };

  const handleInvite = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      alert('Please enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ email, expiresHours })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invite failed');
      alert('Invite created — the user will receive an email (or link logged for dev).');
      setEmail('');
      setOpen(false);
      if (typeof onInviteSuccess === 'function') onInviteSuccess();
    } catch (err) {
      console.error(err);
      alert('Error creating invite: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-primary text-white rounded shadow hover:brightness-105"
        aria-haspopup="dialog"
      >
        Invite Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Invite new admin</h3>

            <label className="block text-sm text-gray-700 dark:text-gray-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 mb-3 px-3 py-2 rounded border focus:outline-none"
              placeholder="admin@example.com"
            />

            <label className="block text-sm text-gray-700 dark:text-gray-200">Expires (hours)</label>
            <input
              type="number"
              min="1"
              value={expiresHours}
              onChange={(e) => setExpiresHours(Number(e.target.value))}
              className="w-28 mt-1 mb-4 px-3 py-2 rounded border focus:outline-none"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="px-3 py-1.5 bg-primary text-white rounded shadow"
                disabled={loading}
              >
                {loading ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminInviteButton;
