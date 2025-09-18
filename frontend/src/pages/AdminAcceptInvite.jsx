// src/pages/AdminAcceptInvite.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Usage: route this page at /admin/accept-invite
 * Accepts query params: ?token=...&email=...
 */

const useQuery = () => new URLSearchParams(useLocation().search);

const AdminAcceptInvite = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = query.get('token') || '';
    const e = query.get('email') || '';
    setToken(t);
    setEmail(e);
  }, [query]);

  const handleAccept = async () => {
    if (!token || !email) return alert('Missing token or email.');
    if (!password || password.length < 8) return alert('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Accept invite failed');
      alert('Account created. Please login.');
      navigate('/login'); // or wherever
    } catch (err) {
      console.error(err);
      alert('Error accepting invite: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-3">Accept Admin Invite</h2>
      <p className="mb-4 text-sm text-gray-600">Email: <strong>{email}</strong></p>

      <label className="block text-sm text-gray-700">Choose password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mt-1 mb-4 px-3 py-2 rounded border"
        placeholder="Minimum 8 characters"
      />

      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 bg-gray-200 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleAccept}
          className="px-3 py-1.5 bg-primary text-white rounded"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Admin Account'}
        </button>
      </div>
    </div>
  );
};

export default AdminAcceptInvite;
