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
  auto_lucky_order_enabled?: boolean;
  manual_task_lock?: boolean;
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
  payment_method?: string | null;
  txid?: string | null;
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
  vip_level?: string;
  rotation_batch?: number | null;
   rating?: number;
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
  is_read: boolean;
}
interface SubAdminCredentialRequest {
  id: string;
  sub_admin_id: string;
  sub_admin_email?: string;
  request_type: 'email' | 'password';
  requested_email: string | null;
  status: 'pending' | 'verified' | 'completed' | 'rejected' | 'expired';
  expires_at: string | null;
  verified_at: string | null;
  created_at: string;
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
  const [_newProdCategory] = useState('Beauty & Skincare');  
  const [currentAdminEmail, setCurrentAdminEmail] = useState('admin@gmail.com');
  const [isMainAdmin, setIsMainAdmin] = useState(true);
  const [subAdminDbId, setSubAdminDbId] = useState('');
  const [subAdminInviteCode, setSubAdminInviteCode] = useState('');
  const [subAdminPermissions, setSubAdminPermissions] = useState<SubAdminPermissions>(defaultSubAdminPermissions);

  const [mainAdminEmail, setMainAdminEmail] = useState('admin@gmail.com');
  const [mainAdminPassword, setMainAdminPassword] = useState('');
  const [depositTrc20, setDepositTrc20] = useState(() => localStorage.getItem('global_trc20') || 'TYA83kNx9XmR2pQz1L7W4sV6B0c9e5F8dH');
  const [mainInviteCode, setMainInviteCode] = useState(() => localStorage.getItem('global_invite') || 'MAIN2026');
  const [reportCustomerId, setReportCustomerId] = useState<string>('');

  const [reportStartDate, setReportStartDate] = useState('');
const [reportEndDate, setReportEndDate] = useState('');
const [reportCategory, setReportCategory] = useState('all');
const [reportTasks, setReportTasks] = useState<any[]>([]);
const [reportLoading, setReportLoading] = useState(false);
const [reportError, setReportError] = useState('');
  
const [telegramUrl, setTelegramUrl] = useState('https://t.me');
  const [whatsappUrl, setWhatsappUrl] = useState('https://whatsapp.com');
  
  const [subAdminEditableEmail, setSubAdminEditableEmail] = useState('');
  const [subAdminEditablePassword, setSubAdminEditablePassword] = useState('');
  const [subAdminEditableInviteCode, setSubAdminEditableInviteCode] = useState('');
  const [subAdminEditableTelegram, setSubAdminEditableTelegram] = useState('');
  const [subAdminEditableWhatsapp, setSubAdminEditableWhatsapp] = useState('');

  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [credentialRequests, setCredentialRequests] =
  useState<SubAdminCredentialRequest[]>([]);

const [credentialRequestsLoading, setCredentialRequestsLoading] =
  useState(false);

const [credentialRequestMessage, setCredentialRequestMessage] =
  useState('');

const [generatedVerificationCodes, setGeneratedVerificationCodes] =
  useState<Record<string, string>>({});

const [verificationCodeInputs, setVerificationCodeInputs] =
  useState<Record<string, string>>({});



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
const [batchManagerSelectedBatch, setBatchManagerSelectedBatch] =
  useState<number | 'all' | 'unassigned'>('all');

const [batchManagerEditingProduct, setBatchManagerEditingProduct] =
  useState<ProductItem | null>(null);

const [batchManagerEditName, setBatchManagerEditName] = useState('');
const [batchManagerEditStore, setBatchManagerEditStore] =
  useState<'Amazon' | 'AliExpress' | 'Shopify'>('Amazon');
const [batchManagerEditPrice, setBatchManagerEditPrice] = useState('');
const [batchManagerEditImage, setBatchManagerEditImage] = useState('');
const [batchManagerEditRating, setBatchManagerEditRating] = useState('5');
const [batchManagerEditVip, setBatchManagerEditVip] = useState('VIP 1');
const [batchManagerSaving, setBatchManagerSaving] = useState(false);

  const [newProdImageFile, setNewProdImageFile] = useState<File | null>(null);
  const [newProdVipLevel, setNewProdVipLevel] = useState('VIP 1');
  const [newProdRating, setNewProdRating] = useState('5');
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
 
 
 
type LuckyOrderProduct = {
  id: number;
  name: string;
  store: string;
  price: number;
  image_url: string | null;
  rating: number;
  marketing_level: string;
  commission_label: string;
  is_active: boolean;
  created_at?: string;
in_lucky_gallery?: boolean;
};

const [luckyOrderProducts, setLuckyOrderProducts] =
  useState<LuckyOrderProduct[]>([]);

const fetchLuckyOrderProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('lucky_order_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load Lucky Order products:', error);
      showToast(`Lucky Order products load failed: ${error.message}`, 'error');
      return;
    }

    setLuckyOrderProducts(data || []);
  } catch (err: any) {
    console.error('Lucky Order products fetch error:', err);
    showToast(
      err?.message || 'Unable to load Lucky Order products.',
      'error'
    );
  }
};
const [luckyProductsGalleryOpen, setLuckyProductsGalleryOpen] =
  useState(false);
const [luckyOrderOpen, setLuckyOrderOpen] = useState(false);
const [luckyOrderLoading] = useState(false);
const [luckyOrderSaving, setLuckyOrderSaving] = useState(false);
const [luckyOrderEditingId, setLuckyOrderEditingId] =
  useState<number | null>(null);

const [luckyOrderName, setLuckyOrderName] = useState('');
const [luckyOrderStore, setLuckyOrderStore] = useState('Amazon');
const [luckyOrderPrice, setLuckyOrderPrice] = useState('');
const [luckyOrderImageUrl, setLuckyOrderImageUrl] = useState('');
const [luckyOrderImageFile, setLuckyOrderImageFile] =
  useState<File | null>(null);
const [luckyOrderRating, setLuckyOrderRating] = useState('5');
const [luckyOrderMarketingLevel, setLuckyOrderMarketingLevel] =
  useState('Regular');

const [luckyOrderSearch, setLuckyOrderSearch] = useState('');

 
 
 
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
  const [, setQrPreviewUrl] = useState('');
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
  { id: 1, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
  { id: 2, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
  { id: 3, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
  { id: 4, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
  { id: 5, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
]);

const [, setAutoSlotsEnabled] = useState(false);
const [autoSlotsSaving, setAutoSlotsSaving] = useState(false);

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
    await fetchAdminData();
  } else {
    setIsMainAdmin(false);
    setCurrentAdminEmail(subAdminEmail || 'subadmin@platform.com');
    setSubAdminEditableEmail(subAdminEmail || '');

    const { data: subData, error: subError } = await supabase
      .from('sub_admins')
      .select('*')
      .eq('email', subAdminEmail)
      .maybeSingle();

    if (subError) {
      console.error('Failed to load sub-admin:', subError);
    }

    if (subData) {
      setSubAdminDbId(subData.id);

      const cleanCode = (subData.invite_code || '')
        .toString()
        .trim()
        .toUpperCase();

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
    }

    await fetchAdminData();
  }
};

const handleGenerateCredentialCode = async (requestId: string) => {
  setCredentialRequestMessage('');

  try {
    const { data, error } = await supabase.functions.invoke(
      'sub-admin-credential-requests',
      {
        body: {
          action: 'generate_verification_code',
          request_id: requestId,
        },
      }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.message || 'Code generate nahi hua.');
    }

    setGeneratedVerificationCodes((prev) => ({
      ...prev,
      [requestId]: data.verification_code,
    }));

    setCredentialRequestMessage(
      `Verification code generated. Request: ${requestId}`
    );
  } catch (error) {
    setCredentialRequestMessage(
      error instanceof Error ? error.message : 'Code generate nahi hua.'
    );
  }
};

const handleReviewCredentialRequest = async (
  requestId: string,
  decision: 'approve' | 'reject'
) => {
  setCredentialRequestMessage('');

  const verificationCode = (
    verificationCodeInputs[requestId] || ''
  ).trim();

  if (decision === 'approve' && !/^\d{6}$/.test(verificationCode)) {
    setCredentialRequestMessage(
      'Approve karne se pehle 6-digit verification code enter karein.'
    );
    return;
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      'sub-admin-credential-requests',
      {
        body: {
          action: 'review_request',
          request_id: requestId,
          decision,
          ...(decision === 'approve'
            ? { verification_code: verificationCode }
            : {}),
        },
      }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.message || 'Request review nahi hui.');
    }

    setCredentialRequestMessage(data.message || 'Request reviewed.');

    setGeneratedVerificationCodes((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });

    setVerificationCodeInputs((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });

    const { data: refreshed, error: refreshError } =
      await supabase.functions.invoke(
        'sub-admin-credential-requests',
        {
          body: { action: 'list_requests' },
        }
      );

    if (!refreshError && refreshed?.success) {
      setCredentialRequests(
        Array.isArray(refreshed.requests) ? refreshed.requests : []
      );
    }
  } catch (error) {
    setCredentialRequestMessage(
      error instanceof Error ? error.message : 'Request review nahi hui.'
    );
  }
};

const fetchAdminData = async () => {
  // 1. Customer profiles load karein.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (profilesError) {
    console.error('Failed to load profiles:', profilesError);
  } else if (profiles) {
    const mappedProfiles = profiles.map((p, idx) => ({
      ...p,
      custom_id: idx + 1,
      auto_task_lock: p.auto_task_lock ?? true,
    }));

    // 2. Sirf saved customer-specific Auto Lucky settings read karein.
    // Global template ko yahan copy/upsert nahi karna.
    const {
      data: luckySettings,
      error: luckySettingsError,
    } = await supabase
      .from('customer_auto_lucky_order_settings')
      .select('user_id, enabled');

    if (luckySettingsError) {
      console.error(
        'Auto Lucky Order settings load failed:',
        luckySettingsError
      );

      setCustomers((prev) =>
        mappedProfiles.map((profile) => {
          const existing = prev.find(
            (item) => item.id === profile.id
          );

          return {
            ...profile,
            auto_lucky_order_enabled:
              existing?.auto_lucky_order_enabled ?? false,
          };
        })
      );
    } else {
      const settingsMap = new Map<string, boolean>(
        (luckySettings ?? []).map((setting) => [
          setting.user_id,
          setting.enabled === true,
        ])
      );

      setCustomers((prev) =>
        mappedProfiles.map((profile) => {
          const existing = prev.find(
            (item) => item.id === profile.id
          );

          return {
            ...profile,
            auto_lucky_order_enabled: settingsMap.has(profile.id)
              ? settingsMap.get(profile.id)!
              : existing?.auto_lucky_order_enabled ?? false,
          };
        })
      );
    }
  }

  // 3. Deposits.
  const { data: depList, error: depositsError } = await supabase
    .from('deposits')
    .select('*')
    .order('created_at', { ascending: false });

  if (depositsError) {
    console.error('Failed to load deposits:', depositsError);
  } else if (depList) {
    setDeposits(depList);
  }

  // 4. Withdrawals.
  const { data: witList, error: withdrawalsError } = await supabase
    .from('withdrawals')
    .select('*')
    .order('created_at', { ascending: false });

  if (withdrawalsError) {
    console.error('Failed to load withdrawals:', withdrawalsError);
  } else if (witList) {
    setWithdrawals(witList);
  }

  // 5. Products.
  const { data: prodList, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Failed to load products:', productsError);
  } else if (prodList) {
    setProductsList(prodList);
  }

  // 6. Sub-admins.
  if (isMainAdmin) {
    const { data: subList, error: subListError } = await supabase
      .from('sub_admins')
      .select(
        'id, email, invite_code, telegram_url, whatsapp_url, permissions, created_at'
      );

    if (subListError) {
      console.error('Failed to load Sub-Admins:', subListError.message);
    } else if (subList) {
      setSubAdmins(subList);
    }
  }

  // 7. Admin notifications.
  const { data: notifList, error: notifError } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (notifError) {
    console.error('Failed to load admin notifications:', notifError);
  } else if (notifList) {
    setNotifications(notifList);
  }

  // 8. Credential requests.
  if (isMainAdmin) {
    setCredentialRequestsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'sub-admin-credential-requests',
        {
          body: { action: 'list_requests' },
        }
      );

      if (error) throw error;

      if (data?.success) {
        setCredentialRequests(
          Array.isArray(data.requests) ? data.requests : []
        );
      } else {
        console.error('Credential requests error:', data?.message);
      }
    } catch (error) {
      console.error('Credential requests load failed:', error);
    } finally {
      setCredentialRequestsLoading(false);
    }
  }

  // 9. System settings.
  const {
    data: settingsData,
    error: settingsError,
  } = await supabase
    .from('system_settings')
    .select(
      'id, deposit_trc20_address, main_invite_code, qr_code_url, telegram_url, whatsapp_url'
    )
    .eq('id', 1)
    .maybeSingle();

  if (settingsError) {
    console.error('Failed to load system settings:', settingsError);
  } else if (settingsData) {
    setDepositTrc20(settingsData.deposit_trc20_address ?? '');
    setMainInviteCode(settingsData.main_invite_code ?? '');
    setQrCodeUrl(settingsData.qr_code_url ?? '');

    if (settingsData.deposit_trc20_address) {
      localStorage.setItem(
        'global_trc20',
        settingsData.deposit_trc20_address
      );
    } else {
      localStorage.removeItem('global_trc20');
    }

    if (settingsData.main_invite_code) {
      localStorage.setItem(
        'global_invite',
        settingsData.main_invite_code
      );
    } else {
      localStorage.removeItem('global_invite');
    }

    if (settingsData.telegram_url !== null) {
      setTelegramUrl((current) =>
        current === '' ? (settingsData.telegram_url ?? '') : current
      );
    }

    if (settingsData.whatsapp_url !== null) {
      setWhatsappUrl((current) =>
        current === '' ? (settingsData.whatsapp_url ?? '') : current
      );
    }
  }

  // 10. Chat messages.
  const { data: allChats, error: chatsError } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (chatsError) {
    console.error('Failed to load chat messages:', chatsError);
  } else if (allChats) {
    setChatMessages(allChats);

    const uniqueUserIds = Array.from(
      new Set(
        allChats
          .map((c) =>
            c.sender_id === 'admin' ? c.receiver_id : c.sender_id
          )
          .filter((id) => id && id !== 'admin')
      )
    );

    setChatUsers(uniqueUserIds);

    if (uniqueUserIds.length > 0) {
      setActiveChatUserId((currentId) =>
        currentId && uniqueUserIds.includes(currentId)
          ? currentId
          : uniqueUserIds[0]
      );
    }
  }
};

  
useEffect(() => {
  const loadAutoSlots = async () => {
    const { data, error } = await supabase
      .from('auto_lucky_order_settings')
      .select('global_enabled, slots')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Auto Slots load failed:', error);
      showToast('Unable to load Auto Slots settings.', 'error');
      return;
    }

    if (data) {
      // Ab 5 ki jagah 7 slots initialize honge
      const defaults = Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        active: false,
        taskNum: '',
        minAmount: '',
        maxAmount: '',
        comm: '',
      }));

      const savedSlots = Array.isArray(data.slots)
        ? data.slots
        : [];

      const loadedSlots = defaults.map((slot) => {
        const saved = savedSlots.find(
          (item: any) => Number(item.id) === slot.id
        );

        return saved
          ? {
              ...slot,
              active: Boolean(saved.active),
              taskNum: String(saved.taskNum ?? ''),
              minAmount: String(saved.minAmount ?? ''),
              maxAmount: String(saved.maxAmount ?? ''),
              comm: String(saved.comm ?? ''),
            }
          : slot;
      });

      setAutoSlots(loadedSlots);
      setAutoSlotsEnabled(Boolean(data.global_enabled));
    }
  };

  void loadAutoSlots();
}, []);

  useEffect(() => {
    checkAdminRoleAndFetchData();

    const syncInterval = setInterval(() => {
      checkAdminRoleAndFetchData();
    }, 3000);

    let chatRefreshInProgress = false;

    const refreshAdminChat = async () => {
      if (chatRefreshInProgress) return;
      chatRefreshInProgress = true;

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Failed to refresh admin chat:', error);
          return;
        }

        if (data) {
          setChatMessages(data);

          const uniqueUserIds = Array.from(
            new Set(
              data
                .map((m) =>
                  m.sender_id === 'admin'
                    ? m.receiver_id
                    : m.sender_id
                )
                .filter((id) => id && id !== 'admin')
            )
          );

          setChatUsers(uniqueUserIds);

          setActiveChatUserId((currentId) => {
            if (currentId && uniqueUserIds.includes(currentId)) {
              return currentId;
            }

            return uniqueUserIds[0] || '';
          });
        }
      } catch (err) {
        console.error('Unexpected admin chat refresh error:', err);
      } finally {
        chatRefreshInProgress = false;
      }
    };

    void refreshAdminChat();

    const adminChannel = supabase
      .channel('admin-live-sync-room')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          void checkAdminRoleAndFetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        () => {
          void checkAdminRoleAndFetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        () => {
          void checkAdminRoleAndFetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          void refreshAdminChat();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void refreshAdminChat();
        }
      });
 return () => {
      clearInterval(syncInterval);
      void supabase.removeChannel(adminChannel);
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

    if (
      !Number.isFinite(val) ||
      val <= 0 ||
      Math.abs(val * 100 - Math.round(val * 100)) > 0.000001
    ) {
      showToast(
        'Enter a valid amount with up to 2 decimal places.',
        'error'
      );
      return;
    }

    const isAdd = modalType === 'add_funds';
    const userId = selectedUserForModal.id;

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        throw new Error(
          'Supabase login session missing. Please log out and log in again.'
        );
      }

      const { data, error } = await supabase.rpc(
        'admin_adjust_customer_balance_and_lucky_order' as any,
        {
          p_target_user_id: userId,
          p_amount: val,
          p_action: isAdd ? 'add' : 'deduct',
          p_note: isAdd
            ? 'Manual Add Funds by Admin'
            : 'Manual Deduct Funds by Admin',
        } as any
      );

      if (error) throw error;

      const result = data as {
        success?: boolean;
        balance_after?: number;
        amount?: number;
        action?: string;
        lucky_order_funding_added?: number;
        lucky_order_funding_status?: string;
      } | null;

      if (
        !result?.success ||
        result.balance_after == null ||
        !Number.isFinite(Number(result.balance_after))
      ) {
        throw new Error(
          'Balance update could not be verified. Please check the database before retrying.'
        );
      }

      const newBalance = Number(result.balance_after);

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === userId
            ? { ...customer, balance: newBalance }
            : customer
        )
      );

      setSelectedUserForModal((prev) =>
        prev && prev.id === userId
          ? { ...prev, balance: newBalance }
          : prev
      );

      const fundingAdded = Number(
        result.lucky_order_funding_added ?? 0
      );

      const customerNumber = selectedUserForModal.custom_id;

      if (isAdd && fundingAdded > 0) {
        showToast(
          `$${val.toFixed(2)} added to customer #${customerNumber}. ` +
            `Lucky Order funding recorded: $${fundingAdded.toFixed(2)}. ` +
            `New balance: $${newBalance.toFixed(2)}`
        );
      } else {
        showToast(
          `$${val.toFixed(2)} ${
            isAdd ? 'added to' : 'deducted from'
          } customer #${customerNumber}. ` +
            `New balance: $${newBalance.toFixed(2)}`
        );
      }

      setFundInput('');
      setModalType(null);
    } catch (err: any) {
      console.error('Manual balance adjustment failed:', err);
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
        .from('payment-Qr')
        .upload(filePath, qrFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: qrFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('payment-Qr')
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
    { id: 1, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
    { id: 2, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
    { id: 3, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
    { id: 4, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
    { id: 5, active: false, taskNum: '', minAmount: '', maxAmount: '', comm: '' },
  ]);

  setAutoSlotsEnabled(false);
  showToast('Auto Slots reset locally. Save settings to apply the reset.');
};


const handleSaveAutoSlots = async () => {
  if (autoSlotsSaving) return;

  // Selected customer zaroori hai
  if (!selectedUserForModal?.id) {
    showToast('Pehle customer select karein.', 'error');
    return;
  }

  // Active slots ki validation
  for (const slot of autoSlots) {
    if (!slot.active) continue;

    const taskNum = Number(slot.taskNum);
    const minAmount = Number(slot.minAmount);
    const maxAmount = Number(slot.maxAmount);
    const comm = Number(slot.comm);

    if (
      !Number.isInteger(taskNum) ||
      taskNum < 1 ||
      taskNum > 25 ||
      slot.taskNum.trim() === ''
    ) {
      showToast(
        `Slot ${slot.id}: Task Number 1 se 25 ke darmiyan hona chahiye.`,
        'error'
      );
      return;
    }

    if (
      slot.minAmount.trim() === '' ||
      slot.maxAmount.trim() === '' ||
      !Number.isFinite(minAmount) ||
      !Number.isFinite(maxAmount) ||
      minAmount <= 0 ||
      maxAmount < minAmount
    ) {
      showToast(
        `Slot ${slot.id}: Minimum aur Maximum Amount check karein.`,
        'error'
      );
      return;
    }

    if (
      slot.comm.trim() === '' ||
      !Number.isFinite(comm) ||
      comm < 0 ||
      comm > 100
    ) {
      showToast(
        `Slot ${slot.id}: Commission 0 se 100 ke darmiyan honi chahiye.`,
        'error'
      );
      return;
    }
  }

  // Har enabled slot ka task number unique hona chahiye
  const enabledTaskNumbers = autoSlots
    .filter((slot) => slot.active)
    .map((slot) => Number(slot.taskNum));

  if (new Set(enabledTaskNumbers).size !== enabledTaskNumbers.length) {
    showToast(
      'Enabled Auto Slots ke task numbers alag alag rakhein.',
      'error'
    );
    return;
  }

  setAutoSlotsSaving(true);

  try {
    // Sirf main admin ko save karne ki permission hai
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (
      authError ||
      authData.user?.email?.toLowerCase() !== 'adoochen64@gmail.com'
    ) {
      showToast('Only the main admin can save Auto Slots.', 'error');
      return;
    }

    const slotsToSave = autoSlots.map((slot) => ({
      id: slot.id,
      active: Boolean(slot.active),
      taskNum: slot.taskNum,
      minAmount: slot.minAmount,
      maxAmount: slot.maxAmount,
      comm: slot.comm,
    }));

    const customerId = selectedUserForModal.id;

    // Pehle check karein ke customer ki settings row maujood hai
    const { data: existingSettings, error: readError } = await supabase
      .from('customer_auto_lucky_order_settings')
      .select('user_id')
      .eq('user_id', customerId)
      .maybeSingle();

    if (readError) throw readError;

    if (existingSettings) {
      // Sirf slots update honge; enabled toggle bilkul change nahi hoga
      const { error: updateError } = await supabase
        .from('customer_auto_lucky_order_settings')
        .update({
          slots: slotsToSave,
        })
        .eq('user_id', customerId);

      if (updateError) throw updateError;
    } else {
      // Missing row ke liye default ON setting ke saath initialize karein.
      // Agar row pehle se nahi thi, tabhi enabled true set hoga.
      const { error: insertError } = await supabase
        .from('customer_auto_lucky_order_settings')
        .insert({
          user_id: customerId,
          enabled: true,
          slots: slotsToSave,
        });

      if (insertError) throw insertError;

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? { ...customer, auto_lucky_order_enabled: true }
            : customer
        )
      );

      setSelectedUserForModal((prev) =>
        prev && prev.id === customerId
          ? { ...prev, auto_lucky_order_enabled: true }
          : prev
      );
    }

    showToast('Selected customer ke Auto Lucky Slots save ho gaye.');
  } catch (err: unknown) {
    console.error('Customer Auto Slots save failed:', err);

    showToast(
      err instanceof Error
        ? err.message
        : 'Unable to save customer Auto Slots.',
      'error'
    );
  } finally {
    setAutoSlotsSaving(false);
  }
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
    } catch {
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
      const { data: authData, error: authError } = await supabase.auth.getUser();

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

      if (newProdImageFile) {
        const file = newProdImageFile;
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedImageTypes.includes(file.type)) {
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
          category: 'Beauty & Skincare',
          vip_level: newProdVipLevel,
          rating: Number(newProdRating),
          is_active: false,
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
        setNewProdRating('5');
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
        body: { category: 'Premium Watches' },
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
 
const handleAssignProductBatch = async (
  productId: string,
  batchValue: string
) => {
  try {
    const batch = batchValue === '' ? null : Number(batchValue);

    if (
      batch !== null &&
      (!Number.isInteger(batch) || batch < 1 || batch > 6)
    ) {
      showToast('Please select Batch 1 to Batch 6.', 'error');
      return;
    }

    if (batch !== null) {
      const { count, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('rotation_batch', batch)
        .neq('id', productId);

      if (countError) throw countError;

      if ((count ?? 0) >= 25) {
        showToast(`Batch ${batch} already has 25 products.`, 'error');
        return;
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update({ rotation_batch: batch })
      .eq('id', productId)
      .select('id, rotation_batch')
      .single();

    if (error) throw error;

    setProductsList((prev) =>
      prev.map((product) =>
        String(product.id) === String(productId)
          ? { ...product, rotation_batch: data.rotation_batch }
          : product
      )
    );

    showToast(
      batch === null
        ? 'Product moved to Unassigned.'
        : `Product assigned to Batch ${batch}.`
    );
  } catch (err: any) {
    showToast(err?.message || 'Could not assign product batch.', 'error');
  }
};

const openBatchManagerEdit = (product: ProductItem) => {
  setBatchManagerEditingProduct(product);
  setBatchManagerEditName(product.name);
  setBatchManagerEditStore(product.store);
  setBatchManagerEditPrice(String(product.price));
  setBatchManagerEditImage(product.image_url || '');
  setBatchManagerEditRating(String(product.rating ?? 5));
  setBatchManagerEditVip(product.vip_level || 'VIP 1');
};

const saveBatchManagerEdit = async () => {
  const product = batchManagerEditingProduct;
  const price = Number(batchManagerEditPrice);
  const rating = Number(batchManagerEditRating);

  if (!product) return;

  if (
    !batchManagerEditName.trim() ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !batchManagerEditImage.trim() ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    showToast(
      'Please enter a valid name, price, image URL and rating.',
      'error'
    );
    return;
  }

  setBatchManagerSaving(true);

  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: batchManagerEditName.trim(),
        store: batchManagerEditStore,
        price,
        image_url: batchManagerEditImage.trim(),
        rating,
        vip_level: batchManagerEditVip,
      })
      .eq('id', product.id)
      .select()
      .single();

    if (error) throw error;

    setProductsList((prev) =>
      prev.map((item) =>
        String(item.id) === String(product.id)
          ? { ...item, ...data }
          : item
      )
    );

    setBatchManagerEditingProduct(null);
    showToast('Product updated successfully!');
  } catch (err: any) {
    showToast(
      err?.message || 'Could not update product.',
      'error'
    );
  } finally {
    setBatchManagerSaving(false);
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

  const userId = selectedUserForModal.id;
  const newLoginPassword = editLoginPass.trim();
  const newWithdrawPassword = editWithdrawPass.trim();

  if (newLoginPassword && newLoginPassword.length < 6) {
    showToast('Login password must be at least 6 characters.', 'error');
    return;
  }

  const payload: Record<string, any> = {
    vip_level: editVipLevel,
    withdraw_locked: disableWithdraw,
    withdraw_message: withdrawNotificationMsg.trim(),
    withdraw_status: disableWithdraw ? 'disabled' : 'enabled',
    trc20_address: editTrc20.trim(),
    bank_name: editBankName.trim(),
    account_number: editBankAccount.trim(),
    erc20_address: editErc20.trim(),
  };

  if (newWithdrawPassword) {
    payload.withdraw_password = newWithdrawPassword;
  }

  try {
    const { data: savedUser, error: saveError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (saveError) throw saveError;

    if (!savedUser) {
      throw new Error(
        'Profile settings were not saved. Check admin database permissions.'
      );
    }

    if (newLoginPassword) {
      const { data, error } = await supabase.functions.invoke(
        'admin-update-user-password',
        {
          body: {
            target_user_id: userId,
            new_password: newLoginPassword,
          },
        }
      );

      if (error) {
        throw new Error(
          'Profile saved, but login password update failed: ' +
          error.message
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message || 'The login password was not updated.'
        );
      }
    }

    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === userId
          ? { ...customer, ...savedUser }
          : customer
      )
    );

    setSelectedUserForModal((prev) =>
      prev && prev.id === userId
        ? { ...prev, ...savedUser }
        : prev
    );

    setEditLoginPass('');
    setEditWithdrawPass('');
    setModalType(null);

    showToast(
      newLoginPassword
        ? 'Profile settings and login password updated successfully.'
        : 'Profile settings saved successfully.'
    );
  } catch (err: any) {
    showToast(
      err?.message || 'Could not save user settings.',
      'error'
    );
  }
};


  const handleOpenFullPageTaskSettings = async (user: CustomerProfile) => {
    setSelectedUserForModal(user);
    setEditVipLevel(user.vip_level || 'VIP 0 - Regular');
    await fetchUserCustomTasks(user.id);

    try {
      const { data, error } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_lucky_order', true)
        .order('task_number', { ascending: true });

      if (error) throw error;

      setCustomTasksList(data ?? []);
      setIsFullPageTaskSettings(true);
    } catch (err: any) {
      showToast(
        err?.message || 'Could not load Lucky Orders.',
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

      setCustomTasksList((prev: any[]) =>
        prev.filter((task) => String(task.id) !== String(taskId))
      );

      setUserCustomTasks((prev: any[]) =>
        prev.filter((task) => String(task.id) !== String(taskId))
      );

      showToast('Custom task deleted successfully.');
    } catch (err: any) {
      showToast(
        err?.message || 'Could not delete custom task.',
        'error'
      );
    }
  };

  const fetchUserCustomTasks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserCustomTasks(data ?? []);
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Could not load user custom tasks.',
        'error'
      );
    }
  };

  
const handleLoadCustomerReport = async (customerId: string) => {
  setReportCustomerId(customerId);
  setReportError('');
  setReportLoading(true);
  setReportTasks([]);

  try {
    const { data, error } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setReportTasks(data ?? []);
  } catch (err: unknown) {
    console.error('Customer report loading failed:', err);

    setReportError(
      err instanceof Error
        ? err.message
        : 'Customer task history could not be loaded.'
    );
  } finally {
    setReportLoading(false);
  }
};

const handleDownloadCustomerReport = () => {
  if (!reportCustomer) {
    showToast('Please select a customer first.', 'error');
    return;
  }

  const escapeHtml = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const depositRows = filteredReportDeposits
    .map(
      (d: any) => `
        <tr>
          <td>Deposit / Funds</td>
          <td>${escapeHtml(reportDate(d.created_at))}</td>
          <td>${escapeHtml(reportMoney(d.amount))}</td>
          <td>${escapeHtml(d.status ?? d.type ?? 'Recorded')}</td>
        </tr>`
    )
    .join('');

  const withdrawalRows = filteredReportWithdrawals
    .map(
      (w: any) => `
        <tr>
          <td>Withdrawal</td>
          <td>${escapeHtml(reportDate(w.created_at))}</td>
          <td>${escapeHtml(reportMoney(w.amount))}</td>
          <td>${escapeHtml(w.status ?? 'Recorded')}</td>
        </tr>`
    )
    .join('');

  const taskRows = filteredReportTasks
    .map(
      (t: any) => `
        <tr>
          <td>${t.is_lucky_order ? 'Lucky Order' : 'Task'}</td>
          <td>${escapeHtml(reportDate(t.created_at))}</td>
          <td>${escapeHtml(
            reportMoney(t.task_amount ?? t.locked_price ?? t.amount ?? 0)
          )}</td>
          <td>${escapeHtml(
            t.funding_status ?? t.status ?? (t.is_active ? 'Active' : 'Recorded')
          )}</td>
        </tr>`
    )
    .join('');

  const rows =
    depositRows +
    withdrawalRows +
    taskRows;

  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    showToast(
      'Report window blocked. Please allow pop-ups and try again.',
      'error'
    );
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Customer Records &amp; Reports</title>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #222;
          }
          h1 { margin-bottom: 8px; }
          .summary { margin-bottom: 22px; line-height: 1.8; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 9px;
            text-align: left;
            overflow-wrap: anywhere;
          }
          th { background: #eee; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Customer Records &amp; Reports</h1>
        <div class="summary">
          <strong>Customer:</strong>
          ${escapeHtml(reportCustomer.email ?? reportCustomer.custom_id ?? reportCustomer.id)}
          <br />
          <strong>Customer ID:</strong> ${escapeHtml(reportCustomer.id)}
          <br />
          <strong>Start date:</strong> ${escapeHtml(reportStartDate || 'All dates')}
          <br />
          <strong>End date:</strong> ${escapeHtml(reportEndDate || 'All dates')}
          <br />
          <strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString())}
        </div>

        <table>
          <thead>
            <tr>
              <th>Record Type</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status / Details</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows ||
              '<tr><td colspan="4">No records found for the selected filters.</td></tr>'
            }
          </tbody>
        </table>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

const reportCustomer = customers.find(
  (c) => String(c.id) === reportCustomerId
);

const reportDeposits = deposits.filter(
  (d: any) => String(d.user_id) === reportCustomerId
);

const reportWithdrawals = withdrawals.filter(
  (w: any) => String(w.user_id) === reportCustomerId
);

const reportDateMatches = (record: any): boolean => {
  const rawDate = record.created_at || record.updated_at;

  if (!rawDate) return true;

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) return true;

  if (reportStartDate) {
    const start = new Date(`${reportStartDate}T00:00:00`);

    if (date < start) return false;
  }

  if (reportEndDate) {
    const end = new Date(`${reportEndDate}T23:59:59.999`);

    if (date > end) return false;
  }

  return true;
};

const filteredReportDeposits =
  reportDeposits.filter(reportDateMatches);

const filteredReportWithdrawals =
  reportWithdrawals.filter(reportDateMatches);

const filteredReportTasks =
  reportTasks.filter(reportDateMatches);

const reportMoney = (value: unknown): string => {
  const amount = Number(value ?? 0);

  return `$${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
};

const reportDate = (value: unknown): string => {
  if (!value) return 'Date unavailable';

  const date = new Date(String(value));

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString();
};


const handleManualTaskLockToggle = async (
  customer: any,
  locked: boolean
) => {
  const { error } = await supabase
    .from('profiles')
    .update({ manual_task_lock: locked })
    .eq('id', customer.id);

  if (error) {
    console.error('Manual task lock update failed:', error);
    alert('Manual Tasks setting save nahi hui. Please try again.');
    return;
  }

  // Existing customer list ko refresh karne ke liye

 
};

const handleAutoLuckyOrderToggle = async (
  customer: CustomerProfile,
  enabled: boolean
) => {
  try {
    const { data: existingSettings, error: readError } = await supabase
      .from('customer_auto_lucky_order_settings')
      .select('user_id')
      .eq('user_id', customer.id)
      .maybeSingle();

    if (readError) throw readError;

    if (!existingSettings) {
      showToast(
        'Customer Auto Lucky Order settings nahi milin. Is customer ki settings pehle initialize karein.',
        'error'
      );
      return;
    }

    const { error: updateError } = await supabase
      .from('customer_auto_lucky_order_settings')
      .update({ enabled })
      .eq('user_id', customer.id);

    if (updateError) throw updateError;

    setCustomers((prev) =>
      prev.map((item) =>
        item.id === customer.id
          ? { ...item, auto_lucky_order_enabled: enabled }
          : item
      )
    );

    setSelectedUserForModal((prev) =>
      prev && prev.id === customer.id
        ? { ...prev, auto_lucky_order_enabled: enabled }
        : prev
    );

    showToast(
      enabled
        ? 'Customer Auto Lucky Order enabled.'
        : 'Customer Auto Lucky Order disabled.'
    );
  } catch (err: unknown) {
    console.error('Auto Lucky Order update failed:', err);
    showToast(
      err instanceof Error
        ? err.message
        : 'Auto Lucky Order setting save nahi hui.',
      'error'
    );
  }
};

const handleResetUserTasks = async (customer: any) => {
  const confirmed = window.confirm(
    `Customer #${customer.custom_id} ke completed task count ko 0 karna hai?`
  );

  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ completed_tasks: 0 })
      .eq('id', customer.id);

    if (error) throw error;

    // Users table mein task count update karein
    setCustomers((prev) =>
      prev.map((item) =>
        item.id === customer.id
          ? { ...item, completed_tasks: 0 }
          : item
      )
    );

    // Selected user ke profile/modal mein bhi update karein
    setSelectedUserForModal((prev) =>
      prev && prev.id === customer.id
        ? { ...prev, completed_tasks: 0 }
        : prev
    );

    showToast('Completed task count 0 ho gaya hai.');
  } catch (err: unknown) {
    console.error('Reset tasks failed:', err);

    showToast(
      err instanceof Error
        ? err.message
        : 'Tasks reset nahi huay. Please try again.',
      'error'
    );
  }
};

  const handleAutoTaskLockToggle = async (
    user: CustomerProfile,
    shouldLock: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ auto_task_lock: shouldLock })
        .eq('id', user.id);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === user.id
            ? { ...customer, auto_task_lock: shouldLock }
            : customer
        )
      );

      setSelectedUserForModal((prev) =>
        prev && prev.id === user.id
          ? { ...prev, auto_task_lock: shouldLock }
          : prev
      );

      showToast(
        shouldLock
          ? 'Customer auto tasks locked.'
          : 'Customer auto tasks unlocked.'
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Could not update auto task lock.',
        'error'
      );
    }
  };

  const handleClearLuckyOrderConfig = async () => {
    if (!selectedUserForModal) {
      showToast('Please select a customer first.', 'error');
      return;
    }

    const confirmed = window.confirm(
      'Clear completed Lucky Order configurations? Order history, funding records, and wallet balance will be preserved.'
    );

    if (!confirmed) return;

    try {
      const { data, error } = await supabase.rpc(
        'admin_clear_completed_lucky_orders',
        {
          p_user_id: selectedUserForModal.id,
        }
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error('Could not clear Lucky Order configurations.');
      }

      const { data: activeTasks, error: refreshError } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', selectedUserForModal.id)
        .eq('is_lucky_order', true)
        .eq('is_active', true)
        .order('task_number', { ascending: true });

      if (refreshError) throw refreshError;

      setCustomTasksList(activeTasks ?? []);
      await fetchUserCustomTasks(selectedUserForModal.id);

      showToast(
        `Cleared ${data.cleared_count ?? 0} completed Lucky Order configuration(s). History and balance were preserved.`
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Could not clear Lucky Order configurations.',
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

    if (!Number.isInteger(taskNumber) || taskNumber < 1 || taskNumber > 25) {
      showToast('Enter a task number between 1 and 25.', 'error');
      return;
    }

    if (!Number.isFinite(rate) || rate <= 0 || rate > 100) {
      showToast('Commission rate must be greater than 0 and at most 100%.', 'error');
      return;
    }

    if (
      !Number.isFinite(minAmount) ||
      !Number.isFinite(maxAmount) ||
      minAmount <= 0 ||
      maxAmount < minAmount
    ) {
      showToast('Enter a valid minimum and maximum amount.', 'error');
      return;
    }

    const centsMin = Math.ceil(minAmount * 100);
    const centsMax = Math.floor(maxAmount * 100);

    if (centsMax < centsMin) {
      showToast('The amount range must allow at least one valid cent value.', 'error');
      return;
    }

    try {
      const userId = selectedUserForModal.id;
      const randomCents =
        Math.floor(Math.random() * (centsMax - centsMin + 1)) + centsMin;

      const taskAmount = Number((randomCents / 100).toFixed(2));
      const commission = Number((taskAmount * rate / 100).toFixed(2));
   
      const { data: activeLuckyOrder, error: activeCheckError } =
        await supabase
          .from('custom_tasks')
          .select('id, task_number')
          .eq('user_id', userId)
          .eq('is_lucky_order', true)
          .eq('is_active', true)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();

      if (activeCheckError) throw activeCheckError;

      const { error: insertError } = await supabase
        .from('custom_tasks')
        .insert({
          user_id: userId,
          task_number: taskNumber,
          task_amount: taskAmount,
          min_amount: minAmount,
          max_amount: maxAmount,
          commission_rate: rate,
          commission,
          locked_price: taskAmount,
          locked_commission: commission,
          vip_level: selectedUserForModal.vip_level || 'VIP 0 - Regular',
          status: 'pending',
          is_active: !activeLuckyOrder,
          is_lucky_order: true,
          funding_status: 'pending',
        });

      if (insertError) throw insertError;

      const { data: refreshedTasks, error: refreshError } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_lucky_order', true)
        .eq('is_active', true)
        .order('task_number', { ascending: true });

      if (refreshError) throw refreshError;

      setCustomTasksList(refreshedTasks ?? []);
      await fetchUserCustomTasks(userId);

      setSlotTaskNum('');
      setSlotMinAmount('');
      setSlotMaxAmount('');
      setSlotCommPercent('');

      showToast(
        `Lucky Order #${taskNumber} saved. Amount: $${taskAmount.toFixed(2)}, commission: $${commission.toFixed(2)}.`
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Could not save the lucky order.';
      showToast(errorMsg, 'error');
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

const handleSaveSubAdminSelfProfile = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  if (isMainAdmin || !subAdminDbId) {
    showToast('Invalid Sub-Admin session.', 'error');
    return;
  }

  try {
    const oldEmail = currentAdminEmail.trim().toLowerCase();
    const newEmail = subAdminEditableEmail.trim().toLowerCase();
    const newInvite = subAdminEditableInviteCode.trim().toUpperCase();
    const newTelegram = subAdminEditableTelegram.trim();
    const newWhatsapp = subAdminEditableWhatsapp.trim();
    const newPassword = subAdminEditablePassword;

    if (!newEmail) {
      showToast('Email is required.', 'error');
      return;
    }

    const emailChanged = newEmail !== oldEmail;
    const passwordChanged = newPassword.length > 0;

    if (
      emailChanged &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)
    ) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (passwordChanged && newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }

    const invokeCredentialFunction = async (
      body: Record<string, unknown>
    ) => {
      const { data, error } = await supabase.functions.invoke(
        'sub-admin-credential-requests',
        { body }
      );

      if (error) {
        let details: any = null;

        try {
          details = await error.context?.json?.();
        } catch {
          // Keep the original error if the response is not JSON.
        }

        throw new Error(
          details?.message ||
          details?.error ||
          error.message ||
          'Credential request failed.'
        );
      }

      if (data?.success === false) {
        throw new Error(
          data?.message || data?.error || 'Credential request failed.'
        );
      }

      return data;
    };

    const messages: string[] = [];

    if (emailChanged) {
      await invokeCredentialFunction({
        action: 'submit_request',
        request_type: 'email',
        requested_email: newEmail,
      });

      messages.push(
        'Email change request submitted for Main Admin approval.'
      );
    }

    if (passwordChanged) {
      const statusData = await invokeCredentialFunction({
        action: 'get_my_requests',
      });

      const request = statusData?.request;

      if (request?.status === 'verified') {
        await invokeCredentialFunction({
          action: 'complete_password_change',
          request_id: request.id,
          new_password: newPassword,
        });

        messages.push('Password changed successfully.');
      } else if (request?.status === 'pending') {
        messages.push(
          'Password request is pending. Wait for Main Admin approval, then enter the new password and save again.'
        );
      } else {
        await invokeCredentialFunction({
          action: 'submit_request',
          request_type: 'password',
        });

        messages.push(
          'Password request submitted. After Main Admin approval, enter the new password again and save.'
        );
      }

      setSubAdminEditablePassword('');
    }

    const settingsPayload: Record<string, string> = {};

    if (subAdminPermissions.invitationCode) {
      settingsPayload.invite_code = newInvite;
    }

    if (subAdminPermissions.telegram) {
      settingsPayload.telegram_url = newTelegram;
    }

    if (subAdminPermissions.whatsapp) {
      settingsPayload.whatsapp_url = newWhatsapp;
    }

    if (Object.keys(settingsPayload).length > 0) {
      const { error } = await supabase
        .from('sub_admins')
        .update(settingsPayload)
        .eq('id', subAdminDbId)
        .eq('email', oldEmail);

      if (error) throw error;
    }

    const changesList: string[] = [];

    if (emailChanged) {
      changesList.push('Email change request submitted');
    }

    if (passwordChanged) {
      changesList.push('Password workflow processed');
    }

    if (subAdminPermissions.invitationCode) {
      setSubAdminInviteCode(newInvite);
      setSubAdminEditableInviteCode(newInvite);

      if (newInvite) changesList.push('Invitation code updated');
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
          sub_admin_email: oldEmail,
          message: `Sub-Admin (${oldEmail}): ${changesList.join(', ')}`,
        });

      if (notificationError) {
        console.error(
          'Could not create profile notification:',
          notificationError
        );
      }
    }

    showToast(
      messages.length > 0
        ? messages.join(' ')
        : 'Sub-Admin profile updated successfully!',
      'success'
    );
  } catch (err: any) {
    console.error('Sub-Admin profile update failed:', err);
    showToast(
      err?.message || 'Error updating Sub-Admin profile.',
      'error'
    );
  }
};


const handleUpdateAdminCredentials = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  const email = mainAdminEmail.trim();
  const password = mainAdminPassword;

  if (!email) {
    showToast('Please enter the main admin email.', 'error');
    return;
  }

  if (!password.trim()) {
    showToast('Please enter a new password.', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
    });

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    setMainAdminPassword('');

    if (data.user?.email) {
      setMainAdminEmail(data.user.email);
    }

    showToast('Credentials update request submitted successfully.', 'success');
  } catch (error) {
    console.error('Admin credentials update failed:', error);
    showToast('Unable to update credentials. Please try again.', 'error');
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
    const cleanTelegram = telegramUrl.trim();
    const cleanWhatsApp = whatsappUrl.trim();

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
        telegram_url: cleanTelegram,
        whatsapp_url: cleanWhatsApp,
      })
      .select(
        'id, deposit_trc20_address, main_invite_code, qr_code_url, telegram_url, whatsapp_url'
      )
      .single();

    if (saveError) {
      console.error('Settings save failed:', saveError);
      throw saveError;
    }

    if (
      savedRows.deposit_trc20_address !== cleanAddress ||
      (savedRows.telegram_url ?? '') !== cleanTelegram ||
      (savedRows.whatsapp_url ?? '') !== cleanWhatsApp
    ) {
      throw new Error(
        'Saved settings do not match the entered values. Please try again.'
      );
    }

    setDepositTrc20(savedRows.deposit_trc20_address);
    setMainInviteCode(savedRows.main_invite_code ?? '');
    setQrCodeUrl(savedRows.qr_code_url ?? '');
    setTelegramUrl(savedRows.telegram_url ?? '');
    setWhatsappUrl(savedRows.whatsapp_url ?? '');

    localStorage.setItem(
      'global_trc20',
      savedRows.deposit_trc20_address
    );
    localStorage.setItem(
      'global_invite',
      savedRows.main_invite_code ?? ''
    );

    showToast('Settings saved and verified in Supabase!');
  } catch (err: any) {
    console.error('Main settings error:', err);
    showToast(err.message || 'Failed to save settings.', 'error');
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
      showToast(
        err?.message || 'Could not update customer status.',
        'error'
      );
    }
  };
  const resetLuckyOrderForm = () => {
    setLuckyOrderEditingId(null);
    setLuckyOrderName('');
    setLuckyOrderStore('Amazon');
    setLuckyOrderPrice('');
    setLuckyOrderImageUrl('');
    setLuckyOrderImageFile(null);
    setLuckyOrderRating('5');
    setLuckyOrderMarketingLevel('VIP 1');
  };

  const saveLuckyOrderProduct = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !luckyOrderName.trim() ||
      !luckyOrderPrice ||
      !Number.isFinite(Number(luckyOrderPrice)) ||
      Number(luckyOrderPrice) <= 0 ||
      (!luckyOrderImageUrl.trim() && !luckyOrderImageFile)
    ) {
      showToast(
        'Enter product name, valid price and image.',
        'error'
      );
      return;
    }

    if (
      !Number.isFinite(Number(luckyOrderRating)) ||
      Number(luckyOrderRating) < 1 ||
      Number(luckyOrderRating) > 5
    ) {
      showToast('Rating must be between 1 and 5.', 'error');
      return;
    }

    if (
      luckyOrderEditingId === null &&
luckyOrderProducts.length >= 250    ) {
      showToast(
        'Maximum 250 Lucky Order products allowed.',
        'error'
      );
      return;
    }

    setLuckyOrderSaving(true);

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (
        authError ||
        authData.user?.email?.toLowerCase() !==
          'adoochen64@gmail.com'
      ) {
        showToast('Main admin login required.', 'error');
        return;
      }

      let imageUrl = luckyOrderImageUrl.trim();

      if (luckyOrderImageFile) {
        const file = luckyOrderImageFile;

        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedTypes.includes(file.type)) {
          showToast(
            'Use JPG, PNG or WEBP images only.',
            'error'
          );
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          showToast(
            'Image must be 5 MB or smaller.',
            'error'
          );
          return;
        }

        const ext = file.name.split('.').pop()?.toLowerCase();

        if (
          !ext ||
          !['jpg', 'jpeg', 'png', 'webp'].includes(ext)
        ) {
          showToast('Invalid image extension.', 'error');
          return;
        }

        const imagePath =
          `lucky-order-products/${crypto.randomUUID()}.${ext}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from('product-images')
          .upload(imagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(imagePath);

        if (!urlData?.publicUrl) {
          throw new Error(
            'Could not generate the product image URL.'
          );
        }

        imageUrl = urlData.publicUrl;
      }

      const payload = {
        name: luckyOrderName.trim(),
        store: luckyOrderStore,
        price: Number(luckyOrderPrice),
        image_url: imageUrl,
        rating: Number(luckyOrderRating),
        marketing_level: luckyOrderMarketingLevel,
        updated_at: new Date().toISOString(),
      };

      let saveError: any = null;

      if (luckyOrderEditingId !== null) {
        const { error } = await supabase
          .from('lucky_order_products')
          .update(payload)
          .eq('id', luckyOrderEditingId);

        saveError = error;
      } else {
        const { error } = await supabase
          .from('lucky_order_products')
          .insert([payload]);

        saveError = error;
      }

      if (saveError) throw saveError;

      showToast(
        luckyOrderEditingId !== null
          ? 'Lucky Order product updated!'
          : 'Lucky Order product added!'
      );

      resetLuckyOrderForm();
      await fetchLuckyOrderProducts();
    } catch (err: any) {
      console.error('Lucky Order product save failed:', err);

      showToast(
        `Lucky Order error: ${
          err?.message || 'Unable to save product.'
        }`,
        'error'
      );
    } finally {
      setLuckyOrderSaving(false);
    }
  };

  const editLuckyOrderProduct = (
    product: LuckyOrderProduct
  ) => {
    setLuckyOrderEditingId(product.id);
    setLuckyOrderName(product.name);
    setLuckyOrderStore(product.store || 'Amazon');
    setLuckyOrderPrice(String(product.price));
    setLuckyOrderImageUrl(product.image_url || '');
    setLuckyOrderImageFile(null);
    setLuckyOrderRating(String(product.rating ?? 5));
    setLuckyOrderMarketingLevel(
      product.marketing_level || 'VIP 1'
    );
      

    setLuckyOrderOpen(true);
  };

  const deleteLuckyOrderProduct = async (id: number) => {
    if (
      !window.confirm(
        'Delete this Lucky Order product?'
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lucky_order_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLuckyOrderProducts((prev) =>
        prev.filter((product) => product.id !== id)
      );

      if (luckyOrderEditingId === id) {
        resetLuckyOrderForm();
      }

      showToast('Lucky Order product deleted.');
    } catch (err: any) {
      console.error('Lucky Order product delete failed:', err);

      showToast(
        `Delete failed: ${
          err?.message || 'Unable to delete product.'
        }`,
        'error'
      );
    }
  };

  const toggleLuckyProductGallery = async (
  product: LuckyOrderProduct
) => {
  const nextValue = !product.in_lucky_gallery;

  try {
    const { error } = await supabase
      .from('lucky_order_products')
      .update({ in_lucky_gallery: nextValue })
      .eq('id', product.id);

    if (error) throw error;

    setLuckyOrderProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, in_lucky_gallery: nextValue }
          : p
      )
    );

    showToast(
      nextValue
        ? 'Product moved into Lucky Products gallery.'
        : 'Product moved out of Lucky Products gallery.'
    );
  } catch (err: any) {
    console.error('Lucky Products move failed:', err);

    showToast(
      err?.message || 'Could not move this product.',
      'error'
    );
  }
};

  const filterByUniversalQuery = (
    c: CustomerProfile,
    q: string
  ) => {
    const cleanQ = q.trim().toLowerCase().replace(/^#/, '');

    if (!cleanQ) return true;

    const customId = String(c.custom_id ?? '').toLowerCase();
    const userId = String(c.id ?? '').toLowerCase();

    const nameStr = String(
      c.full_name ||
        c.username ||
        c.name ||
        c.display_name ||
        ''
    ).toLowerCase();

    const username = String(c.username || '').toLowerCase();
    const emailStr = String(c.email || '').toLowerCase();
    const phoneStr = String(c.phone || '').toLowerCase();
    const inviteCode = String(c.invite_code || '').toLowerCase();

    if (/^\d+$/.test(cleanQ) && customId === cleanQ) {
      return true;
    }

    return (
      userId.includes(cleanQ) ||
      customId.includes(cleanQ) ||
      nameStr.includes(cleanQ) ||
      username.includes(cleanQ) ||
      emailStr.includes(cleanQ) ||
      phoneStr.includes(cleanQ) ||
      inviteCode.includes(cleanQ)
    );
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

    if (!cust || !isCustomerOfSubAdmin(cust, subAdminInviteCode)) {
      return false;
    }
  }

  const q = depositSearchQuery.trim().toLowerCase().replace(/^#/, '');
  if (!q) return true;

  const cust = customers.find((c) => c.id === d.user_id);
  const details = getCustomerDetailsByUserId(d.user_id);

  const searchable = [
    details.customId,
    details.name,
    d.id,
    d.user_id,
    d.custom_task_id,
    cust?.trc20_address,
    cust?.erc20_address,
    cust?.bank_name,
    cust?.invite_code,
    cust?.referred_by_code,
    cust?.invitation_code,
  ]
    .filter((v) => v !== null && v !== undefined)
    .join(' ')
    .toLowerCase();

  return searchable.includes(q);
});
const filteredWithdrawals = withdrawals.filter((w) => {
  if (!isMainAdmin) {
    const cust = customers.find((c) => c.id === w.user_id);
    if (!cust || !isCustomerOfSubAdmin(cust, subAdminInviteCode)) {
      return false;
    }
  }

  const q = withdrawSearchQuery.trim().toLowerCase().replace(/^#/, '');
  if (!q) return true;

  const cust = customers.find((c) => c.id === w.user_id);
  const details = getCustomerDetailsByUserId(w.user_id);

  const searchable = [
    details.customId,
    details.name,
    w.id,
    w.user_id,
    cust?.trc20_address,
    cust?.erc20_address,
    cust?.bank_name,
    cust?.invite_code,
    cust?.referred_by_code,
    cust?.invitation_code,
  ]
    .filter((v) => v !== null && v !== undefined)
    .join(' ')
    .toLowerCase();

  return searchable.includes(q);
});

  const filteredProducts = productsList.filter((p) => {
    const q = productSearchQuery.trim().toLowerCase();

    if (!q) return true;

    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.store || '').toLowerCase().includes(q)
    );
  });

  const filteredChatUsers = chatUsers.filter((uId) => {
    const cust = customers.find((c) => c.id === uId);

    if (!cust) return false;

    if (
      !isMainAdmin &&
      !isCustomerOfSubAdmin(cust, subAdminInviteCode)
    ) {
      return false;
    }

    return filterByUniversalQuery(cust, searchQuery);
  });

  const handleSelectChatUser = async (userId: string) => {
    setActiveChatUserId(userId);

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', 'admin')
      .eq('is_admin', false)
      .eq('is_read', false);

    if (error) {
      showToast('Could not mark messages as read.', 'error');
      return;
    }

    setChatMessages((previous) =>
      previous.map((m) =>
        m.sender_id === userId &&
        m.receiver_id === 'admin' &&
        m.is_admin === false
          ? { ...m, is_read: true }
          : m
      )
    );
  };

  const activeUserChatHistory = chatMessages.filter(
    (m) =>
      m.sender_id === activeChatUserId ||
      m.receiver_id === activeChatUserId
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
  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">

{/* CUSTOMER HEADER */}
<div className="mb-4 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-md">
  {/* Header Title */}
  <div className="flex items-center gap-3 border-b border-blue-100 bg-white/80 px-4 py-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-xl text-white shadow-sm">
      ⚡
    </div>

    <div className="min-w-0 flex-1">
      <h2 className="text-sm font-black text-blue-950">
        Lucky Order Settings
      </h2>

      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
        <span>
          ID:{" "}
          <span className="font-mono font-bold text-blue-800">
            #{selectedUserForModal.custom_id}
          </span>
        </span>

        <span className="text-slate-300">|</span>

        <span>
          Phone:{" "}
          <span className="font-bold text-slate-700">
            {selectedUserForModal.phone || 'Not Set'}
          </span>
        </span>
      </p>

      <p className="mt-1 truncate text-xs text-slate-600">
        Name:{" "}
        <span className="font-bold text-slate-800">
          {selectedUserForModal.full_name ||
            selectedUserForModal.username ||
            selectedUserForModal.name ||
            'Not Set'}
        </span>
      </p>
    </div>

    <div className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
        Tasks
      </p>
      <p className="text-sm font-black text-blue-900">
        {selectedUserForModal.completed_tasks || 0}/25
      </p>
    </div>
  </div>

  {/* Balance and Lucky Order Amount */}
  <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
    <div className="rounded-xl border border-emerald-200 bg-white p-3">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Current Balance
      </p>

      <p className="text-lg font-black text-emerald-700">
        ${Number(selectedUserForModal.balance || 0).toFixed(2)}
      </p>

      {/* Lucky Order negative amount */}
      <div className="mt-2 border-t border-slate-100 pt-2">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Lucky Order Negative Amount
        </p>

        <p className="text-base font-black text-rose-600">
          {(() => {
            const luckyAmount = Number(
              (selectedUserForModal as any).lucky_order_negative_amount ?? 0
            );

            return `-$${Math.abs(luckyAmount).toFixed(2)}`;
          })()}
        </p>
      </div>
    </div>

    {/* Task Progress */}
    <div className="rounded-xl border border-indigo-100 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Daily Task Progress
        </p>

        <p className="text-xs font-black text-indigo-800">
          {selectedUserForModal.completed_tasks || 0} / 25
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-800 to-indigo-500 transition-all duration-300"
          style={{
            width: `${Math.min(
              100,
              (Number(selectedUserForModal.completed_tasks || 0) / 25) * 100
            )}%`,
          }}
        />
      </div>
    </div>
  </div>

  {/* VIP Upgrade */}
  <div className="border-t border-blue-100 bg-white/80 p-3">
    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
      Upgrade User VIP Level
    </label>

    <select
      value={editVipLevel}
      onChange={(e) => setEditVipLevel(e.target.value)}
      className="w-full rounded-xl border-2 border-blue-900/20 bg-white px-3 py-2.5 text-sm font-bold text-blue-950 outline-none transition focus:border-blue-800 focus:ring-2 focus:ring-blue-100"
    >
      <option value="VIP 0 - Regular">VIP 0 - Regular</option>
      <option value="Amazon VIP 1 - $1000">
        Amazon VIP 1 - $1,000
      </option>
      <option value="AliExpress VIP 2 - $2000">
        AliExpress VIP 2 - $2,000
      </option>
      <option value="Shopify VIP 3 - $5000">
        Shopify VIP 3 - $5,000
      </option>
    </select>
  </div>
</div>

    {/* AUTO SLOTS + MANUAL ORDER SIDE BY SIDE */}
    <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">

      {/* AUTO LUCKY ORDER SLOTS */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-800 px-3 py-2">
          <div>
            <h3 className="text-sm font-black text-white">
              ↻ Auto Lucky Order Slots
            </h3>
            <p className="text-[10px] text-emerald-100">
              Seven compact configurable slots
            </p>
          </div>

          {/* SELECTED CUSTOMER AUTO LUCKY ORDER TOGGLE */}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white">
            <span>
              Auto Lucky Order
            </span>

            <input
              type="checkbox"
              checked={Boolean(selectedUserForModal.auto_lucky_order_enabled)}
              onChange={(e) =>
                handleAutoLuckyOrderToggle(
                  selectedUserForModal,
                  e.target.checked
                )
              }
              className="peer sr-only"
              aria-label="Enable Auto Lucky Order for this customer"
            />

            <span
              className="relative h-5 w-9 rounded-full bg-slate-400 transition-colors
                after:absolute after:left-0.5 after:top-0.5
                after:h-4 after:w-4 after:rounded-full
                after:bg-white after:shadow after:transition-transform
                peer-checked:bg-emerald-400
                peer-checked:after:translate-x-4"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* COLUMN HEADINGS */}
            <div className="grid grid-cols-[42px_minmax(65px,1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(65px,0.8fr)_36px] items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2">
              <span className="text-[9px] font-black text-slate-500">SLOT</span>
              <span className="text-[9px] font-black text-slate-500">TASK NO.</span>
              <span className="text-[9px] font-black text-slate-500">MIN USDT</span>
              <span className="text-[9px] font-black text-slate-500">MAX USDT</span>
              <span className="text-[9px] font-black text-slate-500">COMM. %</span>
              <span className="text-center text-[9px] font-black text-slate-500">EDIT</span>
            </div>

            {Array.from({ length: 7 }, (_, index) => {
              const slot = autoSlots[index] ?? {
                id: index + 1,
                taskNum: '',
                minAmount: '',
                maxAmount: '',
                comm: '',
                active: false,
              };

              const updateSlot = (
                field: 'taskNum' | 'minAmount' | 'maxAmount' | 'comm' | 'active',
                value: string | boolean
              ) => {
                setAutoSlots((prev) => {
                  const next = Array.from({ length: 7 }, (_, i) => ({
                    ...(prev[i] || {}),
                    id: prev[i]?.id ?? i + 1,
                    taskNum: prev[i]?.taskNum ?? '',
                    minAmount: prev[i]?.minAmount ?? '',
                    maxAmount: prev[i]?.maxAmount ?? '',
                    comm: prev[i]?.comm ?? '',
                    active: prev[i]?.active ?? false,
                  }));

                  next[index] = {
                    ...next[index],
                    [field]: value,
                  };

                  return next;
                });
              };

              return (
                <div
                  key={index + 1}
                  className={`border-b border-slate-100 last:border-b-0 ${
                    slot.active ? 'bg-emerald-50/60' : 'bg-white'
                  }`}
                >
                  <div className="grid grid-cols-[42px_minmax(65px,1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(65px,0.8fr)_36px] items-center gap-1 px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black ${
                          slot.active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>

                    <span className="truncate text-xs font-bold text-slate-800">
                      {slot.taskNum || '—'}
                    </span>

                    <span className="truncate font-mono text-xs text-slate-700">
                      {slot.minAmount || '—'}
                    </span>

                    <span className="truncate font-mono text-xs text-slate-700">
                      {slot.maxAmount || '—'}
                    </span>

                    <span className="truncate text-xs font-semibold text-indigo-700">
                      {slot.comm ? `${slot.comm}%` : '—'}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const editor = document.getElementById(
                          `auto-slot-editor-${index + 1}`
                        );
                        editor?.classList.toggle('hidden');
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-sm hover:bg-emerald-50"
                      aria-label={`Edit Auto Slot ${index + 1}`}
                      title={`Edit Slot ${index + 1}`}
                    >
                      ✏️
                    </button>
                  </div>

                  <div
                    id={`auto-slot-editor-${index + 1}`}
                    className="hidden border-t border-emerald-100 bg-emerald-50/50 p-2"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-900">
                        EDIT SLOT #{index + 1}
                      </span>

                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                        {slot.active ? 'Enabled' : 'Disabled'}
                        <input
                          type="checkbox"
                          checked={Boolean(slot.active)}
                          onChange={(e) =>
                            updateSlot('active', e.target.checked)
                          }
                          className="h-4 w-4 accent-emerald-600"
                          aria-label={`Enable Auto Slot ${index + 1}`}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <label className="text-[10px] font-bold text-slate-600">
                        Task Number
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={slot.taskNum ?? ''}
                          onChange={(e) =>
                            updateSlot('taskNum', e.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                        />
                      </label>

                      <label className="text-[10px] font-bold text-slate-600">
                        Minimum
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={slot.minAmount ?? ''}
                          onChange={(e) =>
                            updateSlot('minAmount', e.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                        />
                      </label>

                      <label className="text-[10px] font-bold text-slate-600">
                        Maximum
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={slot.maxAmount ?? ''}
                          onChange={(e) =>
                            updateSlot('maxAmount', e.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                        />
                      </label>

                      <label className="text-[10px] font-bold text-slate-600">
                        Commission %
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={slot.comm ?? ''}
                          onChange={(e) =>
                            updateSlot('comm', e.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-2">
          <button
            type="button"
            onClick={handleResetAutoSlots}
            disabled={autoSlotsSaving}
            className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700 disabled:opacity-50"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleSaveAutoSlots}
            disabled={autoSlotsSaving}
            className="flex-[2] rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {autoSlotsSaving ? 'Saving...' : 'Save Auto Slots'}
          </button>
        </div>
      </section>

      {/* MANUAL LUCKY ORDER */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-indigo-200 bg-white">
        <div className="bg-indigo-900 px-3 py-3">
          <h3 className="text-sm font-black text-white">
            ⚡ Manual Lucky Order
          </h3>
          <p className="mt-1 text-[10px] text-indigo-100">
            Publish an individual customer's order
          </p>
        </div>

        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-600">
              Task Number
              <input
                type="number"
                min="1"
                max="25"
                placeholder="e.g. 5"
                value={slotTaskNum}
                onChange={(e) => setSlotTaskNum(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="text-[10px] font-bold text-slate-600">
              Commission %
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={slotCommPercent}
                onChange={(e) => setSlotCommPercent(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="text-[10px] font-bold text-slate-600">
              Minimum USDT
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={slotMinAmount}
                onChange={(e) => setSlotMinAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="text-[10px] font-bold text-slate-600">
              Maximum USDT
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={slotMaxAmount}
                onChange={(e) => setSlotMaxAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handlePublishLuckyOrderSlot}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-indigo-700"
          >
            ⚡ Publish Manual Order
          </button>

          <p className="text-[10px] leading-4 text-slate-500">
            Existing manual order publish and funding workflow is preserved.
          </p>
        </div>
      </section>
    </div>

    {/* CONFIGURED MANUAL ORDERS */}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div>
          <h3 className="text-xs font-black text-slate-900">
            Configured Manual Lucky Orders
          </h3>
          <p className="text-[10px] text-slate-500">
            Existing manual orders for this customer
          </p>
        </div>

        <button
          type="button"
          disabled={customTasksList.length === 0}
          onClick={handleClearLuckyOrderConfig}
          className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear Completed
        </button>
      </div>

      <div className="max-h-36 space-y-1.5 overflow-y-auto p-2">
        {customTasksList.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-4 text-center text-[10px] text-slate-400">
            No synchronized Lucky Orders for this user.
          </p>
        ) : (
          customTasksList.map((task) => (
            <div
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800">
                  Task #{task.task_number}
                  <span className="ml-2 font-mono text-indigo-600">
                    ${task.min_amount} – ${task.max_amount} USDT
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  Commission: {task.commission_rate ?? 10}% · Configured
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteCustomTask(task.id)}
                className="rounded-lg bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>

    {/* PAGE ACTIONS */}
    <div className="flex flex-col justify-end gap-2 border-t border-slate-200 pt-3 sm:flex-row">
      <button
        type="button"
        onClick={() => setIsFullPageTaskSettings(false)}
        className="rounded-lg bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
      >
        Back to User List
      </button>

      <button
        type="button"
        onClick={handleSaveFullPageTaskSettings}
        className="rounded-lg bg-blue-900 px-6 py-2.5 text-xs font-black text-white hover:bg-blue-800"
      >
        Save VIP Settings
      </button>
    </div>
  </div>
) : null}

{/* TAB 1: USERS */}
{!isFullPageTaskSettings && activeTab === 'users' && (
  <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">

    {/* Professional Header */}
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900">
          Customer Management
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Manage customer accounts, balances, task permissions and settings.
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-600">
          Assigned Customers:{' '}
          <span className="font-black text-blue-700">
            {filteredCustomers.length}
          </span>
        </p>
      </div>

      <div className="w-full lg:max-w-xs">
        <input
          type="text"
          placeholder="Search ID, name, phone or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>

    {/* Customer Table */}
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
   
<tr className="bg-[#1e3a8a] text-white font-bold">
  <th className="p-3">User</th>
  <th className="p-3">Invite Code</th>
  <th className="p-3">Email / VIP</th>
  <th className="p-3">Tasks</th>
  <th className="p-3">Balance</th>
  <th className="p-3 text-center">Task Controls</th>
  <th className="p-3 text-center">Status</th>
  <th className="p-3 text-center">Actions</th>
</tr>

        </thead>

        <tbody className="divide-y divide-slate-100">
          {filteredCustomers.map((c) => (
            <tr
              key={c.id}
              className="transition-colors hover:bg-blue-50/50"
            >
              {/* User */}
              <td className="whitespace-nowrap px-4 py-4">
                <div className="font-mono text-sm font-black text-blue-950">
                  #{c.custom_id}
                </div>
                <div className="mt-1 font-semibold text-slate-700">
                  👤 {c.full_name || c.username || c.name || 'No Name'}
                </div>
              </td>

              {/* Invitation Code */}
              <td className="whitespace-nowrap px-4 py-4">
                <div className="font-mono text-xs font-bold text-slate-700">
                  {renderSimpleInvitationCodes(c)}
                </div>
              </td>

              {/* Email and VIP */}
              <td className="min-w-[190px] px-4 py-4">
                <div className="break-words font-semibold text-slate-700">
                  {c.email || 'customer@appuser.local'}
                </div>
                <span className="mt-1.5 inline-block rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">
                  {c.vip_level || 'VIP 0 - Regular'}
                </span>
              </td>

              {/* Task Progress */}
              <td className="whitespace-nowrap px-4 py-4 text-center">
                <div className="font-mono text-sm font-black text-blue-950">
                  {c.completed_tasks || 0} / 25
                </div>
                <div className="mx-auto mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          (Number(c.completed_tasks || 0) / 25) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </td>

          
<td className="p-3 whitespace-nowrap">
  <div className="font-black text-emerald-600 text-sm">
    ${Number(c.balance || 0).toFixed(2)}
  </div>

  <div className="flex items-center gap-2 mt-2">
    <button
      type="button"
      onClick={() => {
        setSelectedUserForModal(c);
        setModalType('add_funds');
        setFundInput('');
      }}
      className="rounded-lg bg-emerald-600 px-2.5 py-1.5
        text-[10px] font-bold text-white hover:bg-emerald-700"
    >
      + Add
    </button>

    <button
      type="button"
      onClick={() => {
        setSelectedUserForModal(c);
        setModalType('cut_funds');
        setFundInput('');
      }}
      className="rounded-lg bg-rose-600 px-2.5 py-1.5
        text-[10px] font-bold text-white hover:bg-rose-700"
    >
      − Deduct
    </button>
  </div>
</td>

<td className="p-3">
  <div className="flex items-center justify-center gap-3 whitespace-nowrap">

    {/* Auto Tasks */}
    <div className="flex flex-col items-center gap-1">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(c.auto_task_lock)}
          onChange={(e) =>
            handleAutoTaskLockToggle(c, e.target.checked)
          }
          className="sr-only peer"
        />
        <div className="w-9 h-5 rounded-full bg-slate-300
          peer-checked:bg-emerald-500
          after:content-[''] after:absolute after:top-[2px]
          after:left-[2px] after:h-4 after:w-4
          after:rounded-full after:bg-white after:shadow
          after:transition-transform
          peer-checked:after:translate-x-4">
        </div>
      </label>
      <span className="text-[10px] font-semibold text-slate-600">
        Auto
      </span>
    </div>

    {/* Lucky Order */}
    <div className="flex flex-col items-center gap-1">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(c.auto_lucky_order_enabled)}
          onChange={(e) =>
            handleAutoLuckyOrderToggle(c, e.target.checked)
          }
          className="sr-only peer"
        />
        <div className="w-9 h-5 rounded-full bg-slate-300
          peer-checked:bg-amber-500
          after:content-[''] after:absolute after:top-[2px]
          after:left-[2px] after:h-4 after:w-4
          after:rounded-full after:bg-white after:shadow
          after:transition-transform
          peer-checked:after:translate-x-4">
        </div>
      </label>
      <span className="text-[10px] font-semibold text-slate-600">
        Lucky
      </span>
    </div>

    {/* Manual Tasks */}
    <div className="flex flex-col items-center gap-1">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(c.manual_task_lock)}
          onChange={(e) =>
            handleManualTaskLockToggle(c, e.target.checked)
          }
          className="sr-only peer"
        />
        <div className="w-9 h-5 rounded-full bg-slate-300
          peer-checked:bg-rose-500
          after:content-[''] after:absolute after:top-[2px]
          after:left-[2px] after:h-4 after:w-4
          after:rounded-full after:bg-white after:shadow
          after:transition-transform
          peer-checked:after:translate-x-4">
        </div>
      </label>
      <span className="text-[10px] font-semibold text-slate-600">
        Manual
      </span>
    </div>

  </div>
</td>


              {/* Account Status */}
              <td className="px-4 py-4">
                <select
                  value={c.is_frozen ? 'frozen' : 'active'}
                  onChange={(e) =>
                    handleStatusChange(c, e.target.value === 'frozen')
                  }
                  className={`rounded-lg border px-2.5 py-2 text-[10px] font-bold outline-none focus:ring-2 ${
                    c.is_frozen
                      ? 'border-rose-200 bg-rose-50 text-rose-700 focus:ring-rose-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-100'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="frozen">Disabled / Frozen</option>
                </select>
              </td>

<td className="p-3">
  <div className="flex items-center justify-center gap-2.5">

    <button
      type="button"
      onClick={() => handleResetUserTasks(c)}
      title="Reset Tasks"
      className="h-10 w-10 rounded-xl border border-slate-300
        bg-white text-slate-700 text-2xl font-bold
        shadow-sm hover:bg-slate-100 hover:shadow
        transition flex items-center justify-center"
    >
      ↻
    </button>

    <button
      type="button"
      onClick={() => handleOpenFullPageTaskSettings(c)}
      title="Task Settings"
      className="h-10 w-10 rounded-xl border border-blue-200
        bg-blue-50 text-blue-800 text-xl
        shadow-sm hover:bg-blue-100 hover:shadow
        transition flex items-center justify-center"
    >
      ⚙
    </button>

    <button
      type="button"
      onClick={() => handleOpenUserProfileModal(c)}
      title="Customer Profile"
      className="h-10 w-10 rounded-xl border border-emerald-200
        bg-emerald-50 text-emerald-800 text-xl
        shadow-sm hover:bg-emerald-100 hover:shadow
        transition flex items-center justify-center"
    >
      👤
    </button>

  </div>
</td>
      </tr>
          ))}

          {filteredCustomers.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center">
                <div className="text-sm font-bold text-slate-500">
                  No customers found
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Try a different search term.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

        {/* TAB 2: DEPOSIT RECORDS */}
        {!isFullPageTaskSettings && activeTab === 'deposits' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-4 gap-3">
              <div>
                <h2 className="text-lg font-black text-blue-900">
                  Deposit Records & Approvals
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Customer deposits, TRC20 verification and approval history
                </p>
              </div>

              <div className="w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search ID, name, phone, TXID or wallet..."
                  value={depositSearchQuery}
                  onChange={(e) => setDepositSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* TRC20 Auto Verification */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-blue-950">
                    TRON TRC20 Auto-Verify & Release
                  </h3>
                  <p className="text-xs text-blue-800 mt-1">
                    Automatic release sirf confirmed USDT TRC20 transaction,
                    correct receiving wallet aur exact amount match hone par.
                    Unverified deposits pending rahenge.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCheckTrc20Transfers}
                  disabled={scannerLoading}
                  className="shrink-0 rounded-xl bg-blue-700 hover:bg-blue-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scannerLoading ? 'Checking Transfers...' : 'Check Confirm Funds'}
                </button>
              </div>

              {/* Scanner summary */}
              {scannerResult && (
                <div className="space-y-3">
                  {scannerResult.error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                      {scannerResult.error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-blue-100 bg-white p-3">
                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500">
                          Transfers Checked
                        </p>
                        <p className="text-2xl font-black text-blue-800 mt-1">
                          {scannerResult.transfers_checked ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-white p-3">
                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500">
                          Deposits Released
                        </p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">
                          {scannerResult.released ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl border border-amber-100 bg-white p-3">
                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500">
                          Skipped / Unmatched
                        </p>
                        <p className="text-2xl font-black text-amber-600 mt-1">
                          {scannerResult.skipped ?? 0}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Detailed transactions returned by Edge Function */}
                  {Array.isArray(scannerResult.transactions) &&
                    scannerResult.transactions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-800">
                          TRC20 Transaction Details
                        </h4>

                        {scannerResult.transactions.map((tx: {
                          txid?: string;
                          transaction_id?: string;
                          release_status?: string;
                          status?: string;
                          customer_name?: string;
                          customer_id?: string;
                          submitted_amount?: string | number;
                          verified_amount?: string | number;
                          amount?: string | number;
                          block_timestamp?: string | number;
                          timestamp?: string | number;
                          from?: string;
                          sender_address?: string;
                          to?: string;
                          receiving_address?: string;
                        }, index: number) => (
                          <div
                            key={tx.txid || tx.transaction_id || index}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <span className="text-xs font-black text-slate-800">
                                Transaction {index + 1}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                                  tx.release_status === 'released' ||
                                  tx.status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {tx.release_status ||
                                  tx.status ||
                                  'Verified transfer'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-slate-500 font-semibold">
                                  Customer
                                </p>
                                <p className="font-bold text-slate-800 break-words">
                                  {tx.customer_name || 'See deposit record'}
                                  {tx.customer_id ? ` (${tx.customer_id})` : ''}
                                </p>
                              </div>

                              <div>
                                <p className="text-slate-500 font-semibold">
                                  Submitted Deposit
                                </p>
                                <p className="font-black text-slate-800">
                                  {tx.submitted_amount != null
                                    ? `$${tx.submitted_amount} USDT`
                                    : 'Not provided'}
                                </p>
                              </div>

                              <div>
                                <p className="text-slate-500 font-semibold">
                                  Blockchain Verified Amount
                                </p>
                                <p className="font-black text-emerald-700">
                                  {tx.verified_amount != null
                                    ? `$${tx.verified_amount} USDT`
                                    : tx.amount != null
                                      ? `$${tx.amount} USDT`
                                      : 'Not available'}
                                </p>
                              </div>

                              <div>
                                <p className="text-slate-500 font-semibold">
                                  Blockchain Date & Time
                                </p>
                                <p className="font-semibold text-slate-800">
                                  {tx.block_timestamp
                                    ? new Date(
                                        Number(tx.block_timestamp) < 1e12
                                          ? Number(tx.block_timestamp) * 1000
                                          : Number(tx.block_timestamp)
                                      ).toLocaleString()
                                    : tx.timestamp
                                      ? new Date(
                                          Number(tx.timestamp) < 1e12
                                            ? Number(tx.timestamp) * 1000
                                            : Number(tx.timestamp)
                                        ).toLocaleString()
                                      : 'Not provided'}
                                </p>
                              </div>

                              <div className="sm:col-span-2">
                                <p className="text-slate-500 font-semibold">
                                  Transaction ID (TXID)
                                </p>
                                <p className="font-mono text-[11px] text-slate-800 break-all">
                                  {tx.txid || tx.transaction_id || 'Not provided'}
                                </p>
                              </div>

                              <div className="sm:col-span-2">
                                <p className="text-slate-500 font-semibold">
                                  Sender Wallet Address
                                </p>
                                <p className="font-mono text-[11px] text-slate-800 break-all">
                                  {tx.from ||
                                    tx.sender_address ||
                                    'Not provided by scanner'}
                                </p>
                              </div>

                              <div className="sm:col-span-2">
                                <p className="text-slate-500 font-semibold">
                                  Receiving Wallet Address
                                </p>
                                <p className="font-mono text-[11px] text-slate-800 break-all">
                                  {tx.to ||
                                    tx.receiving_address ||
                                    'Not provided by scanner'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {scannerResult &&
                    !scannerResult.error &&
                    (!Array.isArray(scannerResult.transactions) ||
                      scannerResult.transactions.length === 0) && (
                      <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                        Scanner summary received. No detailed transactions
                        were returned in this response. Unmatched deposits
                        must remain pending for manual review.
                      </p>
                    )}

                  {/* Scanner diagnostics */}
                  <details className="rounded-xl border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-bold text-slate-600">
                      Scanner response / diagnostic details
                    </summary>
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-700">
                      {JSON.stringify(scannerResult, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>

            {/* Deposit records table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white font-bold">
                    <th className="p-3">Customer</th>
                    <th className="p-3">Deposit Amount</th>
                    <th className="p-3">Wallet / TXID</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredDeposits.length > 0 ? (
                    filteredDeposits.map((dep) => {
                      const custDetails = getCustomerDetailsByUserId(dep.user_id);

                      return (
                        <tr key={dep.id} className="hover:bg-slate-50 transition">
                          {/* Customer */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="text-sm font-mono font-black text-blue-900">
                              {custDetails.customId || 'No ID'}
                            </div>
                            <div className="text-xs font-bold text-slate-700 mt-0.5">
                              👤 {custDetails.name || 'Unknown customer'}
                            </div>
                        
                          </td>

                          {/* Amount */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-mono font-black text-emerald-600 text-sm">
                              ${Number(dep.amount || 0).toFixed(2)} USDT
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              {dep.payment_method || 'trc20'}
                            </div>
                          </td>

                          {/* Wallet and TXID */}
                          <td className="p-3 min-w-56 max-w-xs">
                            <div className="text-[10px] font-bold text-slate-500 mb-1">
                              Submitted Wallet Address
                            </div>
                            <div className="font-mono text-slate-700 text-[11px] break-all">
                              {dep.trc20_address || 'Not provided'}
                            </div>

                            {dep.txid && (
                              <div className="mt-2">
                                <div className="text-[10px] font-bold text-slate-500 mb-1">
                                  TXID
                                </div>
                                <div className="font-mono text-[10px] text-blue-700 break-all">
                                  {dep.txid}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="p-3 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                            {dep.created_at
                              ? new Date(dep.created_at).toLocaleString()
                              : 'Not available'}
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black ${
                                dep.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : dep.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {String(dep.status || 'pending').toUpperCase()}
                            </span>

                            {dep.status === 'pending' && (
                              <div className="text-[10px] text-amber-700 mt-1 font-semibold">
                                Awaiting approval / verification
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right whitespace-nowrap">
                            {dep.status === 'pending' ? (
                              <div className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDepositAction(dep, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl shadow transition"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDepositAction(dep, 'rejected')}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-xl shadow transition"
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
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No deposit records found.
                      </td>
                    </tr>
                  )}
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
  <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">

    {/* Professional Heading */}
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900">
          Task Management & User Overview
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Manage customer balances, task progress, locks and individual settings.
        </p>
      </div>

      <div className="w-full lg:max-w-xs">
        <input
          type="text"
          placeholder="Search customers or tasks..."
          value={taskSearchQuery}
          onChange={(e) => setTaskSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>

    {/* Customer Table */}
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="bg-gradient-to-r from-blue-950 to-blue-800 text-white">
            <th className="whitespace-nowrap px-4 py-4 font-bold">Users</th>
            <th className="whitespace-nowrap px-4 py-4 font-bold">Invite Code</th>
            <th className="whitespace-nowrap px-4 py-4 text-center font-bold">Balance</th>
            <th className="whitespace-nowrap px-4 py-4 text-center font-bold">VIP Level</th>
            <th className="whitespace-nowrap px-4 py-4 text-center font-bold">Tasks</th>
            <th className="whitespace-nowrap px-4 py-4 text-center font-bold">Task Lock</th>
            <th className="whitespace-nowrap px-4 py-4 text-right font-bold">Task Settings</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {filteredTaskCustomers.map((c) => {
            const negVal = Number(c.running_tasks || 0);
            const hasNeg = negVal < 0;
            const currentBalance = Number(c.balance || 0);
            const completedTasks = Number(c.completed_tasks || 0);

            return (
              <tr
                key={c.id}
                className="transition-colors hover:bg-blue-50/50"
              >
                {/* User */}
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="font-mono text-sm font-black text-blue-950">
                    #{c.custom_id}
                  </div>
                  <div className="mt-1 font-semibold text-slate-700">
                    <span className="mr-1">👤</span>
                    {c.full_name || c.username || c.name || 'No Name'}
                  </div>
                </td>

                {/* Invitation Codes */}
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="inline-block rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1.5 font-mono text-xs font-bold text-amber-900">
                    {renderSimpleInvitationCodes(c)}
                  </div>
                </td>

                {/* Current balance + negative amount */}
                <td className="px-4 py-4 text-center">
                  <div className="inline-flex min-w-[100px] flex-col items-center gap-1">
                    <span className="font-mono text-sm font-black text-emerald-700">
                      ${currentBalance.toFixed(2)}
                    </span>

                    {hasNeg && (
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-xs font-bold text-rose-600">
                        -${Math.abs(negVal).toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>

                {/* VIP Level */}
                <td className="whitespace-nowrap px-4 py-4 text-center">
                  <span className="inline-block rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1.5 font-bold text-amber-800">
                    {c.vip_level || 'VIP 0'}
                  </span>
                </td>

                {/* Tasks */}
                <td className="whitespace-nowrap px-4 py-4 text-center">
                  <div className="font-mono text-sm font-black text-blue-950">
                    {completedTasks} / 25
                  </div>
                  <div className="mx-auto mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, (completedTasks / 25) * 100))}%`,
                      }}
                    />
                  </div>
                </td>

                {/* Existing Task Lock Handler */}
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(c.auto_task_lock)}
                        onChange={(e) =>
                          handleAutoTaskLockToggle(c, e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-transform after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100" />
                    </label>

                    <span
                      className={`text-[10px] font-bold ${
                        c.auto_task_lock
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {c.auto_task_lock ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                </td>

                {/* Existing Settings Handler */}
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleOpenFullPageTaskSettings(c)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <span>⚙</span>
                    Settings
                  </button>
                </td>
              </tr>
            );
          })}

          {filteredTaskCustomers.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-sm font-medium text-slate-400"
              >
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* TAB 5: PRODUCTS MANAGEMENT */}
{!isFullPageTaskSettings && activeTab === 'products' && isMainAdmin && (
  <div className="space-y-6">

    {/* HEADER */}
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />

      <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
            Admin Inventory Control
          </p>
          <h2 className="text-2xl font-black">
            Product Batch Manager
          </h2>
          <p className="mt-2 text-xs text-slate-300">
            Manage products, ratings, prices, VIP levels and batches.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFetchLiveProductsFromAPI}
          disabled={isFetchingLive}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
        >
          {isFetchingLive ? 'Fetching...' : '📥 Fetch Products'}
        </button>
      </div>
    </div>

    {/* LUCKY ORDER PRODUCTS — SEPARATE INVENTORY */}
    <div className="overflow-hidden rounded-3xl border border-violet-300/30 bg-[#0b0c10] shadow-xl shadow-violet-950/20">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !luckyOrderOpen;
          setLuckyOrderOpen(nextOpen);
          if (nextOpen) void fetchLuckyOrderProducts();
        }}
        className="group relative flex w-full items-center justify-between gap-4 overflow-hidden bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-950 p-5 text-left transition hover:brightness-110 md:p-6"
      >
        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/15 text-3xl shadow-inner">
            🎁
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">
              Exclusive Inventory
            </p>
            <h3 className="mt-1 text-xl font-black text-white md:text-2xl">
              Lucky Order Products
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Separate inventory · Manage up to 250 products
            </p>
          </div>
        </div>

        <div className="relative flex shrink-0 items-center gap-3">
          <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1.5 text-xs font-black text-violet-200">
            {luckyOrderProducts.length}/250
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-white">
            {luckyOrderOpen ? '−' : '+'}
          </span>
        </div>
      </button>

      {luckyOrderOpen && (
        <div className="space-y-6 border-t border-violet-400/20 p-4 md:p-6">
          {/* INVENTORY SUMMARY */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-950/60 to-slate-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                Total Products
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {luckyOrderProducts.length}
                <span className="text-sm text-slate-400"> / 50</span>
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Active Products
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {luckyOrderProducts.filter((p) => p.is_active).length}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-950/40 to-slate-900 p-4 md:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Available Capacity
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {Math.max(0, 50 - luckyOrderProducts.length)}
              </p>
            </div>
          </div>

          {/* ADD / EDIT PRODUCT FORM */}
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-4 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
                {luckyOrderEditingId !== null ? '✏️' : '➕'}
              </div>
              <div>
                <h4 className="font-black text-white">
                  {luckyOrderEditingId !== null
                    ? 'Edit Lucky Order Product'
                    : 'Add New Lucky Order Product'}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Add product details, image, rating and level label.
                </p>
              </div>
            </div>

            <form
              onSubmit={saveLuckyOrderProduct}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Product Name
                </label>
                <input
                  required
                  maxLength={160}
                  value={luckyOrderName}
                  onChange={(e) => setLuckyOrderName(e.target.value)}
                  placeholder="Enter product name"
                  className="w-full rounded-xl border border-slate-700 bg-[#0b0c10] p-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Store
                </label>
                <select
                  value={luckyOrderStore}
                  onChange={(e) => setLuckyOrderStore(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0b0c10] p-3 text-sm font-bold text-white outline-none focus:border-violet-400"
                >
                  <option value="Amazon">Amazon</option>
                  <option value="AliExpress">AliExpress</option>
                  <option value="Shopify">Shopify</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Product Price (USDT)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={luckyOrderPrice}
                  onChange={(e) => setLuckyOrderPrice(e.target.value)}
                  placeholder="e.g. 185.00"
                  className="w-full rounded-xl border border-slate-700 bg-[#0b0c10] p-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={luckyOrderImageUrl}
                  onChange={(e) => setLuckyOrderImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-700 bg-[#0b0c10] p-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Upload Image (JPG, PNG, WEBP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setLuckyOrderImageFile(e.target.files?.[0] || null)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#0b0c10] p-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:font-bold file:text-white"
                />
                {luckyOrderImageFile && (
                  <p className="mt-1 truncate text-xs text-violet-300">
                    {luckyOrderImageFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Product Rating
                </label>
                <select
                  value={luckyOrderRating}
                  onChange={(e) => setLuckyOrderRating(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0b0c10] p-3 text-sm text-white outline-none focus:border-violet-400"
                >
                  <option value="5">★★★★★ — 5 Stars</option>
                  <option value="4">★★★★☆ — 4 Stars</option>
                  <option value="3">★★★☆☆ — 3 Stars</option>
                  <option value="2">★★☆☆☆ — 2 Stars</option>
                  <option value="1">★☆☆☆☆ — 1 Star</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Marketing Commission Level
                </label>
                <select
                  value={luckyOrderMarketingLevel}
                  onChange={(e) => setLuckyOrderMarketingLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0b0c10] p-3 text-sm text-white outline-none focus:border-violet-400"
                >
                 <option value="Regular">Regular</option>

                  <option value="VIP 1">VIP 1</option>
                  <option value="VIP 2">VIP 2</option>
                  <option value="VIP 3">VIP 3</option>
                  <option value="VIP 4">VIP 4</option>
                  <option value="VIP 5">VIP 5</option>
                </select>
              </div>

           
              <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3">
                <button
                  type="submit"
                  disabled={
                    luckyOrderSaving ||
                    (luckyOrderEditingId === null &&
                      luckyOrderProducts.length >= 250)
                  }
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {luckyOrderSaving
                    ? 'Saving Product...'
                    : luckyOrderEditingId !== null
                      ? '💾 Save Product Changes'
                      : '+ Add Lucky Order Product'}
                </button>

                {luckyOrderEditingId !== null && (
                  <button
                    type="button"
                    onClick={resetLuckyOrderForm}
                    disabled={luckyOrderSaving}
                    className="rounded-xl border border-slate-600 px-5 py-3 text-xs font-black text-slate-300 transition hover:bg-slate-800"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
{/* BLUE LUCKY PRODUCTS GALLERY */}
<div className="overflow-hidden rounded-3xl border border-blue-400/30 bg-[#0b0c10] shadow-xl shadow-blue-950/30">
  <button
    type="button"
    onClick={() =>
      setLuckyProductsGalleryOpen((prev) => !prev)
    }
    className="flex w-full items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-950 p-5 text-left transition hover:brightness-110 md:p-6"
  >
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-400/15 text-3xl">
        🗂️
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
          Separate Product Gallery
        </p>

        <h4 className="mt-1 text-xl font-black text-white">
          Lucky Products
        </h4>

        <p className="mt-1 text-xs text-blue-100/70">
          Click to view moved products
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5 text-xs font-black text-blue-200">
        {luckyOrderProducts.filter((p) => p.in_lucky_gallery).length}
      </span>

      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-white">
        {luckyProductsGalleryOpen ? '−' : '+'}
      </span>
    </div>
  </button>

  {luckyProductsGalleryOpen && (
    <div className="border-t border-blue-400/20 p-4 md:p-6">
      {luckyOrderProducts.filter((p) => p.in_lucky_gallery).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-blue-400/30 bg-blue-950/20 p-8 text-center">
          <p className="text-3xl">🗂️</p>
          <p className="mt-3 font-bold text-white">
            No products in Lucky Products yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Use Move In on any product below to add it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {luckyOrderProducts
            .filter((p) => p.in_lucky_gallery)
            .map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-blue-400/25 bg-slate-900"
              >
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-blue-950 to-slate-900 p-2">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full max-w-full rounded-lg object-contain"
                    />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>

                <div className="space-y-2 p-3">
                  <p className="break-words text-xs font-bold text-white">
                    {product.name}
                  </p>

                  <p className="text-sm font-black text-emerald-400">
                    ${Number(product.price).toFixed(2)}
                  </p>

                  <button
                    type="button"
                    onClick={() => void toggleLuckyProductGallery(product)}
                    className="w-full rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-2 text-xs font-black text-amber-200 transition hover:bg-amber-500/20"
                  >
                    ↩ Move Out
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )}
</div>
          {/* PRODUCT INVENTORY */}
          <div>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h4 className="font-black text-white">
                  🎁 Lucky Order Inventory
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  These products are separate from your regular batches.
                </p>
              </div>

              <input
                value={luckyOrderSearch}
                onChange={(e) => setLuckyOrderSearch(e.target.value)}
                placeholder="🔎 Search Lucky products..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-white outline-none focus:border-violet-400 sm:max-w-xs"
              />
            </div>

            {luckyOrderLoading ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-12 text-center">
                <p className="text-sm font-bold text-violet-300">
                  Loading Lucky Order products...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
{luckyOrderProducts
  .filter((p) => !p.in_lucky_gallery)
  .filter((p) =>
    `${p.name} ${p.store} ${p.marketing_level}`
      .toLowerCase()
      .includes(luckyOrderSearch.trim().toLowerCase())
  )
  .map((product) => (
                    <div
                      key={product.id}
                      className="group overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-950/20"
                    >
                      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950/50 p-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full max-w-full rounded-xl object-contain transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="text-5xl">📦</span>
                        )}

                        <span
                          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-black ${
                            product.is_active
                              ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                              : 'border border-amber-400/30 bg-amber-400/10 text-amber-300'
                          }`}
                        >
                          {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h5 className="break-words text-sm font-black text-white">
                              {product.name}
                            </h5>
                            <p className="mt-1 text-xs text-slate-400">
                              {product.store}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-black text-emerald-400">
                            ${Number(product.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                            ★ {Number(product.rating).toFixed(1)} / 5
                          </span>

                          <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-1 text-xs font-black text-violet-200">
                            {product.marketing_level}
                          </span>
                        </div>

                      
                        <div className="flex gap-2 border-t border-slate-700 pt-3">
                          <button
                            type="button"
                            onClick={() => editLuckyOrderProduct(product)}
                            className="flex-1 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2.5 text-xs font-black text-violet-200 transition hover:bg-violet-500/20"
                          ><div className="flex flex-wrap gap-2 border-t border-slate-700 pt-3">

  {/* EDIT BUTTON — pehle se mojood */}
  <button
    type="button"
    onClick={() => editLuckyOrderProduct(product)}
    className="flex-1 rounded-xl border border-slate-600 px-3 py-2.5 text-xs font-black"
  >
    ✏️ Edit
  </button>

  {/* MOVE IN / MOVE OUT BUTTON — yahan paste karein */}
  <button
    type="button"
    onClick={() => void toggleLuckyProductGallery(product)}
    className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-black transition ${
      product.in_lucky_gallery
        ? 'border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
        : 'border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20'
    }`}
  >
    {product.in_lucky_gallery ? '↩ Move Out' : '＋ Move In'}
  </button>

  {/* REMOVE BUTTON — aapka pehle se mojood code */}
  <button
    type="button"
    onClick={() => deleteLuckyOrderProduct(product.id)}
    className="flex-1 rounded-xl border border-red-500/30 px-3 py-2.5 text-xs font-black"
  >
    🗑 Remove
  </button>

</div>
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteLuckyOrderProduct(product.id)}
                            className="flex-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/20"
                          >
                            🗑 Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {luckyOrderProducts.filter((p) =>
                  `${p.name} ${p.store} ${p.marketing_level}`
                    .toLowerCase()
                    .includes(luckyOrderSearch.trim().toLowerCase())
                ).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center sm:col-span-2 xl:col-span-3">
                    <div className="text-4xl">🎁</div>
                    <p className="mt-3 font-black text-white">
                      {luckyOrderProducts.length === 0
                        ? 'No Lucky Order products yet'
                        : 'No matching products found'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {luckyOrderProducts.length === 0
                        ? 'Add your first product using the form above.'
                        : 'Try another search term.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* SUMMARY CARDS */}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <button
        type="button"
        onClick={() => setBatchManagerSelectedBatch('all')}
        className={`rounded-2xl border p-4 text-left shadow-sm transition ${
          batchManagerSelectedBatch === 'all'
            ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-100'
            : 'border-slate-200 bg-white hover:border-blue-300'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          All Products
        </p>
        <p className="mt-2 text-3xl font-black text-blue-900">
          {productsList.length}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">View inventory</p>
      </button>

      <button
        type="button"
        onClick={() => setBatchManagerSelectedBatch('unassigned')}
        className={`rounded-2xl border p-4 text-left shadow-sm transition ${
          batchManagerSelectedBatch === 'unassigned'
            ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-100'
            : 'border-slate-200 bg-white hover:border-amber-300'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Unassigned
        </p>
        <p className="mt-2 text-3xl font-black text-amber-600">
          {productsList.filter((p) => p.rotation_batch == null).length}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">Not in a batch</p>
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Assigned
        </p>
        <p className="mt-2 text-3xl font-black text-emerald-600">
          {productsList.filter((p) => p.rotation_batch != null).length}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">Products in batches</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Batch Capacity
        </p>
        <p className="mt-2 text-3xl font-black text-indigo-700">150</p>
        <p className="mt-1 text-[10px] text-slate-500">6 batches × 25 products</p>
      </div>
    </div>

    {/* BATCH FOLDERS */}
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
      <div className="mb-4">
        <h3 className="text-base font-black text-slate-900">
          📁 Product Batches
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Select a batch to view its products. Each batch allows up to 25 products.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((batch) => {
          const batchCount = productsList.filter(
            (p) => Number(p.rotation_batch) === batch
          ).length;

          const selected = batchManagerSelectedBatch === batch;
          const full = batchCount >= 25;

          return (
            <button
              key={batch}
              type="button"
              onClick={() => setBatchManagerSelectedBatch(batch)}
              className={`rounded-2xl border p-4 text-left transition ${
                selected
                  ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-100'
                  : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl">📂</span>
                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-black ${
                    full
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {full ? 'FULL' : 'ACTIVE'}
                </span>
              </div>

              <p className="mt-3 text-sm font-black text-slate-900">
                Batch {batch}
              </p>

              <p className="mt-1 text-xs font-bold text-blue-700">
                {batchCount}/25 products
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${
                    full ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (batchCount / 25) * 100)}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>

    {/* CSV IMPORT */}
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <h3 className="text-base font-black text-blue-900">
        📁 Upload Products via CSV
      </h3>
      <p className="mb-4 mt-1 text-xs text-slate-500">
        Import your catalogue using your existing CSV import handler.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-800 hover:file:bg-blue-100"
      />
    </div>

    {/* MANUAL PRODUCT FORM */}
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-5">
        <h3 className="text-base font-black text-blue-900">
          🛍️ Add Single Product Manually
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Add a product with its store, price, image, VIP level and rating.
        </p>
      </div>

      <form
        onSubmit={handleAddProductSubmit}
        className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2 xl:grid-cols-4"
      >
        <div>
          <label className="mb-1 block font-bold text-slate-600">
            Product Name
          </label>
          <input
            required
            type="text"
            placeholder="Product Name"
            value={newProdName}
            onChange={(e) => setNewProdName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-600">Store</label>
          <select
            value={newProdStore}
            onChange={(e) => setNewProdStore(e.target.value as any)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-bold text-blue-900"
          >
            <option value="Amazon">Amazon</option>
            <option value="AliExpress">AliExpress</option>
            <option value="Shopify">Shopify</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-600">
            Price ($)
          </label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="185"
            value={newProdPrice}
            onChange={(e) => setNewProdPrice(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-slate-600">
            VIP Level
          </label>
          <select
            value={newProdVipLevel}
            onChange={(e) => setNewProdVipLevel(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"
          >
            <option value="VIP 1">VIP 1</option>
            <option value="VIP 2">VIP 2</option>
            <option value="VIP 3">VIP 3</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block font-bold text-slate-600">
            Image URL
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={newProdImageUrl}
            onChange={(e) => setNewProdImageUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block font-bold text-slate-600">
            Upload Product Image
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) =>
              setNewProdImageFile(e.target.files?.[0] || null)
            }
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block font-bold text-slate-600">
            Product Rating
          </label>
          <select
            value={newProdRating}
            onChange={(e) => setNewProdRating(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"
          >
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
            <option value="2">★★☆☆☆ (2 Stars)</option>
            <option value="1">★☆☆☆☆ (1 Star)</option>
          </select>
        </div>

        <div className="flex items-end md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-900 py-3 font-black text-white shadow-lg transition hover:bg-blue-800"
          >
            + Add Product to Database
          </button>
        </div>
      </form>
    </div>

    {/* PRODUCT TABLE */}
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Manage Existing Products
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Total inventory:{' '}
              <span className="font-black text-blue-700">
                {productsList.length}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="🔎 Search product..."
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              className="min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 sm:w-64"
            />

            <button
              type="button"
              onClick={handleDeleteAllProducts}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white shadow transition hover:bg-red-700"
            >
              🗑️ Delete All
            </button>
          </div>
        </div>

        {/* FILTER BUTTONS */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { value: 'all' as const, label: 'All Products' },
            { value: 'unassigned' as const, label: 'Unassigned' },
            { value: 1 as const, label: 'Batch 1' },
            { value: 2 as const, label: 'Batch 2' },
            { value: 3 as const, label: 'Batch 3' },
            { value: 4 as const, label: 'Batch 4' },
            { value: 5 as const, label: 'Batch 5' },
            { value: 6 as const, label: 'Batch 6' },
          ].map((filter) => (
            <button
              key={String(filter.value)}
              type="button"
              onClick={() => setBatchManagerSelectedBatch(filter.value)}
              className={`rounded-xl border px-3 py-2 text-[11px] font-black transition ${
                batchManagerSelectedBatch === filter.value
                  ? 'border-blue-900 bg-blue-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400'
              }`}
            >
              {filter.label}
              {typeof filter.value === 'number' && (
                <span className="ml-1 opacity-75">
                  ({productsList.filter(
                    (p) => Number(p.rotation_batch) === filter.value
                  ).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4">Product</th>
              <th className="p-4">Store</th>
              <th className="p-4">Price</th>
              <th className="p-4">Rating</th>
              <th className="p-4">VIP Level</th>
              <th className="p-4">Batch Assignment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredProducts
              .filter((p) => {
               if (batchManagerSelectedBatch === 'all') {
  return p.rotation_batch == null;
}

                if (batchManagerSelectedBatch === 'unassigned') {
                  return p.rotation_batch == null;
                }

                return Number(p.rotation_batch) === batchManagerSelectedBatch;
              })
              .map((p) => (
                <tr key={p.id} className="transition hover:bg-blue-50/40">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-14 w-14 rounded-xl border border-slate-200 bg-slate-50 object-cover"
                      />

                      <div className="max-w-[230px]">
                        <p className="font-black text-slate-800">{p.name}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          ID: {String(p.id).slice(0, 12)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1.5 text-[10px] font-black text-blue-800">
                      {p.store}
                    </span>
                  </td>

                  <td className="p-4 font-mono font-black text-emerald-700">
                    ${Number(p.price).toFixed(2)}
                  </td>

                  <td className="p-4">
                    <div className="whitespace-nowrap text-amber-500">
                      {'★'.repeat(
                        Math.max(0, Math.min(5, Number(p.rating ?? 5)))
                      )}
                      <span className="text-slate-300">
                        {'★'.repeat(
                          5 - Math.max(0, Math.min(5, Number(p.rating ?? 5)))
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-slate-500">
                      {Number(p.rating ?? 5).toFixed(0)}/5
                    </p>
                  </td>

                  <td className="p-4">
                    <span className="rounded-lg bg-purple-100 px-2 py-1 text-[10px] font-black text-purple-800">
                      {p.vip_level || 'VIP 1'}
                    </span>
                  </td>

                  <td className="p-4">
                    <select
                      value={p.rotation_batch ?? ''}
                      onChange={(e) =>
                        handleAssignProductBatch(String(p.id), e.target.value)
                      }
                      className="min-w-32 rounded-xl border border-slate-300 bg-white p-2.5 font-bold text-blue-900 outline-none focus:border-blue-600"
                    >
                      <option value="">Unassigned</option>
                      {[1, 2, 3, 4, 5, 6].map((batch) => {
                        const count = productsList.filter(
                          (item) =>
                            Number(item.rotation_batch) === batch &&
                            String(item.id) !== String(p.id)
                        ).length;

                        return (
                          <option
                            key={batch}
                            value={batch}
                            disabled={count >= 25}
                          >
                            Batch {batch} ({count}/25)
                          </option>
                        );
                      })}
                    </select>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openBatchManagerEdit(p)}
                        className="rounded-lg bg-blue-700 px-3 py-2 font-black text-white shadow-sm transition hover:bg-blue-800"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 font-black text-white shadow-sm transition hover:bg-red-700"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {filteredProducts.filter((p) => {
if (batchManagerSelectedBatch === 'all') {
  return p.rotation_batch == null;
}
              if (batchManagerSelectedBatch === 'unassigned') {
                return p.rotation_batch == null;
              }

              return Number(p.rotation_batch) === batchManagerSelectedBatch;
            }).length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <div className="text-4xl">📦</div>
                  <p className="mt-3 font-black text-slate-700">
                    No products found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try another batch or change your search.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* EDIT PRODUCT MODAL */}
    {batchManagerEditingProduct && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4">
        <div className="my-auto w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-slate-950 to-blue-950 p-5 text-white">
            <div>
              <h3 className="text-lg font-black">✏️ Edit Product</h3>
              <p className="mt-1 text-xs text-blue-200">
                Changes will be saved to your database.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBatchManagerEditingProduct(null)}
              className="rounded-xl bg-white/10 px-3 py-2 text-lg font-black hover:bg-white/20"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveBatchManagerEdit();
            }}
            className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Product Name
              </label>
              <input
                required
                value={batchManagerEditName}
                onChange={(e) => setBatchManagerEditName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Store
              </label>
              <select
                value={batchManagerEditStore}
                onChange={(e) =>
                  setBatchManagerEditStore(
                    e.target.value as 'Amazon' | 'AliExpress' | 'Shopify'
                  )
                }
                className="w-full rounded-xl border border-slate-300 p-3 text-sm"
              >
                <option value="Amazon">Amazon</option>
                <option value="AliExpress">AliExpress</option>
                <option value="Shopify">Shopify</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Price ($)
              </label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={batchManagerEditPrice}
                onChange={(e) => setBatchManagerEditPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Image URL
              </label>
              <input
                required
                type="url"
                value={batchManagerEditImage}
                onChange={(e) => setBatchManagerEditImage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm"
              />
              {batchManagerEditImage && (
                <img
                  src={batchManagerEditImage}
                  alt="Product preview"
                  className="mt-3 h-24 w-24 rounded-xl border border-slate-200 object-cover"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                VIP Level
              </label>
              <select
                value={batchManagerEditVip}
                onChange={(e) => setBatchManagerEditVip(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm"
              >
                <option value="VIP 1">VIP 1</option>
                <option value="VIP 2">VIP 2</option>
                <option value="VIP 3">VIP 3</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Rating
              </label>
              <select
                value={batchManagerEditRating}
                onChange={(e) => setBatchManagerEditRating(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm"
              >
                <option value="5">★★★★★ (5 Stars)</option>
                <option value="4">★★★★☆ (4 Stars)</option>
                <option value="3">★★★☆☆ (3 Stars)</option>
                <option value="2">★★☆☆☆ (2 Stars)</option>
                <option value="1">★☆☆☆☆ (1 Star)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3 md:col-span-2">
              <button
                type="button"
                onClick={() => setBatchManagerEditingProduct(null)}
                disabled={batchManagerSaving}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={batchManagerSaving}
                className="flex-1 rounded-xl bg-blue-900 py-3 text-xs font-black text-white shadow-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {batchManagerSaving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
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
                      onClick={() => handleSelectChatUser(uId)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between ${
                        activeChatUserId === uId
                          ? 'bg-blue-900 text-white'
                          : 'bg-white text-slate-800 border'
                      }`}
                    >
                      <span className="font-mono flex-1 min-w-0 truncate">
                        {custDetails.customId} - {custDetails.name}
                      </span>

                      {chatMessages.some(
                        (m) =>
                          m.sender_id === uId &&
                          m.receiver_id === 'admin' &&
                          m.is_admin === false &&
                          m.is_read === false
                      ) && (
                        <span
                          className="ml-2 h-2.5 w-2.5 rounded-full bg-green-500 shrink-0"
                          title="Unread message"
                        />
                      )}
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

        {/* TAB 8: ADMIN SETTINGS & SUB-ADMIN NOTIFICATIONS */}
        {!isFullPageTaskSettings && activeTab === 'settings' && (
          <div className="space-y-6">
            
            {!isMainAdmin && (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">🛠️ Sub-Admin Profile Settings</h3>
                <form onSubmit={handleSaveSubAdminSelfProfile} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Email</label>
                    <input type="email" value={subAdminEditableEmail} onChange={(e) => setSubAdminEditableEmail(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">New Password (Optional)</label>
                    <input type="password" value={subAdminEditablePassword} onChange={(e) => setSubAdminEditablePassword(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Invitation Code</label>
                    <input type="text" value={subAdminEditableInviteCode} onChange={(e) => setSubAdminEditableInviteCode(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5 font-bold uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Telegram Support Link
                    </label>
                    <input
                      type="url"
                      value={subAdminEditableTelegram}
                      onChange={(e) => setSubAdminEditableTelegram(e.target.value)}
                      placeholder="https://t.me/yourusername"
                      className="w-full rounded-xl border border-slate-300 p-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      WhatsApp Support Link
                    </label>
                    <input
                      type="url"
                      value={subAdminEditableWhatsapp}
                      onChange={(e) => setSubAdminEditableWhatsapp(e.target.value)}
                      placeholder="https://whatsapp.com/..."
                      className="w-full rounded-xl border border-slate-300 p-3"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-900 text-white font-black text-xs rounded-xl shadow">Save Changes</button>
                </form>
              </div>
            )}

            {isMainAdmin && (
              <div className="space-y-6">
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

{/* SUB-ADMIN CREDENTIAL CHANGE REQUESTS */}
{isMainAdmin && (
  <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Sub-Admin Credential Requests
        </h3>
        <p className="text-sm text-slate-500">
          Email aur password change requests review karein.
        </p>
      </div>

      <button
        type="button"
        onClick={async () => {
          setCredentialRequestsLoading(true);
          setCredentialRequestMessage('');

          try {
            const { data, error } =
              await supabase.functions.invoke(
                'sub-admin-credential-requests',
                { body: { action: 'list_requests' } }
              );

            if (error) throw error;

            if (!data?.success) {
              throw new Error(
                data?.message || 'Requests load nahi huin.'
              );
            }

            setCredentialRequests(
              Array.isArray(data.requests) ? data.requests : []
            );
          } catch (error) {
            setCredentialRequestMessage(
              error instanceof Error
                ? error.message
                : 'Requests load nahi huin.'
            );
          } finally {
            setCredentialRequestsLoading(false);
          }
        }}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        {credentialRequestsLoading ? 'Loading...' : 'Refresh Requests'}
      </button>
    </div>

    {credentialRequestMessage && (
      <div className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
        {credentialRequestMessage}
      </div>
    )}

    {credentialRequestsLoading && credentialRequests.length === 0 ? (
      <p className="text-sm text-slate-500">
        Requests load ho rahi hain...
      </p>
    ) : credentialRequests.length === 0 ? (
      <p className="text-sm text-slate-500">
        Abhi koi credential request nahi hai.
      </p>
    ) : (
      <div className="space-y-4">
        {credentialRequests.map((request) => (
          <div
            key={request.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {request.sub_admin_email || 'Unknown Sub-Admin'}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Type: {request.request_type === 'email'
                    ? 'Email Change'
                    : 'Password Change'}
                </p>

                {request.request_type === 'email' &&
                  request.requested_email && (
                    <p className="mt-1 break-all text-sm text-slate-600">
                      New email: {request.requested_email}
                    </p>
                  )}

                <p className="mt-1 break-all text-xs text-slate-400">
                  Request ID: {request.id}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Created: {new Date(request.created_at).toLocaleString()}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                {request.status}
              </span>
            </div>

            {request.status === 'pending' && (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    handleGenerateCredentialCode(request.id)
                  }
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
                >
                  Generate Verification Code
                </button>

                {generatedVerificationCodes[request.id] && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Verification code — show only to the authorized reviewer
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="font-mono text-2xl font-bold tracking-widest text-slate-900">
                        {generatedVerificationCodes[request.id]}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            generatedVerificationCodes[request.id]
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        Copy Code
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-600">
                      Code 15 minutes mein expire ho jayega.
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Enter 6-digit verification code to approve
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCodeInputs[request.id] || ''}
                    onChange={(event) =>
                      setVerificationCodeInputs((prev) => ({
                        ...prev,
                        [request.id]: event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6),
                      }))
                    }
                    placeholder="000000"
                    className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 font-mono tracking-widest outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleReviewCredentialRequest(request.id, 'approve')
                    }
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                  >
                    Verify & Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Kya aap is credential request ko reject karna chahte hain?'
                        )
                      ) {
                        void handleReviewCredentialRequest(
                          request.id,
                          'reject'
                        );
                      }
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

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
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 space-y-4">
                    <h3 className="text-base font-extrabold text-blue-900 border-b pb-2">
                      👑 Main System & Global Settings
                    </h3>

                    <form onSubmit={handleSaveMainSettings} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">
                          Global Deposit TRC20 Address
                        </label>
                        <input
                          type="text"
                          value={depositTrc20}
                          onChange={(e) => setDepositTrc20(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-blue-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">
                          Main Invitation Code (Live Database Sync)
                        </label>
                        <input
                          type="text"
                          value={mainInviteCode}
                          onChange={(e) => setMainInviteCode(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-emerald-500 rounded-xl p-2.5 font-bold uppercase text-emerald-900"
                        />
                      </div>

                      <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                        <h4 className="font-extrabold text-blue-900 text-sm">
                          TRC20 Payment QR Code
                        </h4>

                        <label className="font-bold text-slate-600 block">
                          Select QR Image (PNG, JPG, WebP — max 2 MB)
                        </label>

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                        />

                        {qrCodeUrl && (
                          <div className="space-y-2">
                            <p className="font-bold text-slate-600">Current / Uploaded QR Preview</p>
                            <img
                              src={qrCodeUrl}
                              alt="TRC20 Payment QR Code"
                              className="w-44 h-44 object-contain rounded-xl border border-slate-200 bg-white p-2"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleUploadQr}
                          disabled={qrUploading || !qrFile}
                          className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl shadow disabled:opacity-50"
                        >
                          {qrUploading ? 'Uploading QR...' : 'Upload TRC20 QR Image'}
                        </button>
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">
                          Telegram Support Link
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={telegramUrl}
                          onChange={(e) => setTelegramUrl(e.target.value)}
                          placeholder="https://t.me/yourusername"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">
                          WhatsApp Support Link
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={whatsappUrl}
                          onChange={(e) => setWhatsappUrl(e.target.value)}
                          placeholder="https://wa.me/923001234567"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-900 text-white font-black text-xs rounded-xl shadow"
                      >
                        Save Global System Settings
                      </button>
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
                        <input type="password" placeholder="Enter new password" value={mainAdminPassword} onChange={(e) => setMainAdminPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-indigo-900 text-white font-black text-xs rounded-xl shadow mt-6">Update Credentials</button>
                    </form>
                  </div>
                </div>

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
                                  setEditSubPerms({
                                    ...defaultSubAdminPermissions,
                                    ...(sub.permissions || {}),
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

{/* TAB 9: RECORDS & REPORTS */}
{!isFullPageTaskSettings && activeTab === 'delete_users' && isMainAdmin && (
  <div className="space-y-6">
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="bg-gradient-to-r from-slate-950 via-slate-800 to-amber-700 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              Customer Activity Center
            </p>
            <h2 className="mt-2 text-2xl font-black">
              📊 Records &amp; Reports
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              Customer ki financial aur task history date range ke mutabiq dekhein.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
            <p className="text-xs text-slate-200">Selected Customer</p>
            <p className="text-xl font-black">
              {reportCustomer ? `#${reportCustomer.custom_id}` : 'None'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-700">
              SEARCH CUSTOMER
            </label>
            <input
              value={deleteSearchQuery}
              onChange={(e) => setDeleteSearchQuery(e.target.value)}
              placeholder="Name, email, ID or invite code..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black text-slate-700">
              FROM DATE
            </label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black text-slate-700">
              TO DATE
            </label>
            <input
              type="date"
              value={reportEndDate}
              min={reportStartDate || undefined}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: 'all', title: 'All Records', icon: '📚', color: 'slate' },
            { id: 'deposits', title: 'Deposits & Funds', icon: '💰', color: 'emerald' },
            { id: 'withdrawals', title: 'Withdrawals', icon: '🏦', color: 'blue' },
            { id: 'lucky', title: 'Lucky Orders', icon: '🍀', color: 'amber' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setReportCategory(item.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                reportCategory === item.id
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                  : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="mt-2 text-sm font-black text-slate-800">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {reportCategory === item.id ? 'Selected view' : 'Click to view'}
              </p>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Email / Account</th>
                <th className="p-3">Current Balance</th>
                <th className="p-3">Invite Code</th>
                <th className="p-3 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeleteCustomers.map((c) => (
                <tr
                  key={c.id}
                  className={`transition hover:bg-amber-50 ${
                    reportCustomerId === String(c.id) ? 'bg-amber-50' : ''
                  }`}
                >
                  <td className="p-3">
                    <p className="font-black text-slate-900">
                      #{c.custom_id}
                    </p>
                    <p className="mt-1 font-semibold text-slate-600">
                      {c.full_name || c.username || c.name || 'No Name'}
                    </p>
                  </td>
                  <td className="p-3 font-medium text-slate-600">
                    {c.email || 'customer@appuser.local'}
                  </td>
                  <td className="p-3 font-black text-emerald-700">
                    {reportMoney(c.balance)}
                  </td>
                  <td className="p-3">{renderSimpleInvitationCodes(c)}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => void handleLoadCustomerReport(String(c.id))}
                      className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white hover:bg-amber-600"
                    >
                      {reportCustomerId === String(c.id) ? 'Refresh Report' : 'View History'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDeleteCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {reportError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {reportError}
          </div>
        )}

        {reportCustomer && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <h3 className="font-black text-slate-900">
                  {reportCustomer.full_name || reportCustomer.username || reportCustomer.name || 'Customer'}
                  {' '}— Records
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  {reportStartDate || 'Beginning'} to {reportEndDate || 'Today / latest available'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCustomerReport}
                className="rounded-xl bg-emerald-700 px-5 py-3 text-xs font-black text-white hover:bg-emerald-800"
              >
                ⬇ Export / Save as PDF
              </button>
            </div>

            {reportLoading ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center font-bold text-slate-500">
                Loading customer history...
              </div>
            ) : (
              <>
                {(reportCategory === 'all' || reportCategory === 'deposits') && (
                  <div className="overflow-x-auto rounded-2xl border border-emerald-200">
                    <h4 className="bg-emerald-50 p-4 font-black text-emerald-900">
                      💰 Deposits & Funds ({filteredReportDeposits.length})
                    </h4>
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead className="bg-emerald-800 text-white">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReportDeposits.map((d: any, i: number) => (
                          <tr key={d.id || i}>
                            <td className="p-3">{reportDate(d.created_at)}</td>
                            <td className="p-3 font-black">{reportMoney(d.amount)}</td>
                            <td className="p-3">{d.status || d.payment_status || 'Recorded'}</td>
                            <td className="p-3">{d.id || d.tx_hash || d.transaction_id || '—'}</td>
                          </tr>
                        ))}
                        {!filteredReportDeposits.length && (
                          <tr><td colSpan={4} className="p-4 text-slate-500">No deposits in this date range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {(reportCategory === 'all' || reportCategory === 'withdrawals') && (
                  <div className="overflow-x-auto rounded-2xl border border-blue-200">
                    <h4 className="bg-blue-50 p-4 font-black text-blue-900">
                      🏦 Withdrawals ({filteredReportWithdrawals.length})
                    </h4>
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead className="bg-blue-800 text-white">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReportWithdrawals.map((w: any, i: number) => (
                          <tr key={w.id || i}>
                            <td className="p-3">{reportDate(w.created_at)}</td>
                            <td className="p-3 font-black">{reportMoney(w.amount)}</td>
                            <td className="p-3">{w.status || 'Recorded'}</td>
                            <td className="p-3">{w.id || w.transaction_id || w.tx_hash || '—'}</td>
                          </tr>
                        ))}
                        {!filteredReportWithdrawals.length && (
                          <tr><td colSpan={4} className="p-4 text-slate-500">No withdrawals in this date range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {(reportCategory === 'all' || reportCategory === 'lucky') && (
                  <div className="overflow-x-auto rounded-2xl border border-amber-200">
                    <h4 className="bg-amber-50 p-4 font-black text-amber-900">
                      🍀 Task & Lucky Order History ({filteredReportTasks.filter((t: any) => reportCategory !== 'lucky' || t.is_lucky_order).length})
                    </h4>
                    <table className="w-full min-w-[750px] text-left text-xs">
                      <thead className="bg-amber-700 text-white">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Task #</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Task Amount</th>
                          <th className="p-3">Commission</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReportTasks
                          .filter((t: any) => reportCategory !== 'lucky' || t.is_lucky_order)
                          .map((t: any, i: number) => (
                            <tr key={t.id || i}>
                              <td className="p-3">{reportDate(t.created_at)}</td>
                              <td className="p-3 font-black">{t.task_number ?? t.task_num ?? '—'}</td>
                              <td className="p-3">
                                {t.is_lucky_order ? '🍀 Lucky Order' : 'Normal / Custom Task'}
                              </td>
                              <td className="p-3 font-black">
                                {reportMoney(t.task_amount ?? t.locked_price ?? t.amount ?? t.price)}
                              </td>
                              <td className="p-3 font-bold text-emerald-700">
                                {reportMoney(t.locked_commission ?? t.commission ?? 0)}
                              </td>
                              <td className="p-3">{t.status || t.funding_status || 'Recorded'}</td>
                            </tr>
                          ))}
                        {filteredReportTasks.filter((t: any) => reportCategory !== 'lucky' || t.is_lucky_order).length === 0 && (
                          <tr><td colSpan={6} className="p-4 text-slate-500">No task records in this date range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Existing customer deletion feature remains separate */}
    <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50 p-5">
        <div>
          <h3 className="font-black text-red-800">🗑️ Delete Customer</h3>
          <p className="mt-1 text-xs text-slate-500">
            This is a separate permanent action. Review carefully before deleting.
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
          Main Admin Only
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-3">Customer ID / Name</th>
              <th className="p-3">Invite Code</th>
              <th className="p-3">Email / Account</th>
              <th className="p-3">Balance</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeleteCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-red-50">
                <td className="p-3">
                  <div className="font-black text-red-900">#{c.custom_id}</div>
                  <div className="mt-1 font-semibold text-slate-700">
                    {c.full_name || c.username || c.name || 'No Name'}
                  </div>
                </td>
                <td className="p-3">{renderSimpleInvitationCodes(c)}</td>
                <td className="p-3 font-semibold text-slate-700">
                  {c.email || 'customer@appuser.local'}
                </td>
                <td className="p-3 font-mono font-bold text-emerald-600">
                  {reportMoney(c.balance)}
                </td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Are you sure you want to delete customer #${c.custom_id}?`
                      );
                      if (!confirmed) return;

                      supabase.from('profiles').delete().eq('id', c.id).then(({ error }) => {
                        if (!error) {
                          setCustomers((prev) => prev.filter((item) => item.id !== c.id));
                          if (reportCustomerId === String(c.id)) {
                            setReportCustomerId('');
                            setReportTasks([]);
                          }
                          showToast('Customer deleted successfully.');
                        } else {
                          showToast(error.message, 'error');
                        }
                      });
                    }}
                    className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white hover:bg-red-700"
                  >
                    🗑️ Delete Customer
                  </button>
                </td>
              </tr>
            ))}
            {!filteredDeleteCustomers.length && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                <label className="font-bold text-slate-700 block">
                  Main / Customer Invitation Codes
                </label>
                <div className="font-mono font-extrabold text-blue-900 break-all">
                  {mainInviteCode || 'Not set'} / {selectedUserForModal.user_invite_code || selectedUserForModal.invite_code || selectedUserForModal.invitation_code || 'Not set'}
                </div>
              </div>

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