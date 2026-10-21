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
 withdraw_locked?: boolean;
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
    invitationCode?: boolean;
    telegram?: boolean;
    whatsapp?: boolean;
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

type SubAdminPermissions = {
  users: boolean;
  deposits: boolean;
  withdrawals: boolean;
  tasks: boolean;
  support: boolean;
  products: boolean;
  invitationCode: boolean;
  telegram: boolean;
  whatsapp: boolean;
};

const defaultSubAdminPermissions: SubAdminPermissions = {
  users: true,
  deposits: true,
  withdrawals: true,
  tasks: false,
  support: true,
  products: false,
  invitationCode: true,
  telegram: true,
  whatsapp: true,
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'deposits' | 'withdrawals' | 'tasks' | 'products' | 'support' | 'whatsapp_telegram' | 'settings' | 'delete_users'
  >('deposits');

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'zh' | 'ur' | 'ar'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteSearchQuery, setDeleteSearchQuery] = useState('');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [withdrawSearchQuery, setWithdrawSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [newProdCategory, _setNewProdCategory] = useState('Beauty & Skincare');  
  const [currentAdminEmail, setCurrentAdminEmail] = useState('admin@gmail.com');
  const [isMainAdmin, setIsMainAdmin] = useState(true);
  const [subAdminDbId, setSubAdminDbId] = useState('');
  const [subAdminInviteCode, setSubAdminInviteCode] = useState('');
  const [subAdminPermissions, setSubAdminPermissions] = useState<SubAdminPermissions>(defaultSubAdminPermissions);

  const [mainAdminEmail, setMainAdminEmail] = useState('admin@gmail.com');
  const [mainAdminPassword, setMainAdminPassword] = useState('');
  const [depositTrc20, setDepositTrc20] = useState(() => localStorage.getItem('global_trc20') || 'TYA83kNx9XmR2pQz1L7W4sV6B0c9e5F8dH');
  const [mainInviteCode, setMainInviteCode] = useState(() => localStorage.getItem('global_invite') || 'MAIN2026');
  
  const [telegramUrl, setTelegramUrl] = useState('https://t.me');
  const [whatsappUrl, setWhatsappUrl] = useState('https://whatsapp.com');
  
  const [subAdminEditableEmail, setSubAdminEditableEmail] = useState('');
  const [subAdminEditablePassword, setSubAdminEditablePassword] = useState('');
  const [subAdminEditableInviteCode, setSubAdminEditableInviteCode] = useState('');
  const [subAdminEditableTelegram, setSubAdminEditableTelegram] = useState('');
  const [subAdminEditableWhatsapp, setSubAdminEditableWhatsapp] = useState('');
  const [waConnected, setWaConnected] = useState(false);
  const [tgConnected, setTgConnected] = useState(false);
  const [whatsappQrUrl] = useState('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://web.whatsapp.com');
  const [telegramQrUrl] = useState('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://web.telegram.org');

  const [editSubTelegram, setEditSubTelegram] = useState('');
  const [editSubWhatsapp, setEditSubWhatsapp] = useState('');
  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPassword, setNewSubPassword] = useState('');
  const [newSubInviteCode, setNewSubInviteCode] = useState('');

  const [selectedSubAdminForModal, setSelectedSubAdminForModal] = useState<SubAdminUser | null>(null);
  const [editSubEmail, setEditSubEmail] = useState('');
  const [editSubPassword, setEditSubPassword] = useState('');
  const [editSubInviteCode, setEditSubInviteCode] = useState('');
  const [editSubPerms, setEditSubPerms] = useState<SubAdminPermissions>(defaultSubAdminPermissions);

  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerResult, setScannerResult] = useState<any>(null);

const [newProdImageFile, setNewProdImageFile] = useState<File | null>(null);
const [newProdVipLevel, setNewProdVipLevel] = useState('VIP 1');

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

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [qrUploading, setQrUploading] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [editVipLevel, setEditVipLevel] = useState('VIP 0 - Regular');
  const [editWithdrawPass, setEditWithdrawPass] = useState('');
  const [editLoginPass, setEditLoginPass] = useState('');
  const [editTrc20, setEditTrc20] = useState('');
  const [editErc20, setEditErc20] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [disableWithdraw, setDisableWithdraw] = useState(false);
  const [withdrawNotificationMsg, setWithdrawNotificationMsg] = useState('');
 const [, setUserCustomTasks] = useState<any[]>([]);
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
          setSubAdminPermissions({
            ...defaultSubAdminPermissions,
            ...subData.permissions,
          });
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

    if (isMainAdmin) {
      const { data: subList, error: subListError } = await supabase
        .from('sub_admins')
        .select('id, email, invite_code, telegram_url, whatsapp_url, permissions, created_at');

      if (subListError) {
        console.error('Failed to load Sub-Admins:', subListError.message);
      } else if (subList) {
        setSubAdmins(subList);
      }
    }

    const { data: notifList } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
    if (notifList) setNotifications(notifList);

    const {
      data: settingsData,
      error: settingsError,
    } = await supabase
      .from('system_settings')
      .select('id, deposit_trc20_address, main_invite_code, qr_code_url, telegram_url, whatsapp_url')
      .eq('id', 1)
      .maybeSingle();

    if (settingsError) {
      console.error('Failed to load system settings:', settingsError);
    } else if (settingsData) {
      setDepositTrc20(settingsData.deposit_trc20_address ?? '');
      setMainInviteCode(settingsData.main_invite_code ?? '');
      setQrCodeUrl(settingsData.qr_code_url ?? '');
      if (settingsData.deposit_trc20_address) {
        localStorage.setItem('global_trc20', settingsData.deposit_trc20_address);
      } else {
        localStorage.removeItem('global_trc20');
      }

      if (settingsData.main_invite_code) {
        localStorage.setItem('global_invite', settingsData.main_invite_code);
      } else {
        localStorage.removeItem('global_invite');
      }

      if (settingsData.telegram_url !== null) {
        setTelegramUrl(settingsData.telegram_url ?? '');
      }

      if (settingsData.whatsapp_url !== null) {
        setWhatsappUrl(settingsData.whatsapp_url ?? '');
      }
    }

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { checkAdminRoleAndFetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => { checkAdminRoleAndFetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => { checkAdminRoleAndFetchData(); })
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

  if (!isMainAdmin) {
    showToast('Only Main Admin can manually adjust customer balance.', 'error');
    return;
  }

  const val = Number(fundInput);

  if (!Number.isFinite(val) || val <= 0) {
    showToast('Enter a valid amount.', 'error');
    return;
  }

  const isAdd = modalType === 'add_funds';
  const userId = selectedUserForModal.id;

  try {
    // 1. Customer ka current profile fetch karein
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, balance')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentBalance = Number(profile.balance ?? 0);
    const newBal = Number(
      (
        isAdd
          ? currentBalance + val
          : Math.max(0, currentBalance - val)
      ).toFixed(2)
    );

    // 2. Balance update karein profiles table mein
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBal })
      .eq('id', userId)
      .select('id, balance')
      .single();

    if (updateError) throw updateError;

    if (!updatedProfile) {
      throw new Error('Balance update could not be verified.');
    }

    // 3. Agar funds add kiye gaye hain, toh user ke sabhi pending lucky orders ko 'funded' kar dein taake wo unlock ho jayein
    if (isAdd) {
      const { error: fundingError } = await supabase
        .from('custom_tasks')
        .update({
          funding_status: 'funded',
          funded_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('is_active', true)
        .eq('is_lucky_order', true);

      if (fundingError) {
        console.error('Lucky order funding update warning:', fundingError);
      }

      // Optional: Deposits table mein entry record karein
      await supabase.from('deposits').insert([
        {
          user_id: userId,
          amount: val,
          trc20_address: 'ADMIN_MANUAL_ADDITION',
          status: 'approved'
        }
      ]);
    }

    // 4. Local admin UI state update karein
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === updatedProfile.id
          ? { ...customer, balance: Number(updatedProfile.balance) }
          : customer
      )
    );

    setSelectedUserForModal((prev) =>
      prev && prev.id === updatedProfile.id
        ? { ...prev, balance: Number(updatedProfile.balance) }
        : prev
    );

    showToast(
      `$${val.toFixed(2)} ${
        isAdd ? 'added to' : 'deducted from'
      } customer #${selectedUserForModal.custom_id}. Balance: $${Number(
        updatedProfile.balance
      ).toFixed(2)}`
    );

    setModalType(null);
    setFundInput('');
  } catch (err: any) {
    console.error('Manual balance update failed:', err);
    showToast(
      err?.message || 'Could not update customer balance.',
      'error'
    );
  }
};
 
const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']; 

const handleUploadQr = async () => {
  if (!isMainAdmin) {
    showToast('Only Main Admin can upload the QR code.', 'error');
    return;
  }

  // Ensure a file has been selected before accessing its properties.
  if (!qrFile) {
    showToast('Please select a QR image first.', 'error');
    return;
  }

  if (!allowedTypes.includes(qrFile.type)) {
    showToast('Please select a PNG, JPG, or WebP image.', 'error');
    return;
  }

  if (qrFile.size > 2 * 1024 * 1024) {
    showToast('QR image must be 2 MB or smaller.', 'error');
    return;
  }

  setQrUploading(true);

  try {
    const extension =
      qrFile.type === 'image/png'
        ? 'png'
        : qrFile.type === 'image/webp'
          ? 'webp'
          : 'jpg';

    const filePath = `main/payment-qr-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-qr')
      .upload(filePath, qrFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: qrFile.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('payment-qr')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Could not generate QR image URL.');
    }

    setQrCodeUrl(data.publicUrl);
    setQrPreviewUrl(data.publicUrl);

    showToast(
      'QR image uploaded. Now click Save Global System Settings.'
    );
  } catch (err: any) {
    console.error('QR upload failed:', err);

    showToast(
      err?.message || 'QR upload failed.',
      'error'
    );
  } finally {
    setQrUploading(false);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please select a CSV file.', 'error');
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');

      if (lines.length < 2) {
        showToast('CSV file has no product records.', 'error');
        return;
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let value = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && line[i + 1] === '"' && inQuotes) {
            value += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(value.trim());
            value = '';
          } else {
            value += char;
          }
        }
        result.push(value.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map((header) => header.trim().toLowerCase().replace(/^\uFEFF/, ''));
      const nameIndex = headers.indexOf('name');
      const priceIndex = headers.indexOf('price');
      const imageIndex = headers.indexOf('image_url');
      const categoryIndex = headers.indexOf('category');
      const storeIndex = headers.indexOf('store');

      if (nameIndex === -1 || priceIndex === -1 || imageIndex === -1) {
        showToast('CSV needs name, price, and image_url columns.', 'error');
        return;
      }

      const products = lines.slice(1).map((line) => {
        const columns = parseCSVLine(line);
        return {
          name: columns[nameIndex] || '',
          price: Number(columns[priceIndex]),
          image_url: columns[imageIndex] || '',
          category: categoryIndex >= 0 ? columns[categoryIndex] || null : null,
          store: storeIndex >= 0 ? columns[storeIndex] || 'Custom' : 'Custom',
        };
      });

      const { error } = await supabase.from('products').insert(products);
      if (error) throw error;

      showToast(`${products.length} products uploaded successfully!`);
      event.target.value = '';
    } catch (error) {
      showToast('Unable to read the CSV file.', 'error');
    }
  };

  
const handleAddProductSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newProdName.trim() || !newProdPrice ||
      (!newProdImageFile && !newProdImageUrl.trim())) {
    showToast('Enter product name, price and image.', 'error');
    return;
  }

  let imageUrl = newProdImageUrl.trim();
  let imagePath: string | null = null;

    try {
    // CHECK SUPABASE LOGIN SESSION
    
const { data: authData, error: authError } =
  await supabase.auth.getUser();

console.log('Verified Supabase user:', authData.user?.email);
console.log('Auth check error:', authError);

if (
  authError ||
  authData.user?.email?.toLowerCase() !== 'adoochen64@gmail.com'
) {
  showToast(
    'Please log in with the main admin account before uploading images.',
    'error'
  );
  return;
}


console.log('Logged-in email:', authData.user?.email);
    if (newProdImageFile) {
      const file = newProdImageFile;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!allowedTypes.includes(file.type)) {
        showToast('Use JPG, PNG or WEBP images only.', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be 5 MB or smaller.', 'error');
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        showToast('Invalid image extension.', 'error');
        return;
      }

      imagePath = `products/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(imagePath, file, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
  console.error('IMAGE UPLOAD ERROR:', uploadError);
  showToast(
    `Image upload failed: ${uploadError.message}`,
    'error'
  );
  return;
}

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(imagePath);

      imageUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: newProdName.trim(),
        store: newProdStore,
        price: Number(newProdPrice),
        image_url: imageUrl,
        category: newProdCategory,
        vip_level: newProdVipLevel,
        is_active: true,
        image_storage_path: imagePath,
        product_source: newProdImageFile ? 'uploaded' : 'manual',
      }])
      .select()
      .single();

    if (error) throw error;

    if (data) {
      setProductsList(prev => [data, ...prev]);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdImageUrl('');
      setNewProdImageFile(null);
      setNewProdVipLevel('VIP 1');
      showToast('Product added successfully!');
    }
  } catch (err: any) {
    showToast(`Product error: ${err.message}`, 'error');
  }
};

  const handleFetchLiveProductsFromAPI = async () => {
    setIsFetchingLive(true);
    try {
      showToast('AI is generating premium products...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        showToast('Please sign in again.', 'error');
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-product-generator', {
        body: { category: newProdCategory || 'Premium Watches' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.success && Array.isArray(data.products)) {
        setProductsList((prev) => [...data.products, ...prev]);
        showToast(`AI generated products successfully.`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Unable to connect to AI backend.', 'error');
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
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProductsList((prev) => prev.filter((product) => String(product.id) !== String(productId)));
      showToast('Product deleted successfully!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  
const handleOpenUserProfileModal = (user: CustomerProfile) => {
  setSelectedUserForModal(user);
  setEditVipLevel(user.vip_level || 'VIP 0 - Regular');
  setDisableWithdraw(Boolean(user.withdraw_locked));
  setWithdrawNotificationMsg(user.withdraw_message || '');
  setEditTrc20(user.trc20_address || '');
  setEditErc20(user.erc20_address || '');
  setEditBankName(user.bank_name || '');
  setEditBankAccount(user.bank_account_number || '');
  setEditWithdrawPass('');
  setEditLoginPass('');
  setModalType('user_profile_all');
};

const handleSaveAllUserSettings = async () => {
  if (!selectedUserForModal) return;
const payload: Record<string, any> = {
  vip_level: editVipLevel,
  withdraw_locked: disableWithdraw,
  withdraw_message: withdrawNotificationMsg.trim(),
  trc20_address: editTrc20.trim(),
  bank_name: editBankName.trim(),
  account_number: editBankAccount.trim(),
};

  if (editWithdrawPass.trim()) {
    payload.withdraw_password = editWithdrawPass.trim();
  }

  const { data: savedUser, error: saveError } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', selectedUserForModal.id)
    .select('id')
    .maybeSingle();
if (saveError || !savedUser) {
 console.error('Save user settings failed:', {
  message: saveError?.message,
  code: saveError?.code,
  details: saveError?.details,
  hint: saveError?.hint,
  userId: selectedUserForModal.id,
});

  showToast(
    saveError?.message ||
      'Settings save nahi hui. Admin update permission ya database response check karein.',
    'error'
  );

  return;
}

  if (editLoginPass.trim()) {
    const { error: rpcError } = await supabase.rpc(
      'admin_update_user_password',
      {
        target_user_id: selectedUserForModal.id,
        new_password: editLoginPass.trim(),
      }
    );

    if (rpcError) {
      console.error('Login password update failed:', rpcError);
      showToast(
        'Other settings were saved, but the login password update failed.',
        'error'
      );
      return;
    }
  }

  setCustomers((prev) =>
    prev.map((c) =>
      c.id === selectedUserForModal.id
        ? { ...c, ...payload }
        : c
    )
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
const fetchUserCustomTasks = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setUserCustomTasks(data || []);
  } catch (err: any) {
    console.error('Failed to fetch user custom tasks:', err);
    showToast(
      err?.message || 'Could not load user custom tasks.',
      'error'
    );
  }
};

const handleDeleteCustomTask = async (taskId: string) => {
  if (!window.confirm('Are you sure you want to delete this custom task?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('custom_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    setUserCustomTasks((prev: any[]) =>
      prev.filter((task) => String(task.id) !== String(taskId))
    );

    showToast('Custom task deleted successfully.');
  } catch (err: any) {
    console.error('Delete custom task failed:', err);
    showToast(err?.message || 'Could not delete custom task.', 'error');
  }
};

const handleAutoTaskLockToggle = async (
  user: CustomerProfile,
  shouldLock: boolean
) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ auto_task_locked: shouldLock })
      .eq('id', user.id);

    if (error) throw error;

    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === user.id
          ? { ...customer, auto_task_locked: shouldLock }
          : customer
      )
    );

    setSelectedUserForModal((prev) =>
      prev && prev.id === user.id
        ? { ...prev, auto_task_locked: shouldLock }
        : prev
    );

    showToast(
      shouldLock
        ? 'Customer auto tasks locked.'
        : 'Customer auto tasks unlocked.'
    );
  } catch (err: any) {
    console.error('Auto task lock update failed:', err);
    showToast(
      err?.message || 'Could not update auto task lock.',
      'error'
    );
  }
};
const handlePublishLuckyOrderSlot = async () => {
  if (!selectedUserForModal) {
    showToast('Please select a customer first.', 'error');
    return;
  }

  const taskNumber = Number(slotTaskNum);
  const rate = Number(slotCommPercent);
  const minAmount = Number(slotMinAmount);
  const maxAmount = Number(slotMaxAmount);

  if (
    !Number.isInteger(taskNumber) ||
    taskNumber < 1 ||
    taskNumber > 25
  ) {
    showToast('Enter a task number between 1 and 25.', 'error');
    return;
  }

  if (
    !Number.isFinite(rate) ||
    rate <= 0 ||
    rate > 100 ||
    !Number.isFinite(minAmount) ||
    minAmount <= 0
  ) {
    showToast('Please enter a valid commission rate and amount.', 'error');
    return;
  }

  try {
    const userId = selectedUserForModal.id;

    // Minimum aur Maximum amount ke darmian random price calculate karein
    const minVal = minAmount;
    const maxVal = Number.isFinite(maxAmount) && maxAmount >= minAmount ? maxAmount : minAmount;

    // Min aur Max range ke andar random price generate karna (cents/decimals handle karne ke liye)
    const centsMin = Math.ceil(minVal * 100);
    const centsMax = Math.floor(maxVal * 100);
    
    const randomCents = Math.floor(Math.random() * (centsMax - centsMin + 1)) + centsMin;
    const taskAmount = Number((randomCents / 100).toFixed(2));

    const commission = Number((taskAmount * rate / 100).toFixed(2));

    // Is user ke pehle ke sabhi pending lucky orders delete kar dein taaki multiple active orders ka conflict na ho
    await supabase
      .from('custom_tasks')
      .delete()
      .eq('user_id', userId)
      .eq('is_lucky_order', true)
      .eq('status', 'pending');

    // Random calculated taskAmount database mein insert karein
    const { error: insertError } = await supabase
      .from('custom_tasks')
      .insert({
        user_id: userId,
        task_number: taskNumber,
        task_amount: taskAmount,
        min_amount: minVal,
        max_amount: maxVal,
        commission_rate: rate,
        commission,
        locked_price: taskAmount,
        locked_commission: commission,
        vip_level: selectedUserForModal.vip_level || 'VIP 0 - Regular',
        status: 'pending',
        is_active: true,
        is_lucky_order: true,
        funding_status: 'pending'
      });

    if (insertError) throw insertError;

    await fetchUserCustomTasks(userId);

    const { data: refreshedTasks, error: refreshError } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_lucky_order', true)
      .order('task_number', { ascending: true });

    if (refreshError) throw refreshError;

    setCustomTasksList(refreshedTasks || []);
    setSlotTaskNum('');
    setSlotMinAmount('');
    setSlotMaxAmount('');
    setSlotCommPercent('');

    showToast(
      `Lucky Order Slot #${taskNumber} published successfully with generated amount $${taskAmount.toFixed(2)}!`
    );
  } catch (err: any) {
    console.error('Publish Lucky Order Slot failed:', err);
    showToast(
      err?.message || 'Could not publish Lucky Order Slot.',
      'error'
    );
  }
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
      if (status === 'approved') {
        const { data, error } = await supabase.rpc(
          'approve_deposit_and_release',
          { p_deposit_id: deposit.id }
        );

        if (error) throw error;

        if (!data?.success) {
          throw new Error('Deposit approval was not confirmed.');
        }
      } else {
        const { data, error } = await supabase
          .from('deposits')
          .update({ status: 'rejected' })
          .eq('id', deposit.id)
          .eq('status', 'pending')
          .select('id')
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          throw new Error('Deposit already processed or not found.');
        }
      }

      const { data: latestDeposits, error: depositsError } =
        await supabase
          .from('deposits')
          .select('*')
          .order('created_at', { ascending: false });

      if (depositsError) throw depositsError;

      if (latestDeposits) {
        setDeposits(latestDeposits);
      }

      const { data: latestCustomers, error: customersError } =
        await supabase
          .from('profiles')
          .select('*');

      if (customersError) throw customersError;

      if (latestCustomers) {
        setCustomers((prev) =>
          prev.map((customer) => {
            const latest = latestCustomers.find(
              (profile) => profile.id === customer.id
            );

            return latest
              ? { ...customer, ...latest }
              : customer;
          })
        );
      }

      showToast(
        status === 'approved'
          ? 'Deposit approved and balance released successfully!'
          : 'Deposit rejected successfully!'
      );
    } catch (err: any) {
      console.error('Deposit action failed:', err);
      showToast(
        err?.message || 'Could not process deposit.',
        'error'
      );
    }
  };

  const handleCheckTrc20Transfers = async () => {
    setScannerLoading(true);
    setScannerResult(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        throw new Error('Admin session missing. Please log in again.');
      }

      const { data, error } = await supabase.functions.invoke(
        'trc20-deposit-scanner',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        let details = error.message || 'Scanner request failed.';

        try {
          const responseContext = (error as any).context;

          if (responseContext) {
            let body: any = null;

            try {
              body = await responseContext.clone().json();
            } catch {
              const text = await responseContext.clone().text();
              body = { message: text };
            }

            details = [
              body?.message || details,
              body?.upstream_status ? `Upstream status: ${body.upstream_status}` : '',
              body?.upstream_error ? `Details: ${body.upstream_error}` : '',
            ]
              .filter(Boolean)
              .join(' | ');
          }
        } catch {
          // Keep original error
        }

        throw new Error(details);
      }

      setScannerResult(
        data ?? {
          ok: false,
          message: 'No response from scanner.',
        }
      );
    } catch (err: any) {
      setScannerResult({
        ok: false,
        message: err?.message || 'Scanner connection failed.',
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
        setCustomers((prev) => prev.map((c) => (c.id === withdraw.user_id ? { ...c, balance: newBal } : c)));
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
      if (allChats) setChatMessages(allChats);
    } else {
      showToast('Error sending chat reply', 'error');
    }
  };

  const handleSaveSubAdminSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMainAdmin || !subAdminDbId) {
      showToast('Invalid Sub-Admin session.', 'error');
      return;
    }

    try {
      const oldEmail = currentAdminEmail;
      const newEmail = subAdminEditableEmail.trim().toLowerCase();
      const newInvite = subAdminEditableInviteCode.trim().toUpperCase();
      const newTelegram = subAdminEditableTelegram.trim();
      const newWhatsapp = subAdminEditableWhatsapp.trim();

      if (!newEmail) {
        showToast('Email is required.', 'error');
        return;
      }

      const updatePayload: Record<string, string> = {
        email: newEmail,
      };

      if (subAdminPermissions.invitationCode) {
        updatePayload.invite_code = newInvite;
      }

      if (subAdminPermissions.telegram) {
        updatePayload.telegram_url = newTelegram;
      }

      if (subAdminPermissions.whatsapp) {
        updatePayload.whatsapp_url = newWhatsapp;
      }

      const { error } = await supabase
        .from('sub_admins')
        .update(updatePayload)
        .eq('id', subAdminDbId)
        .eq('email', oldEmail);

      if (error) throw error;

      const changesList: string[] = [];

      if (oldEmail !== newEmail) {
        changesList.push('Email updated');
        localStorage.setItem('sub_admin_logged_in', newEmail);
        setCurrentAdminEmail(newEmail);
      }

      if (subAdminPermissions.invitationCode) {
        setSubAdminInviteCode(newInvite);
        setSubAdminEditableInviteCode(newInvite);

        if (newInvite) {
          changesList.push('Invitation code updated');
        }
      }

      if (subAdminPermissions.telegram) {
        changesList.push('Telegram link updated');
      }

      if (subAdminPermissions.whatsapp) {
        changesList.push('WhatsApp link updated');
      }

      if (changesList.length > 0) {
        const { error: notificationError } = await supabase
          .from('admin_notifications')
          .insert({
            sub_admin_email: newEmail,
            message: `Sub-Admin (${oldEmail}): ${changesList.join(', ')}`,
          });

        if (notificationError) {
          console.error('Notification save failed:', notificationError.message);
        }
      }

      showToast('Sub-Admin profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    }
  };

  const handleSaveMainSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isMainAdmin) {
      showToast('Only Main Admin can change global settings.', 'error');
      return;
    }

    try {
      const cleanAddress = depositTrc20.trim();
      const cleanMainInvite = mainInviteCode.trim().toUpperCase();

      if (!cleanAddress) {
        showToast('Please enter your TRC20 address.', 'error');
        return;
      }

      const { data: savedRows, error: saveError } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          key: 'main',
          deposit_trc20_address: cleanAddress,
          main_invite_code: cleanMainInvite,
          qr_code_url: qrCodeUrl.trim(),
          telegram_url: telegramUrl.trim(),
          whatsapp_url: whatsappUrl.trim(),
        })
        .select('id, deposit_trc20_address, main_invite_code, qr_code_url')
        .single();

      if (saveError) {
        console.error('Settings save failed:', saveError);
        throw saveError;
      }

      if (savedRows.deposit_trc20_address !== cleanAddress) {
        throw new Error('Saved TRC20 address does not match the entered address.');
      }

      setDepositTrc20(savedRows.deposit_trc20_address);
      setMainInviteCode(savedRows.main_invite_code ?? '');
      setQrCodeUrl(savedRows.qr_code_url ?? '');
      localStorage.setItem('global_trc20', savedRows.deposit_trc20_address);
      localStorage.setItem('global_invite', savedRows.main_invite_code ?? '');

      showToast('Settings saved and verified in Supabase!');
    } catch (err: any) {
      console.error('Main settings error:', err);
      showToast(err.message || 'Failed to save settings.', 'error');
    }
  };

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMainAdmin) return;
    try {
      const updatePayload: { email?: string; password?: string; } = {};
      if (mainAdminEmail && mainAdminEmail !== currentAdminEmail) updatePayload.email = mainAdminEmail.trim().toLowerCase();
      if (mainAdminPassword) updatePayload.password = mainAdminPassword;

      const { error } = await supabase.auth.updateUser(updatePayload);
      if (error) throw error;

      showToast('Admin credentials updated successfully!');
      setMainAdminPassword('');
    } catch (err: any) {
      showToast(err.message || 'Error updating credentials', 'error');
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMainAdmin) return;
    if (!newSubEmail.trim() || !newSubPassword.trim() || !newSubInviteCode.trim()) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      const permissions: SubAdminPermissions = {
        users: true,
        deposits: true,
        withdrawals: true,
        support: true,
        tasks: false,
        products: false,
        invitationCode: true,
        telegram: true,
        whatsapp: true
      };

      const { data: insertedData, error } = await supabase
        .from('sub_admins')
        .insert([{
          email: newSubEmail.trim().toLowerCase(),
          password: newSubPassword.trim(),
          invite_code: newSubInviteCode.trim().toUpperCase(),
          permissions,
        }])
        .select()
        .single();

      if (error) throw error;
      if (insertedData) setSubAdmins((prev) => [...prev, insertedData]);

      setNewSubEmail('');
      setNewSubPassword('');
      setNewSubInviteCode('');
      showToast('Sub-Admin created successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error creating Sub-Admin', 'error');
    }
  };

  const handleDeleteSubAdmin = async (subId: string) => {
    if (!isMainAdmin) return;
    if (!window.confirm('Delete this sub-admin?')) return;
    try {
      const { error } = await supabase.from('sub_admins').delete().eq('id', subId);
      if (error) throw error;
      setSubAdmins((prev) => prev.filter((s) => s.id !== subId));
      showToast('Sub-Admin deleted successfully!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleSaveSubAdminSettings = async () => {
    if (!isMainAdmin || !selectedSubAdminForModal) return;

    try {
      const payload: any = {
        permissions: editSubPerms,
      };

      if (editSubEmail.trim()) {
        payload.email = editSubEmail.trim().toLowerCase();
      }

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

      showToast('Sub-Admin settings updated!');
      setSelectedSubAdminForModal(null);
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
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
    const ownCode = c.user_invite_code || c.invite_code || c.invitation_code || '';
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

  const handleStatusChange = async (
    customer: CustomerProfile,
    shouldFreeze: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_frozen: shouldFreeze })
        .eq('id', customer.id);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, is_frozen: shouldFreeze }
            : c
        )
      );

      showToast(
        shouldFreeze
          ? 'Customer account frozen successfully.'
          : 'Customer account activated successfully.'
      );
    } catch (err: any) {
      console.error('Customer status update failed:', err);
      showToast(
        err?.message || 'Could not update customer status.',
        'error'
      );
    }
  };

const handleResetUserTasks = async (customer: CustomerProfile) => {
  const confirmed = window.confirm(
    `Reset task progress for customer #${customer.custom_id}?`
  );

  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        completed_tasks: 0,
        running_tasks: 0,
        pending_task: null
      })
      .eq('id', customer.id);

    if (error) throw error;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              completed_tasks: 0,
              running_tasks: 0,
              pending_task: null
            }
          : c
      )
    );

    setSelectedUserForModal((prev) =>
      prev && prev.id === customer.id
        ? {
            ...prev,
            completed_tasks: 0,
            running_tasks: 0,
            pending_task: null
          }
        : prev
    );

    showToast('Customer task progress reset successfully.');
  } catch (err: any) {
    console.error('Reset customer tasks failed:', err);
    showToast(
      err?.message || 'Could not reset customer task progress.',
      'error'
    );
  }
};

const handleDeleteCustomer = async (customer: CustomerProfile) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete customer #${customer.custom_id}? This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', customer.id);

    if (error) throw error;

    setCustomers((prev) =>
      prev.filter((c) => c.id !== customer.id)
    );

    setSelectedUserForModal((prev) =>
      prev?.id === customer.id ? null : prev
    );

    showToast('Customer profile deleted successfully.');
  } catch (err: any) {
    console.error('Delete customer failed:', err);
    showToast(
      err?.message || 'Could not delete customer profile.',
      'error'
    );
  }
};

  const filterByUniversalQuery = (c: CustomerProfile, q: string) => {
    if (!q || !q.trim()) return true;
    const cleanQ = q.toLowerCase().trim().replace('#', '');

    if (/^\d+$/.test(cleanQ)) {
      return c.custom_id === Number(cleanQ);
    }

    const nameStr = (c.full_name || c.username || c.name || c.display_name || '').toLowerCase();
    const emailStr = (c.email || '').toLowerCase();
    const phoneStr = (c.phone || '').toLowerCase();

    return nameStr.includes(cleanQ) || emailStr.includes(cleanQ) || phoneStr.includes(cleanQ);
  };

  const isCustomerOfSubAdmin = (c: CustomerProfile, subCode: string) => {
    if (isMainAdmin) return true;
    if (subAdminDbId && c.sub_admin_id === subAdminDbId) return true;
    if (!subCode || subCode.trim() === '') return false;
    const targetSubCode = subCode.toString().trim().toUpperCase();
    const usedCode = getUserRegistrationInviCode(c);
    const ownCode = getUserOwnDashboardInviCode(c);
    return usedCode === targetSubCode || ownCode === targetSubCode;
  };

  const visibleCustomers = isMainAdmin ? customers : customers.filter((c) => isCustomerOfSubAdmin(c, subAdminInviteCode));
  const filteredCustomers = visibleCustomers.filter((c) => filterByUniversalQuery(c, searchQuery));
  const filteredDeleteCustomers = visibleCustomers.filter((c) => filterByUniversalQuery(c, deleteSearchQuery));
  const filteredTaskCustomers = visibleCustomers.filter((c) => filterByUniversalQuery(c, taskSearchQuery));

  const filteredDeposits = deposits.filter((d) => {
    if (!isMainAdmin) {
      const cust = customers.find((c) => c.id === d.user_id);
      if (!cust || !isCustomerOfSubAdmin(cust, subAdminInviteCode)) return false;
    }
    if (!depositSearchQuery || !depositSearchQuery.trim()) return true;
    const q = depositSearchQuery.toLowerCase().trim().replace('#', '');
    const custDetails = getCustomerDetailsByUserId(d.user_id);
    if (/^\d+$/.test(q)) {
      return custDetails.customId.replace('#', '') === q;
    }
    return custDetails.customId.toLowerCase().includes(q) || custDetails.name.toLowerCase().includes(q);
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!isMainAdmin) {
      const cust = customers.find(c => c.id === w.user_id);
      if (!cust || !isCustomerOfSubAdmin(cust, subAdminInviteCode)) return false;
    }
    if (!withdrawSearchQuery || !withdrawSearchQuery.trim()) return true;
    const q = withdrawSearchQuery.toLowerCase().trim().replace('#', '');
    const custDetails = getCustomerDetailsByUserId(w.user_id);
    if (/^\d+$/.test(q)) {
      return custDetails.customId.replace('#', '') === q;
    }
    return custDetails.customId.toLowerCase().includes(q) || custDetails.name.toLowerCase().includes(q);
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
    return filterByUniversalQuery(cust, searchQuery);
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
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'users' && !isFullPageTaskSettings ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'}`}
              >
                <span>👥</span><span>Users</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.deposits) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('deposits'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'}`}
              >
                <span>📥</span><span>Deposit Records</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.withdrawals) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('withdrawals'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'}`}
              >
                <span>📤</span><span>Withdrawal Requests</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.tasks) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('tasks'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'tasks' || isFullPageTaskSettings ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'}`}
              >
                <span>⚡</span><span>Task Management</span>
              </button>
            )}

            {isMainAdmin && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('products'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'}`}
              >
                <span>🛍️</span><span>Products Management</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.support) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('support'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'support' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'}`}
              >
                <span>🎧</span><span>Live Support & Chat</span>
              </button>
            )}

            {(isMainAdmin || subAdminPermissions.telegram || subAdminPermissions.whatsapp) && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('whatsapp_telegram'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'whatsapp_telegram' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-200 hover:bg-blue-800'}`}
              >
                <span>📱</span><span>WhatsApp & Telegram</span>
              </button>
            )}

            <button
              onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('settings'); }}
              className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800'}`}
            >
              <span>🛠️</span><span>Settings</span>
            </button>

            {isMainAdmin && (
              <button
                onClick={() => { setIsFullPageTaskSettings(false); setActiveTab('delete_users'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-2 transition ${activeTab === 'delete_users' ? 'bg-red-600 text-white shadow-lg' : 'text-red-200 hover:bg-red-900/50'}`}
              >
                <span>🗑️</span><span>Delete Customers</span>
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
            <span>🚪</span><span>Logout Portal</span>
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
          <div className={`p-3.5 mb-4 text-xs font-bold rounded-2xl shadow border ${message.type === 'error' ? 'bg-red-100 border-red-400 text-red-800' : 'bg-emerald-100 border-emerald-400 text-emerald-800'}`}>
            {message.text}
          </div>
        )}

        {/* FULL PAGE TASK SETTINGS VIEW */}
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
              onClick={handlePublishLuckyOrderSlot}
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
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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

        {/* TAB 1: USERS */}
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
                  placeholder="Search by ID, Name, Phone..."
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
                        <div className="text-xs font-bold text-slate-700 mt-0.5">👤 {c.full_name || c.username || c.name || 'No Name'}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">{renderSimpleInvitationCodes(c)}</td>
                      <td className="p-3">
                        <div className="text-slate-700 font-semibold">{c.email || 'customer@appuser.local'}</div>
                        <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 font-bold rounded text-[9px] mt-0.5 inline-block">
                          {c.vip_level || 'VIP 0 - Regular'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-900 text-sm">{c.completed_tasks} / 25</td>
                      <td className="p-3 font-mono">
                        <div className="font-black text-emerald-600 text-sm">${c.balance.toFixed(2)}</div>
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
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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
                            className="px-2.5 py-1.5 bg-amber-500 text-white font-bold text-[10px] rounded-lg shadow hover:bg-amber-600"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => handleOpenFullPageTaskSettings(c)}
                            className="px-2.5 py-1.5 bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-indigo-700"
                          >
                            Settings
                          </button>
                          <button
                            onClick={() => handleOpenUserProfileModal(c)}
                            className="px-2.5 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-blue-700"
                          >
                            Profile
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
            <div className="flex justify-between items-center border-b pb-3 gap-4">
              <h2 className="text-lg font-black text-blue-900">Deposit Records & Approvals</h2>
              <div className="w-80 max-w-full">
                <input
                  type="text"
                  placeholder="Search by ID, Name, Phone or TRC20..."
                  value={depositSearchQuery}
                  onChange={(e) => setDepositSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCheckTrc20Transfers}
                  disabled={scannerLoading}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {scannerLoading ? 'Checking...' : 'Check Confirmed Transfers'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    showToast('Confirm Funds will be enabled after secure payment matching is implemented.', 'error');
                  }}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                >
                  Confirm Funds
                </button>
              </div>

              {scannerResult && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs">
                  {JSON.stringify(scannerResult, null, 2)}
                </pre>
              )}
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
                          <div className="text-[10px] text-slate-500">📞 {custDetails.phone}</div>
                        </td>
                        <td className="p-3 font-mono font-black text-emerald-600 text-sm">${dep.amount} USDT</td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">{dep.trc20_address || 'Not provided'}</td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">{new Date(dep.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${dep.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : dep.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {dep.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {dep.status === 'pending' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleDepositAction(dep, 'approved')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl shadow transition"
                              >
                                Approve (+Auto Add & Release Lock)
                              </button>
                              <button
                                onClick={() => handleDepositAction(dep, 'rejected')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-xl shadow transition"
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
              <h2 className="text-lg font-black text-blue-900">Withdrawal Requests</h2>
              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search withdrawals..."
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
                    <th className="p-3">TRC20 Wallet Address</th>
                    <th className="p-3">Date & Time</th>
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
                        </td>
                        <td className="p-3 font-mono font-black text-blue-700 text-sm">${wit.amount} USDT</td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">{wit.trc20_address || 'Wallet'}</td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">{new Date(wit.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${wit.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : wit.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
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
              <h2 className="text-lg font-black text-blue-900">Task Management & User Overview</h2>
              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search tasks..."
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
                      </td>
                      <td className="p-3 whitespace-nowrap">{renderSimpleInvitationCodes(c)}</td>
                      <td className="p-3 font-mono font-black text-red-600">
                        {c.running_tasks && c.running_tasks < 0 ? `$${Math.abs(c.running_tasks).toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="p-3 font-bold text-amber-700">{c.vip_level || 'VIP 0'}</td>
                      <td className="p-3 font-mono font-bold text-blue-900 text-sm">{c.completed_tasks} / 25</td>
                      <td className="p-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(c.auto_task_lock)}
                            onChange={(e) => handleAutoTaskLockToggle(c, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenFullPageTaskSettings(c)}
                          className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-indigo-700 ml-auto"
                        >
                          Settings
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PRODUCTS MANAGEMENT */}
        {!isFullPageTaskSettings && activeTab === 'products' && isMainAdmin && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-black flex items-center gap-2">
                  <span>⚡</span> Auto-Import E-Commerce Products
                </h2>
                <p className="text-xs text-blue-200">Import sample catalogue products from AI.</p>
              </div>

              <button
                onClick={handleFetchLiveProductsFromAPI}
                disabled={isFetchingLive}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs rounded-2xl shadow-lg transition uppercase tracking-wider disabled:opacity-50"
              >
                {isFetchingLive ? 'Fetching...' : '📥 Fetch Products'}
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-black text-blue-900">📁 Upload Products via CSV</h2>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-black text-blue-900">🛍️ Add Single Product Manually</h2>
              <form onSubmit={handleAddProductSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Store</label>
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
                  <label className="font-bold text-slate-600 block mb-1">Price ($)</label>
                  <input
                    type="number"
                    placeholder="185"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                  
<div>
  <label className="font-bold text-slate-600 block mb-1">
    Upload Product Image
  </label>
  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={(e) =>
      setNewProdImageFile(e.target.files?.[0] || null)
    }
    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
  />
</div>

<div>
  <label className="font-bold text-slate-600 block mb-1">
    VIP Level
  </label>
  <select
    value={newProdVipLevel}
    onChange={(e) => setNewProdVipLevel(e.target.value)}
    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
  >
    <option value="VIP 1">VIP 1</option>
    <option value="VIP 2">VIP 2</option>
    <option value="VIP 3">VIP 3</option>
  </select>
</div>

                </div>
                <div className="md:col-span-4 pt-2">
                  <button type="submit" className="w-full py-3 bg-blue-900 text-white font-black text-xs rounded-xl shadow">
                    + Add Product to Database
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-black text-blue-900">Manage Existing Products</h3>
                  <p className="text-xs text-slate-500">Total: <span className="font-bold text-blue-700">{productsList.length}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteAllProducts}
                    className="px-4 py-2 bg-red-600 text-white font-black text-xs rounded-xl shadow"
                  >
                    🗑️ Delete All
                  </button>
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-64 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1e3a8a] text-white font-bold">
                      <th className="p-3">Image</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Store</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-300" />
                        </td>
                        <td className="p-3 font-bold text-slate-800">{p.name}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">{p.store}</span></td>
                        <td className="p-3 font-mono font-black text-emerald-600">${Number(p.price).toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteProduct(p.id)} className="px-3 py-1.5 bg-red-600 text-white font-bold text-[10px] rounded-lg shadow">
                            🗑️ Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: LIVE SUPPORT & CHAT */}
        {!isFullPageTaskSettings && activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-3 h-[420px]">
              <div className="border-r border-slate-200 bg-slate-50 p-3 space-y-2 overflow-y-auto">
                <h4 className="font-bold text-xs text-slate-700">Customer Inbox</h4>
                {filteredChatUsers.map((uId) => {
                  const custDetails = getCustomerDetailsByUserId(uId);
                  return (
                    <button
                      key={uId}
                      onClick={() => setActiveChatUserId(uId)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between ${activeChatUserId === uId ? 'bg-blue-900 text-white' : 'bg-white text-slate-800 border'}`}
                    >
                      <span className="font-mono">{custDetails.customId} - {custDetails.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="col-span-2 flex flex-col justify-between p-4 bg-white">
                <div className="border-b pb-2 font-bold text-xs text-blue-900">
                  Live Chat: <span className="font-mono text-blue-700">{activeChatUserId ? getCustomerDetailsByUserId(activeChatUserId).customId : 'Select user'}</span>
                </div>

                <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 text-xs">
                  {activeUserChatHistory.map((m) => (
                    <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-2.5 rounded-xl ${m.is_admin ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-800 border'}`}>
                        <p>{m.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendAdminReply} className="flex gap-2 border-t pt-2">
                  <input
                    type="text"
                    placeholder="Type reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                  <button type="submit" className="px-5 py-2 bg-blue-900 text-white font-black text-xs rounded-xl">Send</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: WHATSAPP & TELEGRAM */}
        {!isFullPageTaskSettings && activeTab === 'whatsapp_telegram' && isMainAdmin && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                <h3 className="text-base font-extrabold text-emerald-800 border-b pb-2">🟢 WhatsApp QR</h3>
                <div className="flex flex-col items-center justify-center my-4 space-y-2">
                  <img src={whatsappQrUrl} alt="WhatsApp QR" className="w-40 h-40 rounded-xl border p-2" />
                  <button onClick={() => { setWaConnected(true); showToast('WhatsApp connected!'); }} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow">
                    {waConnected ? 'Connected ✓' : 'Connect WhatsApp'}
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                <h3 className="text-base font-extrabold text-blue-800 border-b pb-2">🔵 Telegram QR</h3>
                <div className="flex flex-col items-center justify-center my-4 space-y-2">
                  <img src={telegramQrUrl} alt="Telegram QR" className="w-40 h-40 rounded-xl border p-2" />
                  <button onClick={() => { setTgConnected(true); showToast('Telegram connected!'); }} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow">
                    {tgConnected ? 'Connected ✓' : 'Connect Telegram'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: ADMIN SETTINGS & SUB-ADMIN NOTIFICATIONS */}
        {!isFullPageTaskSettings && activeTab === 'settings' && (
          <div className="space-y-6">

            {!isMainAdmin && (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">
                  🛠️ Sub-Admin Profile Settings
                </h3>

                <form onSubmit={handleSaveSubAdminSelfProfile} className="space-y-3 text-xs">

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={subAdminEditableEmail}
                      onChange={(e) => setSubAdminEditableEmail(e.target.value)}
                      className="w-full bg-slate-50 border rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={subAdminEditablePassword}
                      onChange={(e) => setSubAdminEditablePassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-50 border rounded-xl p-2.5"
                    />
                  </div>

                  {subAdminPermissions.invitationCode && (
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">
                        Your Invitation Code
                      </label>
                      <input
                        type="text"
                        value={subAdminEditableInviteCode}
                        onChange={(e) => setSubAdminEditableInviteCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border rounded-xl p-2.5 font-bold uppercase"
                      />
                    </div>
                  )}

                  {subAdminPermissions.telegram && (
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">
                        Your Telegram Link
                      </label>
                      <input
                        type="url"
                        value={subAdminEditableTelegram}
                        onChange={(e) => setSubAdminEditableTelegram(e.target.value)}
                        placeholder="https://t.me/your_username"
                        className="w-full bg-slate-50 border rounded-xl p-2.5"
                      />
                    </div>
                  )}

                  {subAdminPermissions.whatsapp && (
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">
                        Your WhatsApp Link
                      </label>
                      <input
                        type="url"
                        value={subAdminEditableWhatsapp}
                        onChange={(e) => setSubAdminEditableWhatsapp(e.target.value)}
                        placeholder="https://wa.me/..."
                        className="w-full bg-slate-50 border rounded-xl p-2.5"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-900 text-white font-black text-xs rounded-xl shadow"
                  >
                    Save Changes
                  </button>

                </form>
              </div>
            )}

            {isMainAdmin && (
              <div className="space-y-6">
                {/* NOTIFICATIONS DROPDOWN / ACCORDION UI */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-200 space-y-3">
                  <div 
                    onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                    className="flex items-center justify-between cursor-pointer border-b pb-3 select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔔</span>
                      <h3 className="text-base font-extrabold text-blue-900">
                        Sub-Admin Activity Notifications (Real-Time Log)
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-mono font-bold">
                        {notifications.length} Logs
                      </span>
                      <span className="text-blue-900 font-bold text-sm">
                        {showNotificationsDropdown ? '▲ Hide' : '▼ View Logs'}
                      </span>
                    </div>
                  </div>

                  {showNotificationsDropdown && (
                    <div className="max-h-60 overflow-y-auto space-y-2.5 pt-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-3 text-center">No recent changes recorded from Sub-Admins.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs flex justify-between items-center shadow-sm">
                            <span className="font-bold text-blue-950">{notif.message}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(notif.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GLOBAL SYSTEM SETTINGS & LIVE INVITATION CODE */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">👑 Main System & Global Settings</h3>
                    <form onSubmit={handleSaveMainSettings} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Global Deposit TRC20 Address</label>
                        <input type="text" value={depositTrc20} onChange={(e) => setDepositTrc20(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-blue-900 font-bold" />
                      </div>
                      <div>
                      
                      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl">
                            ▦
                          </div>
                          <div>
                            <h4 className="font-extrabold text-indigo-950">
                              TRC20 Payment QR Code
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              Upload the QR shown on the customer Deposit page.
                            </p>
                          </div>
                        </div>

                        {(qrPreviewUrl || qrCodeUrl) && (
                          <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-3">
                            <img
                              src={qrPreviewUrl || qrCodeUrl}
                              alt="TRC20 payment QR preview"
                              className="h-40 w-40 object-contain"
                            />
                          </div>
                        )}

                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-300 bg-white p-5 text-center hover:bg-indigo-50 transition">
                          <span className="text-2xl mb-2">☁️</span>
                          <span className="text-xs font-extrabold text-indigo-900">
                            Choose QR Image
                          </span>
                          <span className="mt-1 text-[10px] text-slate-500">
                            PNG, JPG or WebP · Maximum 2 MB
                          </span>

                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              const allowedTypes = [
                                'image/png',
                                'image/jpeg',
                                'image/webp',
                              ];

                              if (!allowedTypes.includes(file.type)) {
                                showToast('Please choose a PNG, JPG, or WebP image.', 'error');
                                e.currentTarget.value = '';
                                return;
                              }

                              if (file.size > 2 * 1024 * 1024) {
                                showToast('Image must be 2 MB or smaller.', 'error');
                                e.currentTarget.value = '';
                                return;
                              }

                              setQrFile(file);

                              const previewUrl = URL.createObjectURL(file);
                              setQrPreviewUrl(previewUrl);
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          disabled={!qrFile || qrUploading}
                          onClick={handleUploadQr}
                          className="w-full rounded-xl bg-indigo-700 py-3 text-xs font-black text-white shadow-lg transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {qrUploading ? 'Uploading QR...' : '↑ Upload QR Image'}
                        </button>
                      </div>

                      <label className="font-bold text-slate-600 block mb-1 mt-3">Main Invitation Code (Live Database Sync)</label>
                        <input 
                          type="text" 
                          value={mainInviteCode} 
                          onChange={(e) => setMainInviteCode(e.target.value)} 
                          className="w-full bg-slate-50 border-2 border-emerald-500 rounded-xl p-2.5 font-bold uppercase text-emerald-900" 
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Users registering with this code will connect to the main system instantly.</p>
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

                  {/* MAIN ADMIN CREDENTIALS */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">🔑 Main Admin Credentials</h3>
                    <form onSubmit={handleUpdateAdminCredentials} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Main Admin Email</label>
                        <input type="email" value={mainAdminEmail} onChange={(e) => setMainAdminEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">New Password</label>
                        <input type="password" placeholder="Enter new password" value={mainAdminPassword} onChange={(e) => setMainAdminPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-indigo-900 text-white font-black text-xs rounded-xl shadow mt-6">Update Credentials</button>
                    </form>
                  </div>
                </div>

                {/* SUB-ADMIN CREATION & PERMISSIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* EXISTING SUB-ADMINS LIST */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">📋 Existing Sub-Admins & Access Control</h3>
                    <div className="overflow-y-auto max-h-[350px] space-y-2.5">
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
                                  setEditSubPerms({
                                    users: sub.permissions?.users ?? true,
                                    deposits: sub.permissions?.deposits ?? true,
                                    withdrawals: sub.permissions?.withdrawals ?? true,
                                    tasks: sub.permissions?.tasks ?? false,
                                    support: sub.permissions?.support ?? true,
                                    products: sub.permissions?.products ?? false,
                                    invitationCode: sub.permissions?.invitationCode ?? true,
                                    telegram: sub.permissions?.telegram ?? true,
                                    whatsapp: sub.permissions?.whatsapp ?? true,
                                  });
                                }}
                                className="px-3 py-1.5 bg-blue-900 text-white font-black text-[10px] rounded-xl shadow hover:bg-blue-800 transition"
                              >
                                ⚙️ Settings
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

        {/* TAB 9: DELETE CUSTOMERS PANEL */}
        {!isFullPageTaskSettings && activeTab === 'delete_users' && isMainAdmin && (
          <div className="bg-white rounded-3xl shadow-xl border border-red-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-red-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-red-700 flex items-center gap-2">
                  <span>🗑️</span> Customer Deletion Management
                </h2>
                <p className="text-xs text-slate-500 font-medium">Permanently delete customer accounts.</p>
              </div>

              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search to delete..."
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
                      </td>
                      <td className="p-3 whitespace-nowrap">{renderSimpleInvitationCodes(c)}</td>
                      <td className="p-3 text-slate-700 font-semibold">{c.email || 'customer@appuser.local'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">${c.balance.toFixed(2)}</td>
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
                className={`flex-1 py-2.5 text-white font-black text-xs rounded-xl shadow ${modalType === 'add_funds' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
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
                  <input 
                    type="text" 
                    placeholder="New Login Password" 
                    value={editLoginPass} 
                    onChange={(e) => setEditLoginPass(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs" 
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Withdraw Password</label>
                  <input 
                    type="text" 
                    placeholder="New Withdraw Password" 
                    value={editWithdrawPass} 
                    onChange={(e) => setEditWithdrawPass(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs" 
                  />
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
                    <label className="font-bold text-slate-700 block mb-1">Notification Message</label>
                    <textarea rows={2} placeholder="Message displayed on withdraw..." value={withdrawNotificationMsg} onChange={(e) => setWithdrawNotificationMsg(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs" />
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

      {/* MODAL 3: SUB-ADMIN SETTINGS */}
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
                <label className="font-bold text-slate-600 block mb-1">Sub-Admin Email</label>
                <input type="email" value={editSubEmail} onChange={(e) => setEditSubEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-blue-900" />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Update Invitation Code</label>
                <input type="text" value={editSubInviteCode} onChange={(e) => setEditSubInviteCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold uppercase" />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-blue-900 block uppercase text-[10px]">Sub-Admin Permissions:</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.users} onChange={(e) => setEditSubPerms({ ...editSubPerms, users: e.target.checked })} />
                    <span>Users</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.deposits} onChange={(e) => setEditSubPerms({ ...editSubPerms, deposits: e.target.checked })} />
                    <span>Deposit Records</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.withdrawals} onChange={(e) => setEditSubPerms({ ...editSubPerms, withdrawals: e.target.checked })} />
                    <span>Withdrawals</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.tasks} onChange={(e) => setEditSubPerms({ ...editSubPerms, tasks: e.target.checked })} />
                    <span>Task Management</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.support} onChange={(e) => setEditSubPerms({ ...editSubPerms, support: e.target.checked })} />
                    <span>Live Support</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.products} onChange={(e) => setEditSubPerms({ ...editSubPerms, products: e.target.checked })} />
                    <span>Products</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.invitationCode} onChange={(e) => setEditSubPerms({ ...editSubPerms, invitationCode: e.target.checked })} />
                    <span>Invitation Code</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.telegram} onChange={(e) => setEditSubPerms({ ...editSubPerms, telegram: e.target.checked })} />
                    <span>Telegram Link</span>
                  </label>
                  <label className="flex items-center space-x-2 font-bold text-slate-700">
                    <input type="checkbox" checked={editSubPerms.whatsapp} onChange={(e) => setEditSubPerms({ ...editSubPerms, whatsapp: e.target.checked })} />
                    <span>WhatsApp Link</span>
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