import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Deposit: React.FC = () => {
  const navigate = useNavigate();
  const [trc20Address, setTrc20Address] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [amount, setAmount] = useState('');
  const [txid, setTxid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

 const fetchSystemSettings = async () => {
    try {
      // Direct Supabase se id: 1 ya key: 'main' wali row fetch karein
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .or('id.eq.1,key.eq.main')
        .maybeSingle();

      if (!error && data) {
        if (data.deposit_trc20_address) {
          setTrc20Address(data.deposit_trc20_address);
          localStorage.setItem('global_trc20', data.deposit_trc20_address);
        }
        if (data.qr_code_url) {
          setQrCodeUrl(data.qr_code_url);
          localStorage.setItem('global_qr', data.qr_code_url);
        }
      } else {
        // Fallback to localStorage agar direct fetch mein masla ho
        const savedTrc = localStorage.getItem('global_trc20');
        if (savedTrc) setTrc20Address(savedTrc);
      }
    } catch (err) {
      console.error('Error fetching deposit settings:', err);
      const savedTrc = localStorage.getItem('global_trc20');
      if (savedTrc) setTrc20Address(savedTrc);
    }
  };

  const handleCopy = () => {
    if (!trc20Address) return;
    navigator.clipboard.writeText(trc20Address);
    setMessage({ text: 'TRC20 Address copied to clipboard!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

 
const handleSubmitDeposit = async (e: React.FormEvent) => {
  e.preventDefault();

  const val = Number(amount);
  const submittedTxid = txid.trim();

  if (!Number.isFinite(val) || val <= 0) {
    setMessage({ text: 'Please enter a valid deposit amount', type: 'error' });
    return;
  }

  if (!submittedTxid || !/^[a-fA-F0-9]{64}$/.test(submittedTxid)) {
    setMessage({
      text: 'Please enter a valid 64-character blockchain transaction ID (TXID).',
      type: 'error',
    });
    return;
  }

  if (!trc20Address) {
    setMessage({ text: 'Deposit address is not available. Please try again later.', type: 'error' });
    return;
  }

  setLoading(true);

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage({ text: 'Please log in to submit a deposit', type: 'error' });
      return;
    }

    const { error } = await supabase.from('deposits').insert({
      user_id: user.id,
      amount: val,
      trc20_address: trc20Address,
      payment_method: 'trc20',
      txid: submittedTxid,
      status: 'pending',
    });

    if (error) throw error;

    setMessage({
      text: 'Deposit request submitted successfully! Blockchain verification is pending.',
      type: 'success',
    });

    setAmount('');
    setTxid('');

    setTimeout(() => {
      navigate(-1);
    }, 2500);
  } catch (err: any) {
    setMessage({ text: err.message || 'Failed to submit deposit', type: 'error' });
  } finally {
    setLoading(false);
  }
};

  const quickAmounts = [30, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 7000, 10000];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-[#121620] rounded-3xl p-6 border border-amber-500/30 shadow-2xl space-y-6">
        
        <div className="text-center border-b border-amber-500/20 pb-4">
          <h2 className="text-xl font-black text-amber-400">Deposit USDT Funds</h2>
          <p className="text-[11px] text-slate-400 mt-1">Transfer USDT via TRC20 network to top up balance</p>
        </div>

        {message && (
          <div
            className={`p-3 text-xs font-bold rounded-2xl border ${
              message.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* TRC20 Address & QR Code Card */}
        <div className="bg-[#1a202c] p-4 rounded-2xl border border-amber-500/20 text-center space-y-3">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">TRC20 DEPOSIT ADDRESS</span>
          <div className="font-mono text-xs text-white break-all bg-black/40 p-2.5 rounded-xl border border-amber-500/10 select-all min-h-[38px] flex items-center justify-center">
            {trc20Address || <span className="text-slate-500 animate-pulse">Loading live address...</span>}
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs rounded-xl shadow hover:opacity-90 transition"
          >
            📋 Copy TRC20 Address
          </button>

          {/* QR Code Display */}
          <div className="pt-2 flex justify-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Deposit QR Code" className="w-36 h-36 object-contain rounded-xl border border-amber-500/30 bg-white p-1" />
            ) : (
              <div className="w-36 h-36 bg-black/50 border border-amber-500/30 rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-mono text-center p-2">
                QR Code Generated from Address
              </div>
            )}
          </div>
        </div>

        {/* Quick Amount Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 block">Select Quick Amount ($)</label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  amount === val.toString()
                    ? 'bg-amber-500 text-black border-amber-400 shadow-lg'
                    : 'bg-[#1a202c] text-amber-400 border-amber-500/20 hover:border-amber-500/50'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleSubmitDeposit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Enter custom amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#1a202c] border border-amber-500/30 rounded-xl p-3 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
            />
          </div>
          
<div>
  <label className="text-[11px] font-bold text-slate-400 block mb-1">
    Transaction ID (TXID)
  </label>
  <input
    type="text"
    value={txid}
    onChange={(e) => setTxid(e.target.value.trim())}
    placeholder="Paste your TRC20 transaction ID"
    autoComplete="off"
    spellCheck={false}
    required
    className="w-full bg-[#1a202c] border border-amber-500/30 rounded-xl p-3 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
  />
  <p className="text-[10px] text-slate-400 mt-1">
    Enter the transaction ID from your confirmed USDT TRC20 transfer.
  </p>
</div>


          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 bg-[#1a202c] text-slate-300 font-bold text-xs rounded-xl border border-slate-700 hover:bg-[#222a38]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black text-xs rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};