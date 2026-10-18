import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CustomerProfile {
  id: string;
  custom_id: number;
  email: string;
  full_name?: string;
  username?: string;
  name?: string;
  display_name?: string;
  phone?: string;
  balance: number;
  running_tasks?: number;
  completed_tasks: number;
  invitation_code?: string;
  invite_code?: string;
  user_invite_code?: string;
  referred_by_code?: string;
  sub_admin_id?: string;
  created_at: string;
  vip_level: string;
  trc20_address?: string;
  erc20_address?: string;
  bank_name?: string;
  bank_account_number?: string;
  withdraw_message?: string;
  is_frozen?: boolean;
  auto_task_lock?: boolean;
}

interface CustomTaskSlot {
  id: string;
  task_number: number;
  min_amount: number;
  max_amount: number;
  commission_rate: number;
  is_active: boolean;
}

interface DepositRecord {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  trc20_address: string;
}

interface WithdrawRecord {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  trc20_address: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_admin: boolean;
}

export const SubAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'tasks' | 'support' | 'settings'>('users');
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [withdrawSearchQuery, setWithdrawSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminCode, setSubAdminCode] = useState('');
  const [subAdminDbId, setSubAdminDbId] = useState('');
  
  // Editable Sub-Admin Profile
  const [subAdminEditableEmail, setSubAdminEditableEmail] = useState('');
  const [subAdminEditablePassword, setSubAdminEditablePassword] = useState('');
  const [subAdminEditableInviteCode, setSubAdminEditableInviteCode] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('https://t.me');
  const [whatsappUrl, setWhatsappUrl] = useState('https://whatsapp.com');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals & Full Page
  const [selectedUserForModal, setSelectedUserForModal] = useState<CustomerProfile | null>(null);
  const [modalType, setModalType] = useState<'add_funds' | 'cut_funds' | 'user_profile_all' | null>(null);
  const [isFullPageTaskSettings, setIsFullPageTaskSettings] = useState(false);
  const [fundInput, setFundInput] = useState('');

  // User Profile Settings State
  const [editVipLevel, setEditVipLevel] = useState('VIP 0 - Regular');
  const [editWithdrawPass, setEditWithdrawPass] = useState('');
  const [editTrc20, setEditTrc20] = useState('');
  const [editErc20, setEditErc20] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [disableWithdraw, setDisableWithdraw] = useState(false);
  const [withdrawNotificationMsg, setWithdrawNotificationMsg] = useState('');
   

  // Lucky Order Slots State
  const [slotTaskNum, setSlotTaskNum] = useState('');
  const [slotMinAmount, setSlotMinAmount] = useState('');
  const [slotMaxAmount, setSlotMaxAmount] = useState('');
  const [slotCommPercent, setSlotCommPercent] = useState('');
  const [customTasksList, setCustomTasksList] = useState<CustomTaskSlot[]>([]);
  const [autoSlots, setAutoSlots] = useState([
    { id: 1, active: false, taskNum: '', amount: '', comm: '' },
    { id: 2, active: false, taskNum: '', amount: '', comm: '' },
    { id: 3, active: false, taskNum: '', amount: '', comm: '' },
    { id: 4, active: false, taskNum: '', amount: '', comm: '' },
    { id: 5, active: false, taskNum: '', amount: '', comm: '' },
  ]);

  // Chat State
  const [chatUsers, setChatUsers] = useState<string[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const fetchSubAdminPortalData = async () => {
    try {
      const currentEmail = localStorage.getItem('sub_admin_logged_in');
      setSubAdminEmail(currentEmail || 'Sub-Admin');

      if (!currentEmail) {
        window.location.href = '/admin/login';
        return;
      }

      // 1. Fetch Sub-Admin Record
      const { data: subData, error: subErr } = await supabase
        .from('sub_admins')
        .select('*')
        .eq('email', currentEmail)
        .maybeSingle();

      if (subErr || !subData) {
        console.error('Sub-admin record not found:', subErr);
        return;
      }

      const subCode = (subData.invite_code || '').trim().toUpperCase();
      setSubAdminCode(subCode);
      setSubAdminDbId(subData.id);
      setSubAdminEditableEmail(subData.email || '');
      setSubAdminEditableInviteCode(subCode);
      if (subData.telegram_url) setTelegramUrl(subData.telegram_url);
      if (subData.whatsapp_url) setWhatsappUrl(subData.whatsapp_url);

      // 2. Fetch Customers Assigned STRICTLY to this Sub-Admin
      const { data: matchedCustomers, error: custErr } = await supabase
        .from('profiles')
        .select('*')
        .or(`sub_admin_id.eq.${subData.id},invitation_code.ilike.${subCode},invite_code.ilike.${subCode},referred_by_code.ilike.${subCode}`)
        .order('created_at', { ascending: true });

      if (custErr) throw custErr;

      const strictlyAssigned = (matchedCustomers || []).filter(c => {
        const uCode = (c.invitation_code || c.invite_code || c.referred_by_code || '').toString().trim().toUpperCase();
        return c.sub_admin_id === subData.id || uCode === subCode;
      });

      const customerList = strictlyAssigned.map((c, idx) => ({
        ...c,
        custom_id: idx + 1,
        auto_task_lock: c.auto_task_lock ?? true,
      }));
      setCustomers(customerList);

      const customerIds = customerList.map(c => c.id);

      if (customerIds.length > 0) {
        // 3. Real-Time Fetch Deposits for these customers
        const { data: depData } = await supabase
          .from('deposits')
          .select('*')
          .in('user_id', customerIds)
          .order('created_at', { ascending: false });
        setDeposits(depData || []);

        // 4. Real-Time Fetch Withdrawals for these customers
        const { data: witData } = await supabase
          .from('withdrawals')
          .select('*')
          .in('user_id', customerIds)
          .order('created_at', { ascending: false });
        setWithdrawals(witData || []);
      } else {
        setDeposits([]);
        setWithdrawals([]);
      }

      // 5. Fetch Chat Messages
      const { data: allChats } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
      if (allChats) {
        setChatMessages(allChats);
        const assignedUserIds = customerList.map(c => c.id);
        const uniqueUserIds = Array.from(new Set(allChats.map((c) => (c.sender_id === 'admin' ? c.receiver_id : c.sender_id))))
          .filter(uId => assignedUserIds.includes(uId));
        setChatUsers(uniqueUserIds);
        if (uniqueUserIds.length > 0 && !activeChatUserId) {
          setActiveChatUserId(uniqueUserIds[0]);
        }
      }

    } catch (err) {
      console.error('Error fetching sub-admin data:', err);
    }
  };

  useEffect(() => {
    fetchSubAdminPortalData();
    const interval = setInterval(fetchSubAdminPortalData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('sub_admin_logged_in');
    localStorage.removeItem('current_admin_role');
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const handleFundSubmit = async () => {
    if (!selectedUserForModal || !fundInput) return;
    const val = Number(fundInput);
    if (isNaN(val) || val <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }

    const isAdd = modalType === 'add_funds';
    const newBal = isAdd ? selectedUserForModal.balance + val : Math.max(0, selectedUserForModal.balance - val);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        balance: newBal,
        auto_task_lock: isAdd ? false : selectedUserForModal.auto_task_lock 
      })
      .eq('id', selectedUserForModal.id);

    if (error) {
      showToast(`Error updating balance: ${error.message}`, 'error');
      return;
    }

    // Agar manual funds add kiye hain toh deposits table mein approved entry insert kar dein taake history mein show ho
    if (isAdd) {
      await supabase.from('deposits').insert([
        {
          user_id: selectedUserForModal.id,
          amount: val,
          status: 'approved',
          trc20_address: selectedUserForModal.trc20_address || 'Sub-Admin Manual Deposit'
        }
      ]);

      const { data: depData } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', selectedUserForModal.id)
        .order('created_at', { ascending: false });
      if (depData) setDeposits(depData);
    }

    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedUserForModal.id ? { ...c, balance: newBal, auto_task_lock: isAdd ? false : c.auto_task_lock } : c))
    );

    showToast(`$${val} ${isAdd ? 'Added & Approved' : 'Deducted'} for #${selectedUserForModal.custom_id}`);
    setModalType(null);
    setFundInput('');
  };

  const handleStatusChange = async (user: CustomerProfile, isFrozen: boolean) => {
    await supabase.from('profiles').update({ is_frozen: isFrozen }).eq('id', user.id);
    setCustomers((prev) =>
      prev.map((c) => (c.id === user.id ? { ...c, is_frozen: isFrozen } : c))
    );
    showToast(`User #${user.custom_id} status updated to ${isFrozen ? 'Disabled' : 'Active'}`);
  };

  const handleAutoTaskLockToggle = async (user: CustomerProfile, isLocked: boolean) => {
    const { error } = await supabase.from('profiles').update({ auto_task_lock: isLocked }).eq('id', user.id);
    if (!error) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === user.id ? { ...c, auto_task_lock: isLocked } : c))
      );
      showToast(`User #${user.custom_id} task lock updated to ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
    } else {
      showToast(`Error updating task lock: ${error.message}`, 'error');
    }
  };

  const handleResetUserTasks = async (user: CustomerProfile) => {
    await supabase.from('profiles').update({ completed_tasks: 0, running_tasks: 0 }).eq('id', user.id);
    await supabase.from('custom_tasks').delete().eq('user_id', user.id);
    setCustomers((prev) =>
      prev.map((c) => (c.id === user.id ? { ...c, completed_tasks: 0, running_tasks: 0 } : c))
    );
    showToast(`Tasks & Lucky Orders reset to 0/25 for #${user.custom_id}`);
  };

  const fetchUserCustomTasks = async (userId: string) => {
    const { data } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('task_number', { ascending: true });
    if (data) setCustomTasksList(data);
  };

  const handlePublishLuckyOrder = async () => {
    if (!selectedUserForModal) return;

    if (!slotTaskNum || !slotMinAmount) {
      showToast('Task Number and Min Amount are required!', 'error');
      return;
    }

    const taskNum = Number(slotTaskNum);
    const minAmt = Number(slotMinAmount);
    const maxAmt = slotMaxAmount ? Number(slotMaxAmount) : minAmt;
    const commPercent = Number(slotCommPercent || 10);

    const negativeBalanceValue = -minAmt;
    await supabase.from('profiles').update({ running_tasks: negativeBalanceValue }).eq('id', selectedUserForModal.id);

    const { error } = await supabase
      .from('custom_tasks')
      .insert([
        {
          user_id: selectedUserForModal.id,
          task_number: taskNum,
          min_amount: minAmt,
          max_amount: maxAmt,
          task_amount: minAmt,
          commission: commPercent,
          commission_rate: commPercent,
          is_active: true
        }
      ]);

    if (!error) {
      setCustomers(prev => prev.map(c => c.id === selectedUserForModal.id ? { ...c, running_tasks: negativeBalanceValue } : c));
      showToast(`Professional Lucky Order for Task #${taskNum} ($${minAmt}) published & synchronized!`);
      setSlotTaskNum('');
      setSlotMinAmount('');
      setSlotMaxAmount('');
      setSlotCommPercent('');
      fetchUserCustomTasks(selectedUserForModal.id);
    } else {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleDeleteCustomTask = async (taskId: string) => {
    const { error } = await supabase.from('custom_tasks').delete().eq('id', taskId);

    if (!error) {
      if (selectedUserForModal) {
        await supabase.from('profiles').update({ running_tasks: 0 }).eq('id', selectedUserForModal.id);
        setCustomers(prev => prev.map(c => c.id === selectedUserForModal.id ? { ...c, running_tasks: 0 } : c));
      }
      showToast('Lucky order slot deleted and balance normalized successfully!');
      if (selectedUserForModal) {
        fetchUserCustomTasks(selectedUserForModal.id);
      }
    } else {
      showToast(`Delete error: ${error.message}`, 'error');
    }
  };

  const handleOpenUserProfileModal = (user: CustomerProfile) => {
    setSelectedUserForModal(user);
    setEditVipLevel(user.vip_level || 'VIP 0 - Regular');
    setDisableWithdraw(Boolean(user.is_frozen));
    setWithdrawNotificationMsg(user.withdraw_message || '');
    setEditTrc20(user.trc20_address || '');
    setEditErc20(user.erc20_address || '');
    setEditBankName(user.bank_name || '');
    setEditBankAccount(user.bank_account_number || '');
    setEditWithdrawPass('');
    setModalType('user_profile_all');
  };

  const handleSaveAllUserSettings = async () => {
    if (!selectedUserForModal) return;

    const payload: any = {
      vip_level: editVipLevel,
      is_frozen: disableWithdraw,
      withdraw_message: disableWithdraw ? (withdrawNotificationMsg || 'Withdrawal is temporarily disabled.') : '',
      trc20_address: editTrc20,
      erc20_address: editErc20,
      bank_name: editBankName,
      bank_account_number: editBankAccount,
    };

    if (editWithdrawPass) payload.withdraw_password = editWithdrawPass;

    await supabase.from('profiles').update(payload).eq('id', selectedUserForModal.id);

    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedUserForModal.id ? { ...c, ...payload } : c))
    );

    showToast(`All User Settings saved for #${selectedUserForModal.custom_id}`);
    setModalType(null);
  };

  const handleOpenFullPageTaskSettings = async (user: CustomerProfile) => {
    setSelectedUserForModal(user);
    setEditVipLevel(user.vip_level || 'VIP 0 - Regular');
    await fetchUserCustomTasks(user.id);
    setIsFullPageTaskSettings(true);
  };

  const handleSaveFullPageTaskSettings = async () => {
    if (!selectedUserForModal) return;

    try {
      await supabase.from('profiles').update({ vip_level: editVipLevel }).eq('id', selectedUserForModal.id);
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedUserForModal.id ? { ...c, vip_level: editVipLevel } : c))
      );
      showToast(`VIP Level updated for User #${selectedUserForModal.custom_id}`);
      setIsFullPageTaskSettings(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    }
  };

  const handleDepositAction = async (deposit: DepositRecord, status: 'approved' | 'rejected') => {
    if (deposit.status !== 'pending') return;

    const { error: depError } = await supabase
      .from('deposits')
      .update({ status })
      .eq('id', deposit.id);

    if (depError) {
      showToast(`Error updating deposit status: ${depError.message}`, 'error');
      return;
    }

    if (status === 'approved') {
      const { data: latestProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, balance')
        .eq('id', deposit.user_id)
        .maybeSingle();

      if (fetchErr || !latestProfile) {
        showToast('Deposit approved, but user profile could not be found!', 'error');
      } else {
        const currentBalance = Number(latestProfile.balance) || 0;
        const newBalance = currentBalance + Number(deposit.amount);

        const { error: updateBalError } = await supabase
          .from('profiles')
          .update({ balance: newBalance, auto_task_lock: false })
          .eq('id', deposit.user_id);

        if (updateBalError) {
          showToast(`Error updating user balance: ${updateBalError.message}`, 'error');
        } else {
          setCustomers((prev) =>
            prev.map((c) => (c.id === deposit.user_id ? { ...c, balance: newBalance, auto_task_lock: false } : c))
          );
          showToast(`Deposit of $${deposit.amount} approved & auto task lock released successfully!`);
        }
      }
    } else {
      showToast('Deposit request rejected!');
    }

    setDeposits((prev) => prev.map((d) => (d.id === deposit.id ? { ...d, status } : d)));
  };
  

  const handleWithdrawAction = async (withdraw: WithdrawRecord, status: 'approved' | 'rejected') => {
    if (withdraw.status !== 'pending') return;
    
    const { error: witError } = await supabase.from('withdrawals').update({ status }).eq('id', withdraw.id);
    if (witError) {
      showToast(`Error updating withdrawal status: ${witError.message}`, 'error');
      return;
    }

    if (status === 'approved') {
      const user = customers.find((c) => c.id === withdraw.user_id);
      if (user) {
        const newBal = Math.max(0, user.balance - withdraw.amount);
        await supabase.from('profiles').update({ balance: newBal }).eq('id', withdraw.user_id);
        setCustomers((prev) =>
          prev.map((c) => (c.id === withdraw.user_id ? { ...c, balance: newBal } : c))
        );
      }
      showToast('Withdrawal approved & funds deducted from customer balance!');
    } else if (status === 'rejected') {
      showToast('Withdrawal request rejected!');
    }

    setWithdrawals((prev) => prev.map((w) => (w.id === withdraw.id ? { ...w, status } : w)));
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeChatUserId) return;

    const newMsg = {
      sender_id: 'admin',
      receiver_id: activeChatUserId,
      message: replyMessage.trim(),
      is_admin: true,
    };

    const { error } = await supabase.from('chat_messages').insert([newMsg]);
    if (!error) {
      setReplyMessage('');
      const { data: allChats } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
      if (allChats) {
        setChatMessages(allChats);
      }
    } else {
      showToast('Error sending chat reply', 'error');
    }
  };

  const handleSaveSubAdminSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEmail = subAdminEditableEmail.trim().toLowerCase();
      const newInvite = subAdminEditableInviteCode.trim().toUpperCase();

      const updatePayload: any = {
        email: newEmail,
        telegram_url: telegramUrl,
        whatsapp_url: whatsappUrl
      };

      if (newInvite) updatePayload.invite_code = newInvite;
      if (subAdminEditablePassword.trim()) updatePayload.password = subAdminEditablePassword.trim();

      const { error } = await supabase
        .from('sub_admins')
        .update(updatePayload)
        .eq('id', subAdminDbId);

      if (error) throw error;

      await supabase.from('admin_notifications').insert([
        { sub_admin_email: newEmail, message: `Sub-Admin (${newEmail}) updated profile/code.` }
      ]);

      localStorage.setItem('sub_admin_logged_in', newEmail);
      setSubAdminEmail(newEmail);
      setSubAdminCode(newInvite);
      setSubAdminEditablePassword('');

      showToast('Sub-Admin profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    }
  };

  const getCustomerDetailsByUserId = (userId: string) => {
    const cust = customers.find((c) => c.id === userId);
    if (!cust) return { customId: '#1', name: 'No Name', phone: 'No Phone' };
    return {
      customId: `#${cust.custom_id || 1}`,
      name: cust.full_name || cust.username || cust.name || cust.display_name || 'No Name Set',
      phone: cust.phone || 'No Phone Set'
    };
  };

  const getUserRegistrationInviCode = (c: CustomerProfile) => {
    const raw = c.invitation_code || c.invite_code || c.referred_by_code || '';
    return raw.toString().trim().toUpperCase();
  };

  const getUserOwnDashboardInviCode = (c: CustomerProfile) => {
    const ownCode = c.user_invite_code || `CUST${c.custom_id}`;
    return ownCode.toString().trim().toUpperCase();
  };

  const renderSimpleInvitationCodes = (c: CustomerProfile) => {
    const usedInviCode = getUserRegistrationInviCode(c) || 'N/A';
    const userOwnCode = getUserOwnDashboardInviCode(c) || `CUST${c.custom_id}`;

    return (
      <div className="flex flex-col text-xs space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Reg Code:</span>
          <span className="text-slate-900 font-bold">{usedInviCode}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Own Code:</span>
          <span className="text-blue-600 font-mono font-bold">{userOwnCode}</span>
        </div>
      </div>
    );
  };

  const filterByUniversalQuery = (c: CustomerProfile, q: string) => {
    if (!q) return true;
    const cleanQ = q.toLowerCase().trim().replace('#', '');
    const custIdStr = c.custom_id.toString();
    const invCodeStr = getUserRegistrationInviCode(c).toLowerCase();
    const ownCodeStr = getUserOwnDashboardInviCode(c).toLowerCase();
    const emailStr = (c.email || '').toLowerCase();
    const nameStr = (c.full_name || c.username || c.name || c.display_name || '').toLowerCase();
    const phoneStr = (c.phone || '').toLowerCase();

    return (
      custIdStr === cleanQ ||
      custIdStr.includes(cleanQ) ||
      invCodeStr.includes(cleanQ) ||
      ownCodeStr.includes(cleanQ) ||
      emailStr.includes(cleanQ) ||
      nameStr.includes(cleanQ) ||
      phoneStr.includes(cleanQ)
    );
  };

  const filteredCustomers = customers.filter((c) => filterByUniversalQuery(c, searchQuery));
  const filteredTaskCustomers = customers.filter((c) => filterByUniversalQuery(c, taskSearchQuery));

  const filteredDeposits = deposits.filter((d) => {
    if (!depositSearchQuery) return true;
    const q = depositSearchQuery.toLowerCase().trim();
    const custDetails = getCustomerDetailsByUserId(d.user_id);
    return (
      custDetails.customId.toLowerCase().includes(q) ||
      custDetails.name.toLowerCase().includes(q) ||
      custDetails.phone.toLowerCase().includes(q) ||
      (d.trc20_address && d.trc20_address.toLowerCase().includes(q))
    );
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!withdrawSearchQuery) return true;
    const q = withdrawSearchQuery.toLowerCase().trim();
    const custDetails = getCustomerDetailsByUserId(w.user_id);
    return (
      custDetails.customId.toLowerCase().includes(q) ||
      custDetails.name.toLowerCase().includes(q) ||
      custDetails.phone.toLowerCase().includes(q) ||
      (w.trc20_address && w.trc20_address.toLowerCase().includes(q))
    );
  });

  const filteredChatUsers = chatUsers.filter((uId) => {
    const cust = customers.find(c => c.id === uId);
    if (!cust) return false;
    return filterByUniversalQuery(cust, chatSearchQuery);
  });

  const activeUserChatHistory = chatMessages.filter(
    (m) => m.sender_id === activeChatUserId || m.receiver_id === activeChatUserId
  );

  return (
    <div className="min-h-screen bg-[#f1f3f9] text-slate-800 flex font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-64 bg-[#1e3a8a] text-white flex flex-col justify-between p-4 shadow-2xl">
        <div className="space-y-6">
          <div className="text-xl font-black tracking-wider text-cyan-300 border-b border-blue-800 pb-3 flex items-center gap-2">
            <span>⚙️</span> Sub-Admin Portal
          </div>

          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('users'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                activeTab === 'users' && !isFullPageTaskSettings ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>👥</span>
              <span>Users ({customers.length})</span>
            </button>

            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('deposits'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>📥</span>
              <span>Deposit Records ({deposits.length})</span>
            </button>

            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('withdrawals'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>📤</span>
              <span>Withdrawal Requests ({withdrawals.length})</span>
            </button>

            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('tasks'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                (activeTab === 'tasks' || isFullPageTaskSettings) ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>⚡</span>
              <span>Task Management</span>
            </button>

            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('support'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                activeTab === 'support' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>🎧</span>
              <span>Live Support & Chat</span>
            </button>

            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('settings'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>🛠️</span>
              <span>Settings</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-blue-800 pt-3 space-y-2">
          <div className="text-xs text-blue-200 truncate">
            Sub-Admin: <span className="font-bold text-white">{subAdminEmail}</span>
            <div className="text-[10px] text-cyan-300 mt-0.5">Code: {subAdminCode || 'N/A'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-1"
          >
            <span>🚪</span>
            <span>Logout Portal</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-6 overflow-y-auto">
        
        {message && (
          <div
            className={`p-3.5 mb-4 text-xs font-bold rounded-2xl shadow border ${
              message.type === 'error' ? 'bg-red-100 border-red-400 text-red-800' : 'bg-emerald-100 border-emerald-400 text-emerald-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {isFullPageTaskSettings && selectedUserForModal ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-6">
            
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1.5">
                <h2 className="text-base font-black text-blue-900 flex items-center gap-2">
                  <span>⚡</span> Professional Lucky Order Setup for <span className="text-blue-700 font-mono">#{selectedUserForModal.custom_id}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                  <span>Name: <b className="text-slate-800">{selectedUserForModal.full_name || selectedUserForModal.username || selectedUserForModal.name || 'Not Set'}</b></span>
                  <span>Phone: <b className="text-slate-800">{selectedUserForModal.phone || 'Not Set'}</b></span>
                  {renderSimpleInvitationCodes(selectedUserForModal)}
                  <span>Balance: <b className="text-emerald-700 font-mono">${selectedUserForModal.balance.toFixed(2)}</b></span>
                  <span>Tasks: <b className="text-indigo-800 font-mono">{selectedUserForModal.completed_tasks} / 25</b></span>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Upgrade User VIP Level</label>
                <select
                  value={editVipLevel}
                  onChange={(e) => setEditVipLevel(e.target.value)}
                  className="w-full md:w-56 bg-white border-2 border-blue-900 text-blue-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none shadow"
                >
                  <option value="VIP 0 - Regular">VIP 0 - Regular</option>
                  <option value="Amazon VIP 1 - $1000">Amazon VIP 1 - $1,000</option>
                  <option value="AliExpress VIP 2 - $2000">AliExpress VIP 2 - $2,000</option>
                  <option value="Shopify VIP 3 - $5000">Shopify VIP 3 - $5,000</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    🎁 Configure 5 Auto Lucky Order Slots
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Target Task Number (#):</label>
                    <input
                      type="number"
                      placeholder="e.g. 5, 10, 15"
                      value={slotTaskNum}
                      onChange={(e) => setSlotTaskNum(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Commission Rate (%):</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={slotCommPercent}
                      onChange={(e) => setSlotCommPercent(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Target Amount Range (USDT Min - Max):</label>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        placeholder="Min e.g. 120"
                        value={slotMinAmount}
                        onChange={(e) => setSlotMinAmount(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        placeholder="Max e.g. 130"
                        value={slotMaxAmount}
                        onChange={(e) => setSlotMaxAmount(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePublishLuckyOrder}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>Publish & Synchronize Lucky Order Slot</span>
                </button>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">5 Auto Slots:</span>
                  <div className="space-y-2.5">
                    {autoSlots.map((slot) => (
                      <div key={slot.id} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 text-xs shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-blue-900">Slot #{slot.id} (Auto-Fetch)</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slot.active}
                              onChange={(e) => {
                                const updated = autoSlots.map(s => s.id === slot.id ? { ...s, active: e.target.checked } : s);
                                setAutoSlots(updated);
                                showToast(`Auto Slot #${slot.id} status updated!`);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  📋 Configured Synchronized Lucky Orders:
                </h4>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {customTasksList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">No active synchronized lucky orders for this user.</p>
                  ) : (
                    customTasksList.map((task, idx) => (
                      <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs w-full shadow-sm">
                        <div className="flex-1">
                          <div className="font-bold text-slate-800 text-sm">
                            Task #{task.task_number} — <span className="text-indigo-600 font-mono">${task.min_amount} - ${task.max_amount} USDT</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Commission: {task.commission_rate || 10}% | Status: Direct Synchronized ⚡
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCustomTask(task.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition text-xs shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setIsFullPageTaskSettings(false)}
                className="px-6 py-3 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300"
              >
                Back to User List
              </button>
              <button
                onClick={handleSaveFullPageTaskSettings}
                className="px-8 py-3 bg-blue-900 text-white font-black text-xs rounded-xl shadow hover:bg-blue-800"
              >
                Save VIP Settings
              </button>
            </div>

          </div>
        ) : null}

        {/* TAB 1: USERS PANEL */}
        {!isFullPageTaskSettings && activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-blue-900">Users</h2>
                <p className="text-xs text-slate-500 font-medium">Assigned Customers: <span className="font-bold text-blue-700">{filteredCustomers.length}</span></p>
              </div>

              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search by ID, Name, Phone, Email or Invi Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white font-bold">
                    <th className="p-3">Users</th>
                    <th className="p-3">Registration Code / Own Code</th>
                    <th className="p-3">Gmail / VIP Status</th>
                    <th className="p-3">Tasks</th>
                    <th className="p-3">Bal</th>
                    <th className="p-3">Task Lock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions & Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-sm font-mono font-black text-blue-900">#{c.custom_id}</div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">
                          👤 {c.full_name || c.username || c.name || c.display_name || 'No Name Set'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          📞 {c.phone || 'No Phone Set'}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {renderSimpleInvitationCodes(c)}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-700 font-semibold">{c.email || 'customer@appuser.local'}</div>
                        <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 font-bold rounded text-[9px] mt-0.5 inline-block">
                          {c.vip_level || 'VIP 0 - Regular'}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-blue-900 text-sm">
                        {c.completed_tasks} / 25
                      </td>

                      <td className="p-3 font-mono">
                        <div className="font-black text-emerald-600 text-sm">${c.balance.toFixed(2)}</div>
                        {c.running_tasks && c.running_tasks < 0 ? (
                          <div className="text-red-600 font-black text-xs font-mono">
                            ${Math.abs(c.running_tasks).toFixed(2)}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px]">$0.00</div>
                        )}
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => { setSelectedUserForModal(c); setModalType('add_funds'); setFundInput(''); }}
                            className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded hover:bg-emerald-700 shadow-sm"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => { setSelectedUserForModal(c); setModalType('cut_funds'); setFundInput(''); }}
                            className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded hover:bg-red-700 shadow-sm"
                          >
                            - Cut
                          </button>
                        </div>
                      </td>

                      <td className="p-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(c.auto_task_lock)}
                            onChange={(e) => handleAutoTaskLockToggle(c, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </td>

                      <td className="p-3">
                        <select
                          value={c.is_frozen ? 'frozen' : 'active'}
                          onChange={(e) => handleStatusChange(c, e.target.value === 'frozen')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border focus:outline-none ${
                            c.is_frozen ? 'bg-red-100 border-red-300 text-red-700' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="frozen">Disabled / Frozen</option>
                        </select>
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => handleResetUserTasks(c)}
                            className="px-2.5 py-1.5 bg-amber-500 text-white font-bold text-[10px] rounded-lg shadow hover:bg-amber-600 flex items-center space-x-1"
                          >
                            <span>🔄</span>
                            <span>Reset</span>
                          </button>
                          <button
                            onClick={() => handleOpenFullPageTaskSettings(c)}
                            className="px-2.5 py-1.5 bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-indigo-700 flex items-center space-x-1"
                          >
                            <span>⚡</span>
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={() => handleOpenUserProfileModal(c)}
                            className="px-2.5 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-blue-700 flex items-center space-x-1"
                          >
                            <span>⚙️</span>
                            <span>Profile</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DEPOSIT RECORDS */}
        {!isFullPageTaskSettings && activeTab === 'deposits' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-black text-blue-900">Deposit Records & Approvals</h2>

              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search by ID, Name, Phone or TRC20..."
                  value={depositSearchQuery}
                  onChange={(e) => setDepositSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white font-bold">
                    <th className="p-3">Users</th>
                    <th className="p-3">Deposit Amount</th>
                    <th className="p-3">TRC20 Wallet Address</th>
                    <th className="p-3">Date & Time (Real-Time)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredDeposits.map((dep) => {
                    const custDetails = getCustomerDetailsByUserId(dep.user_id);
                    return (
                      <tr key={dep.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 whitespace-nowrap">
                          <div className="text-sm font-mono font-black text-blue-900">{custDetails.customId}</div>
                          <div className="text-xs font-bold text-slate-700 mt-0.5">👤 {custDetails.name}</div>
                          <div className="text-[11px] text-slate-500">📞 {custDetails.phone}</div>
                        </td>
                        <td className="p-3 font-mono font-black text-emerald-600 text-sm">
                          ${dep.amount} USDT
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {dep.trc20_address || 'TYA83kNx9XmR2pQz1L7W4sV6B0c9e5F8dH'}
                        </td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {new Date(dep.created_at).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                            dep.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : dep.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {dep.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {dep.status === 'pending' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleDepositAction(dep, 'approved')}
                                className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-emerald-700"
                              >
                                Approve (+Auto Add & Release Lock)
                              </button>
                              <button
                                onClick={() => handleDepositAction(dep, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: WITHDRAWAL REQUESTS */}
        {!isFullPageTaskSettings && activeTab === 'withdrawals' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-black text-blue-900">Withdrawal Requests & Refund Records</h2>

              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search by ID, Name, Phone or TRC20..."
                  value={withdrawSearchQuery}
                  onChange={(e) => setWithdrawSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white font-bold">
                    <th className="p-3">Users</th>
                    <th className="p-3">Withdraw Amount</th>
                    <th className="p-3">Target TRC20 Wallet Address</th>
                    <th className="p-3">Date & Time (Real-Time)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredWithdrawals.map((wit) => {
                    const custDetails = getCustomerDetailsByUserId(wit.user_id);
                    return (
                      <tr key={wit.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 whitespace-nowrap">
                          <div className="text-sm font-mono font-black text-blue-900">{custDetails.customId}</div>
                          <div className="text-xs font-bold text-slate-700 mt-0.5">👤 {custDetails.name}</div>
                          <div className="text-[11px] text-slate-500">📞 {custDetails.phone}</div>
                        </td>
                        <td className="p-3 font-mono font-black text-blue-700 text-sm">
                          ${wit.amount} USDT
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {wit.trc20_address || 'TQ9x7kNx9XmR2pQz1L7W4sV6B0c9e5F8dH'}
                        </td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {new Date(wit.created_at).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                            wit.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : wit.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {wit.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {wit.status === 'pending' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleWithdrawAction(wit, 'approved')}
                                className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-emerald-700"
                              >
                                Approve (-Deduct Balance)
                              </button>
                              <button
                                onClick={() => handleWithdrawAction(wit, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TASK MANAGEMENT */}
        {!isFullPageTaskSettings && activeTab === 'tasks' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-black text-blue-900">⚡ Task Management & User Overview</h2>

              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search by ID, Name, Phone or Invi Code..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white font-bold">
                    <th className="p-3">Users</th>
                    <th className="p-3">Registration Code / Own Code</th>
                    <th className="p-3">Neg Bal</th>
                    <th className="p-3">VIP Level</th>
                    <th className="p-3">Tasks</th>
                    <th className="p-3">Task Lock</th>
                    <th className="p-3 text-right">Task Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredTaskCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-sm font-mono font-black text-blue-900">#{c.custom_id}</div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">👤 {c.full_name || c.username || c.name || 'No Name'}</div>
                        <div className="text-[11px] text-slate-500">📞 {c.phone || 'No Phone'}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {renderSimpleInvitationCodes(c)}
                      </td>
                      
                      <td className="p-3 font-mono font-black text-red-600">
                        {c.running_tasks && c.running_tasks < 0 ? `$${Math.abs(c.running_tasks).toFixed(2)}` : '$0.00'}
                      </td>

                      <td className="p-3 font-bold text-amber-700">{c.vip_level || 'VIP 0'}</td>
                      
                      <td className="p-3 font-mono font-bold text-blue-900 text-sm">
                        {c.completed_tasks} / 25
                      </td>

                      <td className="p-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(c.auto_task_lock)}
                            onChange={(e) => handleAutoTaskLockToggle(c, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenFullPageTaskSettings(c)}
                          className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-indigo-700 flex items-center space-x-1 ml-auto"
                        >
                          <span>⚙️</span>
                          <span>Settings</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LIVE SUPPORT & CHAT */}
        {!isFullPageTaskSettings && activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-3 h-[420px]">
              <div className="border-r border-slate-200 bg-slate-50 p-3 space-y-2 overflow-y-auto">
                <div className="border-b pb-2 space-y-2">
                  <h4 className="font-bold text-xs text-slate-700">Customer Inbox</h4>
                  <input
                    type="text"
                    placeholder="Search by ID, Name or Phone..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-[10px] font-semibold"
                  />
                </div>

                {filteredChatUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2">No matching customer chats.</p>
                ) : (
                  filteredChatUsers.map((uId) => {
                    const custDetails = getCustomerDetailsByUserId(uId);
                    return (
                      <button
                        key={uId}
                        onClick={() => setActiveChatUserId(uId)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between ${
                          activeChatUserId === uId ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span className="font-mono">{custDetails.customId} - {custDetails.name}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="col-span-2 flex flex-col justify-between p-4 bg-white">
                <div className="border-b pb-2 font-bold text-xs text-blue-900 flex justify-between items-center">
                  <span>Live Conversation: <span className="font-mono text-blue-700">{activeChatUserId ? getCustomerDetailsByUserId(activeChatUserId).customId : 'Select a user'}</span></span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 text-xs">
                  {activeUserChatHistory.map((m) => (
                    <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-2.5 rounded-xl ${m.is_admin ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-800 border'}`}>
                        <p>{m.message}</p>
                        <span className="text-[8px] opacity-70 block text-right mt-1 font-mono">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendAdminReply} className="flex gap-2 border-t pt-2">
                  <input
                    type="text"
                    placeholder="Type reply to customer..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                  <button type="submit" className="px-5 py-2 bg-blue-900 text-white font-black text-xs rounded-xl shadow hover:bg-blue-800">Send</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {!isFullPageTaskSettings && activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4 max-w-xl">
            <h3 className="text-base font-extrabold text-blue-900 border-b pb-2 flex items-center gap-2">
              <span>🛠️</span> Sub-Admin Profile & Settings
            </h3>
            <p className="text-xs text-slate-500">Aap yahan apni profile details aur support links update kar sakte hain.</p>
            
            <form onSubmit={handleSaveSubAdminSelfProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Sub-Admin Email</label>
                <input
                  type="email"
                  value={subAdminEditableEmail}
                  onChange={(e) => setSubAdminEditableEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-blue-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Enter new password if changing"
                  value={subAdminEditablePassword}
                  onChange={(e) => setSubAdminEditablePassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Invitation Code</label>
                <input
                  type="text"
                  value={subAdminEditableInviteCode}
                  onChange={(e) => setSubAdminEditableInviteCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold uppercase text-blue-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Telegram Support Link</label>
                <input type="text" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">WhatsApp Support Link</label>
                <input type="text" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
              </div>

              <button type="submit" className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow uppercase tracking-wider">
                Save Changes
              </button>
            </form>
          </div>
        )}

      </div>

      {/* MODAL 1: ADD / CUT FUNDS */}
      {(modalType === 'add_funds' || modalType === 'cut_funds') && selectedUserForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border-2 border-blue-900">
            <h3 className="text-base font-extrabold text-blue-900">
              {modalType === 'add_funds' ? '➕ Add Funds' : '➖ Deduct Funds'} for #{selectedUserForModal.custom_id}
            </h3>
            <p className="text-xs text-slate-500 font-mono">Current Balance: ${selectedUserForModal.balance.toFixed(2)}</p>

            <input
              type="number"
              placeholder="Enter amount ($)"
              value={fundInput}
              onChange={(e) => setFundInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold"
            />

            <div className="flex gap-2">
              <button onClick={() => setModalType(null)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">Cancel</button>
              <button
                onClick={handleFundSubmit}
                className={`flex-1 py-2.5 text-white font-black text-xs rounded-xl shadow ${
                  modalType === 'add_funds' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: USER SETTINGS */}
      {modalType === 'user_profile_all' && selectedUserForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl border-2 border-blue-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-extrabold text-blue-900">
                ⚙️ User Profile & Rules Settings: #{selectedUserForModal.custom_id}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">VIP Level Upgrade</label>
                <select
                  value={editVipLevel}
                  onChange={(e) => setEditVipLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-blue-900"
                >
                  <option value="VIP 0 - Regular">VIP 0 - Regular</option>
                  <option value="Amazon VIP 1 - $1000">Amazon VIP 1 - $1,000</option>
                  <option value="AliExpress VIP 2 - $2000">AliExpress VIP 2 - $2,000</option>
                  <option value="Shopify VIP 3 - $5000">Shopify VIP 3 - $5,000</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Login Password</label>
                  <input type="password" disabled value="••••••••" className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Withdraw Password</label>
                  <input type="password" placeholder="New withdraw password" value={editWithdrawPass} onChange={(e) => setEditWithdrawPass(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer TRC20 Address</label>
                  <input type="text" placeholder="TRC20 Wallet Address" value={editTrc20} onChange={(e) => setEditTrc20(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer ERC20 Address</label>
                  <input type="text" placeholder="ERC20 Wallet Address" value={editErc20} onChange={(e) => setEditErc20(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Bank Name</label>
                  <input type="text" placeholder="e.g. Chase Bank" value={editBankName} onChange={(e) => setEditBankName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Bank Account Number</label>
                  <input type="text" placeholder="Account / IBAN Number" value={editBankAccount} onChange={(e) => setEditBankAccount(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono" />
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-2xl border border-red-200 space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={disableWithdraw} onChange={(e) => setDisableWithdraw(e.target.checked)} />
                  <span className="font-bold text-red-900">Disable / Lock Withdrawal for User</span>
                </label>
                {disableWithdraw && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Notification Message (Displayed to User on Withdraw)</label>
                    <textarea rows={2} placeholder="Message displayed when customer clicks withdraw..." value={withdrawNotificationMsg} onChange={(e) => setWithdrawNotificationMsg(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button onClick={() => setModalType(null)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">Cancel</button>
              <button onClick={handleSaveAllUserSettings} className="flex-1 py-2.5 bg-blue-900 text-white font-black text-xs rounded-xl shadow hover:bg-blue-800">
                Save All User Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubAdminDashboard;