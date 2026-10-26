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
  luckyAmount?: number;
  customTaskId?: string;
  fundingStatus?: string;
  fundedAt?: string | null;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_admin: boolean;
}



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

const [isLuckyOrderDeposit, setIsLuckyOrderDeposit] = useState(false);
const [paymentMethod, setPaymentMethod] = useState<'trc20' | 'bank'>('trc20');
const [paymentReference, setPaymentReference] = useState('');
const [receiptFile, setReceiptFile] = useState<File | null>(null);
const [depositStep, setDepositStep] = useState<1 | 2>(1);

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
  const [telegramUrl, setTelegramUrl] = useState('https://t.me');
  const [whatsappUrl, setWhatsappUrl] = useState('https://whatsapp.com');
  const [recordsList, _setRecordsList] = useState<ProductTask[]>([]);
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
  const [isWithdrawLocked, setIsWithdrawLocked] = useState(false);
 
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

  const HOW_IT_WORKS_TEXT = `HOW DIGITAL MARKETING WORKS
Your Guide to Grabbing Tasks, VIP Levels & Commissions

01. Create Your Account
Register an account on Digital Marketing and review the platform's guidelines, task requirements, and account policies before getting started.

02. Recharge Your Account
Add funds to your account according to the platform's minimum recharge requirement of $15. Make sure your payment details are correct before submitting your deposit.

03. Activate Your Grabbing Tasks
Once your account meets the applicable task requirements, access the Grabbing Tasks section to view and begin your available tasks.

04. Complete 25 Daily Tasks
The standard task cycle consists of 25 tasks. Follow the instructions for each task and complete the required steps to finish your daily cycle.

05. Understand VIP Levels
VIP 1, VIP 2, and VIP 3 represent different membership levels. Each level may have different task requirements, account limits, and commission rates.

06. Earn Task Commissions
Commission rates may range from 1% to 30%, depending on the applicable VIP level and task conditions. Review the displayed rate and terms before starting each task.

07. Understand Lucky Orders
Lucky Orders may appear as part of the task cycle. These orders can have different funding requirements and commission rates, so always check the order amount before proceeding.

08. Review the Required Order Amount
Some tasks may require a specified amount of available funds. Check the required amount carefully and confirm that you understand the funding conditions before continuing.

09. Follow Task Instructions
Complete each task according to the instructions shown on your account. Task status and completion eligibility depend on the platform's applicable rules.

10. Track Your Progress
Use your dashboard to review completed tasks, pending tasks, account balance, commission records, and your current VIP level.

11. Complete Your Daily Cycle
After completing all 25 required tasks, your task cycle can be reviewed according to the platform's completion rules and account conditions.

12. Request a Withdrawal
When your account meets the withdrawal eligibility requirements, submit a withdrawal request with the correct payment details and requested amount.

13. Finance Department Verification
The Finance Department may review your withdrawal request, transaction history, deposits, and available balance before approving a payment.

14. Additional Verification for Higher Balances
If your account has an unusually high balance, substantial accumulated funds, or transactions requiring further review, additional verification may be requested. Any verification requirements should be communicated clearly through official support channels.

15. Payment Review and Processing
Withdrawals are processed after the necessary checks are completed. Processing times may vary depending on payment method, transaction status, and applicable verification requirements.

16. Maintain Account Security
Keep your login credentials and transaction information secure. Never share your password or transfer money to an individual claiming to be a finance officer.

17. Review All Terms Before Recharging
Before adding funds or accepting a task, review the platform's commission policy, withdrawal conditions, potential fees, and refund policy. Task completion or VIP membership should not be treated as a guarantee of profit.

Digital Marketing — Your Platform for Exploring Digital Commerce and Grabbing Task-Based Opportunities.`;

const RULES_TEXT = `PLATFORM RULES & REGULATIONS

01. STARTING BALANCE
The minimum starting balance is $30.00. Users must review the platform's terms and task requirements before recharging their accounts.

02. ACCOUNT REGISTRATION
Every user must provide accurate, complete, and up-to-date registration information. False identities or misleading information are strictly prohibited.

03. DAILY TASK REQUIREMENT
The standard task cycle consists of 25 tasks. Users must complete the required tasks according to the platform's applicable rules and eligibility conditions.

04. TASK COMPLETION
All tasks must be completed according to the instructions displayed on the platform. Users must review task details, amounts, and conditions before proceeding.

05. COMMISSION POLICY
Commission rates may range from 1% to 30% (with regular rates from 0.50% to 5%), depending on the applicable VIP level and task conditions. Rates are subject to the platform's published commission policy and are not a guarantee of profit.

06. VIP MEMBERSHIP
VIP 1, VIP 2, and VIP 3 may have different task limits, fund requirements, and commission rates. Users must review the applicable terms before upgrading or participating.

07. LUCKY ORDER POLICY
Lucky Orders may appear automatically during a task cycle. No one can predict them in advance. They may have different order amounts and commission rates, and users must complete them on time as required.

08. ACCOUNT BALANCE AND FUNDING
Users must maintain accurate awareness of their available balance and any task-specific funding requirements. No user should proceed with a task without understanding its financial obligations.

09. DEPOSIT VERIFICATION
Deposits may remain pending until the Finance Department verifies the payment details. Users must submit accurate transaction references and any requested payment evidence.

10. WITHDRAWAL ELIGIBILITY
Withdrawal eligibility is subject to completion of the required task cycle, account status, available balance, and the published withdrawal policy. Completing 25 tasks does not guarantee immediate payment.

11. FINANCE DEPARTMENT REVIEW
The Finance Department may review withdrawal requests, transaction records, deposits, and account activity before processing a payment. Users will be informed if additional information is required.

12. CUSTOMER VERIFICATION (KYC) AND FINANCIAL REQUIREMENTS
Additional identity verification may be required where legally necessary, where unusual account activity is detected, or where a transaction requires further review. If your funds exceed a high range, verification must be completed in compliance with rules and coordinated with the finance department.

13. WITHDRAWAL HOLDS
A withdrawal may be temporarily placed on hold while a legitimate verification, payment, or security review is pending. The reason for the hold and the steps required to resolve it should be communicated clearly.

14. OFFICIAL PAYMENT METHODS
Users must use only officially supported deposit and withdrawal methods. Payments made to unauthorized individuals or unofficial accounts may not be recognized by the platform.

15. ACCOUNT SECURITY
Users are responsible for protecting their passwords, login credentials, and personal information. Never share account credentials, verification codes, or passwords with another person.

16. PROHIBITED ACTIVITIES
Fraud, impersonation, manipulation of tasks, falsification of payment evidence, unauthorized access, and other unlawful activities are strictly prohibited and may result in account restrictions or suspension.

17. MULTIPLE ACCOUNTS AND MISUSE
Creating multiple accounts to bypass platform limits, exploit promotions, manipulate commissions, or evade restrictions is prohibited. Any action taken must comply with the platform's published account policy.

18. CUSTOMER SUPPORT
Questions about deposits, tasks, commissions, verification, or withdrawals should be submitted through official customer support. Users should retain relevant transaction records for reference.

19. PRIVACY AND DATA PROTECTION
Personal and financial information must be handled securely and used only for legitimate platform operations, verification, security, and other purposes disclosed in the applicable privacy policy.

20. ACCOUNT SUSPENSION AND REVIEW
Accounts may be restricted or suspended when credible evidence of fraud, security risks, or serious rule violations exists. Reviews should follow the platform's stated procedures and applicable law.

21. ACCURATE INFORMATION
Users must ensure that all submitted personal, payment, and transaction information is accurate. The platform cannot guarantee successful processing when incorrect or incomplete information is provided.

22. RISKS AND NO GUARANTEED RETURNS
Task participation, VIP membership, and commission rates do not guarantee earnings or financial returns. Users should understand the risks and avoid committing funds they cannot afford to lose.

23. REFUNDS AND DISPUTES
Deposit disputes, payment errors, and refund requests will be handled according to the published refund policy and applicable law. Users should contact official support with relevant evidence.

24. POLICY UPDATES
The platform may update its rules when operational, security, or legal requirements change. Material changes should be communicated through appropriate official channels.

25. ACCEPTANCE OF RULES
By using the platform, users acknowledge that they are responsible for reading and following the applicable terms, task conditions, payment policies, and security requirements.

DIGITAL MARKETING
Please use the platform responsibly, protect your account, and review all financial and task conditions before proceeding.`;
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
  if (!user?.id) return;

  let isMounted = true;

  const fetchSupportLinks = async () => {
    try {
      // Check which sub-admin this customer belongs to
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('sub_admin_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Customer support profile load failed:', profileError);
        return;
      }

      if (!isMounted) return;

      // If customer belongs to a sub-admin, load that sub-admin's links
      if (profile?.sub_admin_id) {
        const { data: subAdmin, error: subAdminError } = await supabase
          .from('sub_admins')
          .select('telegram_url, whatsapp_url')
          .eq('id', profile.sub_admin_id)
          .maybeSingle();

        if (subAdminError) {
          console.error('Sub-admin support links load failed:', subAdminError);
          return;
        }

        if (!isMounted) return;

        if (subAdmin) {
          setTelegramUrl(
            subAdmin.telegram_url?.trim() || 'https://t.me'
          );
          setWhatsappUrl(
            subAdmin.whatsapp_url?.trim() || 'https://whatsapp.com'
          );
          return;
        }
      }

      // Customers without a linked sub-admin use main-admin links
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('telegram_url, whatsapp_url')
        .eq('id', 1)
        .maybeSingle();

      if (settingsError) {
        console.error('Global support links load failed:', settingsError);
        return;
      }

      if (!isMounted) return;

      if (settings) {
        setTelegramUrl(
          settings.telegram_url?.trim() || 'https://t.me'
        );
        setWhatsappUrl(
          settings.whatsapp_url?.trim() || 'https://whatsapp.com'
        );
      }
    } catch (error) {
      console.error('Support links load failed:', error);
    }
  };

  void fetchSupportLinks();

  const channel = supabase
    .channel(`customer-support-links-live-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      },
      () => {
        void fetchSupportLinks();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sub_admins',
      },
      () => {
        void fetchSupportLinks();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'system_settings',
        filter: 'id=eq.1',
      },
      () => {
        void fetchSupportLinks();
      }
    )
    .subscribe();

  return () => {
    isMounted = false;
    void supabase.removeChannel(channel);
  };
}, [user?.id]);

useEffect(() => {
  if (!user?.id) return;

  let isMounted = true;

   
const applyProfileSettings = (profile: any) => {
  if (!isMounted || !profile) return;

  setIsWithdrawLocked(Boolean(profile.withdraw_locked));
  setWithdrawLockedMsg(profile.withdraw_message || '');
  setIsAccountFrozen(Boolean(profile.is_frozen));
  setIsAutoTaskLocked(Boolean(profile.auto_task_lock));

  if (profile.balance !== undefined && profile.balance !== null) {
    setBalance(Number(profile.balance) || 0);
  }

  if (profile.vip_level) {
    setActiveVipLevel(profile.vip_level);
  }
};


  const loadLatestProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'withdraw_locked, withdraw_message, is_frozen, auto_task_lock, balance, vip_level'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Load customer profile settings failed:', error);
      return;
    }

    if (data) applyProfileSettings(data);
  };

  const profileChannel = supabase
    .channel(`customer-profile-live-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      },
      (payload) => {
        if (payload.new && Object.keys(payload.new).length > 0) {
          applyProfileSettings(payload.new);
        } else {
          void loadLatestProfile();
        }
      }
    )
    .subscribe((status, error) => {
      console.log('Customer profile realtime status:', status);

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(
          'Customer profile realtime subscription failed:',
          error
        );
      }
    });

  void loadLatestProfile();

  return () => {
    isMounted = false;
    void supabase.removeChannel(profileChannel);
  };
}, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const luckyOrdersChannel = supabase
      .channel(`customer-lucky-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'custom_tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as {
            id?: string;
            funding_status?: string;
            funded_at?: string | null;
            status?: string;
          };

          setCurrentTask((previousTask) => {
            if (
              !previousTask ||
              !previousTask.isLucky ||
              previousTask.customTaskId !== updatedOrder.id
            ) {
              return previousTask;
            }

            return {
              ...previousTask,
              fundingStatus: updatedOrder.funding_status,
              fundedAt: updatedOrder.funded_at ?? null,
            };
          });
        }
      )
      .subscribe((status, error) => {
        console.log('Lucky Order realtime status:', status);

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Lucky Order realtime error:', error);
        }
      });

    return () => {
      void supabase.removeChannel(luckyOrdersChannel);
    };
  }, [user?.id]);

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
  
const { data: prodData, error: prodError } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('rotation_batch', { ascending: true, nullsFirst: false })
  .order('id', { ascending: true });

if (prodError) {
  console.error('Products loading failed:', prodError);
} else if (prodData) {
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

      setCurrentTask(data.pending_task ?? null);
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
        setCurrentTask(data.pending_task ?? null);
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
          setCurrentTask(payload.new.pending_task ?? null);
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

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };


useEffect(() => {
  if (!user?.id) return;

  const channel = supabase
    .channel(`customer-chat-live-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
      },
      (payload) => {
        const newMsg = payload.new as ChatMessage | undefined;
        const oldMsg = payload.old as Partial<ChatMessage> | undefined;

        // Sirf is customer ki chat update karein.
        const belongsToCustomer =
          newMsg?.sender_id === user.id ||
          newMsg?.receiver_id === user.id ||
          oldMsg?.sender_id === user.id ||
          oldMsg?.receiver_id === user.id;

        if (!belongsToCustomer || !newMsg?.id) return;

        setChatMessages((prev) => {
          // Temporary message ya pehle se loaded message duplicate na ho.
          const withoutTemp = prev.filter(
            (msg) =>
              !(
                String(msg.id).startsWith('temp-') &&
                msg.sender_id === newMsg.sender_id &&
                msg.message === newMsg.message
              )
          );

          const exists = withoutTemp.some(
            (msg) => String(msg.id) === String(newMsg.id)
          );

          if (exists) return withoutTemp;

          return [...withoutTemp, newMsg].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);
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
    showToast(
      'Your account is frozen by admin. Please contact customer support.',
      'error'
    );
    return;
  }

  if (!user) {
    showToast('Please sign in first.', 'error');
    return;
  }

  // Admin manual task lock
  const { data: taskLockProfile, error: taskLockError } = await supabase
    .from('profiles')
    .select('manual_task_lock')
    .eq('id', user.id)
    .single();

  if (taskLockError || !taskLockProfile) {
    showToast('Please refresh the page and try again.', 'error');
    return;
  }

  if (taskLockProfile.manual_task_lock === true) {
    showToast('Please refresh the page and try again.', 'error');
    return;
  }

  if (isAutoTaskLocked || (balance < 30 && completedTasks === 0)) {
    showToast(
      'Task grabbing is locked for new accounts. Minimum $30 recharge required to auto-unlock tasks.',
      'error'
    );
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

  setIsGrabbing(true);

  const nextTaskNum = completedTasks + 1;

  try {
    // 1. Read customer Auto Lucky Order settings
    const {
      data: customerAutoSettings,
      error: customerSettingsError,
    } = await supabase
      .from('customer_auto_lucky_order_settings')
      .select('enabled, slots')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerSettingsError) {
      console.error('Customer Auto Lucky settings:', customerSettingsError);
      showToast('Could not load Auto Lucky Order settings.', 'error');
      return;
    }

    // 2. Read global Auto Lucky Order settings
   
const customerSlots = Array.isArray(customerAutoSettings?.slots)
  ? customerAutoSettings.slots
  : [];

const autoLuckyEnabled = customerAutoSettings?.enabled === true;

const autoSlot = autoLuckyEnabled
  ? customerSlots.find(
      (slot: any) =>
        slot?.active === true &&
        Number(slot?.taskNum) === nextTaskNum
    )
  : null;


    let customTaskData: any = null;

    // 3. AUTO slot trigger: find or create this customer's Auto order
    if (autoSlot) {
      const {
        data: existingAutoOrder,
        error: autoOrderError,
      } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_number', nextTaskNum)
        .eq('status', 'pending')
        .eq('is_lucky_order', true)
        .eq('order_source', 'auto')
        .maybeSingle();

      if (autoOrderError) {
        console.error('Auto Lucky Order lookup:', autoOrderError);
        showToast('Could not load Auto Lucky Order.', 'error');
        return;
      }

      if (existingAutoOrder) {
        customTaskData = existingAutoOrder;
      } else {
        const minAmount = Number(autoSlot.minAmount);
        const maxAmount = Number(autoSlot.maxAmount);
        const commissionRate = Number(autoSlot.comm);

        if (
          !Number.isFinite(minAmount) ||
          !Number.isFinite(maxAmount) ||
          minAmount <= 0 ||
          maxAmount < minAmount ||
          !Number.isFinite(commissionRate) ||
          commissionRate < 0 ||
          commissionRate > 100
        ) {
          showToast('Auto Lucky Order settings are invalid.', 'error');
          return;
        }

        const orderAmount = Number(
          (minAmount + Math.random() * (maxAmount - minAmount)).toFixed(2)
        );

        const orderCommission = Number(
          (orderAmount * commissionRate / 100).toFixed(2)
        );

        const {
          data: newAutoOrder,
          error: createAutoError,
        } = await supabase
          .from('custom_tasks')
          .insert({
            user_id: user.id,
            task_number: nextTaskNum,
            task_amount: orderAmount,
            min_amount: minAmount,
            max_amount: maxAmount,
            commission_rate: commissionRate,
            commission: orderCommission,
            locked_price: orderAmount,
            locked_commission: orderCommission,
            vip_level: activeVipLevel,
            status: 'pending',
            is_active: true,
            is_lucky_order: true,
            funding_status: 'pending',
            order_source: 'auto',
          })
          .select('*')
          .single();

        if (createAutoError || !newAutoOrder) {
          console.error('Auto Lucky Order creation:', createAutoError);
          showToast(
            createAutoError?.message ||
              'Auto Lucky Order could not be created.',
            'error'
          );
          return;
        }

        customTaskData = newAutoOrder;
      }
    } else {
      // 4. No Auto slot: only look for a Manual Lucky Order
      const {
        data: manualTaskData,
        error: manualTaskError,
      } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_number', nextTaskNum)
        .eq('status', 'pending')
        .eq('is_lucky_order', true)
        .eq('order_source', 'manual')
        .maybeSingle();

      if (manualTaskError) {
        console.error('Manual Lucky Order lookup:', manualTaskError);
        showToast('Could not load your task. Please try again.', 'error');
        return;
      }

      customTaskData = manualTaskData;
    }


    let grabbedProduct: ProductTask;
    let displayNegativeAmt = 0;

  

    // 5. Read customer's saved batch progress
    const {
      data: batchProfile,
      error: batchReadError,
    } = await supabase
      .from('profiles')
      .select('batch_number, batch_product_position')
      .eq('id', user.id)
      .single();

    if (batchReadError || !batchProfile) {
      showToast('Could not load batch progress. Please try again.', 'error');
      return;
    }

    const currentBatchNumber = Math.min(
      6,
      Math.max(1, Number(batchProfile.batch_number) || 1)
    );

    let assignedBatchProducts = dbProducts.filter(
      (product: any) =>
        Number(product.rotation_batch) === currentBatchNumber &&
        product.is_active !== false
    );

    if (assignedBatchProducts.length === 0) {
      assignedBatchProducts = dbProducts.filter(
        (product: any) =>
          Number(product.rotation_batch) >= 1 &&
          Number(product.rotation_batch) <= 6 &&
          product.is_active !== false
      );
    }

    // 6. Lucky Order task
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
        showToast(
          'Lucky Order settings are invalid. Please contact support.',
          'error'
        );
        return;
      }

      // Do not silently grab an order that is already funded/completed
      if (
        customTaskData.status !== 'pending' ||
        customTaskData.funding_status === 'funded'
      ) {
        showToast(
          'This Lucky Order is not available to grab. Please refresh and try again.',
          'error'
        );
        return;
      }

      displayNegativeAmt = -Math.abs(targetLuckyAmount);

  
      // Lucky Order product sirf Lucky Products gallery se select karein.
      const {
        data: luckyGalleryProducts,
        error: luckyGalleryError,
      } = await supabase
        .from('lucky_order_products')
        .select(
          'id, name, store, price, image_url, rating, is_active, in_lucky_gallery'
        )
        .eq('in_lucky_gallery', true)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (luckyGalleryError) {
        console.error('Lucky gallery product lookup failed:', luckyGalleryError);
        showToast(
          'Could not load Lucky Products. Please try again.',
          'error'
        );
        return;
      }

      if (!luckyGalleryProducts || luckyGalleryProducts.length === 0) {
        showToast(
          'No active products are available in the Lucky Products gallery.',
          'error'
        );
        return;
      }

      const luckyProdIndex =
        (nextTaskNum - 1) % luckyGalleryProducts.length;

      const selectedLuckyProd = luckyGalleryProducts[luckyProdIndex];


      grabbedProduct = {
        id: nextTaskNum,
        customTaskId: customTaskData.id,
        name: selectedLuckyProd.name,
        store: selectedLuckyProd.store || 'Amazon',
        price: Number(selectedLuckyProd.price) || 0,
        luckyAmount: targetLuckyAmount,
        commission: taskComm,
        rating: Number(selectedLuckyProd.rating) || 5,      
        imageUrl: selectedLuckyProd.image_url,
        isLucky: true,
        };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          running_tasks: displayNegativeAmt,
          pending_task: grabbedProduct,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setRunningTasksVal(displayNegativeAmt);
    } else {
      // 7. Normal product task
      if (assignedBatchProducts.length === 0) {
        showToast(
          `Batch ${currentBatchNumber} mein koi active product assigned nahi hai. Admin se products assign karwayein.`,
          'error'
        );
        return;
      }

      if (balance <= 0) {
        showToast(
          'Insufficient balance! Please make a deposit request.',
          'error'
        );
        setShowDepositModal(true);
        return;
      }

      const batchPosition =
        Number(batchProfile.batch_product_position) || 0;

      const uniquePoolIndex =
        batchPosition % assignedBatchProducts.length;

      const selectedOfficialProd =
        assignedBatchProducts[uniquePoolIndex];

      const itemPrice = Number(selectedOfficialProd.price);

      if (!Number.isFinite(itemPrice) || itemPrice < 0) {
        showToast('Product price is invalid. Please contact support.', 'error');
        return;
      }

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
          selectedOfficialProd.image_url ||
          selectedOfficialProd.imageUrl,
        isLucky: false,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          pending_task: grabbedProduct,
          running_tasks: 0,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setRunningTasksVal(0);
    }

    setCurrentTask(grabbedProduct);
    setShowFullPageTask(true);
  } catch (error: any) {
    console.error('Task loading failed:', error);
    showToast(
      error?.message || 'Could not load task. Please try again.',
      'error'
    );
  } finally {
    setIsGrabbing(false);
  }
};

const handleConfirmTask = async () => {
if (!user || !currentTask) return;
if (isGrabbing) return;

// MANUAL TASK LOCK: Existing task bhi confirm nahi ho sakega
const { data: taskLockProfile, error: taskLockError } = await supabase
  .from('profiles')
  .select('manual_task_lock')
  .eq('id', user.id)
  .single();

if (taskLockError || !taskLockProfile) {
  showToast('Please refresh the page and try again.', 'error');
  return;
}

if (taskLockProfile.manual_task_lock === true) {
  showToast('Please refresh the page and try again.', 'error');
  return;
}

setIsGrabbing(true);
  try {
    // LUCKY ORDER: completion, commission aur balance ek RPC transaction mein
    if (currentTask.isLucky) {
     const customTaskId = currentTask.customTaskId;

if (
  typeof customTaskId !== 'string' ||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customTaskId)
) {
  showToast(
    'Lucky Order ID is missing or invalid. Please refresh and try again.',
    'error'
  );
  return;
} 

      const { data, error } = await supabase.rpc(
        'complete_funded_lucky_order',
        {
          p_custom_task_id: customTaskId,
        }
      );

      if (error) {
        console.error('Lucky Order completion RPC failed:', error);
        showToast(
          error.message || 'Lucky Order could not be completed.',
          'error'
        );
        return;
      }

      if (!data || data.success !== true) {
        showToast(
          'Lucky Order completion was not confirmed. Please refresh and check your account.',
          'error'
        );
        return;
      }

      // UI ko database ke confirmed results se update karein
      setBalance(Number(data.balance));
      setTodayCommission(Number(data.total_profits));
      setCompletedTasks(Number(data.completed_tasks));
      setRunningTasksVal(0);
      setCurrentTask(null);
      setShowFullPageTask(false);

      showToast(
        `Lucky Order completed successfully! Commission added: $${Number(
          data.commission
        ).toFixed(2)}.`
      );

      return;
    }

    // NORMAL TASK: existing completion flow
    const earnedCommission = Number(currentTask.commission || 0);

    if (
      !Number.isFinite(earnedCommission) ||
      earnedCommission < 0
    ) {
      showToast('Invalid task commission.', 'error');
      return;
    }

    const nextCompletedTasks = completedTasks + 1;

    // Current batch progress profile se read karein
    const { data: batchProfile, error: batchReadError } = await supabase
      .from('profiles')
      .select('batch_number, batch_product_position')
      .eq('id', user.id)
      .single();

    if (batchReadError || !batchProfile) {
      showToast('Could not load batch progress. Please try again.', 'error');
      return;
    }

    const currentBatchNumber = Number(batchProfile.batch_number) || 1;
    const currentBatchPosition = Number(batchProfile.batch_product_position) || 0;

    // ROUND-ROBIN ROTATION:
    // Har completed normal task ke baad agla batch select hoga.
    // Batch 1 product 1 -> Batch 2 product 1 -> ... -> Batch 6 product 1
    // Batch 6 ke baad Batch 1 product 2 shuru hoga.

    const safeBatchNumber =
      Number.isInteger(currentBatchNumber) &&
      currentBatchNumber >= 1 &&
      currentBatchNumber <= 6
        ? currentBatchNumber
        : 1;

    const safeBatchPosition =
      Number.isInteger(currentBatchPosition) &&
      currentBatchPosition >= 0 &&
      currentBatchPosition < 25
        ? currentBatchPosition
        : 0;

    const nextBatchNumber =
      safeBatchNumber >= 6 ? 1 : safeBatchNumber + 1;

    const savedBatchPosition =
      safeBatchNumber >= 6
        ? (safeBatchPosition + 1) % 25
        : safeBatchPosition;


    const newTotalProfits = Number(
      (Number(todayCommission) + earnedCommission).toFixed(2)
    );

    const newBalance = Number(
      (Number(balance) + earnedCommission).toFixed(2)
    );

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        balance: newBalance,
        total_profits: newTotalProfits,
        completed_tasks: nextCompletedTasks,
        batch_number: nextBatchNumber,
       batch_product_position: savedBatchPosition,
        running_tasks: 0,
        pending_task: null,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Normal task completion failed:', profileError);
      showToast(
        'Task could not be completed. Please try again.',
        'error'
      );
      return;
    }

    setBalance(newBalance);
    setTodayCommission(newTotalProfits);
    setCompletedTasks(nextCompletedTasks);
    setRunningTasksVal(0);
    setCurrentTask(null);
    setShowFullPageTask(false);

_setRecordsList((prev) => [currentTask, ...prev]);
    showToast(
      `Task #${currentTask.id} completed! Earned +$${earnedCommission.toFixed(2)}.`
    );
  } catch (err: any) {
    console.error('Task completion error:', err);

    showToast(
      err?.message || 'Could not complete task. Please try again.',
      'error'
    );
  } finally {
    setIsGrabbing(false);
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

const handleDepositSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    showToast('Please sign in first.', 'error');
    return;
  }

  const amt = Number(depositAmount);
  const reference = paymentReference.trim();

  if (!Number.isFinite(amt) || amt <= 0) {
    showToast('Please enter a valid deposit amount.', 'error');
    return;
  }

  // Find the Lucky Order that this deposit should help fund.
  // The customer can deposit any positive amount.
  let linkedLuckyOrderId: string | null = null;

  try {
    if (currentTask?.isLucky && currentTask.customTaskId) {
      const { data: luckyOrder, error: luckyOrderError } =
        await supabase
          .from('custom_tasks')
          .select('id, user_id, is_lucky_order, funding_status, status')
          .eq('id', currentTask.customTaskId)
          .eq('user_id', user.id)
          .eq('is_lucky_order', true)
          .eq('status', 'pending')
          .maybeSingle();

      if (luckyOrderError) {
        throw luckyOrderError;
      }

      if (!luckyOrder) {
        showToast(
          'Could not find the pending Lucky Order. Please refresh and try again.',
          'error'
        );
        return;
      }

      if (luckyOrder.funding_status !== 'funded') {
        linkedLuckyOrderId = luckyOrder.id;
      }
    } else {
      // Profile's normal Deposit button:
      // find the customer's latest pending, unfunded Lucky Order.
      const { data: pendingOrders, error: pendingOrdersError } =
        await supabase
          .from('custom_tasks')
          .select('id, funding_status')
          .eq('user_id', user.id)
          .eq('is_lucky_order', true)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

      if (pendingOrdersError) {
        throw pendingOrdersError;
      }

      const pendingOrder = pendingOrders?.find(
        (order) => order.funding_status !== 'funded'
      );

      if (pendingOrder) {
        linkedLuckyOrderId = pendingOrder.id;
      }
    }
  } catch (err: any) {
    console.error('Lucky Order lookup failed:', err);
    showToast(
      err?.message || 'Could not check pending Lucky Order.',
      'error'
    );
    return;
  }

  // TXID/reference OR receipt: at least one is required.
  if (!reference && !receiptFile) {
    showToast(
      'Please enter a TXID or upload a payment screenshot.',
      'error'
    );
    return;
  }

  if (receiptFile) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(receiptFile.type)) {
      showToast('Please upload a JPG, PNG or WEBP image.', 'error');
      return;
    }

    if (receiptFile.size > 5 * 1024 * 1024) {
      showToast('Receipt image must be 5 MB or smaller.', 'error');
      return;
    }
  }

  let receiptPath: string | null = null;

  // Upload screenshot only when the customer selected one.
  if (receiptFile) {
    const extension = receiptFile.name.split('.').pop()?.toLowerCase();

    if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      showToast('Invalid receipt file extension.', 'error');
      return;
    }

    const safeFileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    receiptPath = `${user.id}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('deposit-receipts')
      .upload(receiptPath, receiptFile, {
        contentType: receiptFile.type,
        upsert: false,
      });

    if (uploadError) {
      showToast(`Receipt upload failed: ${uploadError.message}`, 'error');
      return;
    }
  }

  const addressOrBankInfo =
    paymentMethod === 'trc20'
      ? adminTrc20DepositAddress
      : `Bank: ${bankName} - Account: ${accountNumber}`;

  const { error } = await supabase.from('deposits').insert({
    user_id: user.id,
    custom_task_id: linkedLuckyOrderId,
    amount: amt,
    trc20_address: addressOrBankInfo,
    status: 'pending',
    payment_method: paymentMethod,
    txid: paymentMethod === 'trc20' ? reference || null : null,
    payment_reference: reference || null,
    receipt_path: receiptPath,
  });

  if (error) {
    console.error('Deposit request failed:', error);
    showToast(`Deposit Error: ${error.message}`, 'error');
    return;
  }

  showToast('Deposit request submitted! Waiting for payment verification.');

  setShowDepositModal(false);
  setDepositStep(1);
  setDepositAmount('');
  setPaymentReference('');
  setReceiptFile(null);

  const { data: depData, error: historyError } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!historyError && depData) {
    setDepositHistory(depData);
  }
};

  // UPDATED WITHDRAW SUBMIT WITH BALANCE DEDUCTION & ADMIN LOCK / FROZEN CHECK
 const handleWithdrawSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const amt = Number(withdrawAmount);

  if (!user) {
    showToast('Please sign in first.', 'error');
    return;
  }

  // Admin withdrawal lock check
  if (isWithdrawLocked) {
    showToast(
      `Withdrawal Locked: ${
        withdrawLockedMsg || 'Withdrawal is temporarily disabled by admin.'
      }`,
      'error'
    );
    return;
  }

  // Account freeze check
  if (isAccountFrozen) {
    showToast(
      `Your account is frozen. ${
        withdrawLockedMsg || 'Withdrawals are restricted by admin.'
      }`,
      'error'
    );
    return;
  }

  // Validation
  if (!withdrawAmount.trim() || !Number.isFinite(amt) || amt <= 0) {
    showToast('Please enter a valid withdrawal amount.', 'error');
    return;
  }

  if (!withdrawPasswordInput) {
    showToast('Please enter your withdrawal password.', 'error');
    return;
  }

  if (completedTasks < 25) {
    showToast(
      'Withdrawal Locked: Complete all 25 daily tasks first!',
      'error'
    );
    return;
  }

  try {
    const { data, error } = await supabase.rpc(
      'submit_withdrawal_request',
      {
        p_amount: amt,
        p_password: withdrawPasswordInput,
        p_trc20_address: trc20Address || 'User Wallet',
      }
    );

    if (error) {
      console.error('Withdrawal request failed:', error);

      const { data: latestProfile } = await supabase
        .from('profiles')
        .select('withdraw_locked, withdraw_message, is_frozen')
        .eq('id', user.id)
        .maybeSingle();

      if (latestProfile) {
        setIsWithdrawLocked(Boolean(latestProfile.withdraw_locked));
        setWithdrawLockedMsg(latestProfile.withdraw_message || '');
        setIsAccountFrozen(Boolean(latestProfile.is_frozen));
      }

      showToast(error.message || 'Withdrawal request failed.', 'error');
      return;
    }
    

    if (!data?.success) {
      showToast(data?.message || 'Withdrawal request failed.', 'error');
      return;
    }

    // Updated profile fetch karein
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, withdraw_locked, withdraw_message, is_frozen, vip_level, auto_task_lock')
      .eq('id', user.id)
      .single();

    if (!profileError && updatedProfile) {
      setBalance(Number(updatedProfile.balance) || 0);
      setIsWithdrawLocked(Boolean(updatedProfile.withdraw_locked));
      setWithdrawLockedMsg(updatedProfile.withdraw_message || '');
      setIsAccountFrozen(Boolean(updatedProfile.is_frozen));
      setIsAutoTaskLocked(Boolean(updatedProfile.auto_task_lock));

      if (updatedProfile.vip_level) {
        setActiveVipLevel(updatedProfile.vip_level);
      }
    }

    // Refresh withdrawal history
    const { data: witData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (witData) {
      setWithdrawHistory(witData);
    }

    showToast('Withdrawal request submitted successfully.');
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawPasswordInput('');
  } catch (err: any) {
    console.error('Withdrawal submission error:', err);
    showToast(
      err?.message || 'Could not submit withdrawal request.',
      'error'
    );
  }
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
{/* Frozen Account Warning */}
{isAccountFrozen && (
  <div
    role="alert"
    className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300"
  >
    <h3 className="mb-2 font-bold">
      ⚠️ Your Account Is Frozen
    </h3>
    <p className="text-sm">
      Your account has been frozen by the administrator.
      Please contact Customer Service for assistance.
    </p>
  </div>
)}
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
 onClick={() => {
  setIsLuckyOrderDeposit(false);
  setDepositAmount('');
  setDepositStep(1);
  setPaymentReference('');
  setReceiptFile(null);
  setShowDepositModal(true);
}}
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

  {/* HOME TAB - COMPACT SINGLE-PAGE FIT */}
        {activeTab === 'home' && (
          <div className="space-y-2 font-sans text-amber-100">
            
            {/* TOP 4 BUTTONS */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <button
                onClick={() => setInfoModal({ title: 'About Us', text: ABOUT_TEXT })}
                className="p-1.5 bg-[#0b0c10] border border-[#d4af37] rounded-xl shadow flex flex-col items-center justify-center space-y-0.5 hover:border-[#f3e5ab]"
              >
                <span className="text-base">👥</span>
                <span className="text-[8px] font-black text-[#f3e5ab]">About Us</span>
              </button>

              <button
                onClick={() => setInfoModal({ title: 'Platform Rules', text: RULES_TEXT })}
                className="p-1.5 bg-[#0b0c10] border border-[#d4af37] rounded-xl shadow flex flex-col items-center justify-center space-y-0.5 hover:border-[#f3e5ab]"
              >
                <span className="text-base">📋</span>
                <span className="text-[8px] font-black text-[#f3e5ab]">Rules</span>
              </button>

              <button
                onClick={() => setInfoModal({ title: 'How It Works', text: HOW_IT_WORKS_TEXT })}
                className="p-1.5 bg-[#0b0c10] border border-[#d4af37] rounded-xl shadow flex flex-col items-center justify-center space-y-0.5 hover:border-[#f3e5ab]"
              >
                <span className="text-base">⚙️</span>
                <span className="text-[8px] font-black text-[#f3e5ab]">How Works</span>
              </button>

              <button
                onClick={() => setShowCertModal(true)}
                className="p-1.5 bg-[#0b0c10] border border-[#d4af37] rounded-xl shadow flex flex-col items-center justify-center space-y-0.5 hover:border-[#f3e5ab]"
              >
                <span className="text-base">📜</span>
                <span className="text-[8px] font-black text-[#f3e5ab]">Certificate</span>
              </button>
            </div>

            {/* ABOUT US FRONT DISPLAY WITH FULL DETAILS */}
            <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-2xl p-2.5 space-y-1.5 shadow-xl">
              <div className="flex items-center space-x-1.5 border-b border-[#d4af37]/30 pb-1">
                <div className="w-6 h-6 rounded-full bg-[#18150a] border border-[#d4af37] flex items-center justify-center text-xs">
                  👥
                </div>
                <h3 className="text-xs font-black text-[#f3e5ab] tracking-wider">About Us</h3>
              </div>

              <p className="text-[10px] text-gray-300 leading-snug">
                Welcome to Digital Marketing. Digital Marketing is an online platform focused on digital commerce, marketing innovation, and online business opportunities. It serves as an <span className="text-[#f3e5ab] font-bold">international legal platform offering genuine earning opportunities</span> through Digital Marketing. Partnered with <span className="text-red-400 font-bold">AliExpress</span>, <span className="text-amber-400 font-bold">Amazon</span> and <span className="text-emerald-400 font-bold">Shopify</span>.
              </p>

              <div className="bg-[#18150a] border border-[#d4af37]/50 p-1.5 rounded-xl flex justify-around items-center">
                <span className="font-black text-red-500 text-[10px]">AliExpress</span>
                <span className="text-gray-600">|</span>
                <span className="font-black text-amber-400 text-[10px]">amazon</span>
                <span className="text-gray-600">|</span>
                <span className="font-black text-emerald-400 text-[10px]">shopify</span>
              </div>
            </div>

            {/* COMPACT LIVE TRANSACTIONS BOX */}
            <div className="bg-[#0b0c10] border-2 border-[#d4af37] p-2.5 rounded-2xl shadow-xl space-y-1.5 w-full">
              <div className="flex justify-between items-center border-b border-[#d4af37]/30 pb-1">
                <h3 className="text-xs font-extrabold text-[#f3e5ab] tracking-wider flex items-center space-x-1.5">
                  <span className="text-sm text-[#d4af37]">📈</span>
                  <span>LIVE TRANSACTIONS</span>
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] font-bold rounded-full animate-pulse">
                  Real-Time
                </span>
              </div>

              <div className="space-y-1">
                {liveFeed.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-1.5 bg-[#18150a] border border-[#d4af37]/30 rounded-xl flex items-center justify-between text-[11px] transition duration-300"
                  >
                    <div>
                      <span className="font-bold text-white text-[10px]">{tx.user}</span>
                      <p className="text-[7px] text-gray-400 leading-none">(Commission Earned)</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-[#50e3c2] text-xs">+${tx.amount} USDT</span>
                      <p className="text-[7px] text-gray-400 leading-none">{tx.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COMPACT WHY CHOOSE US FOOTER */}
            <div className="bg-gradient-to-r from-[#181408] via-[#241c0c] to-[#181408] border-2 border-[#d4af37] rounded-2xl p-2 shadow-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#d4af37] text-black flex items-center justify-center font-bold text-xs shadow">
                    🛡️
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-[#f3e5ab]">Why Choose Us?</h4>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-[8px]">
                  <span className="px-1.5 py-0.5 bg-black/60 border border-[#d4af37]/40 rounded-lg text-amber-200">🔒 Secure</span>
                  <span className="px-1.5 py-0.5 bg-black/60 border border-[#d4af37]/40 rounded-lg text-amber-200">👥 Verified</span>
                  <span className="px-1.5 py-0.5 bg-black/60 border border-[#d4af37]/40 rounded-lg text-amber-200">🎧 Support</span>
                </div>
              </div>

              <div className="text-center border-t border-[#d4af37]/20 pt-1">
                <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-white to-[#d4af37] tracking-wider italic">
                  📈 Build Your Future With Us
                </span>
              </div>

              {/* 3 REAL DIGITAL MARKETING TRUST LOGOS */}
              <div className="pt-1 border-t border-[#d4af37]/20 grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-black/70 border border-[#d4af37]/30 rounded-xl p-1 flex items-center justify-center space-x-1">
                  <span className="text-blue-400 font-black text-[11px]">∞</span>
                  <span className="text-[8px] font-bold text-gray-200">Meta Ads</span>
                </div>
                <div className="bg-black/70 border border-[#d4af37]/30 rounded-xl p-1 flex items-center justify-center space-x-1">
                  <span className="text-amber-400 font-black text-[10px]">G</span>
                  <span className="text-[8px] font-bold text-gray-200">Google Partner</span>
                </div>
                <div className="bg-black/70 border border-[#d4af37]/30 rounded-xl p-1 flex items-center justify-center space-x-1">
                  <span className="text-orange-500 font-black text-[10px]">hub</span>
                  <span className="text-[8px] font-bold text-gray-200">HubSpot</span>
                </div>
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
          <h2 className="text-base font-extrabold text-[#f3e5ab]">
            Customer Support Center
          </h2>
          <p className="text-[10px] text-gray-400">
            24/7 Official Support Channels & Live Agent
          </p>
        </div>

        {/* ADMIN SAVED SUPPORT LINKS */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={telegramUrl || 'https://t.me'}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 bg-[#18150a] border border-sky-400/50 text-sky-300 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 hover:bg-sky-950/30"
          >
            <span>✈️</span>
            <span>Telegram</span>
          </a>

          <a
            href={whatsappUrl || 'https://whatsapp.com'}
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
            <span className="text-xs font-black text-[#f3e5ab]">
              Live Assistant Portal
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">
            ● Online
          </span>
        </div>

        <div className="flex-1 min-h-[320px] max-h-[450px] overflow-y-auto space-y-2.5 pr-1 text-xs">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 text-xs py-16">
              No messages yet. Send a message to support!
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  !msg.is_admin ? 'items-end' : 'items-start'
                }`}
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

        <form
          onSubmit={handleSendMessage}
          className="flex gap-2 pt-2 border-t border-[#d4af37]/30"
        >
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
  {isGrabbing
    ? 'Matching Order Tasks...'
    : currentTask?.isLucky === true
      ? 'VIEW PENDING LUCKY ORDER'
      : 'START GRABBING'}
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

       
{currentTask?.isLucky && (
  <div className="bg-[#171717] border border-red-500/40 rounded-2xl p-3 space-y-3">
    <div className="flex items-center gap-3">
    <img
  src={currentTask.imageUrl}
  alt={currentTask.name}
  loading="eager"
  decoding="async"
  className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl object-contain bg-white p-1 border border-red-500/50"
/>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white line-clamp-1">
          {currentTask.name}
        </p>

        <p className="text-[10px] text-red-300 font-mono mt-0.5">
          {Math.abs(Number(runningTasksVal)) > 0.009
            ? `Required Recharge: $${Math.abs(Number(runningTasksVal)).toFixed(2)}`
            : 'Lucky Order pending — checking funding status'}
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
{depositStep === 1 && paymentMethod === 'bank' && (
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
      />
    </div>

    <p className="text-[10px] text-gray-400">
      Check the account details carefully before sending payment.
    </p>
  </div>
)}

<form onSubmit={handleDepositSubmit} className="space-y-3">

{/* STEP 1: AMOUNT */}
{depositStep === 1 && (
  <>
{!isLuckyOrderDeposit && (      <div>
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
    )}

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
readOnly={isLuckyOrderDeposit}
        onChange={(e) => setDepositAmount(e.target.value)}
        className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white read-only:opacity-80"
        required
      />
    </div>

    <button
      type="button"
      onClick={() => {
        const amount = Number(depositAmount);

        if (!Number.isFinite(amount) || amount <= 0) {
          showToast('Please enter a valid deposit amount', 'error');
          return;
        }

        if (
          paymentMethod === 'bank' &&
          (!bankName.trim() || !accountNumber.trim())
        ) {
          showToast('Please enter bank name and account number', 'error');
          return;
        }

        setDepositStep(2);
      }}
      className="w-full py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black text-xs font-black rounded-xl"
    >
      Next
    </button>
  </>
)}

  {/* STEP 2: PAYMENT PROOF */}
  {depositStep === 2 && (
    <>
      <div className="bg-[#18150a] border border-[#d4af37]/40 rounded-xl p-3">
        <p className="text-[10px] text-gray-400">Selected Payment Method</p>
        <p className="text-sm font-bold text-[#f3e5ab]">
          {paymentMethod === 'trc20' ? 'USDT TRC20' : 'Bank Transfer'}
        </p>

        <p className="text-[10px] text-gray-400 mt-2">Deposit Amount</p>
        <p className="text-lg font-black text-[#d4af37]">
          ${Number(depositAmount).toFixed(2)}
        </p>
      </div>

      <div>
        <label className="text-[10px] text-gray-400 block mb-1">
          {paymentMethod === 'trc20'
            ? 'Transaction ID (TXID) — optional if screenshot provided'
            : 'Bank Payment Reference — optional if screenshot provided'}
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
        />
      </div>

      <div>
        <label className="text-[10px] text-gray-400 block mb-1">
          Payment Receipt (JPG, PNG or WEBP, max 5 MB) — optional if reference provided
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          className="w-full text-[10px] text-gray-300 file:mr-2 file:rounded-lg file:border file:border-[#d4af37]/50 file:bg-[#18150a] file:px-3 file:py-2 file:text-[#f3e5ab]"
        />

        {receiptFile && (
          <p className="text-[10px] text-[#f3e5ab] mt-1 break-all">
            Selected: {receiptFile.name}
          </p>
        )}
      </div>

      <p className="text-[10px] text-gray-400">
        Provide either a transaction reference or a screenshot.
        Your request remains pending until payment is verified.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDepositStep(1)}
          className="flex-1 py-2 bg-[#18150a] border border-[#d4af37]/40 text-xs font-bold rounded-xl text-white"
        >
          Back
        </button>

        <button
          type="submit"
          className="flex-1 py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black text-xs font-black rounded-xl"
        >
          Submit Request
        </button>
      </div>
    </>
  )}

  {depositStep === 1 && (
    <button
      type="button"
      onClick={() => {
        setShowDepositModal(false);
        setDepositStep(1);
      }}
      className="w-full py-2 bg-[#18150a] border border-[#d4af37]/40 text-xs font-bold rounded-xl text-white"
    >
      Cancel
    </button>
  )}
</form>
</div>
</div>
)}

    
{/* WITHDRAW MODAL */}
{showWithdrawModal && (
  <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div className="bg-[#0b0c10] border-2 border-[#d4af37] rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h3 className="text-base font-extrabold text-[#f3e5ab] text-center">
        Withdraw Funds
      </h3>

      {/* Show restriction message only once */}
      {(isWithdrawLocked || isAccountFrozen) && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-bold">Withdrawal Restricted</p>
          <p className="mt-1">
            {isAccountFrozen
              ? 'Your account is frozen. Withdrawals are restricted by admin.'
              : withdrawLockedMsg.trim() ||
                'Withdrawal is temporarily disabled by admin.'}
          </p>
        </div>
      )}

      <form onSubmit={handleWithdrawSubmit} className="space-y-3">
        <input
          type="number"
          placeholder="Amount ($)"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          disabled={isWithdrawLocked || isAccountFrozen}
          className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
        />

        <input
          type="password"
          placeholder="Withdrawal Password"
          value={withdrawPasswordInput}
          onChange={(e) => setWithdrawPasswordInput(e.target.value)}
          disabled={isWithdrawLocked || isAccountFrozen}
          className="w-full bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowWithdrawModal(false)}
            className="flex-1 py-2 bg-[#18150a] border border-[#d4af37]/40 text-xs font-bold rounded-xl text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isWithdrawLocked || isAccountFrozen}
            className="flex-1 py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black text-xs font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWithdrawLocked || isAccountFrozen
              ? 'Withdrawal Restricted'
              : 'Submit'}
          </button>
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
           
<div className="w-1/2 aspect-square rounded-xl bg-white border border-[#332a15] overflow-hidden flex items-center justify-center shrink-0 p-3">
  <img
    src={currentTask.imageUrl}
    alt={currentTask.name}
    loading="eager"
    decoding="async"
    fetchPriority="high"
    className="w-full h-full object-contain"
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
                    Congratulationsss                  </div>
                  <div className="text-sm font-bold text-[#f3e5ab]">
                    You have got a lucky order!
                  </div>
               <div className="text-xs text-amber-200/90 font-medium">
  Please complete your high commission lucky order and earn commission
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
  onClick={async () => {
    if (!currentTask) return;

    // Normal task: existing completion flow
    if (!currentTask.isLucky) {
      await handleConfirmTask();
      return;
    }

    // Lucky Order must have its exact database ID
    if (!user || !currentTask.customTaskId) {
      showToast('Lucky Order ID missing. Please refresh and try again.', 'error');
      return;
    }

    // Fetch the latest status and required amount for this exact order
    const { data: luckyOrder, error } = await supabase
      .from('custom_tasks')
      .select('id, funding_status, locked_price, task_amount, user_id')
      .eq('id', currentTask.customTaskId)
      .eq('user_id', user.id)
      .eq('is_lucky_order', true)
      .maybeSingle();

    if (error || !luckyOrder) {
      showToast('Could not load this Lucky Order. Please try again.', 'error');
      return;
    }

    // If verified funding already exists, use the existing completion handler
    if (luckyOrder.funding_status === 'funded') {
      await handleConfirmTask();
      return;
    }

    const requiredAmount = Number(
      luckyOrder.locked_price ?? luckyOrder.task_amount
    );

    if (!Number.isFinite(requiredAmount) || requiredAmount <= 0) {
      showToast('Lucky Order amount is invalid. Please contact support.', 'error');
      return;
    }

   // Open Deposit specifically for this Lucky Order
setIsLuckyOrderDeposit(true);
setDepositAmount(requiredAmount.toFixed(2));
setPaymentReference('');
setReceiptFile(null);
setDepositStep(1);
setShowFullPageTask(false);
setShowDepositModal(true);
  }}
  className="w-full py-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
>
  <span>📋</span>
  <span>CONTINUE TASKS →</span>
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