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
  used_invite_code?: string;
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
  custom_id?: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  custom_task_id?: string | null;
  created_at: string;
  trc20_address: string;
}

interface WithdrawRecord {
  id: string;
  user_id: string;
  custom_id?: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  trc20_address: string;
}

interface ProductItem {
  id: string;
  name: string;
  store: 'Amazon' | 'AliExpress' | 'Shopify';
  price: number;
  image_url: string;
  created_at?: string;
category?: string | null;
}


interface SubAdminUser {
  id: string;
  email: string;
  password?: string;
  invite_code: string;
  telegram_url?: string;
  whatsapp_url?: string;
  permissions?: {
    users: boolean;
    deposits: boolean;
    withdrawals: boolean;
    tasks: boolean;
    support: boolean;
    products: boolean;
  };
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_admin: boolean;
}

interface AdminNotification {
  id: string;
  sub_admin_email: string;
  message: string;
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'deposits' | 'withdrawals' | 'tasks' | 'products' | 'support' | 'whatsapp_telegram' | 'settings' | 'delete_users'
  >('tasks');

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'zh' | 'ur' | 'ar'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteSearchQuery, setDeleteSearchQuery] = useState('');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [withdrawSearchQuery, setWithdrawSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
const [newProdCategory, setNewProdCategory] = useState('Beauty & Skincare');  
const [currentAdminEmail, setCurrentAdminEmail] = useState('admin@gmail.com');
  const [isMainAdmin, setIsMainAdmin] = useState(true);
  const [subAdminDbId, setSubAdminDbId] = useState('');
  const [subAdminInviteCode, setSubAdminInviteCode] = useState('');
  const [subAdminPermissions, setSubAdminPermissions] = useState({
    users: true,
    deposits: true,
    withdrawals: true,
    tasks: true,
    support: true,
    products: true,
  });

  const [mainAdminEmail, setMainAdminEmail] = useState('admin@gmail.com');
  const [mainAdminPassword, setMainAdminPassword] = useState('');
  const [depositTrc20, setDepositTrc20] = useState(() => localStorage.getItem('global_trc20') || 'TYA83kNx9XmR2pQz1L7W4sV6B0c9e5F8dH');
  const [mainInviteCode, setMainInviteCode] = useState(() => localStorage.getItem('global_invite') || 'MAIN2026');

  const [telegramUrl, setTelegramUrl] = useState('https://t.me');
  const [whatsappUrl, setWhatsappUrl] = useState('https://whatsapp.com');
  
  const [subAdminEditableEmail, setSubAdminEditableEmail] = useState('');
  const [subAdminEditablePassword, setSubAdminEditablePassword] = useState('');
  const [subAdminEditableInviteCode, setSubAdminEditableInviteCode] = useState('');

  const [waConnected, setWaConnected] = useState(false);
  const [tgConnected, setTgConnected] = useState(false);
  const [whatsappQrUrl] = useState('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://web.whatsapp.com');
  const [telegramQrUrl] = useState('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://web.telegram.org');

  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPassword, setNewSubPassword] = useState('');
  const [newSubInviteCode, setNewSubInviteCode] = useState('');

  const [selectedSubAdminForModal, setSelectedSubAdminForModal] = useState<SubAdminUser | null>(null);
  const [editSubEmail, setEditSubEmail] = useState('');
  const [editSubPassword, setEditSubPassword] = useState('');
  const [editSubInviteCode, setEditSubInviteCode] = useState('');
  const [editSubTelegram, setEditSubTelegram] = useState('');
  const [editSubWhatsapp, setEditSubWhatsapp] = useState('');
  const [editSubPerms, setEditSubPerms] = useState({
    users: true,
    deposits: true,
    withdrawals: true,
    tasks: true,
    support: true,
    products: true,
  });
const [_newSubPerms, _setNewSubPerms] = useState({
  users: true,
  deposits: true,
  withdrawals: true,
  support: true,
  tasks: false,
  products: false,
});

const [scannerLoading, setScannerLoading] = useState(false);
const [scannerResult, setScannerResult] = useState<any>(null);

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [newProdName, setNewProdName] = useState('');
  const [newProdStore, setNewProdStore] = useState<'Amazon' | 'AliExpress' | 'Shopify'>('Amazon');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const [selectedUserForModal, setSelectedUserForModal] = useState<CustomerProfile | null>(null);
  const [modalType, setModalType] = useState<'add_funds' | 'cut_funds' | 'user_profile_all' | null>(null);
  const [isFullPageTaskSettings, setIsFullPageTaskSettings] = useState(false);
  const [fundInput, setFundInput] = useState('');

  const [editVipLevel, setEditVipLevel] = useState('VIP 0 - Regular');
  const [editWithdrawPass, setEditWithdrawPass] = useState('');
  const [editTrc20, setEditTrc20] = useState('');
  const [editErc20, setEditErc20] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [disableWithdraw, setDisableWithdraw] = useState(false);
  const [withdrawNotificationMsg, setWithdrawNotificationMsg] = useState('');

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

  const [chatUsers, setChatUsers] = useState<string[]>([]);  
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const checkAdminRoleAndFetchData = async () => {
    const subAdminEmail = localStorage.getItem('sub_admin_logged_in');
    const role = localStorage.getItem('current_admin_role');

    if (!role && !subAdminEmail) {
      window.location.href = '/admin/login';
      return;
    }

    if (role === 'admin') {
      setIsMainAdmin(true);
      fetchAdminData();
    } else {
      setIsMainAdmin(false);
      setCurrentAdminEmail(subAdminEmail || 'subadmin@platform.com');
      setSubAdminEditableEmail(subAdminEmail || '');
      
      const { data: subData } = await supabase
        .from('sub_admins')
        .select('*')
        .eq('email', subAdminEmail)
        .maybeSingle();

      if (subData) {
        setSubAdminDbId(subData.id);
        const cleanCode = (subData.invite_code || '').toString().trim().toUpperCase();
        setSubAdminInviteCode(cleanCode);
        setSubAdminEditableInviteCode(cleanCode);
        if (subData.permissions) {
          setSubAdminPermissions(subData.permissions);
        }
        if (subData.telegram_url) setTelegramUrl(subData.telegram_url);
        if (subData.whatsapp_url) setWhatsappUrl(subData.whatsapp_url);
        
        fetchAdminData();
      } else {
        fetchAdminData();
      }
    }
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (profiles) {
      const mappedProfiles = profiles.map((p, idx) => ({
        ...p,
        custom_id: idx + 1,
        auto_task_lock: p.auto_task_lock ?? true,
      }));
      setCustomers(mappedProfiles);
    }

    const { data: depList } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
    if (depList) setDeposits(depList);

    const { data: witList } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (witList) setWithdrawals(witList);

    const { data: prodList } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prodList) setProductsList(prodList);

    const { data: subList } = await supabase.from('sub_admins').select('*');
    if (subList) setSubAdmins(subList);

    const { data: notifList } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
    if (notifList) setNotifications(notifList);

    const { data: allChats } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
    if (allChats) {
      setChatMessages(allChats);
      const uniqueUserIds = Array.from(new Set(allChats.map((c) => (c.sender_id === 'admin' ? c.receiver_id : c.sender_id))));
      setChatUsers(uniqueUserIds);
      if (uniqueUserIds.length > 0 && !activeChatUserId) {
        setActiveChatUserId(uniqueUserIds[0]);
      }
    }
  };

  useEffect(() => {
    checkAdminRoleAndFetchData();

    const syncInterval = setInterval(async () => {
      checkAdminRoleAndFetchData();
    }, 3000);

    const adminChannel = supabase
      .channel('admin-live-sync-room')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => { checkAdminRoleAndFetchData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        () => { checkAdminRoleAndFetchData(); }
      )
      .subscribe();

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(adminChannel);
    };
  }, []);

  const handleAdminLogout = async () => {
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
      .update({ balance: newBal })
      .eq('id', selectedUserForModal.id);

    if (error) {
      showToast(`Error updating balance: ${error.message}`, 'error');
      return;
    }

    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedUserForModal.id ? { ...c, balance: newBal } : c))
    );

    showToast(`$${val} ${isAdd ? 'Added' : 'Deducted'} for #${selectedUserForModal.custom_id}`);
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

  const handleDeleteCustomer = async (user: CustomerProfile) => {
    if (!isMainAdmin) {
      showToast('Only Main Admin can delete customers!', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete Customer #${user.custom_id} (${user.email})?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== user.id));
      showToast(`Customer #${user.custom_id} deleted successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    }
  };

const handleDeleteCustomTask = async (taskId: string) => {
  try {
    const { error } = await supabase
      .from('custom_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw error;
    }

    showToast('Lucky Order deleted successfully.');

    if (selectedUserForModal) {
      await fetchUserCustomTasks(selectedUserForModal.id);
    }
  } catch (err: any) {
    showToast(
      err?.message || 'Could not delete Lucky Order.',
      'error'
    );
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
  if (!selectedUserForModal) {
    showToast('Please select a customer first.', 'error');
    return;
  }

  const taskNum = Number(slotTaskNum);
  const minAmt = Number(slotMinAmount);
  const maxAmt =
    slotMaxAmount.trim() !== ''
      ? Number(slotMaxAmount)
      : minAmt;

  const commPercent =
    slotCommPercent.trim() !== ''
      ? Number(slotCommPercent)
      : 10;

  // Validate inputs.
  if (
    !Number.isInteger(taskNum) ||
    taskNum < 1 ||
    !Number.isFinite(minAmt) ||
    !Number.isFinite(maxAmt) ||
    minAmt <= 0 ||
    maxAmt < minAmt ||
    !Number.isFinite(commPercent) ||
    commPercent < 0 ||
    commPercent > 100
  ) {
    showToast(
      'Enter a valid task number, amount range, and commission (0–100%).',
      'error'
    );
    return;
  }

  // Select one exact amount within the range, to 2 decimal places.
  const minCents = Math.round(minAmt * 100);
  const maxCents = Math.round(maxAmt * 100);

  if (
    Math.abs(minAmt * 100 - minCents) > 0.000001 ||
    Math.abs(maxAmt * 100 - maxCents) > 0.000001
  ) {
    showToast('Amounts can have a maximum of 2 decimal places.', 'error');
    return;
  }

  const exactAmount = Number(
  ((minAmt + maxAmt) / 2).toFixed(2)
);

  try {
    // Prevent another active order in the same task slot.
    const { data: existingTask, error: checkError } = await supabase
      .from('custom_tasks')
      .select('id')
      .eq('user_id', selectedUserForModal.id)
      .eq('task_number', taskNum)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingTask) {
      showToast(
        `An active order already exists for Task #${taskNum}.`,
        'error'
      );
      return;
    }

    // Save the range AND the one exact amount selected for this order.
    const { data: savedTask, error: insertError } = await supabase
      .from('custom_tasks')
      .insert([
        {
          user_id: selectedUserForModal.id,
          task_number: taskNum,
          min_amount: minAmt,
          max_amount: maxAmt,
          task_amount: exactAmount,
          commission: commPercent,
          commission_rate: commPercent,
          is_lucky_order: true,
          status: 'pending',
          is_active: true,
          funding_status: 'pending',
          funded_at: null,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    showToast(
      `Lucky Order #${savedTask.task_number} saved: $${Number(
        savedTask.task_amount
      ).toFixed(2)}`
    );

    setSlotTaskNum('');
    setSlotMinAmount('');
    setSlotMaxAmount('');
    setSlotCommPercent('');

    await fetchUserCustomTasks(selectedUserForModal.id);
  } catch (err: any) {
    showToast(
      err?.message || 'Could not save the Lucky Order.',
      'error'
    );
  }
};

const handleResetAutoSlots = () => {
  setAutoSlots([
    { id: 1, active: false, taskNum: '', amount: '', comm: '' },
    { id: 2, active: false, taskNum: '', amount: '', comm: '' },
    { id: 3, active: false, taskNum: '', amount: '', comm: '' },
    { id: 4, active: false, taskNum: '', amount: '', comm: '' },
    { id: 5, active: false, taskNum: '', amount: '', comm: '' },
  ]);

  showToast('5 Auto Slots boxes reset successfully!');
};

const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".csv")) {
    showToast("Please select a CSV file.", "error");
    event.target.value = "";
    return;
  }

  try {
    const text = await file.text();

    const lines = text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      showToast("CSV file has no product records.", "error");
      return;
    }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let value = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"' && line[i + 1] === '"' && inQuotes) {
          value += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(value.trim());
          value = "";
        } else {
          value += char;
        }
      }

      result.push(value.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((header) =>
      header.trim().toLowerCase().replace(/^\uFEFF/, "")
    );

    const nameIndex = headers.indexOf("name");
    const priceIndex = headers.indexOf("price");
    const imageIndex = headers.indexOf("image_url");
    const categoryIndex = headers.indexOf("category");
    const storeIndex = headers.indexOf("store");

    if (
      nameIndex === -1 ||
      priceIndex === -1 ||
      imageIndex === -1
    ) {
      showToast(
        "CSV needs name, price, and image_url columns.",
        "error"
      );
      return;
    }

    const products = lines.slice(1).map((line) => {
      const columns = parseCSVLine(line);

      return {
        name: columns[nameIndex] || "",
        price: Number(columns[priceIndex]),
        image_url: columns[imageIndex] || "",
        category:
          categoryIndex >= 0 ? columns[categoryIndex] || null : null,
        store: storeIndex >= 0 ? columns[storeIndex] || "Custom" : "Custom",
      };
    });

    if (
      products.some(
        (product) =>
          !product.name ||
          !Number.isFinite(product.price) ||
          product.price <= 0 ||
          !/^https?:\/\//i.test(product.image_url)
      )
    ) {
      showToast(
        "Check CSV rows: product name, positive price, and valid image URL are required.",
        "error"
      );
      return;
    }

    const { error } = await supabase
      .from("products")
      .insert(products);

    if (error) {
      console.error("CSV product upload error:", error);
      showToast("Products could not be uploaded.", "error");
      return;
    }

    showToast(`${products.length} products uploaded successfully!`);
    event.target.value = "";
  } catch (error) {
    console.error("CSV upload error:", error);
    showToast("Unable to read the CSV file.", "error");
  }
};

const handleAddProductSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newProdName.trim() || !newProdPrice || !newProdImageUrl.trim()) {
    showToast('Please fill all product fields!', 'error');
    return;
  }

  if (!Number.isFinite(Number(newProdPrice)) || Number(newProdPrice) <= 0) {
    showToast('Please enter a valid product price!', 'error');
    return;
  }

  if (!newProdCategory) {
    showToast('Please select a product category!', 'error');
    return;
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: newProdName.trim(),
      store: newProdStore,
      price: Number(newProdPrice),
      image_url: newProdImageUrl.trim(),
      category: newProdCategory
    }])
    .select()
    .single();

  if (error) {
    showToast(`Error: ${error.message}`, 'error');
    return;
  }

  if (data) {
    setProductsList(prev => [data, ...prev]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdImageUrl('');
    setNewProdCategory('Beauty & Skincare');
    showToast('Product added successfully!');
  }
};


const handleFetchLiveProductsFromAPI = async () => {
  setIsFetchingLive(true);

  try {
    showToast("AI is generating premium products...");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      showToast("Please sign in again.", "error");
      return;
    }

    const { data, error } = await supabase.functions.invoke(
      "ai-product-generator",
      {
        body: {
          category: newProdCategory || "Premium Watches",
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (error) {
      console.error("AI product generator error:", error);

      const response = error.context;

      if (response instanceof Response) {
        console.error("HTTP status:", response.status);
        console.error(
          "Edge Function response body:",
          await response.clone().text()
        );
      }

      showToast(
        "AI product generation failed. Check console.",
        "error"
      );
      return;
    }

    console.log("AI product generator response:", data);

    if (!data?.success) {
      showToast(
        data?.error || "AI product generation failed.",
        "error"
      );
      return;
    }

    const generatedProducts = Array.isArray(data.products)
      ? data.products
      : [];

    if (generatedProducts.length > 0) {
      setProductsList((prev) => {
        const existingIds = new Set(
          prev.map((product) => String(product.id))
        );

        const newProducts = generatedProducts.filter(
          (product: { id: string | number }) =>
            !existingIds.has(String(product.id))
        );

        return [...newProducts, ...prev];
      });
    }

    showToast(
      `AI generated ${data.inserted ?? generatedProducts.length} products in ${data.category}.`
    );
  } catch (err: unknown) {
    console.error("AI product generator error:", err);

    showToast(
      err instanceof Error
        ? err.message
        : "Unable to connect to AI backend.",
      "error"
    );
  } finally {
    setIsFetchingLive(false);
  }
};

const handleGenerateMissingPremiumProducts = async () => {
  setIsFetchingLive(true);

  let totalInserted = 0;
  const failedCategories: string[] = [];

  try {
    showToast("Checking all 25 premium categories...");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      showToast("Please sign in again.", "error");
      return;
    }

    const { data: categories, error: categoriesError } =
      await supabase
        .from("product_categories")
        .select("category_name")
        .order("sort_order", { ascending: true });

    if (categoriesError) {
      console.error("Category fetch error:", categoriesError);
      showToast("Unable to load product categories.", "error");
      return;
    }

    if (!categories || categories.length === 0) {
      showToast("No product categories were found.", "error");
      return;
    }

    for (const categoryRow of categories) {
      const category = categoryRow.category_name;

      try {
        showToast(`Generating missing products: ${category}`);

        const { data, error } =
          await supabase.functions.invoke(
            "ai-product-generator",
            {
              body: { category },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

        if (error) {
          console.error(
            `Generation failed for ${category}:`,
            error
          );
          failedCategories.push(category);
          continue;
        }

        if (!data?.success) {
          console.error(
            `Generation failed for ${category}:`,
            data?.error
          );
          failedCategories.push(category);
          continue;
        }

        totalInserted += Number(data.inserted || 0);

        const generatedProducts = Array.isArray(data.products)
          ? data.products
          : [];

        if (generatedProducts.length > 0) {
          setProductsList((prev) => {
            const existingIds = new Set(
              prev.map((product) => String(product.id))
            );

            const newProducts = generatedProducts.filter(
              (product: { id: string | number }) =>
                !existingIds.has(String(product.id))
            );

            return [...newProducts, ...prev];
          });
        }
      } catch (categoryError) {
        console.error(
          `Unexpected error for ${category}:`,
          categoryError
        );
        failedCategories.push(category);
      }
    }

    if (failedCategories.length > 0) {
      console.error("Categories needing retry:", failedCategories);

      showToast(
        `Finished with ${totalInserted} new products. ${failedCategories.length} categories failed; check console.`,
        "error"
      );
    } else {
      showToast(
        `Finished! ${totalInserted} new premium products added across ${categories.length} categories.`
      );
    }
  } catch (err: unknown) {
    console.error("Bulk product generation error:", err);

    showToast(
      err instanceof Error
        ? err.message
        : "Unable to generate premium products.",
      "error"
    );
  } finally {
    setIsFetchingLive(false);
  }
};


  const handleDeleteAllProducts = async () => {
    
  
    if (!window.confirm('Are you sure you want to delete all products from inventory?')) return;
    try {
      const { error } = await supabase.from('products').delete().neq('id', 0);
      if (error) throw error;
      setProductsList([]);
      showToast('All products deleted successfully!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (productId: number | string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products') 
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProductsList((prev) =>
        prev.filter((product) => String(product.id) !== String(productId))
      );

      showToast('Product deleted successfully!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
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

 

const handleDepositAction = async (
  deposit: DepositRecord,
  status: 'approved' | 'rejected'
) => {
  if (deposit.status !== 'pending') {
    showToast('This deposit has already been processed.', 'error');
    return;
  }

  try {
    let linkedOrder: {
      id: string;
      task_amount: number;
      status: string | null;
      is_active: boolean | null;
      funding_status: string;
    } | null = null;

    // Validate the exact Lucky Order before approving its deposit.
    if (status === 'approved' && deposit.custom_task_id) {
      const { data: order, error: orderError } = await supabase
        .from('custom_tasks')
        .select('id, task_amount, status, is_active, funding_status')
        .eq('id', deposit.custom_task_id)
        .eq('user_id', deposit.user_id)
        .eq('is_lucky_order', true)
        .maybeSingle();

      if (orderError) {
        showToast(`Could not verify Lucky Order: ${orderError.message}`, 'error');
        return;
      }

      if (
        !order ||
        order.status !== 'pending' ||
        order.is_active !== true ||
        order.funding_status === 'funded'
      ) {
        showToast(
          'Lucky Order is unavailable, already funded, or already processed.',
          'error'
        );
        return;
      }

      if (Number(order.task_amount) !== Number(deposit.amount)) {
        showToast(
          'Deposit amount does not match the Lucky Order amount.',
          'error'
        );
        return;
      }

      linkedOrder = {
        id: order.id,
        task_amount: Number(order.task_amount),
        status: order.status,
        is_active: order.is_active,
        funding_status: order.funding_status,
      };
    }

    // Approve the deposit once. The existing database trigger
    // credits the customer's balance; do not credit it here again.
    const { data: updatedDeposit, error: depError } = await supabase
      .from('deposits')
      .update({ status })
      .eq('id', deposit.id)
      .eq('user_id', deposit.user_id)
      .eq('status', 'pending')
      .select('id, status, custom_task_id')
      .maybeSingle();

    if (depError) {
      showToast(`Error updating deposit: ${depError.message}`, 'error');
      return;
    }

    if (!updatedDeposit) {
      showToast('Deposit already processed. Refresh the page.', 'error');
      return;
    }

    if (status === 'approved') {
      // Mark only the linked Lucky Order as funded.
      // This does not mark the order completed.
      if (linkedOrder) {
        const { data: fundedOrder, error: fundError } = await supabase
          .from('custom_tasks')
          .update({
            funding_status: 'funded',
            funded_at: new Date().toISOString(),
          })
          .eq('id', linkedOrder.id)
          .eq('user_id', deposit.user_id)
          .eq('status', 'pending')
          .eq('is_active', true)
          .eq('funding_status', 'pending')
          .select('id')
          .maybeSingle();

        if (fundError || !fundedOrder) {
          console.error(
            'Deposit approved, but Lucky Order funding update failed:',
            fundError?.message
          );

          showToast(
            'Deposit was approved, but the Lucky Order funding update failed. Do not approve this deposit again. Please refresh and check the order.',
            'error'
          );

          return;
        }
      }

      // Refresh the customer balance from the database.
      const { data: latestProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, balance, auto_task_lock')
        .eq('id', deposit.user_id)
        .maybeSingle();

      if (fetchErr || !latestProfile) {
        showToast(
          'Deposit approved. Refresh the page to check the customer balance.',
          'error'
        );
        return;
      }

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === deposit.user_id
            ? {
                ...customer,
                balance: Number(latestProfile.balance) || 0,
                auto_task_lock: latestProfile.auto_task_lock,
              }
            : customer
        )
      );

      showToast(
        linkedOrder
          ? `Lucky Order deposit of $${Number(deposit.amount).toFixed(2)} approved. The linked order is funded.`
          : `Deposit of $${Number(deposit.amount).toFixed(2)} approved.`,
        'success'
      );
    } else {
      showToast('Deposit request rejected.');
    }

    setDeposits((prev) =>
      prev.map((item) =>
        item.id === deposit.id ? { ...item, status } : item
      )
    );
  } catch (err: any) {
    showToast(
      err?.message || 'Could not process the deposit request.',
      'error'
    );
  }
};


// TRC20 scanner: separate from deposit approval
const handleCheckTrc20Transfers = async () => {
  setScannerLoading(true);
  setScannerResult(null);

  try {
   const { data, error } = await supabase.functions.invoke(
  'trc20-deposit-scanner',
  {
    method: 'GET',
  }
);
if (error) {
  const details = await error.context?.json().catch(() => null);

  setScannerResult({
    ok: false,
    message: error.message || 'Scanner request failed.',
    details,
  });
  return;
}

    setScannerResult(
      data ?? {
        ok: false,
        message: 'Scanner returned no response.',
      }
    );
  } catch (err: any) {
    setScannerResult({
      ok: false,
      message: err?.message || 'Could not contact scanner.',
    });
  } finally {
    setScannerLoading(false);
  }
};

  const handleWithdrawAction = async (withdraw: WithdrawRecord, status: 'approved' | 'rejected') => {
    if (withdraw.status !== 'pending') return;
    await supabase.from('withdrawals').update({ status }).eq('id', withdraw.id);

    if (status === 'rejected') {
      const user = customers.find((c) => c.id === withdraw.user_id);
      if (user) {
        const newBal = user.balance + withdraw.amount;
        await supabase.from('profiles').update({ balance: newBal }).eq('id', withdraw.user_id);
        setCustomers((prev) =>
          prev.map((c) => (c.id === withdraw.user_id ? { ...c, balance: newBal } : c))
        );
      }
    }

    setWithdrawals((prev) => prev.map((w) => (w.id === withdraw.id ? { ...w, status } : w)));
    showToast(`Withdrawal request ${status.toUpperCase()}!`);
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
      const oldEmail = currentAdminEmail;
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

      const changesList = [];
      if (oldEmail !== newEmail) changesList.push(`Email changed from ${oldEmail} to ${newEmail}`);
      if (subAdminEditablePassword.trim()) changesList.push(`Password was updated`);
      if (newInvite && newInvite !== subAdminInviteCode) changesList.push(`Invitation code changed to ${newInvite}`);

      if (changesList.length > 0) {
        const notifMsg = `Sub-Admin (${oldEmail}): ${changesList.join(', ')}`;
        await supabase.from('admin_notifications').insert([
          { sub_admin_email: newEmail, message: notifMsg }
        ]);
      }

      localStorage.setItem('sub_admin_logged_in', newEmail);
      setCurrentAdminEmail(newEmail);
      setSubAdminInviteCode(newInvite);
      setSubAdminEditablePassword('');

      showToast('Sub-Admin profile updated & synchronized with Main Admin!');
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    }
  };

const [newSubPerms, setNewSubPerms] = useState({
  users: true,
  deposits: true,
  withdrawals: true,
  support: true,
  tasks: false,
  products: false,
});

const handleSaveMainSettings = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!isMainAdmin) {
    showToast('Only Main Admin can change global settings.', 'error');
    return;
  }

  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 1,
        key: 'main',
        deposit_trc20_address: depositTrc20,
        main_invite_code: mainInviteCode,
        telegram_url: telegramUrl,
        whatsapp_url: whatsappUrl,
      });

    if (error) throw error;

    localStorage.setItem('global_trc20', depositTrc20);
    localStorage.setItem('global_invite', mainInviteCode);

    showToast('Global System Settings Saved!');
  } catch (err: any) {
    showToast(err.message || 'Failed to save settings', 'error');
  }
};

const handleUpdateAdminCredentials = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  if (!isMainAdmin) return;

  try {
    const updatePayload: {
      email?: string;
      password?: string;
    } = {};

    if (mainAdminEmail && mainAdminEmail !== currentAdminEmail) {
      updatePayload.email = mainAdminEmail.trim().toLowerCase();
    }

    if (mainAdminPassword) {
      updatePayload.password = mainAdminPassword;
    }

    if (Object.keys(updatePayload).length === 0) {
      showToast('Enter a new email or password.', 'error');
      return;
    }

    const { error } = await supabase.auth.updateUser(updatePayload);

    if (error) throw error;

    showToast('Admin credentials updated successfully!');
    setMainAdminPassword('');
  } catch (err: any) {
    showToast(err.message || 'Error updating credentials', 'error');
  }
};

const handleCreateSubAdmin = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  if (!isMainAdmin) {
    showToast('Only Main Admin can create Sub-Admins.', 'error');
    return;
  }

  if (
    !newSubEmail.trim() ||
    !newSubPassword.trim() ||
    !newSubInviteCode.trim()
  ) {
    showToast('Please fill all fields', 'error');
    return;
  }

  try {
    const permissions = {
      users: Boolean(newSubPerms.users),
      deposits: Boolean(newSubPerms.deposits),
      withdrawals: Boolean(newSubPerms.withdrawals),
      support: Boolean(newSubPerms.support),

      // Main Admin can enable Tasks from the permission form
      tasks: Boolean(newSubPerms.tasks),

      // Restricted permissions
      products: false,
      trc_settings: false,
      main_support_links: false,
      main_admin_settings: false,
      manage_subadmins: false,

      // Allows editing only their own support links
      own_telegram_whatsapp: true,
    };

    const { data: insertedData, error } = await supabase
      .from('sub_admins')
      .insert([
        {
          email: newSubEmail.trim().toLowerCase(),
          password: newSubPassword.trim(),
          invite_code: newSubInviteCode.trim().toUpperCase(),
          permissions,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (insertedData) {
      setSubAdmins((prev) => [...prev, insertedData]);
    }

    setNewSubEmail('');
    setNewSubPassword('');
    setNewSubInviteCode('');

    setNewSubPerms({
      users: true,
      deposits: true,
      withdrawals: true,
      support: true,
      tasks: false,
      products: false,
    });

    showToast('Sub-Admin created successfully!');
  } catch (err: any) {
    showToast(err.message || 'Error creating Sub-Admin', 'error');
  }
};

const handleDeleteSubAdmin = async (subId: string) => {
  if (!isMainAdmin) {
    showToast('Only Main Admin can delete Sub-Admins.', 'error');
    return;
  }

  if (!window.confirm('Are you sure you want to delete this sub-admin?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('sub_admins')
      .delete()
      .eq('id', subId);

    if (error) throw error;

    setSubAdmins((prev) =>
      prev.filter((s) => s.id !== subId)
    );

    showToast('Sub-Admin successfully deleted!');
  } catch (err: any) {
    showToast(`Error deleting Sub-Admin: ${err.message}`, 'error');
  }
};

const handleSaveSubAdminSettings = async () => {
  if (!isMainAdmin || !selectedSubAdminForModal) {
    showToast('Only Main Admin can change Sub-Admin settings.', 'error');
    return;
  }

  try {
    const payload: any = {
      permissions: {
        users: Boolean(editSubPerms.users),
        deposits: Boolean(editSubPerms.deposits),
        withdrawals: Boolean(editSubPerms.withdrawals),
        support: Boolean(editSubPerms.support),
        tasks: Boolean(editSubPerms.tasks),

        products: false,
        trc_settings: false,
        main_support_links: false,
        main_admin_settings: false,
        manage_subadmins: false,
        own_telegram_whatsapp: true,
      },
    };

    if (editSubEmail.trim()) {
      payload.email = editSubEmail.trim().toLowerCase();
    }

    // Retained for compatibility with your current schema.
    // Move Sub-Admin passwords to Supabase Auth before production use.
    if (editSubPassword.trim()) {
      payload.password = editSubPassword.trim();
    }

    if (editSubInviteCode.trim()) {
      payload.invite_code = editSubInviteCode.trim().toUpperCase();
    }

    if (editSubTelegram.trim()) {
      payload.telegram_url = editSubTelegram.trim();
    }

    if (editSubWhatsapp.trim()) {
      payload.whatsapp_url = editSubWhatsapp.trim();
    }

    const { error } = await supabase
      .from('sub_admins')
      .update(payload)
      .eq('id', selectedSubAdminForModal.id);

    if (error) throw error;

    setSubAdmins((prev) =>
      prev.map((s) =>
        s.id === selectedSubAdminForModal.id
          ? { ...s, ...payload }
          : s
      )
    );

    showToast('Sub-Admin settings updated successfully!');
    setSelectedSubAdminForModal(null);
  } catch (err: any) {
    showToast(err.message || 'Error saving Sub-Admin settings', 'error');
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
  return (c.referred_by_code || '').trim().toUpperCase();
};

const getUserOwnDashboardInviCode = (c: CustomerProfile) => {
  const ownCode =
    c.user_invite_code ||
    c.invite_code ||
    c.invitation_code ||
    '';

  return ownCode.toString().trim().toUpperCase();
};

  const renderSimpleInvitationCodes = (c: CustomerProfile) => {
    const usedInviCode = getUserRegistrationInviCode(c) || mainInviteCode;
    const userOwnCode = getUserOwnDashboardInviCode(c) || `CUST${c.custom_id}`;

    return (
      <div className="flex flex-col text-xs font-bold space-y-0.5">
        <span className="text-slate-800 font-bold">{usedInviCode}</span>
        <span className="text-blue-600 font-mono font-medium">{userOwnCode}</span>
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

  const isCustomerOfSubAdmin = (c: CustomerProfile, subCode: string) => {
    if (isMainAdmin) return true;
    
    // ✅ Sub-admin ki UUID se direct check karein (Sabse reliable tareeqa)
    if (subAdminDbId && c.sub_admin_id === subAdminDbId) {
      return true;
    }

    if (!subCode || subCode.trim() === '') return false;
    
    const targetSubCode = subCode.toString().trim().toUpperCase();
    const usedCode = getUserRegistrationInviCode(c);
    const ownCode = getUserOwnDashboardInviCode(c);
    
    return usedCode === targetSubCode || ownCode === targetSubCode || usedCode.includes(targetSubCode);
  };

  const visibleCustomers = isMainAdmin
    ? customers
    : customers.filter((c) => isCustomerOfSubAdmin(c, subAdminInviteCode));

  const filteredCustomers = visibleCustomers.filter((c) => filterByUniversalQuery(c, searchQuery));
  const filteredDeleteCustomers = visibleCustomers.filter((c) => filterByUniversalQuery(c, deleteSearchQuery));
  const filteredTaskCustomers = visibleCustomers.filter((c) => filterByUniversalQuery(c, taskSearchQuery));

  
const filteredDeposits = deposits.filter((d) => {
  if (!isMainAdmin) {
    const cust = customers.find((c) => c.id === d.user_id);

    if (!cust || !isCustomerOfSubAdmin(cust, subAdminInviteCode)) {
      return false;
    }
  }

  const q = depositSearchQuery.trim().toLowerCase();

  if (!q) return true;

  const custDetails = getCustomerDetailsByUserId(d.user_id);

  const searchableFields = [
    String(custDetails.customId ?? ''),
    String(custDetails.name ?? ''),
    String(custDetails.phone ?? ''),
    String(d.trc20_address ?? ''),
    String((d as any).txid ?? ''),
    String((d as any).transaction_hash ?? ''),
    String(d.status ?? ''),
  ].map((value) => value.toLowerCase());

  // "#6" aur "6" dono se customer ID search ho sake
  const normalizedQuery = q.replace(/^#/, '');

  return searchableFields.some((value) =>
    value.includes(q) ||
    value.replace(/^#/, '').includes(normalizedQuery)
  );
});

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!isMainAdmin) {
      const cust = customers.find(c => c.id === w.user_id);
      if (!cust || !isCustomerOfSubAdmin(cust, subAdminInviteCode)) return false;
    }
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

  const filteredProducts = productsList.filter((p) => {
    const q = productSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.store.toLowerCase().includes(q);
  });

  const filteredChatUsers = chatUsers.filter((uId) => {
    const cust = customers.find(c => c.id === uId);
    if (!cust) return false;
    if (!isMainAdmin && !isCustomerOfSubAdmin(cust, subAdminInviteCode)) return false;
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
            <span>⚙️</span> {isMainAdmin ? 'Admin Portal' : 'Sub-Admin Portal'}
          </div>

          <nav className="space-y-1.5 text-xs font-bold">
            {(isMainAdmin || subAdminPermissions.users) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('users'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  activeTab === 'users' && !isFullPageTaskSettings ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                <span>👥</span>
                <span>Users</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.deposits) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('deposits'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                <span>📥</span>
                <span>Deposit Records</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.withdrawals) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('withdrawals'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                <span>📤</span>
                <span>Withdrawal Requests</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.tasks) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('tasks'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  (activeTab === 'tasks' || isFullPageTaskSettings) ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                <span>⚡</span>
                <span>Task Management</span>
              </button>
            )}

            {isMainAdmin && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('products'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                <span>🛍️</span>
                <span>Products Management</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.support) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('support'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  activeTab === 'support' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                <span>🎧</span>
                <span>Live Support & Chat</span>
              </button>
            )}

            {isMainAdmin && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('whatsapp_telegram'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  activeTab === 'whatsapp_telegram' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-200 hover:bg-blue-800'
                }`}
              >
                <span>📱</span>
                <span>WhatsApp & Telegram</span>
              </button>
            )}

            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('settings'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>🛠️</span>
              <span>Settings</span>
            </button>

            {isMainAdmin && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('delete_users'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${
                  activeTab === 'delete_users' ? 'bg-red-600 text-white shadow-lg' : 'text-red-200 hover:bg-red-900/50'
                }`}
              >
                <span>🗑️</span>
                <span>Delete Customers</span>
              </button>
            )}
          </nav>
        </div>

        <div className="border-t border-blue-800 pt-3 space-y-2">
          <div className="text-xs text-blue-200">
            Logged in: <span className="font-bold text-white">{currentAdminEmail}</span>
            {!isMainAdmin && (
              <div className="text-[10px] text-cyan-300 mt-0.5">Code: {subAdminInviteCode || 'NO CODE SET'}</div>
            )}
          </div>
          <button
            onClick={handleAdminLogout}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-1"
          >
            <span>🚪</span>
            <span>Logout Portal</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-6 overflow-y-auto">
        
        <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-2xl shadow border border-slate-200">
          <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
            <span>🌐 System Language:</span>
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="en">🇺🇸 English</option>
            <option value="zh">🇨🇳 中文 (Chinese)</option>
            <option value="ur">🇵🇰 اردو (Urdu)</option>
            <option value="ar">🇸🇦 العربية (Arabic)</option>
          </select>
        </div>

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
                  <button
                    onClick={handleResetAutoSlots}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-black rounded-lg text-xs transition"
                  >
                    🔄 Reset Slots
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Target Task Number (#):</label>
                    <input
                      type="number"
                      placeholder="e.g. 5, 10, 15"
                      value={slotTaskNum}
                      onChange={(e) => setSlotTaskNum(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Commission Rate (%):</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={slotCommPercent}
                      onChange={(e) => setSlotCommPercent(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        placeholder="Max e.g. 130"
                        value={slotMaxAmount}
                        onChange={(e) => setSlotMaxAmount(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePublishLuckyOrder}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-200 transition uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>Publish & Synchronize Lucky Order Slot</span>
                </button>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">5 Auto Slots (Slide to Activate & Auto-Fetch):</span>
                  <div className="space-y-2.5">
                    {autoSlots.map((slot) => (
                      <div key={slot.id} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 text-xs shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-blue-900">Slot #{slot.id} (Auto-Fetch)</span>
                          <div className="flex items-center gap-2">
                            {slot.active && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                ✓ Active
                              </span>
                            )}
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

                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            placeholder="Task #"
                            value={slot.taskNum}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAutoSlots(autoSlots.map(s => s.id === slot.id ? { ...s, taskNum: val } : s));
                            }}
                            className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-slate-700"
                          />
                          <input
                            type="number"
                            placeholder="Amount ($)"
                            value={slot.amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAutoSlots(autoSlots.map(s => s.id === slot.id ? { ...s, amount: val } : s));
                            }}
                            className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-emerald-700"
                          />
                          <input
                            type="number"
                            placeholder="Comm %"
                            value={slot.comm}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAutoSlots(autoSlots.map(s => s.id === slot.id ? { ...s, comm: val } : s));
                            }}
                            className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-indigo-700"
                          />
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
                    <th className="p-3">Invite Code</th>
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

    {/* SINGLE DEPOSIT HEADING AND SEARCH BAR */}
    <div className="flex justify-between items-center border-b pb-3 gap-4">
      <h2 className="text-lg font-black text-blue-900">
        Deposit Records & Approvals
      </h2>

    <div className="w-80 max-w-full">
  <input
    type="text"
    placeholder="Search by ID (#6), Name, Phone, TRC20 TXID..."
    value={depositSearchQuery}
    onChange={(e) => setDepositSearchQuery(e.target.value)}
    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
  />
</div>
    </div>

    {/* SINGLE TRC20 SCANNER */}
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <button
        type="button"
        onClick={handleCheckTrc20Transfers}
        disabled={scannerLoading}
        className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {scannerLoading ? 'Checking...' : 'Check Confirmed Transfers'}
      </button>

      {scannerResult && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs">
          {JSON.stringify(scannerResult, null, 2)}
        </pre>
      )}
    </div>

    {/* GREEN CONFIRMED RECHARGE CUSTOMER DETAILS */}
    <div className="rounded-xl border border-green-300 bg-green-50 p-4">
      <h3 className="mb-3 text-base font-black text-green-800">
        Confirmed Recharge — Customer Details
      </h3>

      {scannerResult?.ok === true &&
      Array.isArray(scannerResult.transfers) &&
      scannerResult.transfers.length > 0 ? (
        <div className="space-y-3">
          {scannerResult.transfers.map((tx: any, txIndex: number) => (
            <div
              key={tx.txid || txIndex}
              className="rounded-lg border border-green-200 bg-white p-3"
            >
              <p className="font-bold text-green-800">
                Amount: {tx.amount_usdt} USDT
              </p>

              <p className="mt-1 break-all text-xs text-slate-700">
                Transaction ID: {tx.txid || 'Not available'}
              </p>

              <p className="mt-1 break-all text-xs text-slate-700">
                Sender: {tx.from || 'Not available'}
              </p>

              <p className="mt-1 text-sm font-semibold text-green-800">
                Match: {tx.match_status ?? 'Not available'}
              </p>

              {Array.isArray(tx.customer_matches) &&
              tx.customer_matches.length > 0 ? (
                tx.customer_matches.map((customer: any, index: number) => (
                  <div
                    key={`${customer.deposit_id || tx.txid}-${index}`}
                    className="mt-3 rounded-lg bg-green-50 p-3 text-sm"
                  >
                    <p>
                      <strong>Admin Panel Customer ID:</strong>{' '}
                      {customer.customer_admin_id ?? 'Not available'}
                    </p>

                    <p className="break-all">
                      <strong>Account ID:</strong>{' '}
                      {customer.customer_account_id ?? 'Not available'}
                    </p>

                    <p>
                      <strong>Deposit Amount:</strong>{' '}
                      {customer.deposit_amount ?? 'Not available'}
                    </p>

                    <p>
                      <strong>Deposit Status:</strong>{' '}
                      {customer.deposit_status ?? 'Not available'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="mt-2 text-sm text-amber-700">
                  No deposit request matched this transaction ID.
                  Customer identity has not been determined.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-green-800">
          {scannerResult?.ok === false
            ? `Scanner error: ${scannerResult.message || 'Unable to retrieve transfers.'}`
            : 'No confirmed incoming USDT transfers are currently available to display.'}
        </p>
      )}
    </div>

    {/* ORIGINAL DEPOSIT TABLE — PRESERVED */}
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
              <tr
                key={dep.id}
                className="hover:bg-slate-50 transition"
              >
                <td className="p-3 whitespace-nowrap">
                  <div className="text-sm font-mono font-black text-blue-900">
                    {custDetails.customId}
                  </div>

                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    👤 {custDetails.name}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    📞 {custDetails.phone}
                  </div>
                </td>

                <td className="p-3 font-mono font-black text-emerald-600 text-sm">
                  ${dep.amount} USDT
                </td>

                <td className="p-3 font-mono text-slate-600 text-[11px]">
                  {dep.trc20_address || 'Not provided'}
                </td>

                <td className="p-3 font-mono text-slate-500 text-[11px]">
                  {new Date(dep.created_at).toLocaleString()}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                      dep.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dep.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {dep.status.toUpperCase()}
                  </span>
                </td>

                <td className="p-3 text-right">
                  {dep.status === 'pending' ? (
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDepositAction(dep, 'approved')}
                        className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-emerald-700"
                      >
                        Approve (+Auto Add & Release Lock)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDepositAction(dep, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[10px]">
                      Processed
                    </span>
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
                                Approve
                              </button>
                              <button
                                onClick={() => handleWithdrawAction(wit, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-red-700"
                              >
                                Reject (+Refund)
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
      <h2 className="text-lg font-black text-blue-900">
        ⚡ Task Management & User Overview
      </h2>

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

    {/* Iske neeche apna existing Task Management code waise hi rakhein */}    
    
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white font-bold">
                    <th className="p-3">Users</th>
                    <th className="p-3">Invite Code</th>
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

      ```tsx
  {/* TAB 5: PRODUCTS MANAGEMENT */}
  {!isFullPageTaskSettings && activeTab === 'products' && isMainAdmin && (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-black flex items-center gap-2">
            <span>⚡</span> Auto-Import E-Commerce Products
          </h2>
          <p className="text-xs text-blue-200">
            Import sample catalogue products without duplicating existing entries.
          </p>
        </div>

        <button
          onClick={handleFetchLiveProductsFromAPI}
          disabled={isFetchingLive}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs rounded-2xl shadow-lg transition uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
        >
          <span>
            {isFetchingLive ? 'Fetching Products...' : '📥 Fetch Products'}
          </span>
        </button>
      </div>

      {/* AI PREMIUM PRODUCT GENERATOR */}
      <div className="bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-5">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <span>✨</span> AI Premium Product Generator
          </h2>
          <p className="text-sm text-blue-200 mt-2">
            Generate premium product suggestions with Gemini AI and save them
            to your Supabase catalogue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-blue-100 mb-2">
              Select Product Category
            </label>

            <select
              value={newProdCategory}
              onChange={(e) => setNewProdCategory(e.target.value)}
              disabled={isFetchingLive}
              className="w-full rounded-xl bg-white text-slate-900 border border-blue-200 p-3 text-sm font-bold disabled:opacity-60"
            >
              <option value="Premium Watches">Premium Watches</option>
              <option value="Premium Smartphones">Premium Smartphones</option>
              <option value="Beauty & Skincare">Beauty &amp; Skincare</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleFetchLiveProductsFromAPI}
              disabled={isFetchingLive}
              className="w-full px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 rounded-xl text-white text-sm font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isFetchingLive
                ? "✨ Generating Products..."
                : "✨ Generate AI Products"}
            </button>
          </div>
       
<div className="pt-2">
  <button
    type="button"
    onClick={handleGenerateMissingPremiumProducts}
    disabled={isFetchingLive}
    className="w-full px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 rounded-xl text-white text-sm font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
  >
    {isFetchingLive
      ? "⏳ Processing Categories..."
      : "✨ Generate Missing Premium Products"}
  </button>
  <p className="text-xs text-blue-200 mt-2">
    Checks all 25 categories and generates products for categories
    that are not yet complete.
  </p>
</div>

        </div>

        <p className="text-xs text-blue-200">
          Products are saved to your existing Supabase products table.
          Your existing Fetch Products feature remains unchanged.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-black text-blue-900 flex items-center gap-2">
          <span>📁</span> Upload Custom Products via CSV File
        </h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-black text-blue-900 flex items-center gap-2">
          <span>🛍️</span> Add Single Product Manually
        </h2>

        <form
          onSubmit={handleAddProductSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Product Name
            </label>
            <input
              type="text"
              placeholder="e.g. Premium Watch"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Store / Platform
            </label>
            <select
              value={newProdStore}
              onChange={(e) => setNewProdStore(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-blue-900"
            >
              <option value="Amazon">Amazon</option>
              <option value="AliExpress">AliExpress</option>
              <option value="Shopify">Shopify</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Price ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 185"
              value={newProdPrice}
              onChange={(e) => setNewProdPrice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Product Category
            </label>
           
<select
  value={newProdCategory}
  onChange={(e) => setNewProdCategory(e.target.value)}
  disabled={isFetchingLive}
  className="w-full rounded-xl bg-white text-slate-900 border border-blue-200 p-3 text-sm font-bold disabled:opacity-60"
>
  <option value="Premium Laptops">Premium Laptops</option>
  <option value="Premium Smartphones">Premium Smartphones</option>
  <option value="Premium Watches">Premium Watches</option>
  <option value="Luxury Handbags">Luxury Handbags</option>
  <option value="Fashion & Clothing">Fashion &amp; Clothing</option>
  <option value="Fragrances">Fragrances</option>
  <option value="Beauty & Skincare">Beauty &amp; Skincare</option>
  <option value="Jewelry & Accessories">Jewelry &amp; Accessories</option>
  <option value="Fitness & Sports Equipment">Fitness &amp; Sports Equipment</option>
  <option value="Pet Supplies">Pet Supplies</option>
  <option value="Kitchen Appliances">Kitchen Appliances</option>
  <option value="Home Decor">Home Decor</option>
  <option value="Home Furniture">Home Furniture</option>
  <option value="Audio & Headphones">Audio &amp; Headphones</option>
  <option value="Gaming & Consoles">Gaming &amp; Consoles</option>
  <option value="Computer Accessories">Computer Accessories</option>
  <option value="Tablets">Tablets</option>
  <option value="Smart Home Devices">Smart Home Devices</option>
  <option value="Travel & Luggage">Travel &amp; Luggage</option>
  <option value="Footwear">Footwear</option>
  <option value="Sunglasses & Eyewear">Sunglasses &amp; Eyewear</option>
  <option value="Baby & Kids Products">Baby &amp; Kids Products</option>
  <option value="Outdoor & Camping">Outdoor &amp; Camping</option>
  <option value="Automotive Accessories">Automotive Accessories</option>
  <option value="Office & Stationery">Office &amp; Stationery</option>
</select>

          </div>

          <div className="md:col-span-4">
            <label className="font-bold text-slate-600 block mb-1">
              Image URL
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={newProdImageUrl}
              onChange={(e) => setNewProdImageUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
            />
          </div>

          <div className="md:col-span-4 pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow transition uppercase tracking-wider"
            >
              + Add Product to Database
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-black text-blue-900">
              Manage Existing Products
            </h3>
            <p className="text-xs text-slate-500">
              Total Products in Inventory:{' '}
              <span className="font-bold text-blue-700">
                {productsList.length}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAllProducts}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>🗑️</span>
              <span>Delete All Products</span>
            </button>

            <div className="w-72">
              <input
                type="text"
                placeholder="Search product name or store..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3a8a] text-white font-bold">
                <th className="p-3">Image</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Store</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-right">Remove / Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-slate-400 italic"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-xl border border-slate-300"
                      />
                    </td>

                    <td className="p-3 font-bold text-slate-800">
                      {p.name}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                        {p.category || 'Uncategorized'}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                        {p.store}
                      </span>
                    </td>

                    <td className="p-3 font-mono font-black text-emerald-600">
                      ${Number(p.price).toFixed(2)}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg shadow transition"
                      >
                        🗑️ Remove Product
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
```
        {/* TAB 6: LIVE SUPPORT & CHAT */}
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

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
              <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">📢 Official Telegram & WhatsApp Support Links</h3>
              <form onSubmit={handleSaveMainSettings} className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Telegram URL</label>
                  <input type="text" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">WhatsApp URL</label>
                  <input type="text" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                </div>
                <div className="col-span-2">
                  <button type="submit" className="py-2.5 px-6 bg-blue-900 text-white font-black text-xs rounded-xl shadow">Save Support Links</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MAIN ADMIN TAB: WHATSAPP & TELEGRAM QR CODE SCAN & MANAGEMENT */}
        {!isFullPageTaskSettings && activeTab === 'whatsapp_telegram' && isMainAdmin && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <span>📱</span> Main Admin WhatsApp & Telegram QR Terminal
                </h2>
                <p className="text-xs text-emerald-200">
                  Manage device connections, scan QR codes safely, and update official customer support links directly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-emerald-800 border-b pb-2 flex items-center gap-2">
                    <span>🟢</span> WhatsApp Device Scan & Login
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Scan the QR code below using your WhatsApp mobile application to link the device securely.
                  </p>

                  <div className="flex flex-col items-center justify-center my-6 space-y-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl border-2 border-emerald-300 shadow-inner">
                      <img src={whatsappQrUrl} alt="WhatsApp QR Code" className="w-48 h-48 rounded-xl" />
                    </div>

                    <div className="text-center space-y-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black inline-block ${
                        waConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {waConnected ? '✓ WhatsApp Device Connected & Synced' : '⌛ Waiting for WhatsApp QR Scan...'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWaConnected(true);
                    showToast('WhatsApp Device successfully connected!');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Simulate WhatsApp Connected
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-blue-800 border-b pb-2 flex items-center gap-2">
                    <span>🔵</span> Telegram Device Scan & Login
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Scan the QR code below using your Telegram mobile app to link and manage customer bot support.
                  </p>

                  <div className="flex flex-col items-center justify-center my-6 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-2xl border-2 border-blue-300 shadow-inner">
                      <img src={telegramQrUrl} alt="Telegram QR Code" className="w-48 h-48 rounded-xl" />
                    </div>

                    <div className="text-center space-y-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black inline-block ${
                        tgConnected ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {tgConnected ? '✓ Telegram Device Connected & Synced' : '⌛ Waiting for Telegram QR Scan...'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTgConnected(true);
                    showToast('Telegram Device successfully connected!');
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Simulate Telegram Connected
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
              <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">🔗 Update Customer Service & Support Links</h3>
              <form onSubmit={handleSaveMainSettings} className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Telegram Service URL</label>
                  <input type="text" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">WhatsApp Service URL</label>
                  <input type="text" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" />
                </div>
                <div className="col-span-2">
                  <button type="submit" className="py-3 px-8 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow">Save Support Links</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: ADMIN SETTINGS & SUB-ADMIN PROFILE */}
        {!isFullPageTaskSettings && activeTab === 'settings' && (
          <div className="space-y-6">
            
            {!isMainAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                  <h3 className="text-base font-extrabold text-blue-900 border-b pb-2 flex items-center gap-2">
                    <span>🛠️</span> Sub-Admin Profile & Settings
                  </h3>
                  <p className="text-xs text-slate-500">You can update your Email, Password, Invitation Code, and Support Links.</p>
                  
                  <form onSubmit={handleSaveSubAdminSelfProfile} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Sub-Admin Email (Editable)</label>
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
                      <label className="font-bold text-slate-600 block mb-1">Invitation Code (Editable)</label>
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

                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-emerald-800 border-b pb-2 flex items-center gap-2">
                      <span>📱</span> WhatsApp & Telegram Device QR Scan
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Scan to link your device directly. Main admin can disable this feature anytime.
                    </p>

                    <div className="flex items-center justify-center gap-4 my-6">
                      <div className="text-center space-y-2">
                        <span className="text-[10px] font-bold text-emerald-700">WhatsApp QR</span>
                        <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300">
                          <img src={whatsappQrUrl} alt="WA QR" className="w-28 h-28 rounded-lg" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <span className="text-[10px] font-bold text-blue-700">Telegram QR</span>
                        <div className="p-2 bg-blue-50 rounded-xl border border-blue-300">
                          <img src={telegramQrUrl} alt="TG QR" className="w-28 h-28 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-center text-[11px] font-bold">
                    🔒 Managed by Main Admin Terminal
                  </span>
                </div>
              </div>
            )}

            {isMainAdmin && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-200 space-y-3">
                  <h3 className="text-base font-extrabold text-blue-900 border-b pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">🔔 Sub-Admin Activity Notifications (Real-Time Log)</span>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-mono">{notifications.length} Logs</span>
                  </h3>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">No recent changes recorded from Sub-Admins.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs flex justify-between items-center">
                          <span className="font-bold text-blue-950">{notif.message}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">👑 Main System & Global Settings</h3>
                    <form onSubmit={handleSaveMainSettings} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Global Deposit TRC20 Address</label>
                        <input type="text" value={depositTrc20} onChange={(e) => setDepositTrc20(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-blue-900 font-bold" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Main Invitation Code</label>
                        <input type="text" value={mainInviteCode} onChange={(e) => setMainInviteCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold uppercase" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Telegram Support Link</label>
                        <input type="text" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">WhatsApp Support Link</label>
                        <input type="text" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-blue-900 text-white font-black text-xs rounded-xl shadow">Save Global System Settings</button>
                    </form>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">🔑 Main Admin Credentials</h3>
                    <form onSubmit={handleUpdateAdminCredentials} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Main Admin Email</label>
                        <input type="email" value={mainAdminEmail} onChange={(e) => setMainAdminEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">New Password</label>
                        <input type="password" placeholder="Enter new password if changing" value={mainAdminPassword} onChange={(e) => setMainAdminPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-indigo-900 text-white font-black text-xs rounded-xl shadow mt-6">Update Admin Credentials</button>
                    </form>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">🛡️ Create Sub-Admin & Permissions</h3>
                    <form onSubmit={handleCreateSubAdmin} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Sub-Admin Email</label>
                        <input type="email" placeholder="subadmin@platform.com" value={newSubEmail} onChange={(e) => setNewSubEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Password</label>
                        <input type="password" placeholder="Assign password" value={newSubPassword} onChange={(e) => setNewSubPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Unique Invi Code</label>
                        <input type="text" placeholder="SUB2026A01" value={newSubInviteCode} onChange={(e) => setNewSubInviteCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold uppercase" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-black text-xs rounded-xl shadow">Create Sub-Admin</button>
                    </form>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">📋 Existing Sub-Admins & Access Control</h3>
                    <div className="overflow-y-auto max-h-[480px] space-y-2.5">
                      {subAdmins.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No sub-admins created yet.</p>
                      ) : (
                        subAdmins.map((sub) => (
                          <div key={sub.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-blue-900">{sub.email}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Code: <b className="text-blue-700">{sub.invite_code || 'N/A'}</b></div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedSubAdminForModal(sub);
                                  setEditSubEmail(sub.email || '');
                                  setEditSubPassword('');
                                  setEditSubInviteCode(sub.invite_code || '');
                                  setEditSubTelegram(sub.telegram_url || '');
                                  setEditSubWhatsapp(sub.whatsapp_url || '');
                                  setEditSubPerms(sub.permissions || { users: true, deposits: true, withdrawals: true, tasks: true, support: true, products: true });
                                }}
                                className="px-3 py-1.5 bg-blue-900 text-white font-black text-[10px] rounded-xl shadow hover:bg-blue-800 transition flex items-center space-x-1"
                              >
                                <span>⚙️</span>
                                <span>Settings</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSubAdmin(sub.id)}
                                className="px-3 py-1.5 bg-red-600 text-white font-black text-[10px] rounded-lg shadow hover:bg-red-700 transition"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 8: DELETE CUSTOMERS PANEL */}
        {!isFullPageTaskSettings && activeTab === 'delete_users' && isMainAdmin && (
          <div className="bg-white rounded-3xl shadow-xl border border-red-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-red-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-red-700 flex items-center gap-2">
                  <span>🗑️</span> Customer Deletion Management
                </h2>
                <p className="text-xs text-slate-500 font-medium">Yahan se aap kisi bhi customer account ko permanently delete kar sakte hain.</p>
              </div>

              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search by ID, Name, Phone or Invi Code..."
                  value={deleteSearchQuery}
                  onChange={(e) => setDeleteSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-red-900 text-white font-bold">
                    <th className="p-3">Users</th>
                    <th className="p-3">Invite Code</th>
                    <th className="p-3">Email / Account</th>
                    <th className="p-3">Bal</th>
                    <th className="p-3 text-right">Permanent Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredDeleteCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-red-50/50 transition">
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-sm font-mono font-black text-red-900">#{c.custom_id}</div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">👤 {c.full_name || c.username || c.name || 'No Name'}</div>
                        <div className="text-[11px] text-slate-500">📞 {c.phone || 'No Phone'}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {renderSimpleInvitationCodes(c)}
                      </td>
                      <td className="p-3 text-slate-700 font-semibold">
                        {c.email || 'customer@appuser.local'}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600">
                        ${c.balance.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="px-3 py-1.5 bg-red-600 text-white font-black text-[10px] rounded-lg shadow hover:bg-red-700 transition"
                        >
                          🗑️ Delete Customer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* MODAL 3: SUB-ADMIN SETTINGS FOR MAIN ADMIN */}
      {selectedSubAdminForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl border-2 border-blue-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-extrabold text-blue-900">
                ⚙️ Sub-Admin Access & Permissions Settings
              </h3>
              <button onClick={() => setSelectedSubAdminForModal(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Sub-Admin Email (Editable)</label>
                <input type="email" value={editSubEmail} onChange={(e) => setEditSubEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-blue-900" />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Update Invitation Code</label>
                <input type="text" value={editSubInviteCode} onChange={(e) => setEditSubInviteCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold uppercase" />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">New Password (Optional)</label>
                <input type="password" placeholder="Enter new password" value={editSubPassword} onChange={(e) => setEditSubPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-blue-900 block uppercase text-[10px]">Sub-Admin Portal Permissions (On/Off Access):</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editSubPerms.users}
                      onChange={(e) => setEditSubPerms({ ...editSubPerms, users: e.target.checked })}
                    />
                    <span>Users</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editSubPerms.deposits}
                      onChange={(e) => setEditSubPerms({ ...editSubPerms, deposits: e.target.checked })}
                    />
                    <span>Deposit Records</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editSubPerms.withdrawals}
                      onChange={(e) => setEditSubPerms({ ...editSubPerms, withdrawals: e.target.checked })}
                    />
                    <span>Withdrawals</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editSubPerms.tasks}
                      onChange={(e) => setEditSubPerms({ ...editSubPerms, tasks: e.target.checked })}
                    />
                    <span>Task Management</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editSubPerms.support}
                      onChange={(e) => setEditSubPerms({ ...editSubPerms, support: e.target.checked })}
                    />
                    <span>Live Support</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editSubPerms.products}
                      onChange={(e) => setEditSubPerms({ ...editSubPerms, products: e.target.checked })}
                    />
                    <span>Products</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button onClick={() => setSelectedSubAdminForModal(null)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">Cancel</button>
              <button onClick={handleSaveSubAdminSettings} className="flex-1 py-2.5 bg-blue-900 text-white font-black text-xs rounded-xl shadow hover:bg-blue-800">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;