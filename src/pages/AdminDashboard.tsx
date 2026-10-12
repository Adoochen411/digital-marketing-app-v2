import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  balance?: number;
  running_tasks?: number;
  completed_tasks?: number;
  status?: string;
  trap_status?: boolean;
  trc20_address?: string;
  bank_holder_name?: string;
  withdraw_password?: string;
  withdraw_status?: string;
  withdraw_message?: string;
  vip_level?: string;
  invitation_code?: string;
}

interface DepositRecord {
  id: string;
  user_id: string;
  amount: number;
  trc20_address?: string;
  status: string;
  created_at: string;
  profiles?: { email: string; phone: string; invitation_code?: string };
}

interface WithdrawRecord {
  id: string;
  user_id: string;
  amount: number;
  trc20_address: string;
  status: string;
  created_at: string;
  profiles?: { email: string; phone: string; invitation_code?: string };
}

interface CustomTask {
  id: string;
  user_id: string;
  task_number: number;
  task_amount: number;
  min_amount: number;
  max_amount: number;
  commission: number;
  vip_level: string;
  is_lucky_order: boolean;
  status: string;
  created_at: string;
  profiles?: { email: string; phone: string };
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_admin: boolean;
}

interface SubAdminRecord {
  id: string;
  email: string;
  invitation_code: string;
  telegram_link?: string;
  whatsapp_link?: string;
  created_at: string;
}

interface MultiSlot {
  task_number: string;
  min_amount: string;
  max_amount: string;
  commission: string;
  is_lucky: boolean;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'tasks' | 'settings' | 'subadmins'>('users');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [mainCode, setMainCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [trc20Address, setTrc20Address] = useState('');
  const [trc20QrUrl, setTrc20QrUrl] = useState('');

  // Sub-Admin Form State
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPassword, setSubAdminPassword] = useState('');
  const [subAdminCode, setSubAdminCode] = useState('');
  const [subAdminTelegram, setSubAdminTelegram] = useState('');
  const [subAdminWhatsapp, setSubAdminWhatsapp] = useState('');
  const [subAdminList, setSubAdminList] = useState<SubAdminRecord[]>([]);
  const [editingSubAdminId, setEditingSubAdminId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [depositsList, setDepositsList] = useState<DepositRecord[]>([]);
  const [withdrawsList, setWithdrawsList] = useState<WithdrawRecord[]>([]);
  const [tasksList, setTasksList] = useState<CustomTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Live Chat State
  const [activeChatUser, setActiveChatUser] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');

  // Selected user and modal state for Users tab
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalType, setModalType] = useState<'add' | 'cut' | 'settings' | 'task_settings' | null>(null);
  const [amountInput, setAmountInput] = useState('');

  // User Settings Form State
  const [editVipLevel, setEditVipLevel] = useState('VIP 0 - Regular');
  const [editTrc20, setEditTrc20] = useState('');
  const [editBankHolder, setEditBankHolder] = useState('');
  const [editWithdrawPassword, setEditWithdrawPassword] = useState('');
  const [editWithdrawStatus, setEditWithdrawStatus] = useState('active');
  const [editWithdrawMessage, setEditWithdrawMessage] = useState('');

  // Modal 7 Lucky Task Slots
  const [modalTargetVip, setModalTargetVip] = useState('VIP 1 - Amazon');
  const [slots, setSlots] = useState<MultiSlot[]>([
    { task_number: '5', min_amount: '100', max_amount: '120', commission: '18', is_lucky: true },
    { task_number: '10', min_amount: '200', max_amount: '250', commission: '30', is_lucky: true },
    { task_number: '15', min_amount: '350', max_amount: '400', commission: '50', is_lucky: true },
    { task_number: '18', min_amount: '500', max_amount: '600', commission: '80', is_lucky: true },
    { task_number: '20', min_amount: '750', max_amount: '900', commission: '120', is_lucky: true },
    { task_number: '22', min_amount: '1000', max_amount: '1200', commission: '180', is_lucky: true },
    { task_number: '25', min_amount: '1500', max_amount: '1800', commission: '250', is_lucky: true },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
    fetchSubAdmins();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'deposits') fetchDeposits();
    if (activeTab === 'withdrawals') fetchWithdraws();
    if (activeTab === 'tasks') {
      fetchUsers();
      fetchTasks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeChatUser) {
      fetchChatMessages(activeChatUser.id);
    }
  }, [activeChatUser]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
    if (data) {
      setTelegram(data.telegram_link || '');
      setWhatsapp(data.whatsapp_link || '');
      setMainCode(data.main_invitation_code || '');
      setTrc20Address(data.deposit_trc20_address || '');
      setTrc20QrUrl(data.deposit_qr_url || '');
    }
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.email) {
      setAdminEmail(userData.user.email);
    }
  };

  const fetchSubAdmins = async () => {
    const { data } = await supabase.from('sub_admins').select('*').order('created_at', { ascending: false });
    if (data) setSubAdminList(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setUsersList(data);
  };

  const fetchDeposits = async () => {
    const { data } = await supabase.from('deposits').select('*, profiles(email, phone, invitation_code)').order('created_at', { ascending: false });
    if (data) setDepositsList(data);
  };

  const fetchWithdraws = async () => {
    const { data } = await supabase.from('withdrawals').select('*, profiles(email, phone, invitation_code)').order('created_at', { ascending: false });
    if (data) setWithdrawsList(data);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from('custom_tasks').select('*, profiles(email, phone)').order('created_at', { ascending: false });
    if (data) setTasksList(data);
  };

  const fetchChatMessages = async (userId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
  };

  const handleCreateOrUpdateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingSubAdminId) {
      // Update Existing Sub Admin
      const { error } = await supabase.from('sub_admins').update({
        email: subAdminEmail,
        invitation_code: subAdminCode,
        telegram_link: subAdminTelegram,
        whatsapp_link: subAdminWhatsapp,
      }).eq('id', editingSubAdminId);

      if (!error) {
        alert('Sub-Admin details updated successfully!');
        setEditingSubAdminId(null);
        resetSubAdminForm();
        fetchSubAdmins();
      } else {
        alert('Error updating sub-admin: ' + error.message);
      }
    } else {
      // Create New Sub Admin
      const { error } = await supabase.from('sub_admins').insert([{
        email: subAdminEmail,
        invitation_code: subAdminCode,
        telegram_link: subAdminTelegram,
        whatsapp_link: subAdminWhatsapp,
      }]);

      if (!error) {
        alert('New Sub-Admin Created Successfully!');
        resetSubAdminForm();
        fetchSubAdmins();
      } else {
        alert('Error creating sub-admin: ' + error.message);
      }
    }
    setLoading(false);
  };

  const resetSubAdminForm = () => {
    setSubAdminEmail('');
    setSubAdminPassword('');
    setSubAdminCode('');
    setSubAdminTelegram('');
    setSubAdminWhatsapp('');
    setEditingSubAdminId(null);
  };

  const handleEditSubAdminClick = (sub: SubAdminRecord) => {
    setEditingSubAdminId(sub.id);
    setSubAdminEmail(sub.email);
    setSubAdminCode(sub.invitation_code);
    setSubAdminTelegram(sub.telegram_link || '');
    setSubAdminWhatsapp(sub.whatsapp_link || '');
  };

  const handleDeleteSubAdmin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Sub-Admin?')) return;
    await supabase.from('sub_admins').delete().eq('id', id);
    fetchSubAdmins();
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChatUser) return;
    const newMsg = {
      sender_id: 'admin',
      receiver_id: activeChatUser.id,
      message: replyText.trim(),
      is_admin: true,
    };
    const { error } = await supabase.from('chat_messages').insert([newMsg]);
    if (!error) {
      setReplyText('');
      fetchChatMessages(activeChatUser.id);
    }
  };

  const handleResetTasks = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reset tasks for this user to 0?')) return;
    const { error } = await supabase
      .from('profiles')
      .update({ running_tasks: 0, completed_tasks: 0 })
      .eq('id', userId);

    if (!error) {
      alert('Tasks count reset to 0 successfully!');
      fetchUsers();
    } else {
      alert('Error resetting tasks: ' + error.message);
    }
  };

  const handleSlotChange = (index: number, field: keyof MultiSlot, value: any) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const clearSingleSlot = (index: number) => {
    const updated = [...slots];
    updated[index] = {
      task_number: '',
      min_amount: '',
      max_amount: '',
      commission: '',
      is_lucky: false,
    };
    setSlots(updated);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formattedTelegram = telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace('@', '')}`;
    const formattedWhatsapp = whatsapp.startsWith('http') ? whatsapp : `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

    const { error } = await supabase.from('system_settings').update({
      telegram_link: formattedTelegram,
      whatsapp_link: formattedWhatsapp,
    }).eq('id', 1);

    setMsg(error ? 'Error updating support settings' : 'Support settings updated successfully!');
    setLoading(false);
  };

  const handleSaveMainAdminControl = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (adminEmail || adminPassword) {
      const updateData: { email?: string; password?: string } = {};
      if (adminEmail) updateData.email = adminEmail;
      if (adminPassword) updateData.password = adminPassword;

      const { error: authError } = await supabase.auth.updateUser(updateData);
      if (authError) {
        alert('Error updating Admin email/password: ' + authError.message);
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.from('system_settings').update({
      main_invitation_code: mainCode,
      deposit_trc20_address: trc20Address,
      deposit_qr_url: trc20QrUrl,
    }).eq('id', 1);

    if (!error) {
      alert('Main Admin credentials, Invitation Code, and TRC20 settings updated successfully!');
      setAdminPassword('');
    } else {
      alert('Error saving admin settings: ' + error.message);
    }
    setLoading(false);
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !amountInput) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount)) return;

    const currentBalance = selectedUser.balance || 0;
    const updatedBalance = modalType === 'add' ? currentBalance + amount : Math.max(0, currentBalance - amount);

    const { error } = await supabase.from('profiles').update({ balance: updatedBalance }).eq('id', selectedUser.id);
    if (!error) {
      setUsersList(usersList.map(u => u.id === selectedUser.id ? { ...u, balance: updatedBalance } : u));
      setModalType(null);
      setAmountInput('');
      setSelectedUser(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    setUsersList(usersList.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const handleUserSettingsSave = async () => {
    if (!selectedUser) return;
    const updatePayload: Record<string, string> = {
      vip_level: editVipLevel,
      trc20_address: editTrc20,
      bank_holder_name: editBankHolder,
      withdraw_password: editWithdrawPassword,
      withdraw_status: editWithdrawStatus,
      withdraw_message: editWithdrawMessage,
    };

    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', selectedUser.id);
    if (!error) {
      alert('Customer VIP level & settings updated successfully!');
      setModalType(null);
      setSelectedUser(null);
      fetchUsers();
    } else {
      alert('Error saving settings: ' + error.message);
    }
  };

  const openTaskSettingsModal = async (user: UserProfile) => {
    setSelectedUser(user);
    setModalTargetVip(user.vip_level || 'VIP 1 - Amazon');

    const { data } = await supabase.from('custom_tasks').select('*').eq('user_id', user.id);
    
    const defaultSlots: MultiSlot[] = [
      { task_number: '5', min_amount: '100', max_amount: '120', commission: '18', is_lucky: true },
      { task_number: '10', min_amount: '200', max_amount: '250', commission: '30', is_lucky: true },
      { task_number: '15', min_amount: '350', max_amount: '400', commission: '50', is_lucky: true },
      { task_number: '18', min_amount: '500', max_amount: '600', commission: '80', is_lucky: true },
      { task_number: '20', min_amount: '750', max_amount: '900', commission: '120', is_lucky: true },
      { task_number: '22', min_amount: '1000', max_amount: '1200', commission: '180', is_lucky: true },
      { task_number: '25', min_amount: '1500', max_amount: '1800', commission: '250', is_lucky: true },
    ];

    if (data && data.length > 0) {
      data.forEach((item: CustomTask, idx: number) => {
        if (idx < 7) {
          defaultSlots[idx] = {
            task_number: item.task_number ? item.task_number.toString() : '',
            min_amount: (item.min_amount || item.task_amount || '').toString(),
            max_amount: (item.max_amount || item.task_amount || '').toString(),
            commission: item.commission ? item.commission.toString() : '',
            is_lucky: item.is_lucky_order,
          };
        }
      });
    }

    setSlots(defaultSlots);
    setModalType('task_settings');
  };

  const handleSaveModalTasks = async () => {
    if (!selectedUser) return;

    await supabase.from('custom_tasks').delete().eq('user_id', selectedUser.id);

    const payload = slots
      .filter(s => s.task_number !== '' && parseFloat(s.max_amount) > 0)
      .map(s => {
        const minVal = parseFloat(s.min_amount) || parseFloat(s.max_amount);
        const maxVal = parseFloat(s.max_amount) || minVal;
        return {
          user_id: selectedUser.id,
          task_number: parseInt(s.task_number) || 1,
          min_amount: minVal,
          max_amount: maxVal,
          task_amount: maxVal,
          commission: parseFloat(s.commission) || 0,
          vip_level: modalTargetVip,
          is_lucky_order: s.is_lucky,
          status: 'pending',
        };
      });

    if (payload.length > 0) {
      const { error } = await supabase.from('custom_tasks').insert(payload);
      if (error) {
        alert('Error saving lucky tasks: ' + error.message);
        return;
      }
    }

    alert('Automatic Lucky Order Sequence updated successfully!');
    setModalType(null);
    setSelectedUser(null);
    fetchTasks();
  };

  const handleDepositAction = async (depositId: string, status: string, userId: string, amount: number) => {
    await supabase.from('deposits').update({ status }).eq('id', depositId);
    if (status === 'approved') {
      const targetUser = usersList.find(u => u.id === userId);
      if (targetUser) {
        const newBal = (targetUser.balance || 0) + amount;
        await supabase.from('profiles').update({ balance: newBal }).eq('id', userId);
      }
    }
    fetchDeposits();
    fetchUsers();
  };

  const handleWithdrawAction = async (withdrawId: string, status: string) => {
    await supabase.from('withdrawals').update({ status }).eq('id', withdrawId);
    fetchWithdraws();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const filteredUsers = usersList.filter(u => 
    (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.id && u.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.invitation_code && u.invitation_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTasksUserList = usersList.filter(u => 
    (u.phone && u.phone.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
    (u.id && u.id.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(taskSearchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-blue-900 text-white flex flex-col justify-between p-4 shadow-lg">
        <div>
          <h1 className="text-xl font-bold mb-6 text-center border-b border-blue-700 pb-3">Admin Panel</h1>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${activeTab === 'users' ? 'bg-blue-700 shadow' : 'hover:bg-blue-800'}`}>1. User Management</button>
            <button onClick={() => setActiveTab('deposits')} className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${activeTab === 'deposits' ? 'bg-blue-700 shadow' : 'hover:bg-blue-800'}`}>2. Deposit Records</button>
            <button onClick={() => setActiveTab('withdrawals')} className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${activeTab === 'withdrawals' ? 'bg-blue-700 shadow' : 'hover:bg-blue-800'}`}>3. Withdraw Records</button>
            <button onClick={() => setActiveTab('tasks')} className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${activeTab === 'tasks' ? 'bg-blue-700 shadow' : 'hover:bg-blue-800'}`}>4. Tasks Management</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${activeTab === 'settings' ? 'bg-blue-700 shadow' : 'hover:bg-blue-800'}`}>5. Support & Live Chat</button>
            <button onClick={() => setActiveTab('subadmins')} className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${activeTab === 'subadmins' ? 'bg-blue-700 shadow' : 'hover:bg-blue-800'}`}>6. Sub-Admin System</button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold transition shadow-md">Logout</button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* TAB 1: USERS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-blue-900">User Management Panel</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Total Registered Customers: <span className="text-blue-600 font-bold">{usersList.length}</span></p>
              </div>
              <div className="w-full md:w-72">
                <input 
                  type="text" 
                  placeholder="Search by ID, Phone or Code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-sm">
                    <th className="p-3">User ID & Phone</th>
                    <th className="p-3">Invi Code</th>
                    <th className="p-3">Gmail / VIP Status</th>
                    <th className="p-3">Tasks (Run / Comp)</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Actions & Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-500">No customers found.</td></tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-bold text-blue-900">{u.phone || 'No Phone'}</div>
                          <div className="text-xs text-gray-400 font-mono">ID: {u.id.slice(0, 6)}...</div>
                        </td>
                        <td className="p-3 font-bold text-indigo-700 text-xs">
                          <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 rounded">
                            {u.invitation_code || 'MAIN'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-600">{u.email || 'N/A'}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                            {u.vip_level || 'VIP 0 - Regular'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-800">
                          <span className="text-blue-600 font-semibold">Run: {u.running_tasks || 0}</span> / <span className="text-green-600 font-semibold">Comp: {u.completed_tasks || 0}</span>
                        </td>
                        <td className="p-3">
                          <div className="text-lg font-bold text-green-600 mb-1">${u.balance || '0.00'}</div>
                          <div className="flex space-x-1">
                            <button onClick={() => { setSelectedUser(u); setModalType('add'); }} className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm transition">+ Add</button>
                            <button onClick={() => { setSelectedUser(u); setModalType('cut'); }} className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm transition">- Cut</button>
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={u.status || 'active'}
                            onChange={(e) => handleStatusChange(u.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold border ${u.status === 'frozen' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300'}`}
                          >
                            <option value="active">Active</option>
                            <option value="frozen">Frozen</option>
                          </select>
                        </td>
                        <td className="p-3 text-center space-x-1.5">
                          <button 
                            onClick={() => openTaskSettingsModal(u)} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-semibold shadow transition"
                            title="Set Lucky Order Rules"
                          >
                            ⚙️ Rules
                          </button>
                          <button 
                            onClick={() => handleResetTasks(u.id)} 
                            className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-semibold shadow transition"
                            title="Reset User Completed Tasks to 0"
                          >
                            🔄 Reset
                          </button>
                          <button 
                            onClick={() => { 
                              setSelectedUser(u); 
                              setModalType('settings'); 
                              setEditVipLevel(u.vip_level || 'VIP 0 - Regular');
                              setEditTrc20(u.trc20_address || '');
                              setEditBankHolder(u.bank_holder_name || '');
                              setEditWithdrawPassword(u.withdraw_password || '');
                              setEditWithdrawStatus(u.withdraw_status || 'active');
                              setEditWithdrawMessage(u.withdraw_message || '');
                            }} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold shadow transition" 
                            title="Customer Settings"
                          >
                            ⚙️ User
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Deposit Records & Complete History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-sm">
                    <th className="p-3">User ID & Phone</th>
                    <th className="p-3">Invi Code</th>
                    <th className="p-3">Gmail</th>
                    <th className="p-3">TRC20 Address</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {depositsList.length === 0 ? (
                    <tr><td colSpan={8} className="p-4 text-center text-gray-500">No deposit requests found.</td></tr>
                  ) : (
                    depositsList.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-blue-900">{d.profiles?.phone || d.user_id.slice(0, 6)}</td>
                        <td className="p-3 text-xs font-bold text-indigo-700">{d.profiles?.invitation_code || 'MAIN'}</td>
                        <td className="p-3 text-gray-600">{d.profiles?.email || 'N/A'}</td>
                        <td className="p-3 font-mono text-xs text-gray-700">{d.trc20_address || 'USDT TRC20'}</td>
                        <td className="p-3 font-bold text-green-600">${d.amount}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${d.status === 'approved' ? 'bg-green-100 text-green-700' : d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {d.status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          {d.status === 'pending' ? (
                            <>
                              <button onClick={() => handleDepositAction(d.id, 'approved', d.user_id, d.amount)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium">Approve</button>
                              <button onClick={() => handleDepositAction(d.id, 'rejected', d.user_id, d.amount)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium">Reject</button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Withdrawal Records & Complete History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-sm">
                    <th className="p-3">User ID & Phone</th>
                    <th className="p-3">Invi Code</th>
                    <th className="p-3">Gmail</th>
                    <th className="p-3">TRC20 Address</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {withdrawsList.length === 0 ? (
                    <tr><td colSpan={8} className="p-4 text-center text-gray-500">No withdrawal requests found.</td></tr>
                  ) : (
                    withdrawsList.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-blue-900">{w.profiles?.phone || w.user_id.slice(0, 6)}</td>
                        <td className="p-3 text-xs font-bold text-indigo-700">{w.profiles?.invitation_code || 'MAIN'}</td>
                        <td className="p-3 text-gray-600">{w.profiles?.email || 'N/A'}</td>
                        <td className="p-3 font-mono text-xs text-gray-700">{w.trc20_address}</td>
                        <td className="p-3 font-bold text-red-600">${w.amount}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(w.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${w.status === 'approved' ? 'bg-green-100 text-green-700' : w.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {w.status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          {w.status === 'pending' ? (
                            <>
                              <button onClick={() => handleWithdrawAction(w.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium">Approve</button>
                              <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium">Reject</button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TASKS MANAGEMENT */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">Tasks Management Panel</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Search customer and click ⚙️ Rules to set or edit 7 lucky task slots.</p>
              </div>
              <div className="w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="Search user by Phone or ID..." 
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-sm">
                    <th className="p-3">Customer Info</th>
                    <th className="p-3">Tasks (Run / Comp)</th>
                    <th className="p-3">Order Amount Range</th>
                    <th className="p-3">VIP Level</th>
                    <th className="p-3">Order Type Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredTasksUserList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasksUserList.map((u) => {
                      const userTask = tasksList.find(t => t.user_id === u.id);
                      return (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-bold text-blue-900">{u.phone || 'User'}</div>
                            <div className="text-xs text-gray-400 font-mono">ID: {u.id.slice(0, 6)}...</div>
                          </td>
                          <td className="p-3 font-semibold text-gray-800">
                            <span className="text-blue-600 font-bold">Run: {u.running_tasks || 0}</span> / <span className="text-green-600 font-bold">Comp: {u.completed_tasks || 0}</span>
                          </td>
                          <td className="p-3 font-semibold text-gray-800">
                            {userTask ? `$${userTask.min_amount || userTask.task_amount} - $${userTask.max_amount || userTask.task_amount}` : 'Not Set'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 font-bold rounded text-xs">
                              {u.vip_level || 'VIP 0'}
                            </span>
                          </td>
                          <td className="p-3">
                            {userTask ? (
                              <span className={`px-2 py-0.5 font-bold rounded text-xs ${userTask.is_lucky_order ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {userTask.is_lucky_order ? `Lucky / Trap Active (${userTask.vip_level || 'VIP'})` : 'Normal'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-medium rounded text-xs">
                                Normal Flow
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center space-x-1.5">
                            <button 
                              onClick={() => openTaskSettingsModal(u)} 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow transition"
                              title="Set Lucky Task Rules"
                            >
                              ⚙️ Rules
                            </button>
                            <button 
                              onClick={() => handleResetTasks(u.id)} 
                              className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow transition"
                              title="Reset Tasks Count to 0"
                            >
                              🔄 Reset
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SUPPORT & LIVE CHAT DASHBOARD */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* 1. Support Settings Form */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 max-w-2xl">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Customer Support Channels Setup</h2>
              {msg && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm font-medium">{msg}</div>}
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Support Username / Link</label>
                  <input type="text" placeholder="e.g. support_help or https://t.me/support_help" value={telegram} onChange={(e) => setTelegram(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Support Number / Link</label>
                  <input type="text" placeholder="e.g. 923001234567 or https://wa.me/923001234567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition shadow-md">
                  {loading ? 'Saving Links...' : 'Update Support Links'}
                </button>
              </form>
            </div>

            {/* 2. Expanded Live Chat Interface */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 h-[600px] flex overflow-hidden">
              {/* Customer Chat Sidebar */}
              <div className="w-1/3 border-r border-gray-200 bg-slate-50 flex flex-col">
                <div className="p-4 border-b bg-blue-900 text-white font-bold text-base flex justify-between items-center">
                  <span>Customer Support Inbox</span>
                  <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full text-white font-semibold">Live</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                  {usersList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">No active customers found.</div>
                  ) : (
                    usersList.map((u) => (
                      <div 
                        key={u.id} 
                        onClick={() => setActiveChatUser(u)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition ${activeChatUser?.id === u.id ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-gray-100'}`}
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-900">{u.phone || u.email}</div>
                          <div className="text-xs text-gray-500 font-mono">ID: {u.id.slice(0, 6)}...</div>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block shadow-sm" title="Active Customer"></span>
                          <span className="text-xs text-gray-400">💬</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Thread Panel */}
              <div className="flex-1 flex flex-col bg-slate-100">
                {activeChatUser ? (
                  <>
                    <div className="p-3.5 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
                      <div>
                        <div className="font-bold text-blue-900 text-base">{activeChatUser.phone || activeChatUser.email}</div>
                        <div className="text-xs text-green-600 font-semibold">● Online for Support</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-800 font-bold rounded">VIP: {activeChatUser.vip_level || 'VIP 0'}</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-gray-400 text-xs py-8">No message history with this customer. Start conversation below.</div>
                      ) : (
                        chatMessages.map((m) => (
                          <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md px-4 py-2 rounded-xl text-sm shadow ${m.is_admin ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                              {m.message}
                              <div className={`text-[10px] mt-1 text-right ${m.is_admin ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 bg-white border-t border-gray-200 flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Type response to customer..." 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={handleSendReply} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow">
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium">
                    Select a customer from left panel to open live chat thread.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SUB-ADMIN SYSTEM & MAIN ADMIN CONTROL */}
        {activeTab === 'subadmins' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Box: Main Admin Credentials & Global Settings */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-blue-900 mb-1">Main Admin Control & Deposit Settings</h2>
              <p className="text-xs text-gray-500 mb-4 font-medium">Update main admin login credentials, registration invitation code, and deposit TRC20 settings.</p>

              <form onSubmit={handleSaveMainAdminControl} className="space-y-4">
                <div className="bg-blue-50 p-3.5 rounded-lg border border-blue-200 space-y-2.5">
                  <h3 className="text-xs font-bold text-blue-900">1. Admin Credentials (Login Info)</h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Admin Email Address</label>
                    <input 
                      type="email" 
                      value={adminEmail} 
                      onChange={(e) => setAdminEmail(e.target.value)} 
                      placeholder="admin@example.com"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 bg-white" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">New Password (Optional)</label>
                    <input 
                      type="password" 
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white" 
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-gray-200 space-y-2.5">
                  <h3 className="text-xs font-bold text-blue-900">2. Registration Invitation Code</h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Main Registration Invitation Code</label>
                    <input 
                      type="text" 
                      value={mainCode} 
                      onChange={(e) => setMainCode(e.target.value)} 
                      placeholder="e.g. VIP888"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg font-bold text-blue-900 text-xs bg-white" 
                      required
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200 space-y-2.5">
                  <h3 className="text-xs font-bold text-emerald-900">3. Deposit TRC20 & QR Code Setup</h3>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">USDT TRC20 Wallet Address</label>
                    <input 
                      type="text" 
                      value={trc20Address} 
                      onChange={(e) => setTrc20Address(e.target.value)} 
                      placeholder="T..."
                      className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg font-mono text-xs bg-white text-emerald-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">TRC20 QR Code Image URL</label>
                    <input 
                      type="text" 
                      value={trc20QrUrl} 
                      onChange={(e) => setTrc20QrUrl(e.target.value)} 
                      placeholder="https://example.com/qr-code.png"
                      className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white" 
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-xs transition shadow-md">
                  {loading ? 'Saving Settings...' : 'Update Admin & Deposit Settings'}
                </button>
              </form>
            </div>

            {/* Right Box: Sub-Admin Creation & Management Control */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-xl font-bold text-blue-900">Create & Manage Sub-Admins</h2>
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">Total: {subAdminList.length}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 font-medium">Create isolated sub-admin accounts with custom assigned invitation codes and customer support links.</p>

                <form onSubmit={handleCreateOrUpdateSubAdmin} className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6">
                  <h3 className="text-xs font-bold text-indigo-900">{editingSubAdminId ? 'Edit Sub-Admin Details' : '+ Add New Sub-Admin Account'}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Sub-Admin Email</label>
                      <input 
                        type="email" 
                        value={subAdminEmail} 
                        onChange={(e) => setSubAdminEmail(e.target.value)} 
                        placeholder="sub@admin.com" 
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Sub-Admin Password</label>
                      <input 
                        type="password" 
                        value={subAdminPassword} 
                        onChange={(e) => setSubAdminPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white" 
                        required={!editingSubAdminId} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">Assigned Invitation Code (Clients Tracking)</label>
                    <input 
                      type="text" 
                      value={subAdminCode} 
                      onChange={(e) => setSubAdminCode(e.target.value)} 
                      placeholder="e.g. SUB01" 
                      className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs font-bold text-indigo-900 bg-white" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Telegram Link / Username</label>
                      <input 
                        type="text" 
                        value={subAdminTelegram} 
                        onChange={(e) => setSubAdminTelegram(e.target.value)} 
                        placeholder="sub_telegram" 
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">WhatsApp Link / Phone</label>
                      <input 
                        type="text" 
                        value={subAdminWhatsapp} 
                        onChange={(e) => setSubAdminWhatsapp(e.target.value)} 
                        placeholder="923000000000" 
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white" 
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-xs shadow transition">
                      {editingSubAdminId ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                    </button>
                    {editingSubAdminId && (
                      <button type="button" onClick={resetSubAdminForm} className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-semibold">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Created Sub-Admins Table */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 mb-2">Active Sub-Admin Accounts</h3>
                <div className="overflow-x-auto max-h-48 border rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-gray-700 border-b">
                        <th className="p-2">Email</th>
                        <th className="p-2">Code</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subAdminList.length === 0 ? (
                        <tr><td colSpan={3} className="p-3 text-center text-gray-400">No sub-admins created yet.</td></tr>
                      ) : (
                        subAdminList.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-gray-800">{sub.email}</td>
                            <td className="p-2 font-bold text-indigo-700">{sub.invitation_code}</td>
                            <td className="p-2 text-center space-x-1">
                              <button onClick={() => handleEditSubAdminClick(sub)} className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">⚙️ Edit</button>
                              <button onClick={() => handleDeleteSubAdmin(sub.id)} className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">🗑️</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modalType && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`bg-white rounded-xl shadow-2xl p-6 w-full my-8 ${modalType === 'task_settings' ? 'max-w-4xl' : 'max-w-2xl'}`}>
            {modalType === 'add' || modalType === 'cut' ? (
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-4 capitalize">{modalType} Funds for {selectedUser.phone || selectedUser.email}</h3>
                <input type="number" placeholder="Enter amount" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
                <div className="flex justify-end space-x-2">
                  <button onClick={() => { setModalType(null); setAmountInput(''); setSelectedUser(null); }} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium">Cancel</button>
                  <button onClick={handleBalanceUpdate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Confirm</button>
                </div>
              </div>
            ) : modalType === 'settings' ? (
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-4">Edit Customer Credentials & Rules</h3>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <label className="block text-xs font-bold text-yellow-900 mb-1">Customer VIP Level</label>
                    <select value={editVipLevel} onChange={(e) => setEditVipLevel(e.target.value)} className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm font-semibold text-yellow-900 bg-white">
                      <option value="VIP 0 - Regular">VIP 0 - Regular</option>
                      <option value="Amazon VIP 1 - $1000">Amazon VIP 1 - $1000</option>
                      <option value="AliExpress VIP 2 - $2000">AliExpress VIP 2 - $2000</option>
                      <option value="Shopify VIP 3 - $5000">Shopify VIP 3 - $5000</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bank Holder Name</label>
                    <input type="text" value={editBankHolder} onChange={(e) => setEditBankHolder(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TRC20 Address</label>
                    <input type="text" value={editTrc20} onChange={(e) => setEditTrc20(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">New Withdraw Password</label>
                    <input type="text" value={editWithdrawPassword} onChange={(e) => setEditWithdrawPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Withdrawal Status</label>
                    <select value={editWithdrawStatus} onChange={(e) => setEditWithdrawStatus(e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold ${editWithdrawStatus === 'deactive' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      <option value="active">Active (User can withdraw)</option>
                      <option value="deactive">Deactive (Block user withdrawal)</option>
                    </select>
                  </div>

                  {editWithdrawStatus === 'deactive' && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <label className="block text-xs font-bold text-red-800 mb-1">Notification Message</label>
                      <textarea rows={2} value={editWithdrawMessage} onChange={(e) => setEditWithdrawMessage(e.target.value)} className="w-full px-3 py-1.5 border border-red-300 rounded text-sm text-red-900" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button onClick={() => { setModalType(null); setSelectedUser(null); }} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium text-sm">Cancel</button>
                  <button onClick={handleUserSettingsSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">Save Changes</button>
                </div>
              </div>
            ) : modalType === 'task_settings' ? (
              <div>
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">Set Automatic Lucky Order Sequence (7 Slots)</h3>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">Configuring tasks for: <span className="text-blue-700 font-bold">{selectedUser.phone || selectedUser.email}</span></p>
                  </div>
                  <button onClick={() => { setModalType(null); setSelectedUser(null); }} className="text-gray-400 hover:text-gray-600 font-bold text-lg px-2">✕</button>
                </div>

                <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <label className="block text-xs font-bold text-blue-900 mb-1">Target VIP Level</label>
                  <select 
                    value={modalTargetVip} 
                    onChange={(e) => setModalTargetVip(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value="VIP 1 - Amazon">VIP 1 - Amazon</option>
                    <option value="VIP 2 - AliExpress">VIP 2 - AliExpress</option>
                    <option value="VIP 3 - Shopify">VIP 3 - Shopify</option>
                  </select>
                </div>

                {/* Expanded 7 Editable Slots Container */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-bold text-gray-600 px-2">
                    <div className="col-span-2">Task #</div>
                    <div className="col-span-3">Min Order ($)</div>
                    <div className="col-span-3">Max Order ($)</div>
                    <div className="col-span-2">Commission ($)</div>
                    <div className="col-span-1 text-center">Lucky?</div>
                    <div className="col-span-1 text-center">Del</div>
                  </div>

                  {slots.map((slot, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="md:col-span-2">
                        <label className="block md:hidden text-xs font-bold text-gray-600 mb-1">Task No</label>
                        <input 
                          type="number" 
                          placeholder="Task #"
                          value={slot.task_number} 
                          onChange={(e) => handleSlotChange(idx, 'task_number', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-bold text-blue-900"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block md:hidden text-xs font-bold text-gray-600 mb-1">Min Order ($)</label>
                        <input 
                          type="number" 
                          placeholder="Min $"
                          value={slot.min_amount} 
                          onChange={(e) => handleSlotChange(idx, 'min_amount', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-semibold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block md:hidden text-xs font-bold text-gray-600 mb-1">Max Order ($)</label>
                        <input 
                          type="number" 
                          placeholder="Max $"
                          value={slot.max_amount} 
                          onChange={(e) => handleSlotChange(idx, 'max_amount', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-semibold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block md:hidden text-xs font-bold text-gray-600 mb-1">Commission ($)</label>
                        <input 
                          type="number" 
                          placeholder="Commission $"
                          value={slot.commission} 
                          onChange={(e) => handleSlotChange(idx, 'commission', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-bold text-green-700"
                        />
                      </div>

                      <div className="md:col-span-1 flex items-center justify-center pt-1 md:pt-0">
                        <input 
                          type="checkbox" 
                          checked={slot.is_lucky} 
                          onChange={(e) => handleSlotChange(idx, 'is_lucky', e.target.checked)}
                          className="w-4 h-4 text-red-600 rounded cursor-pointer" 
                          title="Lucky Trap Checkbox"
                        />
                      </div>

                      {/* Individual Slot Clear/Delete Button */}
                      <div className="md:col-span-1 flex items-center justify-center pt-1 md:pt-0">
                        <button 
                          type="button"
                          onClick={() => clearSingleSlot(idx)} 
                          className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-lg text-xs font-bold transition"
                          title="Clear/Delete Slot"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-gray-200">
                  <button onClick={() => { setModalType(null); setSelectedUser(null); }} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium text-xs">Cancel</button>
                  <button onClick={handleSaveModalTasks} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-md">Save Lucky Sequence</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};