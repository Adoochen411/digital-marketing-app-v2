import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ProductTask {
  id: number;
  name: string;
  store: 'Amazon' | 'AliExpress' | 'Shopify';
  price: number;
  commission: number;
  rating: number;
  imageUrl: string;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent';
  text: string;
  time: string;
}

const EXPENSIVE_PRODUCTS = [
  {
    name: 'Apple MacBook Pro 16" M3 Max Ultra Promotion',
    store: 'Amazon' as const,
    price: 2499.00,
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
  },
  {
    name: 'Sony Alpha A7 IV Full-Frame Camera Kit',
    store: 'Shopify' as const,
    price: 1899.50,
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
  },
  {
    name: 'DJI Mavic 3 Pro Drone Combo Digital Ads',
    store: 'AliExpress' as const,
    price: 1599.00,
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&q=80',
  },
  {
    name: 'Samsung Odyssey Neo G9 Curved Monitor',
    store: 'Amazon' as const,
    price: 1299.99,
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
  },
  {
    name: 'iPhone 15 Pro Max 1TB Titanium Edition',
    store: 'Shopify' as const,
    price: 1399.00,
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&q=80',
  },
  {
    name: 'Bang & Olufsen Beoplay H95 Headphones',
    store: 'AliExpress' as const,
    price: 899.00,
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
  },
];

const INITIAL_TRANSACTIONS = [
  { id: 1, user: 'usr_7857***', amount: 500, type: 'Live Order Commission' },
  { id: 2, user: 'usr_8660***', amount: 1500, type: 'Live Order Commission' },
  { id: 3, user: 'usr_1508***', amount: 400, type: 'Live Order Commission' },
  { id: 4, user: 'usr_7173***', amount: 500, type: 'Live Order Commission' },
  { id: 5, user: 'usr_9743***', amount: 300, type: 'Live Order Commission' },
  { id: 6, user: 'usr_5746***', amount: 300, type: 'Live Order Commission' },
];

export const CustomerDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'support' | 'grabbing' | 'records' | 'vip' | 'mine'>('mine');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const userPhone = user?.user_metadata?.phone_number || '+92 300 1234567';
  const accountStatus = 'Normal / Active';

  const [balance, setBalance] = useState<number>(14.90);
  const [completedTasks, setCompletedTasks] = useState<number>(3);
  const [todayCommission, setTodayCommission] = useState<number>(14.90);
  const [yesterdayEarned] = useState<number>(0.00);
  const [cashGap] = useState<number>(0.00);
  const [activeVipLevel, setActiveVipLevel] = useState<'normal' | 'vip1' | 'vip2' | 'vip3'>('normal');

  const [isGrabbing, setIsGrabbing] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<ProductTask | null>(null);
  const [showFullPageTask, setShowFullPageTask] = useState<boolean>(false);

  const [recordsList, setRecordsList] = useState<ProductTask[]>([]);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // Live Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'agent', text: 'Hello! How can I assist with your tasks or withdrawals today?', time: 'Just now' },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWalletBindModal, setShowWalletBindModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; text: string } | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Form Fields
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [trc20Address, setTrc20Address] = useState('');
  const [erc20Address, setErc20Address] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [withdrawPass, setWithdrawPass] = useState('');

  const quickAmounts = [30, 50, 100, 500, 1000, 2000, 5000, 10000];

  const ABOUT_TEXT = `Digital Marketing Global Network
Operating legally since 2002 under international digital e-commerce authorization.
Our Finance & Audit Department manages seamless global merchant task routing and daily merchant commissions.
We partner directly with leading international platforms including Amazon, AliExpress, and Shopify.
Authorized financial management ensuring secure USDT escrow settlements.`;

  const HOW_IT_WORKS_TEXT = `1. Register and secure your profile using phone and email credentials.
2. Initialize minimum account working deposit starting from $30 USDT.
3. Access the Automatic Grabbing tab from the bottom navigation menu.
4. Click "START GRABBING" to initiate global product matching.
5. System inventory matches targeted promotional product orders in real-time.
6. Verify matched product price, live ratings, and commission yield.
7. Click "COMPLETE" to submit order settlement.
8. Commission profits instantly credit to your live account balance.
9. Higher VIP levels automatically boost daily task yield percentages.
10. System automatically logs high-value tasks into Records.
11. Submit withdrawal requests anytime to your bound USDT TRC20/ERC20 wallet.
12. 24/7 Support Agent available for real-time order routing help.
13. Daily task quota resets automatically every 24 hours.
14. System protects merchant rating integrity through encrypted tasks.
15. Seamless automatic auto-login maintains continuous task sessions.`;

  const RULES_TEXT = `1. Minimum deposit amount starts strictly at $30 USDT.
2. Each account is allocated 25 order tasks daily.
3. Standard task commission yields default to normal dynamic percentages.
4. VIP 1 (Amazon) requires $1000 minimum balance for 10% - 30% yield boost.
5. VIP 2 (AliExpress) requires $2000 minimum balance for 30% - 60% yield boost.
6. VIP 3 (Shopify) requires $5000 minimum balance for 60% - 100% yield boost.
7. Single withdrawal requests exceeding $5000 require security verification.
8. Account frozen status occurs if suspicious access or fraud is detected.
9. Frozen accounts require support identity verification to unfreeze.
10. Deposits or withdrawals rejected due to incorrect wallet binding will refund.
11. All tasks must be completed sequentially before initiating new grabs.
12. Order commission profits are non-transferable between accounts.
13. TRC20 and ERC20 wallet details must be bound accurately in Security.
14. Withdrawal passwords must be configured prior to cash-out requests.
15. Platform reserves legal rights to enforce automated finance safety rules.`;

  useEffect(() => {
    const interval = setInterval(() => {
      const amounts = [200, 300, 400, 500, 700, 789, 1200, 1500];
      const randomAmt = amounts[Math.floor(Math.random() * amounts.length)];
      const randomUser = `usr_${Math.floor(1000 + Math.random() * 9000)}***`;
      const newTx = {
        id: Date.now(),
        user: randomUser,
        amount: randomAmt,
        type: 'Live Order Commission',
      };
      setTransactions((prev) => [newTx, ...prev.slice(0, 5)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'agent',
        text: 'Thank you for reaching out! Our financial support team is reviewing your query.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, replyMsg]);
    }, 1200);
  };

  const handleVipUnlock = (requiredAmount: number, level: 'vip1' | 'vip2' | 'vip3', levelName: string) => {
    if (balance < requiredAmount) {
      showToast(`Required amount $${requiredAmount} needed for ${levelName}!`, 'error');
    } else {
      setActiveVipLevel(level);
      showToast(`Congratulations! You upgraded to ${levelName}.`);
    }
  };

  const handleGrabTask = () => {
    if (completedTasks >= 25) {
      showToast('Daily task limit (25/25) completed!', 'error');
      return;
    }

    setIsGrabbing(true);

    setTimeout(() => {
      const randomProduct = EXPENSIVE_PRODUCTS[Math.floor(Math.random() * EXPENSIVE_PRODUCTS.length)];
      
      let baseRate = 0.02;
      if (activeVipLevel === 'vip1') baseRate = 0.15;
      else if (activeVipLevel === 'vip2') baseRate = 0.40;
      else if (activeVipLevel === 'vip3') baseRate = 0.80;

      const normalComm = parseFloat((Math.random() * (7.0 - 0.5) + 0.5).toFixed(2));
      const calculatedComm = activeVipLevel === 'normal' 
        ? normalComm 
        : parseFloat((randomProduct.price * baseRate).toFixed(2));

      const newTask: ProductTask = {
        id: completedTasks + 1,
        ...randomProduct,
        commission: calculatedComm,
      };

      setCurrentTask(newTask);
      setIsGrabbing(false);
      setShowFullPageTask(true);
    }, 1500);
  };

  const handleConfirmTask = () => {
    if (!currentTask) return;

    setCompletedTasks((prev) => prev + 1);
    setTodayCommission((prev) => parseFloat((prev + currentTask.commission).toFixed(2)));
    setBalance((prev) => parseFloat((prev + currentTask.commission).toFixed(2)));

    if (currentTask.commission >= 5.0) {
      setRecordsList((prev) => [currentTask, ...prev]);
    }

    showToast(`Task #${currentTask.id} completed! Earned +$${currentTask.commission.toFixed(2)}.`);
    setCurrentTask(null);
    setShowFullPageTask(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return;
    }
    showToast(`Deposit request for $${depositAmount} submitted!`);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawPassword) {
      showToast('Please enter amount and withdrawal password', 'error');
      return;
    }
    showToast(`Withdrawal request for $${withdrawAmount} submitted!`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawPassword('');
  };

  return (
    <div className="min-h-screen w-full bg-[#02091d] text-white pb-28 relative font-sans overflow-x-hidden">
      
      {/* FULL-PAGE WORLD MAP TECH BACKGROUND */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-25 mix-blend-screen"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80')` }}
      ></div>
      <div className="fixed inset-0 bg-gradient-to-b from-[#02091d]/90 via-[#051642]/85 to-[#010617]/95 pointer-events-none z-0"></div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 space-y-5 relative z-10">
        
        {message && (
          <div
            className={`p-3.5 text-xs font-bold text-center rounded-2xl shadow-xl border backdrop-blur-md ${
              message.type === 'error'
                ? 'bg-red-600/90 border-red-400 text-white'
                : 'bg-emerald-600/90 border-emerald-400 text-white'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-6 pt-2">
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setInfoModal({ title: 'About Us', text: ABOUT_TEXT })}
                className="p-5 bg-slate-950/80 border border-blue-500/30 rounded-3xl shadow-lg hover:border-amber-400/60 transition flex flex-col items-center space-y-2.5 backdrop-blur-xl"
              >
                <span className="text-3xl p-3 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-400/30">ℹ️</span>
                <span className="text-sm font-black text-white">About Us</span>
              </button>

              <button
                onClick={() => setInfoModal({ title: 'Platform Rules', text: RULES_TEXT })}
                className="p-5 bg-slate-950/80 border border-blue-500/30 rounded-3xl shadow-lg hover:border-amber-400/60 transition flex flex-col items-center space-y-2.5 backdrop-blur-xl"
              >
                <span className="text-3xl p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-400/30">📜</span>
                <span className="text-sm font-black text-white">Rules</span>
              </button>

              <button
                onClick={() => setInfoModal({ title: 'How It Works', text: HOW_IT_WORKS_TEXT })}
                className="p-5 bg-slate-950/80 border border-blue-500/30 rounded-3xl shadow-lg hover:border-amber-400/60 transition flex flex-col items-center space-y-2.5 backdrop-blur-xl"
              >
                <span className="text-3xl p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-400/30">⚙️</span>
                <span className="text-sm font-black text-white">How Works</span>
              </button>

              <button
                onClick={() => setShowCertModal(true)}
                className="p-5 bg-slate-950/80 border border-emerald-500/40 rounded-3xl shadow-lg hover:border-emerald-400 transition flex flex-col items-center space-y-2.5 backdrop-blur-xl"
              >
                <span className="text-3xl p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-400/30">🏅</span>
                <span className="text-sm font-black text-white">Certificate</span>
              </button>
            </div>

            <div className="bg-slate-950/80 border border-blue-500/30 p-5 rounded-3xl shadow-2xl backdrop-blur-xl space-y-3">
              <div className="flex justify-between items-center border-b border-blue-900/60 pb-2.5">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE TRANSACTIONS FEED</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Real-Time</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400 font-mono font-bold">{tx.user}</span>
                      <span className="text-[10px] text-slate-400">({tx.type})</span>
                    </div>
                    <span className="font-mono font-black text-emerald-400">+${tx.amount} USDT</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. SUPPORT TAB WITH OPEN LIVE CHAT BOX */}
        {activeTab === 'support' && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-950/85 p-5 rounded-3xl border border-blue-500/30 shadow-2xl space-y-4 backdrop-blur-xl">
              <div className="text-center space-y-1 border-b border-blue-900/60 pb-3">
                <h2 className="text-base font-bold text-cyan-400">Customer Support Center</h2>
                <p className="text-[11px] text-slate-400">24/7 Channels & Live Support Agent</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2"
                >
                  <span>✈️</span>
                  <span>Telegram</span>
                </a>

                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
              </div>

              <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-3.5 space-y-3 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-cyan-300">Live Assistant Portal</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Online</span>
                </div>

                <div className="h-44 overflow-y-auto space-y-2 pr-1 text-xs">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-2.5 rounded-2xl ${
                          msg.sender === 'user'
                            ? 'bg-cyan-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <p className="leading-snug">{msg.text}</p>
                        <span className="text-[8px] opacity-70 block text-right mt-1 font-mono">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-1 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder="Type your question here..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 3. GRABBING TAB */}
        {activeTab === 'grabbing' && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-950/90 text-white p-6 rounded-3xl border border-blue-500/40 shadow-xl text-center space-y-1 backdrop-blur-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ACCOUNT BALANCE</p>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200">
                {balance.toFixed(2)} <span className="text-sm font-bold text-cyan-400">USDT</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 text-xs">🕒</span>
                  <span className="text-sm font-black text-white">25</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Total Tasks</p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 text-xs">☑️</span>
                  <span className="text-sm font-black text-white">{completedTasks}/25</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Completed</p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 text-xs">💲</span>
                  <span className="text-sm font-black text-emerald-400">${todayCommission.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Earned</p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 text-xs">📈</span>
                  <span className="text-xs font-bold text-amber-400">
                    {activeVipLevel === 'normal' ? 'Active' : activeVipLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Status</p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 text-xs">📊</span>
                  <span className="text-sm font-black text-white">${cashGap.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Cash Gap</p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-900/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-xs">🔒</span>
                  <span className="text-sm font-black text-white">${yesterdayEarned.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Yesterday</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-6 rounded-3xl border border-blue-500/40 shadow-xl text-center space-y-4 backdrop-blur-xl">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-3xl text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Automatic Task Grabbing</h3>
                <p className="text-xs text-slate-400 mt-1">Click below to start matching order tasks from system inventory.</p>
              </div>

              <button
                onClick={handleGrabTask}
                disabled={isGrabbing}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] transition uppercase tracking-wider"
              >
                {isGrabbing ? 'Matching Order Tasks...' : 'Start Grabbing'}
              </button>
            </div>
          </div>
        )}

        {/* 4. RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-950/80 p-6 rounded-3xl border border-blue-500/30 shadow-xl space-y-4 backdrop-blur-xl">
              <div className="border-b border-blue-900/60 pb-3">
                <h2 className="text-base font-bold text-cyan-400">Task Records History</h2>
                <p className="text-xs text-slate-400">View high-commission ($5.00+) and special task records here.</p>
              </div>

              {recordsList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-slate-400">No special high-commission task records saved yet.</p>
                  <button
                    onClick={() => setActiveTab('grabbing')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                  >
                    Continue Grabbing ➔
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordsList.map((rec, i) => (
                    <div key={i} className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{rec.name}</p>
                        <p className="text-[10px] text-slate-400">{rec.store} Promotion</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">+${rec.commission.toFixed(2)}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveTab('grabbing')}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow"
                  >
                    Back to Grabbing Page ➔
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. VIP TAB */}
        {activeTab === 'vip' && (
          <div className="space-y-5 pt-2">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200">
                VIP Membership Levels
              </h2>
              <p className="text-xs text-slate-400">Upgrade to unlock multiplied task profits (10% to 100%).</p>
            </div>

            <div className="bg-slate-950/90 p-5 rounded-3xl border border-amber-500/50 shadow-xl space-y-4 backdrop-blur-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-3xl font-black text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  a
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-amber-400">VIP 1 — AMAZON</h3>
                  <p className="text-xs text-slate-300 font-medium">Commission Rate: 10% - 30%</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full">
                    $1000 Required Balance
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleVipUnlock(1000, 'vip1', 'VIP 1 Amazon')}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition uppercase tracking-wider"
              >
                Upgrade to VIP 1 ($1000)
              </button>
            </div>

            <div className="bg-slate-950/90 p-5 rounded-3xl border border-red-500/50 shadow-xl space-y-4 backdrop-blur-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-3xl text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  🛍️
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-red-400">VIP 2 — AliExpress</h3>
                  <p className="text-xs text-slate-300 font-medium">Commission Rate: 30% - 60%</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-full">
                    $2000 Required Balance
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleVipUnlock(2000, 'vip2', 'VIP 2 AliExpress')}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-black text-xs rounded-xl shadow-lg transition uppercase tracking-wider"
              >
                Upgrade to VIP 2 ($2000)
              </button>
            </div>

            <div className="bg-slate-950/90 p-5 rounded-3xl border border-emerald-500/50 shadow-xl space-y-4 backdrop-blur-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-3xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  🛒
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-emerald-400">VIP 3 — Shopify</h3>
                  <p className="text-xs text-slate-300 font-medium">Commission Rate: 60% - 100%</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">
                    $5000 Required Balance
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleVipUnlock(5000, 'vip3', 'VIP 3 Shopify')}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition uppercase tracking-wider"
              >
                Upgrade to VIP 3 ($5000)
              </button>
            </div>
          </div>
        )}

        {/* 6. MINE TAB WITH SOLID RED LOGOUT BUTTON */}
        {activeTab === 'mine' && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-950/90 p-5 rounded-3xl border border-blue-500/40 shadow-xl flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-2xl text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  👤
                </div>
                <div className="overflow-hidden space-y-0.5">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">PROFILE</p>
                  <h2 className="text-sm font-black text-white">{userPhone}</h2>
                  <p className="text-xs text-slate-400 font-mono truncate">{user?.email || 'user@example.com'}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold">
                  {accountStatus}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/90 p-6 rounded-3xl border border-blue-500/40 shadow-xl text-center space-y-4 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-blue-900/60">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL BALANCE</p>
                  <p className="text-2xl font-black text-blue-400 mt-1">${balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL PROFITS</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">${todayCommission.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition uppercase tracking-wider"
                >
                  📥 Deposit
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="py-3.5 px-4 bg-white text-slate-950 font-black text-xs rounded-xl shadow-lg transition uppercase tracking-wider"
                >
                  📤 Withdraw
                </button>
              </div>
            </div>

            <div className="bg-slate-950/90 rounded-3xl border border-blue-500/30 shadow-xl divide-y divide-blue-900/50 overflow-hidden backdrop-blur-xl">
              <button
                onClick={() => setShowHistoryModal('deposit')}
                className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-blue-900/30 transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">📜</span>
                  <span>Deposit History</span>
                </div>
                <span className="text-slate-500">➔</span>
              </button>

              <button
                onClick={() => setShowHistoryModal('withdraw')}
                className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-blue-900/30 transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">📊</span>
                  <span>Withdraw History</span>
                </div>
                <span className="text-slate-500">➔</span>
              </button>

              <button
                onClick={() => setShowWalletBindModal(true)}
                className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-blue-900/30 transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">💳</span>
                  <span>Wallet Bind (TRC20 / ERC20 / Bank)</span>
                </div>
                <span className="text-slate-500">➔</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-blue-900/30 transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">⚙️</span>
                  <span>Security Settings (Passwords)</span>
                </div>
                <span className="text-slate-500">➔</span>
              </button>
            </div>

            <button
              onClick={signOut}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs rounded-2xl transition flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] uppercase tracking-wider"
            >
              <span>🔒 Log Out Account</span>
            </button>
          </div>
        )}

      </div>

      {/* OFFICIAL CERTIFICATION DOCUMENT MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400/90 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500"></div>

            <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🏅</span>
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">CERTIFICATE OF AUTHORIZATION</span>
              </div>
              <button onClick={() => setShowCertModal(false)} className="text-slate-400 text-xs font-bold hover:text-white">✕</button>
            </div>

            <div className="space-y-3.5 text-left bg-slate-950/90 p-4.5 rounded-2xl border border-slate-800 text-xs font-sans relative">
              
              <div className="absolute top-3 right-3 w-12 h-12 rounded-full border-2 border-amber-400/60 bg-amber-500/10 flex flex-col items-center justify-center text-[8px] font-black text-amber-300 text-center uppercase leading-tight shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <span>OFFICIAL</span>
                <span className="text-[10px]">★ SEAL ★</span>
              </div>

              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider leading-snug pr-14">
                  INTERNATIONAL DIGITAL E-COMMERCE COUNCIL
                </h3>
                <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">ESTABLISHED & REGISTERED SINCE 2002</p>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <p className="flex justify-between">
                  <span className="text-slate-400">License Number:</span>
                  <span className="font-mono font-bold text-cyan-400">#DM-2002-984271-INT</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Financial Audit Ref:</span>
                  <span className="font-mono font-bold text-emerald-400">#FA-99201-GLOBAL</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Auth Status:</span>
                  <span className="font-bold text-emerald-400">Verified Legal Global Partner</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Platforms:</span>
                  <span className="font-bold text-white">Amazon | AliExpress | Shopify</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center">
                <div className="space-y-0.5">
                  <p className="text-amber-300 font-serif italic text-base tracking-widest border-b border-amber-400/40 pb-0.5 inline-block px-1">
                    J. R. Sterling
                  </p>
                  <p className="text-slate-300 font-bold text-[9px] uppercase mt-1">Managing Director</p>
                  <p className="text-[8px] text-slate-500 font-mono">Executive Board</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-amber-300 font-serif italic text-base tracking-widest border-b border-amber-400/40 pb-0.5 inline-block px-1">
                    A. M. Vance
                  </p>
                  <p className="text-slate-300 font-bold text-[9px] uppercase mt-1">Chief Financial Officer</p>
                  <p className="text-[8px] text-slate-500 font-mono">Finance Dept.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[9px] text-slate-400 text-center font-mono">
                📍 7 World Trade Center, 250 Greenwich St, New York, NY 10007, USA
              </div>
            </div>

            <button
              onClick={() => setShowCertModal(false)}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] uppercase tracking-wider"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}

      {/* FULL-PAGE MATCHED ORDER TASK MODAL */}
      {showFullPageTask && currentTask && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.4)]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-black text-cyan-400 uppercase">Matched Order Task #{currentTask.id}</span>
              <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-300 rounded-full text-[10px] font-bold border border-cyan-500/30">
                {currentTask.store} Promotion
              </span>
            </div>

            <div className="space-y-3">
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <img src={currentTask.imageUrl} alt={currentTask.name} className="w-full h-full object-cover" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white leading-snug">{currentTask.name}</h4>
                <p className="text-[11px] text-cyan-400 font-medium mt-0.5">Promoted by Digital Marketing Network</p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs text-center">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <p className="text-[9px] text-slate-400">Product Price</p>
                  <p className="font-mono font-bold text-white mt-0.5">${currentTask.price.toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <p className="text-[9px] text-amber-400">Rating</p>
                  <p className="font-bold text-amber-300 mt-0.5">★ 5.0</p>
                </div>
                <div className="bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                  <p className="text-[9px] text-emerald-400 font-bold">Task Profit</p>
                  <p className="font-mono font-black text-emerald-300 mt-0.5">+${currentTask.commission.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmTask}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition uppercase tracking-wider"
            >
              COMPLETE
            </button>
          </div>
        </div>
      )}

      {/* INFO POPUP MODAL */}
      {infoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center max-h-[80vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-cyan-400 uppercase">{infoModal.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line py-2 text-left font-sans">{infoModal.text}</p>
            <button
              onClick={() => setInfoModal(null)}
              className="w-full py-2.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">Deposit USDT (TRC20)</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <div className="flex flex-col items-center space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="w-32 h-32 bg-white border border-slate-200 p-2 rounded-xl flex items-center justify-center text-slate-950 font-mono font-bold text-xs text-center">
                [QR Code Admin Update]
              </div>
              <p className="text-[10px] text-slate-400 font-mono">TRC20: TAdminDepositAddressTRC20123</p>
              <button
                onClick={() => showToast('Address copied to clipboard!')}
                className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded-lg"
              >
                Copy TRC20 Address
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase">Select Preset Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toString())}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                      depositAmount === amt.toString()
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-400/50'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Manual Amount ($)</label>
                <input
                  type="number"
                  placeholder="Enter custom deposit amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow uppercase"
              >
                Submit Deposit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">Withdraw Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Withdraw Amount ($)</label>
                <input
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Withdrawal Password</label>
                <input
                  type="password"
                  placeholder="Enter withdrawal password"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-white text-slate-950 font-black text-xs rounded-xl shadow uppercase"
              >
                Confirm Withdrawal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WALLET BIND MODAL */}
      {showWalletBindModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">Bind Wallet Details</h3>
              <button onClick={() => setShowWalletBindModal(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Wallet details bound successfully!');
                setShowWalletBindModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">TRC20 Address</label>
                <input
                  type="text"
                  placeholder="Enter TRC20 Address"
                  value={trc20Address}
                  onChange={(e) => setTrc20Address(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">ERC20 Address</label>
                <input
                  type="text"
                  placeholder="Enter ERC20 Address"
                  value={erc20Address}
                  onChange={(e) => setErc20Address(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="Enter Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="Enter Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow uppercase"
              >
                Save Wallet Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">Security Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Security settings updated successfully!');
                setShowSettingsModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Withdrawal Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={withdrawPass}
                  onChange={(e) => setWithdrawPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow uppercase"
              >
                Update Security Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">
                {showHistoryModal === 'deposit' ? 'Deposit History' : 'Withdraw History'}
              </h3>
              <button onClick={() => setShowHistoryModal(null)} className="text-slate-400 text-xs">✕</button>
            </div>
            <p className="text-xs text-slate-400 py-6">No {showHistoryModal} records found.</p>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020d26]/95 border-t-2 border-emerald-500/80 backdrop-blur-2xl py-3 px-2 z-40 shadow-[0_-10px_25px_rgba(16,185,129,0.2)]">
        <div className="max-w-md mx-auto flex justify-between items-center px-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'home' ? 'text-emerald-400 scale-105 font-black' : 'text-slate-400'}`}
          >
            <span className="text-base">🏠</span>
            <span className="text-[9px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'support' ? 'text-emerald-400 scale-105 font-black' : 'text-slate-400'}`}
          >
            <span className="text-base">🎧</span>
            <span className="text-[9px]">Support</span>
          </button>

          <button
            onClick={() => setActiveTab('grabbing')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'grabbing' ? 'text-emerald-400 scale-105 font-black' : 'text-slate-400'}`}
          >
            <span className="text-base">⚡</span>
            <span className="text-[9px]">Grabbing</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'records' ? 'text-emerald-400 scale-105 font-black' : 'text-slate-400'}`}
          >
            <span className="text-base">📋</span>
            <span className="text-[9px]">Records</span>
          </button>

          <button
            onClick={() => setActiveTab('vip')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'vip' ? 'text-emerald-400 scale-105 font-black' : 'text-slate-400'}`}
          >
            <span className="text-base">👑</span>
            <span className="text-[9px]">VIP</span>
          </button>

          <button
            onClick={() => setActiveTab('mine')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'mine' ? 'text-emerald-400 scale-105 font-black' : 'text-slate-400'}`}
          >
            <span className="text-base">👤</span>
            <span className="text-[9px]">Mine</span>
          </button>
        </div>
      </div>

    </div>
  );
};