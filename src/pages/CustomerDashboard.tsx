import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ProductTask {
  id: number;
  name: string;
  store: string;
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
  const [activeTab, setActiveTab] = useState<'home' | 'support' | 'grabbing' | 'records' | 'vip' | 'mine'>('mine');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userPhone, setUserPhone] = useState('');
  const [myInviteCode, setMyInviteCode] = useState('');

  
const [paymentMethod, setPaymentMethod] = useState<'trc20' | 'bank'>('trc20');
const [paymentReference, setPaymentReference] = useState('');
const [receiptFile, setReceiptFile] = useState<File | null>(null);


  const usernameDisplay = user?.user_metadata?.username || userEmail.split('@')[0] || 'User';
  const emailDisplay = userEmail.includes('@appuser.local') ? `${usernameDisplay} (Active)` : userEmail;

  const [balance, setBalance] = useState<number>(0.00);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [todayCommission, setTodayCommission] = useState<number>(0.00);
  const [runningTasksVal, setRunningTasksVal] = useState<number>(0);
  const [activeVipLevel, setActiveVipLevel] = useState<string>('VIP 0 - Regular');

  // Account Frozen & Task Lock States
  const [isAccountFrozen, setIsAccountFrozen] = useState<boolean>(false);
  const [isAutoTaskLocked, setIsAutoTaskLocked] = useState<boolean>(true);

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
01. Recharge your account with $30 (minimum).
02. Your total balance will be activated up to $10,000.
03. Start with 25 tasks (complete all to earn).
04. Get lucky orders (randomly) for extra high commissions.
05. Place orders on AliExpress, Amazon or Shopify (as per task).
06. Complete tasks and get commission.
07. Withdraw your earnings (after completing 25 tasks).
08. Keep working and upgrade to higher VIP levels for more profit.`;

  const RULES_TEXT = `PLATFORM RULES & REGULATIONS
01. Start balance is $30.00. Anyone can recharge and start earning immediately.
02. Complete 25 tasks to get your withdrawal.
03. If your amount is high and digital marketing is required for withdrawal, you must complete customer verification (KYC).
04. Without verification, your withdrawal will be blocked and deactivated.
05. Keep your account active and follow all platform rules.
06. Use only official platform methods for recharge & withdrawal.
07. Do not share your account details with anyone.
08. Any illegal activity will result in permanent ban.
09. Follow the terms, guidelines and rules strictly.
10. We are not responsible for any false information or third-party activities. Use the platform wisely and safely.`;

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
        setRunningTasksVal(Number(data.running_tasks) || 0.00);
        if (data.email) setUserEmail(data.email);
        if (data.phone) setUserPhone(data.phone);

        const currentCode = String(
          data.user_invite_code || data.invitation_code || ''
        ).trim();

        setMyInviteCode(currentCode);

        if (data.completed_tasks !== undefined) setCompletedTasks(data.completed_tasks);
        if (data.vip_level) setActiveVipLevel(data.vip_level);
        if (data.withdraw_message) setWithdrawLockedMsg(data.withdraw_message);
        if (data.is_frozen !== undefined) setIsAccountFrozen(Boolean(data.is_frozen));
        if (data.auto_task_lock !== undefined) setIsAutoTaskLocked(Boolean(data.auto_task_lock));

        if (data.pending_task) {
          setCurrentTask(data.pending_task);
        }

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
        setRunningTasksVal(Number(data.running_tasks) || 0.00);
        if (data.completed_tasks !== undefined) setCompletedTasks(data.completed_tasks);
        if (data.vip_level) setActiveVipLevel(data.vip_level);
        if (data.withdraw_message) setWithdrawLockedMsg(data.withdraw_message);
        if (data.is_frozen !== undefined) setIsAccountFrozen(Boolean(data.is_frozen));
        if (data.auto_task_lock !== undefined) setIsAutoTaskLocked(Boolean(data.auto_task_lock));
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
            setRunningTasksVal(Number(payload.new.running_tasks) || 0.00);
            if (payload.new.completed_tasks !== undefined) setCompletedTasks(payload.new.completed_tasks);
            if (payload.new.vip_level) setActiveVipLevel(payload.new.vip_level);
            if (payload.new.withdraw_message) setWithdrawLockedMsg(payload.new.withdraw_message);
            if (payload.new.is_frozen !== undefined) setIsAccountFrozen(Boolean(payload.new.is_frozen));
            if (payload.new.auto_task_lock !== undefined) setIsAutoTaskLocked(Boolean(payload.new.auto_task_lock));
            if (payload.new.pending_task) {
              setCurrentTask(payload.new.pending_task);
            }
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

  const handleSelectVipLevel = async (vipName: string, minReq: number) => {
    if (balance < minReq) {
      showToast(`Insufficient balance! Minimum required balance for ${vipName} is $${minReq}`, 'error');
      setShowDepositModal(true);
      return;
    }

    setActiveVipLevel(vipName);
    await supabase.from('profiles').update({ vip_level: vipName }).eq('id', user?.id);
    showToast(`Successfully switched to ${vipName}!`);
    setActiveTab('grabbing');
  };

  const handleGrabTask = async () => {
    if (isAccountFrozen) {
      showToast('Your account is frozen by admin. Please contact customer support.', 'error');
      return;
    }

    if ((isAutoTaskLocked || (balance < 30 && completedTasks === 0))) {
      showToast('Task grabbing is locked for new accounts. Minimum $30 recharge required to auto-unlock tasks.', 'error');
      setShowDepositModal(true);
      return;
    }

    if (completedTasks >= 25) {
      showToast(
        'Daily task limit (25/25) completed! Please contact customer service.',
        'error'
      );
      return;
    }

    if (isGrabbing) return;

    if (currentTask && runningTasksVal < 0) {
      setShowFullPageTask(true);
      return;
    }

    if (!user) {
      showToast('Please sign in first.', 'error');
      return;
    }

    setIsGrabbing(true);
    const nextTaskNum = completedTasks + 1;

    const { data: customTaskData, error: customTaskError } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_number', nextTaskNum)
      .eq('is_active', true)
      .eq('status', 'pending')
      .eq('is_lucky_order', true)
      .maybeSingle();

    if (customTaskError) {
      console.error('Lucky Order lookup failed:', customTaskError);
      showToast('Could not load your task. Please try again.', 'error');
      setIsGrabbing(false);
      return;
    }

    setTimeout(async () => {
      try {
        let grabbedProduct: ProductTask;
        const activePool =
          dbProducts.length > 0 ? dbProducts : INTERNAL_PRODUCT_INVENTORY;

        if (customTaskData) {
          const targetLuckyAmount = Number(
            customTaskData.locked_price ?? customTaskData.task_amount
          );

          const taskComm = Number(
            customTaskData.locked_commission ?? customTaskData.commission
          );

          if (
            !Number.isFinite(targetLuckyAmount) ||
            targetLuckyAmount <= 0 ||
            !Number.isFinite(taskComm) ||
            taskComm < 0
          ) {
            showToast('Lucky Order amount or commission is invalid.', 'error');
            setIsGrabbing(false);
            return;
          }

          const displayNegativeAmt = -Math.abs(targetLuckyAmount);
          const luckyProdIndex = (nextTaskNum - 1) % activePool.length;
          const selectedLuckyProd = activePool[luckyProdIndex];

          grabbedProduct = {
            id: nextTaskNum,
            name: selectedLuckyProd.name,
            store: selectedLuckyProd.store || 'Amazon',
            price: targetLuckyAmount,
            commission: taskComm,
            rating: 5,
            imageUrl:
              selectedLuckyProd.image_url || selectedLuckyProd.imageUrl,
            isLucky: true,
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              running_tasks: displayNegativeAmt,
              pending_task: grabbedProduct,
            })
            .eq('id', user.id);

          if (profileError) {
            console.error('Lucky Order save failed:', profileError);
            showToast('Lucky Order could not be saved. Please try again.', 'error');
            setIsGrabbing(false);
            return;
          }

          setRunningTasksVal(displayNegativeAmt);
        } else {
          if (balance <= 0) {
            showToast(
              'Insufficient balance! Please make a deposit request.',
              'error'
            );
            setIsGrabbing(false);
            setShowDepositModal(true);
            return;
          }

          const uniquePoolIndex =
            (completedTasks +
              Math.floor(completedTasks / activePool.length) * 7) %
            activePool.length;

          const selectedOfficialProd = activePool[uniquePoolIndex];
          const itemPrice = Number(selectedOfficialProd.price);

          const vipLevel = String(activeVipLevel);
          let minCommissionCents = 50;
          let maxCommissionCents = 75;

          if (vipLevel.includes('VIP 3')) {
            minCommissionCents = 100;
            maxCommissionCents = 1200;
          } else if (vipLevel.includes('VIP 2')) {
            minCommissionCents = 100;
            maxCommissionCents = 1000;
          } else if (vipLevel.includes('VIP 1')) {
            minCommissionCents = 100;
            maxCommissionCents = 500;
          }

          const calculatedCommission =
            (
              Math.floor(
                Math.random() *
                  (maxCommissionCents - minCommissionCents + 1)
              ) + minCommissionCents
            ) / 100;

          grabbedProduct = {
            id: nextTaskNum,
            name: selectedOfficialProd.name,
            store: selectedOfficialProd.store || 'Amazon',
            price: itemPrice,
            commission: calculatedCommission,
            rating: 5,
            imageUrl:
              selectedOfficialProd.image_url || selectedOfficialProd.imageUrl,
            isLucky: false,
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              pending_task: grabbedProduct,
              running_tasks: 0,
            })
            .eq('id', user.id);

          if (profileError) {
            console.error('Product task save failed:', profileError);
            showToast('Could not save task. Please try again.', 'error');
            setIsGrabbing(false);
            return;
          }

          setRunningTasksVal(0);
        }

        setCurrentTask(grabbedProduct);
        setShowFullPageTask(true);
      } catch (error) {
        console.error('Grab task failed:', error);
        showToast('Could not load task. Please try again.', 'error');
      } finally {
        setIsGrabbing(false);
      }
    }, 1000);
  };

  const handleConfirmTask = async () => {
    if (!currentTask || !user) return;

    if (runningTasksVal < 0 || balance < 0) {
      showToast(
        'Your lucky order is pending. Please contact customer service for assistance.',
        'error'
      );
      setShowFullPageTask(false);
      setShowDepositModal(true);
      return;
    }

    const newCompletedCount = completedTasks + 1;
    const newComm = parseFloat(
      (todayCommission + currentTask.commission).toFixed(2)
    );
    const newBal = parseFloat(
      (balance + currentTask.commission).toFixed(2)
    );

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

    if (profileError) {
      console.error('Task completion profile update failed:', profileError);
      showToast('Task completion could not be saved. Please try again.', 'error');
      return;
    }

    if (currentTask.isLucky) {
      const { error: taskError } = await supabase
        .from('custom_tasks')
        .update({
          status: 'completed',
          is_active: false,
        })
        .eq('user_id', user.id)
        .eq('task_number', currentTask.id)
        .eq('is_lucky_order', true);

      if (taskError) {
        console.error('Lucky Order status update failed:', taskError);
        showToast(
          'Profile saved, but task status could not be updated. Contact support before retrying.',
          'error'
        );
        return;
      }
    }

    setCompletedTasks(newCompletedCount);
    setTodayCommission(newComm);
    setBalance(newBal);
    setRunningTasksVal(0);
    setRecordsList((prev) => [currentTask, ...prev]);

    showToast(
      `Task #${currentTask.id} completed! Earned +$${currentTask.commission.toFixed(2)}.`
    );

    setCurrentTask(null);
    setShowFullPageTask(false);
  };

  
const handleDepositSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    showToast('Please log in again.', 'error');
    return;
  }

  const amount = Number(depositAmount);

  if (!depositAmount || !Number.isFinite(amount) || amount <= 0) {
    showToast('Please enter a valid deposit amount.', 'error');
    return;
  }

  if (!receiptFile) {
    showToast('Please upload your payment receipt screenshot.', 'error');
    return;
  }

  if (paymentMethod === 'trc20' && !paymentReference.trim()) {
    showToast('Please enter your TRC20 transaction ID (TXID).', 'error');
    return;
  }

  if (paymentMethod === 'bank' && !paymentReference.trim()) {
    showToast('Please enter your bank payment reference.', 'error');
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(receiptFile.type)) {
    showToast('Please upload a JPG, PNG or WEBP image.', 'error');
    return;
  }

  if (receiptFile.size > 5 * 1024 * 1024) {
    showToast('Receipt image must be 5 MB or smaller.', 'error');
    return;
  }

  try {
    const extension =
      receiptFile.type === 'image/png'
        ? 'png'
        : receiptFile.type === 'image/webp'
          ? 'webp'
          : 'jpg';

    const receiptPath =
      `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('deposit-receipts')
      .upload(receiptPath, receiptFile, {
        contentType: receiptFile.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase
      .from('deposits')
      .insert({
        user_id: user.id,
        amount,
        trc20_address:
          paymentMethod === 'trc20'
            ? adminTrc20DepositAddress
            : null,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim(),
        txid:
          paymentMethod === 'trc20'
            ? paymentReference.trim()
            : null,
        receipt_path: receiptPath,
        status: 'pending'
      });

    if (insertError) {
      // Best-effort cleanup if saving the request fails.
      await supabase.storage
        .from('deposit-receipts')
        .remove([receiptPath]);

      throw insertError;
    }

    showToast(
      'Deposit request submitted. Payment is pending verification.'
    );

    setShowDepositModal(false);
    setDepositAmount('');
    setPaymentReference('');
    setReceiptFile(null);

    const { data: depData, error: historyError } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Deposit history error:', historyError);
    } else if (depData) {
      setDepositHistory(depData);
    }
  } catch (err: any) {
    console.error('Deposit submission error:', err);
    showToast(
      err?.message || 'Deposit request failed. Please try again.',
      'error'
    );
  }
};

  const handleWalletBindSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isWalletAlreadyBound) {
      showToast('Please contact with customer service for replace your account', 'error');
      setShowWalletBindModal(false);
      return;
    }

    if (!trc20Address && !bankName) {
      showToast('Please enter your TRC20 or Bank account details', 'error');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        trc20: trc20Address,
        trc20_address: trc20Address,
        erc20: erc20Address,
        bank_name: bankName,
        account_number: accountNumber
      })
      .eq('id', user.id);

    if (!error) {
      setIsWalletAlreadyBound(true);
      showToast('Wallet and Bank details bound successfully!');
      setShowWalletBindModal(false);
    } else {
      showToast(`Wallet Bind Error: ${error.message}`, 'error');
    }
  };

  const handleSecurityUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await supabase.from('profiles').update({ email: userEmail, phone: userPhone }).eq('id', user.id);

    if (newLoginPass) {
      const { error } = await supabase.auth.updateUser({ password: newLoginPass });
      if (error) {
        showToast(`Login Pass Error: ${error.message}`, 'error');
        return;
      }
    }

    if (newWithdrawPass) {
      await supabase
        .from('profiles')
        .update({ withdraw_password: newWithdrawPass })
        .eq('id', user.id);
    }

    showToast('Profile credentials updated successfully!');
    setShowSettingsModal(false);
    setNewLoginPass('');
    setNewWithdrawPass('');
  };

  // UPDATED WITHDRAW SUBMIT WITH BALANCE DEDUCTION & ADMIN LOCK / FROZEN CHECK
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);

    if (isAccountFrozen) {
      showToast('Your account is frozen by admin. Withdrawals are restricted.', 'error');
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

    if (!withdrawAmount || amt <= 0 || !withdrawPasswordInput || !user) {
      showToast('Please enter amount and withdrawal password', 'error');
      return;
    }

    if (amt > balance) {
      showToast('Insufficient balance for withdrawal!', 'error');
      return;
    }

    // 1. Calculate new reduced balance immediately
    const newBalance = balance - amt;

    // 2. Insert withdrawal record into database
    const { error } = await supabase.from('withdrawals').insert([
      {
        user_id: user.id,
        amount: amt,
        trc20_address: trc20Address || 'User Wallet',
        status: 'pending'
      }
    ]);

    if (!error) {
      // 3. Update profiles table balance so funds are deducted instantly
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (updateError) {
        showToast(`Warning: Request sent but balance sync failed`, 'error');
      }

      setBalance(newBalance);

      showToast(`Withdrawal request for $${withdrawAmount} processed!`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawPasswordInput('');
      
      const { data: witData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (witData) setWithdrawHistory(witData);
    } else {
      showToast(`Withdrawal Error: ${error.message}`, 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('TRC20 Address copied!');
  };

  return (
    <div className="min-h-screen w-full bg-[#050508] text-amber-100 pb-28 relative font-sans overflow-x-hidden">
      
      {/* GLOBAL HEADER LOGO */}
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
              GROW • EARN • SUCCEED
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
                : 'bg-[#181408]/90 border-[#d4af37] text-[#f3e5ab]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'mine' && (
          <div className="space-y-4">
            
            <div className="bg-[#0b0c10] border-2 border-[#d4af37]/70 rounded-3xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#d4af37] p-0.5 shadow-lg">
                  <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-xl">
                    👤
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide">{usernameDisplay}</h3>
                  <p className="text-[10px] text-[#f3e5ab] font-medium mt-0.5">● {emailDisplay}</p>
                  {userPhone && <p className="text-[10px] text-gray-400 font-medium">📱 {userPhone}</p>}
                </div>
              </div>
              
              {/* Profile Badge Status - FROZEN OR VIP */}
              <div className="text-right space-y-1">
                <div className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                  isAccountFrozen 
                    ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-[#d4af37]/10 border-[#d4af37] text-[#f3e5ab]'
                }`}>
                  {isAccountFrozen ? '❄️ ACCOUNT FROZEN' : `👑 ${activeVipLevel}`}
                </div>
                <div className="text-[9px] font-mono text-emerald-400 font-bold px-1">
                  Invite Code: {myInviteCode || 'Loading...'}
                </div>
              </div>
            </div>

            <div className="bg-[#0b0c10] border-2 border-[#d4af37]/70 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center divide-x divide-[#d4af37]/30">
                <div>
                  <p className="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">TOTAL BALANCE</p>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] to-[#d4af37] mt-0.5">
                    ${balance.toFixed(2)}
                  </h3>
                </div>
                <div className="pl-4">
                  <p className="text-[9px] text-[#d4af37] uppercase font-bold tracking-wider">TOTAL PROFITS</p>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] to-[#d4af37] mt-0.5">
                    ${todayCommission.toFixed(2)}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="py-3 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-1.5 uppercase tracking-wider"
                >
                  <span>👛</span>
                  <span>DEPOSIT</span>
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="py-3 bg-[#18150a] border-2 border-[#d4af37] text-[#f3e5ab] font-black text-xs rounded-2xl shadow flex items-center justify-center space-x-1.5 uppercase tracking-wider"
                >
                  <span>🏦</span>
                  <span>WITHDRAW</span>
                </button>
              </div>
            </div>

            <div className="bg-[#0b0c10] border border-[#d4af37]/50 rounded-3xl shadow-xl overflow-hidden divide-y divide-[#d4af37]/20">
              <button
                onClick={() => setShowHistoryModal('deposit')}
                className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]"
              >
                <span className="flex items-center space-x-3">
                  <span className="text-base text-[#d4af37]">🪙</span>
                  <div>
                    <div className="text-left">Deposit History</div>
                    <div className="text-[9px] text-gray-400 font-normal">View your deposit records</div>
                  </div>
                </span>
                <span className="text-[#d4af37]">➔</span>
              </button>

              <button
                onClick={() => setShowHistoryModal('withdraw')}
                className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]"
              >
                <span className="flex items-center space-x-3">
                  <span className="text-base text-[#d4af37]">👛</span>
                  <div>
                    <div className="text-left">Withdraw History</div>
                    <div className="text-[9px] text-gray-400 font-normal">View your withdrawal records</div>
                  </div>
                </span>
                <span className="text-[#d4af37]">➔</span>
              </button>

              <button
                onClick={() => {
                  if (isWalletAlreadyBound) {
                    showToast('Please contact with customer service for replace your account', 'error');
                  } else {
                    setShowWalletBindModal(true);
                  }
                }}
                className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]"
              >
                <span className="flex items-center space-x-3">
                  <span className="text-base text-[#d4af37]">🔗</span>
                  <div>
                    <div className="text-left">Wallet Bind (TRC20 / ERC20 / Bank)</div>
                    <div className="text-[9px] text-gray-400 font-normal">Manage your wallet addresses</div>
                  </div>
                </span>
                <span className="text-[#d4af37]">➔</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#18150a]"
              >
                <span className="flex items-center space-x-3">
                  <span className="text-base text-[#d4af37]">📧</span>
                  <div>
                    <div className="text-left">Profile Settings & Passwords</div>
                    <div className="text-[9px] text-gray-400 font-normal">Update login and withdraw passwords</div>
                  </div>
                </span>
                <span className="text-[#d4af37]">➔</span>
              </button>
            </div>

            <div className="bg-[#0b0c10] border border-[#d4af37]/50 p-4 rounded-3xl shadow-xl flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center space-x-2">
                <span className="text-base text-[#d4af37]">🌐</span>
                <div>
                  <div>Select Language</div>
                  <div className="text-[9px] text-gray-400 font-normal">Choose preferred language</div>
                </div>
              </span>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  showToast(`Language set to ${e.target.value}`);
                }}
                className="bg-[#18150a] border border-[#d4af37] text-[#f3e5ab] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <button
              onClick={signOut}
              className="w-full py-3.5 bg-gradient-to-r from-red-900 via-red-600 to-red-900 border border-red-500 text-white font-black text-xs rounded-2xl shadow-lg transition uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <span>🔒</span>
              <span>LOG OUT ACCOUNT</span>
            </button>

          </div>
        )}

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4 font-sans text-amber-100">
            
            <div className="grid grid-cols-4 gap-2 text-center">
              <button
                onClick={() => setInfoModal({ title: 'About Us', text: ABOUT_TEXT })}
                className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center justify-center space-y-1 hover:border-[#f3e5ab]"
              >
                <span className="text-lg">👥</span>
                <span className="text-[9px] font-black text-[#f3e5ab]">About Us</span>
              </button>

              <button
                onClick={() => setInfoModal({ title: 'Platform Rules', text: RULES_TEXT })}
                className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center justify-center space-y-1 hover:border-[#f3e5ab]"
              >
                <span className="text-lg">📋</span>
                <span className="text-[9px] font-black text-[#f3e5ab]">Rules</span>
              </button>

              <button
                onClick={() => setInfoModal({ title: 'How It Works', text: HOW_IT_WORKS_TEXT })}
                className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center justify-center space-y-1 hover:border-[#f3e5ab]"
              >
                <span className="text-lg">⚙️</span>
                <span className="text-[9px] font-black text-[#f3e5ab]">How Works</span>
              </button>

              <button
                onClick={() => setShowCertModal(true)}
                className="p-2.5 bg-[#0b0c10] border border-[#d4af37] rounded-2xl shadow flex flex-col items-center justify-center space-y-1 hover:border-[#f3e5ab]"
              >
                <span className="text-lg">📜</span>
                <span className="text-[9px] font-black text-[#f3e5ab]">Certificate</span>
              </button>
            </div>

            <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-4 space-y-3 shadow-2xl">
              <div className="flex items-center space-x-2 border-b border-[#d4af37]/30 pb-2">
                <div className="w-8 h-8 rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-base">
                  👥
                </div>
                <h3 className="text-base font-black text-[#f3e5ab] tracking-wider">About Us</h3>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Digital Marketing is an <span className="text-[#f3e5ab] font-bold">international legal</span> platform offering genuine earning opportunities through <span className="text-[#f3e5ab] font-bold">Digital Marketing</span>. We work as a trusted partner with <span className="text-red-400 font-bold">AliExpress</span>, <span className="text-amber-400 font-bold">Amazon</span> and <span className="text-emerald-400 font-bold">Shopify</span>, and manage the finance department to ensure safe, smooth and secure transactions for all our users.
              </p>

              <div className="bg-[#18150a] border border-[#d4af37]/50 p-2.5 rounded-2xl flex justify-around items-center">
                <span className="font-black text-red-500 text-xs">AliExpress</span>
                <span className="text-gray-600">|</span>
                <span className="font-black text-amber-400 text-xs">amazon</span>
                <span className="text-gray-600">|</span>
                <span className="font-black text-emerald-400 text-xs">shopify</span>
              </div>

              <div className="grid grid-cols-5 gap-1 text-center pt-1">
                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-xs">🛡️</div>
                  <p className="text-[7px] font-bold text-[#f3e5ab] leading-tight">100% Legal & Trusted</p>
                </div>
                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-xs">🔒</div>
                  <p className="text-[7px] font-bold text-[#f3e5ab] leading-tight">Secure Transactions</p>
                </div>
                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-xs">🎧</div>
                  <p className="text-[7px] font-bold text-[#f3e5ab] leading-tight">24/7 Support</p>
                </div>
                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-xs">🌐</div>
                  <p className="text-[7px] font-bold text-[#f3e5ab] leading-tight">Global Platform</p>
                </div>
                <div className="space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-xs">🤝</div>
                  <p className="text-[7px] font-bold text-[#f3e5ab] leading-tight">Long Term Partnership</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-4 space-y-3 shadow-2xl">
                <div className="flex items-center space-x-2 border-b border-[#d4af37]/30 pb-2">
                  <div className="w-8 h-8 rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-base">
                    👑
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#f3e5ab] tracking-wider">VIP Levels & Commission</h3>
                    <p className="text-[8px] text-gray-400">Higher Level = Higher Commission</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-[#18150a] border border-[#d4af37]/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs">👑</span>
                      <span className="font-bold text-white text-[11px]">VIP 0 (Regular)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[#f3e5ab] font-bold text-[11px]">$30.00</span>
                      <p className="text-[8px] text-emerald-400 font-bold">0.56% - 0.75% / Order</p>
                    </div>
                  </div>

                  <div className="p-2 bg-[#18150a] border border-[#d4af37]/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-md bg-amber-500 text-black font-black flex items-center justify-center text-[10px]">a</span>
                      <span className="font-bold text-white text-[11px]">Amazon VIP 1</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[#f3e5ab] font-bold text-[11px]">$1,000.00</span>
                      <p className="text-[8px] text-emerald-400 font-bold">1% - 10% / Order</p>
                    </div>
                  </div>

                  <div className="p-2 bg-[#18150a] border border-[#d4af37]/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-md bg-red-600 text-white font-black flex items-center justify-center text-[9px]">Ali</span>
                      <span className="font-bold text-white text-[11px]">AliExpress VIP 2</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[#f3e5ab] font-bold text-[11px]">$2,000.00</span>
                      <p className="text-[8px] text-emerald-400 font-bold">1% - 20% / Order</p>
                    </div>
                  </div>

                  <div className="p-2 bg-[#18150a] border border-[#d4af37]/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black flex items-center justify-center text-[10px]">S</span>
                      <span className="font-bold text-white text-[11px]">Shopify VIP 3</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[#f3e5ab] font-bold text-[11px]">$5,000.00</span>
                      <p className="text-[8px] text-emerald-400 font-bold">1% - 30% / Order</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0b0c10] border-2 border-[#d4af37] p-3.5 rounded-3xl shadow-xl space-y-2 flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-[#d4af37]/20 pb-2">
                  <h3 className="text-xs font-extrabold text-[#f3e5ab] tracking-wider flex items-center space-x-1.5">
                    <span className="text-sm text-[#d4af37]">📈</span>
                    <span>LIVE TRANSACTIONS</span>
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] font-bold rounded-full animate-pulse">
                    Real-Time
                  </span>
                </div>

                <div className="space-y-1.5 overflow-hidden flex-1">
                  {liveFeed.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2 bg-[#18150a] border border-[#d4af37]/30 rounded-xl flex items-center justify-between text-xs transition duration-300"
                    >
                      <div>
                        <span className="font-bold text-white text-[10px]">{tx.user}</span>
                        <p className="text-[7px] text-gray-400">(Commission)</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-[#50e3c2] text-[11px]">+${tx.amount} USDT</span>
                        <p className="text-[7px] text-gray-500">{tx.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="bg-gradient-to-r from-[#181408] via-[#241c0c] to-[#181408] border-2 border-[#d4af37] rounded-3xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-[#d4af37] text-black flex items-center justify-center font-bold text-lg shadow">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#f3e5ab]">Why Choose Us?</h4>
                  <p className="text-[8px] text-gray-300">Real Earning | Genuine Platform | Global Opportunities</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-center text-[9px]">
                <div className="px-2 py-1 bg-black/60 border border-[#d4af37]/40 rounded-xl text-amber-200">
                  🔒 Secure Payments
                </div>
                <div className="px-2 py-1 bg-black/60 border border-[#d4af37]/40 rounded-xl text-amber-200">
                  👥 Verified Users
                </div>
                <div className="px-2 py-1 bg-black/60 border border-[#d4af37]/40 rounded-xl text-amber-200">
                  🎧 Dedicated Support
                </div>
              </div>

              <div className="w-full text-center border-t border-[#d4af37]/30 pt-2">
                <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37] tracking-wider italic">
                  📈 Build Your Future With Us
                </span>
              </div>
            </div>

          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="bg-[#0b0c10] border-2 border-[#d4af37] p-4 rounded-3xl shadow-2xl space-y-4 min-h-[75vh] flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="text-center space-y-1 border-b border-[#d4af37]/30 pb-3">
                  <h2 className="text-base font-extrabold text-[#f3e5ab]">Customer Support Center</h2>
                  <p className="text-[10px] text-gray-400">24/7 Official Support Channels & Live Agent</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 bg-[#18150a] border border-sky-400/50 text-sky-300 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 hover:bg-sky-950/30"
                  >
                    <span>✈️</span>
                    <span>Telegram</span>
                  </a>

                  <a
                    href="https://whatsapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 bg-[#18150a] border border-emerald-400/50 text-emerald-300 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 hover:bg-emerald-950/30"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="bg-[#18150a] border-2 border-[#d4af37]/60 rounded-2xl p-4 space-y-3 flex-1 flex flex-col justify-between shadow-inner">
                <div className="flex justify-between items-center border-b border-[#d4af37]/30 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-xs font-black text-[#f3e5ab]">Live Assistant Portal</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">● Online</span>
                </div>

                <div className="flex-1 min-h-[320px] max-h-[450px] overflow-y-auto space-y-2.5 pr-1 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs py-16">No messages yet. Send a message to support!</div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${!msg.is_admin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl shadow ${
                            !msg.is_admin
                              ? 'bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-semibold rounded-br-none'
                              : 'bg-black text-gray-200 border border-[#d4af37]/50 rounded-bl-none'
                          }`}
                        >
                          <p className="leading-snug text-xs">{msg.message}</p>
                          <span className="text-[8px] opacity-75 block text-right mt-1 font-mono">
                            {formatDateWithTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-[#d4af37]/30">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-black border border-[#d4af37]/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#f3e5ab]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs rounded-xl shadow uppercase tracking-wider"
                  >
                    Send
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* GRABBING TAB */}
        {activeTab === 'grabbing' && (
          <div className="space-y-4">
            
            {activeVipLevel.includes('Amazon') && (
              <div className="bg-gradient-to-r from-amber-950 via-[#2a1a08] to-amber-950 border-2 border-amber-500 p-4 rounded-3xl shadow-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-amber-400 tracking-wider">amazon VIP 1</h3>
                  <p className="text-[10px] text-amber-200">Exclusive Amazon Grabbing Portal (1% - 10% Commission)</p>
                </div>
                <div className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                  a
                </div>
              </div>
            )}

            {activeVipLevel.includes('AliExpress') && (
              <div className="bg-gradient-to-r from-red-950 via-[#2a0808] to-red-950 border-2 border-red-500 p-4 rounded-3xl shadow-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-red-400 tracking-wider">AliExpress VIP 2</h3>
                  <p className="text-[10px] text-red-200">Exclusive AliExpress Grabbing Portal (1% - 20% Commission)</p>
                </div>
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                  Ali
                </div>
              </div>
            )}

            {activeVipLevel.includes('Shopify') && (
              <div className="bg-gradient-to-r from-emerald-950 via-[#082a18] to-emerald-950 border-2 border-emerald-500 p-4 rounded-3xl shadow-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-emerald-400 tracking-wider">shopify VIP 3</h3>
                  <p className="text-[10px] text-emerald-200">Exclusive Shopify Grabbing Portal (1% - 30% Commission)</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                  S
                </div>
              </div>
            )}

            <div className="bg-[#0b0c10] text-white p-6 rounded-3xl border-2 border-[#d4af37]/70 shadow-xl text-center space-y-1">
              <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">ACCOUNT BALANCE</p>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37]">
                ${balance.toFixed(2)} <span className="text-sm font-bold text-[#d4af37]">USDT</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[#d4af37] text-xs">📋</span>
                  <span className="text-sm font-black text-white">25</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Total Tasks</p>
              </div>

              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[#d4af37] text-xs">⭐</span>
                  <span className="text-sm font-black text-white">{completedTasks}/25</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Completed</p>
              </div>

              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[#50e3c2] text-xs">💰</span>
                  <span className="text-sm font-black text-[#50e3c2]">${todayCommission.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Today Earnings</p>
              </div>

              <div className="bg-[#0b0c10] p-4 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[#d4af37] text-xs">👑</span>
                  <span className="text-xs font-bold text-[#f3e5ab] line-clamp-1">{activeVipLevel}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Status</p>
              </div>
            </div>

            <div className="bg-[#0b0c10] p-6 rounded-3xl border-2 border-[#d4af37]/70 shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#18150a] border-2 border-[#d4af37] flex items-center justify-center text-3xl text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#f3e5ab]">Automatic Task Grabbing</h3>
                <p className="text-xs text-gray-400 mt-1">Click below to start matching order tasks from inventory.</p>
              </div>

              <button
                onClick={handleGrabTask}
                disabled={isGrabbing}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] hover:brightness-110 text-black font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(212,175,55,0.5)] transition uppercase tracking-wider"
              >
                {isGrabbing ? 'Matching Order Tasks...' : currentTask ? 'VIEW PENDING LUCKY ORDER' : 'START GRABBING'}
              </button>
            </div>
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="bg-[#0b0c10] p-6 rounded-3xl border border-[#d4af37]/60 shadow-xl space-y-4">
              <div className="border-b border-[#d4af37]/20 pb-3">
                <h2 className="text-base font-extrabold text-[#f3e5ab]">Task Records History</h2>
                <p className="text-xs text-gray-400">View official completed and pending order records.</p>
              </div>

              {currentTask && (
                <div className="p-4 bg-gradient-to-r from-red-950/80 via-[#2a0808] to-red-950/80 border-2 border-red-500 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center border-b border-red-800/40 pb-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🎁</span> PENDING LUCKY ORDER #{currentTask.id}
                    </span>
                    <span className="text-[10px] bg-red-600/40 border border-red-500 text-red-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                      Action Required
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img src={currentTask.imageUrl} alt={currentTask.name} className="w-12 h-12 rounded-xl object-cover border border-red-500/50" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white line-clamp-1">{currentTask.name}</p>
                      <p className="text-[10px] text-red-300 font-mono mt-0.5">
                        Required Recharge: -${Math.abs(runningTasksVal).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFullPageTask(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs rounded-xl shadow uppercase tracking-wider flex items-center justify-center space-x-1"
                  >
                    <span>⚡ OPEN & COMPLETE LUCKY ORDER</span>
                  </button>
                </div>
              )}

              {recordsList.length === 0 && !currentTask ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-gray-500">No task records completed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordsList.map((rec, i) => (
                    <div key={i} className="p-3 bg-[#18150a] border border-[#d4af37]/30 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{rec.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {rec.store === "AI Generated Catalogue" ? "Amazon" : (rec.store || "Amazon")} Official Category
                        </p>
                      </div>
                      <span className="font-mono font-bold text-[#50e3c2]">+${rec.commission.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIP TAB */}
        {activeTab === 'vip' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="flex justify-center">
                <span className="text-2xl text-[#d4af37]">👑</span>
              </div>
              <h2 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37]">
                VIP MEMBERSHIP LEVELS
              </h2>
              <p className="text-[10px] text-gray-400">Boost commission yield percentage per VIP level</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-[#0b0c10] rounded-3xl border-2 border-[#d4af37] shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-xl bg-[#18150a] border border-[#d4af37] flex flex-col items-center justify-center">
                      <span className="text-xs">👑</span>
                      <span className="text-[7px] font-black text-[#d4af37]">VIP 0</span>
                    </div>
                    <span className="text-xs font-black text-[#f3e5ab]">VIP 0 - Regular</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-300">Min Balance: $30.00</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Earn with high commission:</span>
                  <span className="font-bold text-[#f3e5ab]">0.56% - 0.75% / Order</span>
                </div>

                <button
                  onClick={() => handleSelectVipLevel('VIP 0 - Regular', 30)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs rounded-2xl shadow flex items-center justify-center space-x-1"
                >
                  <span>👑</span>
                  <span>Active Level</span>
                </button>
              </div>

              <div className="p-4 bg-[#0b0c10] rounded-3xl border border-[#d4af37]/50 shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-xl bg-black border border-[#d4af37]/40 flex items-center justify-center text-xl font-bold text-amber-400">a</div>
                    <div>
                      <span className="text-xs font-black text-white">Amazon VIP 1</span>
                      <p className="text-[9px] text-gray-400">Partner E-Commerce</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-300">Min Balance: $1,000.00</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Earn with high commission:</span>
                  <span className="font-bold text-[#f3e5ab]">1% to 10% / Order</span>
                </div>

                <button
                  onClick={() => handleSelectVipLevel('Amazon VIP 1', 1000)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                    balance >= 1000
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black font-black'
                      : 'bg-[#18150a] border border-[#d4af37]/40 text-gray-400'
                  }`}
                >
                  <span>{balance >= 1000 ? '⚡ Unlock & Open Amazon VIP' : '🔒 Locked (Min $1000)'}</span>
                </button>
              </div>

              <div className="p-4 bg-[#0b0c10] rounded-3xl border border-[#d4af37]/50 shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-xl bg-red-600 border border-[#d4af37]/40 flex items-center justify-center text-xs font-black text-white">Ali</div>
                    <div>
                      <span className="text-xs font-black text-white">AliExpress VIP 2</span>
                      <p className="text-[9px] text-gray-400">Partner E-Commerce</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-300">Min Balance: $2,000.00</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Earn with high commission:</span>
                  <span className="font-bold text-[#f3e5ab]">1% to 20% / Order</span>
                </div>

                <button
                  onClick={() => handleSelectVipLevel('AliExpress VIP 2', 2000)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                    balance >= 2000
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black font-black'
                      : 'bg-[#18150a] border border-[#d4af37]/40 text-gray-400'
                  }`}
                >
                  <span>{balance >= 2000 ? '⚡ Unlock & Open AliExpress VIP' : '🔒 Locked (Min $2000)'}</span>
                </button>
              </div>

              <div className="p-4 bg-[#0b0c10] rounded-3xl border border-[#d4af37]/50 shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 border border-[#d4af37]/40 flex items-center justify-center text-base font-black text-white">S</div>
                    <div>
                      <span className="text-xs font-black text-white">Shopify VIP 3</span>
                      <p className="text-[9px] text-gray-400">Partner E-Commerce</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-300">Min Balance: $5,000.00</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Earn with high commission:</span>
                  <span className="font-bold text-[#f3e5ab]">1% to 30% / Order</span>
                </div>

                <button
                  onClick={() => handleSelectVipLevel('Shopify VIP 3', 5000)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                    balance >= 5000
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black font-black'
                      : 'bg-[#18150a] border border-[#d4af37]/40 text-gray-400'
                  }`}
                >
                  <span>{balance >= 5000 ? '⚡ Unlock & Open Shopify VIP' : '🔒 Locked (Min $5000)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0b0c10]/95 border-t-2 border-[#d4af37]/60 backdrop-blur-2xl py-2 px-3 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(212,175,55,0.2)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-0.5 ${activeTab === 'home' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">🏠</span>
          <span className="text-[9px] font-bold">Home</span>
        </button>

        <button onClick={() => setActiveTab('support')} className={`flex flex-col items-center space-y-0.5 ${activeTab === 'support' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">🎧</span>
          <span className="text-[9px] font-bold">Support</span>
        </button>

        <button onClick={() => setActiveTab('grabbing')} className={`flex flex-col items-center space-y-0.5 ${activeTab === 'grabbing' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'grabbing' ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black shadow-lg' : 'bg-[#18150a] text-[#d4af37]'}`}>
            <span className="text-base">⚡</span>
          </div>
          <span className="text-[9px] font-bold">Grabbing</span>
        </button>

        <button onClick={() => setActiveTab('records')} className={`flex flex-col items-center space-y-0.5 ${activeTab === 'records' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">📋</span>
          <span className="text-[9px] font-bold">Records</span>
        </button>

        <button onClick={() => setActiveTab('vip')} className={`flex flex-col items-center space-y-0.5 ${activeTab === 'vip' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">👑</span>
          <span className="text-[9px] font-bold">VIP</span>
        </button>

        <button onClick={() => setActiveTab('mine')} className={`flex flex-col items-center space-y-0.5 ${activeTab === 'mine' ? 'text-[#f3e5ab]' : 'text-gray-400'}`}>
          <span className="text-lg">👤</span>
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </div>

    
{/* DEPOSIT MODAL */}
{showDepositModal && (
  <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-[0_0_30px_rgba(212,175,55,0.3)] my-auto">
      <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">
        Deposit Funds
      </h3>

      {/* PAYMENT METHOD */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPaymentMethod('trc20')}
          className={`rounded-xl border p-2 text-xs font-bold ${
            paymentMethod === 'trc20'
              ? 'bg-[#d4af37] text-black border-[#d4af37]'
              : 'bg-[#18150a] text-[#f3e5ab] border-[#d4af37]/40'
          }`}
        >
          USDT TRC20
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod('bank')}
          className={`rounded-xl border p-2 text-xs font-bold ${
            paymentMethod === 'bank'
              ? 'bg-[#d4af37] text-black border-[#d4af37]'
              : 'bg-[#18150a] text-[#f3e5ab] border-[#d4af37]/40'
          }`}
        >
          Bank Transfer
        </button>
      </div>

      {/* TRC20 DETAILS */}
      {paymentMethod === 'trc20' && (
        <div className="text-center space-y-2 bg-[#18150a] p-3 rounded-2xl border border-[#d4af37]/40">
          <p className="text-[10px] text-[#d4af37] uppercase font-bold">
            TRC20 Deposit Address
          </p>

          <p className="text-xs font-mono text-white break-all select-all">
            {adminTrc20DepositAddress}
          </p>

          <button
            type="button"
            onClick={() => copyToClipboard(adminTrc20DepositAddress)}
            className="py-1.5 px-3 bg-[#d4af37]/20 border border-[#d4af37] text-[#f3e5ab] font-bold text-xs rounded-xl"
          >
            📋 Copy TRC20 Address
          </button>

          <div className="flex justify-center my-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(adminTrc20DepositAddress)}`}
              alt="TRC20 wallet QR code"
              className="w-36 h-36 rounded-xl border border-[#d4af37] bg-white p-1"
            />
          </div>

          <p className="text-[10px] text-gray-400">
            Send USDT using the TRON (TRC20) network only.
          </p>
        </div>
      )}

      {/* BANK DETAILS */}
      {paymentMethod === 'bank' && (
        <div className="space-y-3 bg-[#18150a] p-3 rounded-2xl border border-[#d4af37]/40">
          <p className="text-[10px] text-[#d4af37] uppercase font-bold">
            Bank Transfer Details
          </p>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">
              Bank Name
            </label>
            <input
              type="text"
              placeholder="Enter receiving bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">
              Bank Account Number
            </label>
            <input
              type="text"
              placeholder="Enter receiving account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <p className="text-[10px] text-gray-400">
            Check the account details carefully before sending payment.
          </p>
        </div>
      )}

      <form onSubmit={handleDepositSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">
            Select Quick Amount ($)
          </label>
          <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-black rounded-xl border border-[#d4af37]/30">
            {quickDepositAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepositAmount(amt.toString())}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition border ${
                  depositAmount === amt.toString()
                    ? 'bg-[#d4af37] text-black border-[#d4af37]'
                    : 'bg-[#18150a] border-[#d4af37]/30 text-[#f3e5ab]'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 block mb-1">
            Deposit Amount ($)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
            required
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-400 block mb-1">
            {paymentMethod === 'trc20'
              ? 'Transaction ID (TXID)'
              : 'Bank Payment Reference'}
          </label>
          <input
            type="text"
            placeholder={
              paymentMethod === 'trc20'
                ? 'Paste your transaction ID'
                : 'Enter bank transaction reference'
            }
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
            required
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-400 block mb-1">
            Upload Payment Receipt (JPG, PNG or WEBP, max 5 MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            className="w-full text-[10px] text-gray-300 file:mr-2 file:rounded-lg file:border file:border-[#d4af37]/50 file:bg-[#18150a] file:px-3 file:py-2 file:text-[#f3e5ab]"
            required
          />
          {receiptFile && (
            <p className="text-[10px] text-[#f3e5ab] mt-1 break-all">
              Selected: {receiptFile.name}
            </p>
          )}
        </div>

        <p className="text-[10px] text-gray-400">
          Your request will remain pending until the payment is verified.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDepositModal(false)}
            className="flex-1 py-2 bg-[#18150a] border border-[#d4af37]/40 text-xs font-bold rounded-xl text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black text-xs font-black rounded-xl"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">Withdraw Funds</h3>
            
            {withdrawLockedMsg && (
              <div className="p-3.5 bg-red-950/90 border-2 border-red-500 rounded-2xl text-red-200 text-xs text-center font-bold shadow-lg animate-pulse">
                ⚠️ Withdrawal Restricted:
                <p className="text-[11px] font-medium text-white mt-1 leading-relaxed">{withdrawLockedMsg}</p>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <input
                type="number"
                placeholder="Amount ($)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="password"
                placeholder="Withdrawal Password"
                value={withdrawPasswordInput}
                onChange={(e) => setWithdrawPasswordInput(e.target.value)}
                className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 py-2 bg-[#18150a] border border-[#d4af37]/40 text-xs font-bold rounded-xl text-white">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black text-xs font-black rounded-xl">Submit</button>
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
            {isWalletAlreadyBound && (
              <p className="text-[11px] text-amber-300 text-center bg-[#18150a] p-2 rounded-xl border border-[#d4af37]/40">
                Please contact with customer service for replace your account
              </p>
            )}
            <form onSubmit={handleWalletBindSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="TRC20 Address"
                value={trc20Address}
                disabled={isWalletAlreadyBound}
                onChange={(e) => setTrc20Address(e.target.value)}
                className={`w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white font-mono ${isWalletAlreadyBound ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="ERC20 Address"
                value={erc20Address}
                disabled={isWalletAlreadyBound}
                onChange={(e) => setErc20Address(e.target.value)}
                className={`w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white font-mono ${isWalletAlreadyBound ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="Bank Name"
                value={bankName}
                disabled={isWalletAlreadyBound}
                onChange={(e) => setBankName(e.target.value)}
                className={`w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white ${isWalletAlreadyBound ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accountNumber}
                disabled={isWalletAlreadyBound}
                onChange={(e) => setAccountNumber(e.target.value)}
                className={`w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white font-mono ${isWalletAlreadyBound ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWalletBindModal(false)} className="flex-1 py-2 bg-[#18150a] border border-[#d4af37]/40 text-xs font-bold rounded-xl text-white">Cancel</button>
                {!isWalletAlreadyBound && (
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black text-xs font-black rounded-xl">Save</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PAGE TASK MODAL */}
      {showFullPageTask && currentTask && (
        <div className="fixed inset-0 bg-[#06060a] z-50 flex flex-col justify-between p-4 overflow-y-auto font-sans text-white border-4 border-[#d4af37]/30 shadow-2xl">
          <div className="flex justify-between items-center py-2 border-b border-[#332a15]">
            <button
              onClick={() => setShowFullPageTask(false)}
              className="text-xs bg-[#18150a] border border-[#d4af37]/50 text-[#f3e5ab] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <span>← Back</span>
            </button>
            <h2 className="text-base font-extrabold text-[#f3e5ab] tracking-wider">
              Product Task #{currentTask.id}
            </h2>
            <button
              onClick={() => setShowFullPageTask(false)}
              className="text-xs bg-[#18150a] border border-[#d4af37]/50 text-[#f3e5ab] font-bold px-3 py-1 rounded-xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 my-auto max-w-md mx-auto w-full">
            <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-2xl p-3 flex gap-3 shadow-[0_0_20px_rgba(212,175,55,0.15)] relative overflow-hidden">
              <div className="w-1/2 aspect-square rounded-xl bg-black border border-[#332a15] overflow-hidden flex items-center justify-center">
                <img 
                  src={currentTask.imageUrl} 
                  alt={currentTask.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="w-1/2 flex flex-col justify-between py-1">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold flex items-center gap-1">
                    {currentTask.store === "AI Generated Catalogue" ? "Amazon" : (currentTask.store || "Amazon")}
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mt-0.5">
                    {currentTask.name}
                  </h3>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    Verified Digital Item | Premium Quality
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs mt-1">
                    ⭐⭐⭐⭐⭐ <span className="text-[9px] text-gray-300 font-bold">4.9 (1,248 reviews)</span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-black text-[#f3e5ab] font-mono">
                      ${currentTask.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="mt-1 inline-flex items-center gap-1 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black font-black text-[9px] px-2 py-0.5 rounded-md shadow">
                    👑 Premium Product
                  </div>
                </div>
              </div>
            </div>

            {currentTask.isLucky && (
              <div className="bg-gradient-to-r from-[#1a1508] via-[#332a15] to-[#1a1508] border-2 border-[#f3e5ab] rounded-2xl p-3 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(243,229,171,0.3)] animate-pulse">
                <div className="text-3xl">🎁</div>
                <div className="text-center">
                  <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37] tracking-wide uppercase">
                    Congratulations
                  </div>
                  <div className="text-sm font-bold text-[#f3e5ab]">
                    You have got a lucky order!
                  </div>
                  <div className="text-[9px] text-gray-300 mt-0.5">
                    Please complete your high commission lucky order complete and continue next tasks
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#0b0c10] border border-[#d4af37]/60 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center shadow-lg">
              <div className="border-r border-[#332a15] pr-1 flex flex-col items-center justify-center">
                <div className="text-amber-400 text-lg">⭐</div>
                <div className="text-[9px] font-bold text-gray-300 leading-tight mt-1">High Commission Rating</div>
                <div className="text-[10px] font-black text-amber-400 mt-0.5">⭐⭐⭐⭐⭐ 4.9/5</div>
              </div>

              <div className="border-r border-[#332a15] px-1 flex flex-col items-center justify-center">
                <div className="text-amber-400 text-lg">📋</div>
                <div className="text-[9px] font-bold text-gray-300 leading-tight mt-1">With Digital Marketing</div>
                <div className="text-amber-400 text-xs mt-0.5">📈</div>
              </div>

              <div className="pl-1 flex flex-col items-center justify-center">
                <div className="text-amber-400 text-lg">👑</div>
                <div className="text-[9px] font-bold text-gray-300 leading-tight">Commission Earned</div>
                <div className="text-xs font-black text-[#50e3c2] font-mono mt-0.5">
                  +${currentTask.commission.toLocaleString('en-US', { minimumFractionDigits: 2 })} →
                </div>
              </div>
            </div>

            {currentTask.isLucky && runningTasksVal < 0 && (
              <div className="bg-gradient-to-r from-[#2a0808] via-[#4a0e0e] to-[#2a0808] border-2 border-red-600/80 rounded-2xl p-3 flex justify-between items-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">👛</div>
                  <div>
                    <div className="text-xs font-bold text-red-400">Recharge Amount</div>
                    <div className="text-[9px] text-red-300/80 font-medium">(Negative Balance Locked)</div>
                  </div>
                </div>
                <div className="text-xl font-black text-red-500 font-mono tracking-tight">
                  - ${Math.abs(runningTasksVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmTask}
              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] hover:brightness-110 text-black font-black text-sm rounded-2xl border-2 border-[#f3e5ab] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <span>📋</span>
              <span>CONTINUE TASKS</span>
              <span>➔</span>
            </button>
          </div>

          <div className="text-center py-2 border-t border-[#332a15]">
            <p className="text-[10px] text-gray-400 font-medium">
              Keep going! More orders = More commission!
            </p>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">Update Profile & Settings</h3>
            <form onSubmit={handleSecurityUpdateSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Customer Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">New Login Password</label>
                <input
                  type="password"
                  placeholder="New Login Password"
                  value={newLoginPass}
                  onChange={(e) => setNewLoginPass(e.target.value)}
                  className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">New Withdrawal Password</label>
                <input
                  type="password"
                  placeholder="New Withdrawal Password"
                  value={newWithdrawPass}
                  onChange={(e) => setNewWithdrawPass(e.target.value)}
                  className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 py-2 bg-[#18150a] border border-[#d4af37]/40 text-xs font-bold rounded-xl text-white">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black text-xs font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INFO MODALS */}
      {infoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-base font-extrabold text-[#f3e5ab] border-b border-[#d4af37]/30 pb-2">{infoModal.title}</h3>
            <div className="flex-1 overflow-y-auto pr-1">
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{infoModal.text}</p>
            </div>
            <button onClick={() => setInfoModal(null)} className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black font-black text-xs rounded-xl shadow">Close</button>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-4 border-[#d4af37] rounded-3xl p-6 w-full max-w-md space-y-4 text-center shadow-[0_0_50px_rgba(212,175,55,0.4)] text-xs max-h-[85vh] overflow-y-auto relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-8xl font-black text-[#d4af37]">DM</span>
            </div>

            <div className="p-4 bg-[#141008] border-2 border-[#d4af37]/60 rounded-2xl space-y-3 text-left relative z-10">
              <div className="text-center border-b-2 border-[#d4af37]/40 pb-3">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#d4af37] flex items-center justify-center text-2xl shadow-lg text-black">
                  👑
                </div>
                <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37] tracking-wider">
                  DIGITAL MARKETING
                </div>
                <p className="text-[9px] text-[#d4af37] font-bold uppercase tracking-widest mt-0.5">
                  INTERNATIONAL E-COMMERCE & DIGITAL MARKETING
                </p>
                <h4 className="text-xs font-black text-white mt-1 uppercase tracking-wide">
                  CERTIFICATE OF PROFESSIONAL EXPERTISE
                </h4>
              </div>

              <div className="space-y-1 font-mono text-[10px] bg-black p-2.5 rounded-xl border border-[#d4af37]/40 shadow-inner">
                <p className="text-[#f3e5ab] font-bold">CERTIFICATE REF NO: <span className="text-white">SA11962535-VS-3383</span></p>
                <p className="text-[#f3e5ab] font-bold">REFERENCE YEAR: <span className="text-white">2009</span></p>
              </div>

              <div>
                <h5 className="font-extrabold text-[#f3e5ab] text-[11px] mb-1">LEADERSHIP & PROFESSIONAL PROFILE</h5>
                <p className="text-gray-300 text-[10px]">• CEO of VaynerMedia</p>
                <p className="text-gray-300 text-[10px]">• Serial Entrepreneur | Digital Marketing Strategist</p>
                <p className="text-gray-300 text-[10px]">• Content Marketing & SEO Leader</p>
              </div>

              <div>
                <h5 className="font-extrabold text-[#f3e5ab] text-[11px] mb-1">CORE AREAS OF EXPERTISE</h5>
                <ul className="list-disc pl-4 text-gray-300 text-[10px] space-y-0.5">
                  <li>Digital Marketing & Brand Strategy</li>
                  <li>Content Marketing & SEO Leadership</li>
                  <li>E-Commerce Marketing</li>
                  <li>Digital Advertising & Campaign Management</li>
                  <li>Affiliate Marketing Strategies</li>
                  <li>International Market Research</li>
                  <li>Business Development & Performance Analytics</li>
                </ul>
              </div>

              <div>
                <h5 className="font-extrabold text-[#f3e5ab] text-[11px] mb-1">E-COMMERCE PLATFORMS</h5>
                <p className="text-[#f3e5ab] font-bold text-[10px]">Shopify | Amazon | AliExpress</p>
                <p className="text-[8px] text-gray-400">Platform names listed for identification purposes.</p>
              </div>

              <div className="pt-3 border-t border-[#d4af37]/40 space-y-2 text-[10px]">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-gray-400 text-[8px]">Issuing Organization:</p>
                    <p className="text-white font-bold text-[10px]">DigitalMarketing Network</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-[8px]">Authorized Representative:</p>
                    <p className="text-[#f3e5ab] font-black text-[11px] underline">Gary Vaynerchuk</p>
                  </div>
                </div>
                <p className="text-[8px] text-gray-400 italic text-center">
                  DigitalMarketing with partner VaynerMedia is supported by Gary Vaynerchuk.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCertModal(false)}
              className="w-full py-3 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] uppercase tracking-wider"
            >
              Close Official Certificate
            </button>
          </div>
        </div>
      )}

      {/* HISTORY MODALS */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#f3e5ab] text-center uppercase">{showHistoryModal} History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {showHistoryModal === 'deposit' ? (
                depositHistory.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No deposit history found.</p> :
                depositHistory.map((d: any) => (
                  <div key={d.id} className="p-3 bg-[#18150a] border border-[#d4af37]/30 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white font-bold">${d.amount} USDT</span>
                      <span className="text-[#f3e5ab] font-bold uppercase">{d.status}</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono">
                      {formatDateWithTime(d.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                withdrawHistory.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No withdrawal history found.</p> :
                withdrawHistory.map((w: any) => (
                  <div key={w.id} className="p-3 bg-[#18150a] border border-[#d4af37]/30 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white font-bold">${w.amount} USDT</span>
                      <span className="text-[#f3e5ab] font-bold uppercase">{w.status}</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono">
                      {formatDateWithTime(w.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowHistoryModal(null)} className="w-full py-2 bg-[#18150a] border border-[#d4af37]/40 text-white text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;