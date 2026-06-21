import React, { useState } from 'react';
import { 
  Recycle, LayoutDashboard, Database, Calculator, 
  TrendingUp, Lightbulb, Plus, X, Wand2, Circle, Bot,
  MessageSquare, Send, Loader2, BookOpen, Download, FileSpreadsheet, Printer,
  Lock, User, Mail, ShieldAlert, CheckCircle2, AlertCircle, LogOut,
  Sun, Moon, Leaf, Info, Upload, Image, FileText, Layers, RefreshCw
} from 'lucide-react';
import { calculateDES, getMAPE, findBestParams } from './utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const formatIndoNumber = (num: number | null | undefined, decimals: number = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (parts[1]) {
    return `${parts[0]},${parts[1]}`;
  }
  return parts[0];
};

type DataRow = {
  id: string;
  value: number;
};

type TabMenu = 'dashboard' | 'input' | 'hitungan' | 'grafik_interpretasi' | 'teori' | 'penjelasan_tpa' | 'pengembang';

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const getPeriodLabel = (index: number, format: 'short' | 'long' | 'split' = 'short') => {
  const year = 2018 + Math.floor(index / 12);
  const monthIdx = index % 12;
  if (format === 'short') {
    return `${MONTHS[monthIdx].substring(0, 3)} '${year.toString().slice(-2)}`;
  } else if (format === 'long') {
    return `${MONTHS[monthIdx]} ${year}`;
  } else {
    return { month: MONTHS[monthIdx], year };
  }
};

export default function App() {
  const [activeTab, setActiveTab ] = useState<TabMenu>('teori');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('putri_cempo_theme') as 'light' | 'dark') || 'light';
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('putri_cempo_theme', nextTheme);
  };

  // Theme-dependent styles helper
  const sText = isDark ? 'text-slate-100' : 'text-slate-800';
  const sSubtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const sCard = isDark ? 'bg-slate-900 border-white/5 shadow-none text-slate-100' : 'bg-white border-slate-100 shadow-sm text-slate-800';
  const sCardHover = isDark ? 'hover:bg-slate-800/40' : 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300';
  const sBorder = isDark ? 'border-white/5' : 'border-slate-100';
  const sBorderFull = isDark ? 'border-slate-800' : 'border-slate-200';
  const sBgSoft = isDark ? 'bg-slate-900/40 text-slate-100' : 'bg-slate-50 text-slate-600';
  const sBgSoftSolid = isDark ? 'bg-slate-950/80 text-slate-200' : 'bg-slate-50';
  const sTableHead = isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100/80 text-slate-600 border-slate-200';
  const sTableRow = isDark ? 'border-slate-800 hover:bg-slate-900/50' : 'border-slate-100 hover:bg-slate-50/50';
  const sInput = isDark ? 'bg-slate-950 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-700';
  const sTextAccent = isDark ? 'text-emerald-400' : 'text-slate-700';

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // States for TPA Infographic image
  const [infografisUrl, setInfografisUrl] = useState<string>(() => {
    return localStorage.getItem('putri_cempo_infografis_url') || '';
  });
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [urlInputValue, setUrlInputValue] = useState<string>('');
  const [infografisMode, setInfografisMode] = useState<'skema' | 'gambar'>(() => {
    return (localStorage.getItem('putri_cempo_infografis_mode') as 'skema' | 'gambar') || 'skema';
  });
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('putri_cempo_auth_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('putri_cempo_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Auth Form states
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regNim, setRegNim] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loginIdent, setLoginIdent] = useState(''); // email or NIM
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName.trim() || !regNim.trim() || !regEmail.trim() || !regPassword.trim()) {
      setAuthError('Harap lengkapi semua kolom pendaftaran.');
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setAuthError('Harap masukkan alamat email yang valid.');
      return;
    }

    let existingUsers: any[] = [];
    try {
      const existingStr = localStorage.getItem('putri_cempo_registered_users');
      existingUsers = existingStr ? JSON.parse(existingStr) : [];
    } catch (err) {
      existingUsers = [];
    }

    const duplicate = existingUsers.find((u: any) => u.email.toLowerCase() === regEmail.toLowerCase() || u.nim === regNim);
    if (duplicate) {
      setAuthError('Email atau NIM sudah terdaftar.');
      return;
    }

    const newUser = {
      name: regName,
      nim: regNim,
      email: regEmail,
      password: regPassword
    };

    existingUsers.push(newUser);
    localStorage.setItem('putri_cempo_registered_users', JSON.stringify(existingUsers));
    
    setAuthSuccess('Pendaftaran berhasil! Akun Anda terdaftar. Mengalihkan ke menu masuk...');
    setLoginIdent(regEmail);
    setTimeout(() => {
      setAuthTab('login');
      setAuthSuccess('');
      setRegName('');
      setRegNim('');
      setRegEmail('');
      setRegPassword('');
    }, 1800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!loginIdent.trim() || !loginPassword.trim()) {
      setAuthError('Harap isi Email/NIM dan kata sandi Anda.');
      return;
    }

    let existingUsers: any[] = [];
    try {
      const existingStr = localStorage.getItem('putri_cempo_registered_users');
      existingUsers = existingStr ? JSON.parse(existingStr) : [];
    } catch (err) {
      existingUsers = [];
    }

    const defaultUsers = [
      {
        name: 'Budi Handoko',
        nim: 'I0123045',
        email: 'mahasiswa@uns.ac.id',
        password: 'password123'
      },
      {
        name: 'Administrator TPA',
        nim: '198705052011031002',
        email: 'admin@putricempo.id',
        password: 'admin'
      }
    ];

    const allUsers = [...defaultUsers, ...existingUsers];
    const foundUser = allUsers.find(
      (u: any) => 
        (u.email.toLowerCase() === loginIdent.toLowerCase() || u.nim === loginIdent) && 
        u.password === loginPassword
    );

    if (foundUser) {
      setAuthSuccess(`Selamat datang kembali, ${foundUser.name}!`);
      setTimeout(() => {
        setIsLoggedIn(true);
        setCurrentUser(foundUser);
        localStorage.setItem('putri_cempo_auth_logged_in', 'true');
        localStorage.setItem('putri_cempo_auth_user', JSON.stringify(foundUser));
      }, 1000);
    } else {
      setAuthError('Akun tidak ditemukan atau kata sandi Anda salah.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('putri_cempo_auth_logged_in');
    localStorage.removeItem('putri_cempo_auth_user');
  };
  
  const [wasteData, setWasteData] = useState<DataRow[]>([
    { id: '18-1', value: 10257440 },
    { id: '18-2', value: 9616870 },
    { id: '18-3', value: 10176650 },
    { id: '18-4', value: 9529240 },
    { id: '18-5', value: 9201040 },
    { id: '18-6', value: 8620310 },
    { id: '18-7', value: 8666850 },
    { id: '18-8', value: 8880530 },
    { id: '18-9', value: 8729150 },
    { id: '18-10', value: 9170650 },
    { id: '18-11', value: 9310820 },
    { id: '18-12', value: 9676790 },
    { id: '19-1', value: 10541020 },
    { id: '19-2', value: 9587450 },
    { id: '19-3', value: 10451470 },
    { id: '19-4', value: 9431600 },
    { id: '19-5', value: 9328700 },
    { id: '19-6', value: 8097980 },
    { id: '19-7', value: 8820230 },
    { id: '19-8', value: 8591630 },
    { id: '19-9', value: 8241920 },
    { id: '19-10', value: 8701580 },
    { id: '19-11', value: 9028420 },
    { id: '19-12', value: 10071880 },
    { id: '20-1', value: 10037480 },
    { id: '20-2', value: 9525360 },
    { id: '20-3', value: 9912350 },
    { id: '20-4', value: 8300910 },
    { id: '20-5', value: 8411400 },
    { id: '20-6', value: 9333340 },
    { id: '20-7', value: 9044850 },
    { id: '20-8', value: 9345520 },
    { id: '20-9', value: 8629020 },
    { id: '20-10', value: 8547740 },
    { id: '20-11', value: 8365870 },
    { id: '20-12', value: 8338100 },
    { id: '21-1', value: 7945590 },
    { id: '21-2', value: 6886630 },
    { id: '21-3', value: 7759570 },
    { id: '21-4', value: 8498640 },
    { id: '21-5', value: 10292970 },
    { id: '21-6', value: 10334090 },
    { id: '21-7', value: 8995070 },
    { id: '21-8', value: 9120920 },
    { id: '21-9', value: 8929100 },
    { id: '21-10', value: 9247100 },
    { id: '21-11', value: 10715160 },
    { id: '21-12', value: 10573100 },
    { id: '22-1', value: 10860547 },
    { id: '22-2', value: 9593670 },
    { id: '22-3', value: 10980740 },
    { id: '22-4', value: 10962550 },
    { id: '22-5', value: 11012110 },
    { id: '22-6', value: 10367010 },
    { id: '22-7', value: 10312450 },
    { id: '22-8', value: 10864630 },
    { id: '22-9', value: 10641840 },
    { id: '22-10', value: 11741670 },
    { id: '22-11', value: 12222730 },
    { id: '22-12', value: 12534870 },
    { id: '23-1', value: 12781080 },
    { id: '23-2', value: 11762660 },
    { id: '23-3', value: 12493640 },
    { id: '23-4', value: 11529490 },
    { id: '23-5', value: 12131130 },
    { id: '23-6', value: 10647380 },
    { id: '23-7', value: 10901680 },
    { id: '23-8', value: 10560040 },
    { id: '23-9', value: 10161490 },
    { id: '23-10', value: 11172210 },
    { id: '23-11', value: 11248810 },
    { id: '23-12', value: 11376610 },
    { id: '24-1', value: 13393050 },
    { id: '24-2', value: 11768330 },
    { id: '24-3', value: 12332960 },
    { id: '24-4', value: 12542310 },
    { id: '24-5', value: 12191400 },
    { id: '24-6', value: 11330970 },
    { id: '24-7', value: 11702670 },
    { id: '24-8', value: 11213060 },
    { id: '24-9', value: 11219800 },
    { id: '24-10', value: 11808710 },
    { id: '24-11', value: 12205410 },
    { id: '24-12', value: 12541090 },
    { id: '25-1', value: 11949190 },
    { id: '25-2', value: 10522100 },
    { id: '25-3', value: 11357590 },
    { id: '25-4', value: 9544020 },
    { id: '25-5', value: 9799180 },
    { id: '25-6', value: 8871470 },
    { id: '25-7', value: 9413200 },
    { id: '25-8', value: 9353950 },
    { id: '25-9', value: 9187340 },
    { id: '25-10', value: 10241610 },
    { id: '25-11', value: 10437860 },
    { id: '25-12', value: 10829310 },
  ]);

  const [alpha, setAlpha] = useState<number>(0.9);
  const [beta, setBeta] = useState<number>(0.1);
  const [kapasitas, setKapasitas] = useState<number>(340000000);
  const [activeGraphType, setActiveGraphType] = useState<'bulanan' | 'kumulatif'>('bulanan');
  
  const addRow = () => {
    const lastValue = wasteData.length > 0 ? wasteData[wasteData.length - 1].value + 50 : 1000;
    setWasteData([...wasteData, { id: crypto.randomUUID(), value: lastValue }]);
  };

  const removeRow = (id: string) => {
    setWasteData(wasteData.filter((d) => d.id !== id));
  };

  const updateRow = (id: string, value: number) => {
    setWasteData(wasteData.map((d) => d.id === id ? { ...d, value: isNaN(value) ? 0 : value } : d));
  };

  const optimizeParams = () => {
    const y = wasteData.map((d) => d.value);
    if (y.length < 2) return;
    const best = findBestParams(y);
    setAlpha(Number(best.bestA.toFixed(2)));
    setBeta(Number(best.bestB.toFixed(2)));
  };

  // Calculations
  const y = wasteData.map((d) => d.value);
  const { L, T, F } = calculateDES(y, alpha, beta, 24);
  const mape = getMAPE(y, F);

  const mNext = F[y.length] !== null ? F[y.length] : 0;
  
  const lastL = L[y.length - 1] || 0;
  const lastT = T[y.length - 1] || 0;
  
  let sisaBln = 0;
  let cumm = 0;
  for (let i = 1; i <= 120; i++) {
    let pred = lastL + (i * lastT);
    cumm += pred;
    if (cumm >= kapasitas) {
      break;
    }
    sisaBln = i;
  }

  // Monthly Chart Data (Inflow)
  const chartData = F.map((f, i) => ({
    name: getPeriodLabel(i, 'short') as string,
    actual: i < y.length ? y[i] : null,
    forecast: f !== null ? Number(f.toFixed(2)) : null,
  }));

  // Cumulative Remaining capacity chart data
  const getCumulativeChartData = () => {
    const data = [];
    let currentRemaining = kapasitas;
    const startIndex = y.length; // Index starting after historical data
    
    // Add starting point
    data.push({
      name: getPeriodLabel(startIndex - 1, 'short') as string,
      remaining: currentRemaining,
      warningThreshold: kapasitas * 0.2,
      criticalThreshold: kapasitas * 0.05
    });

    for (let m = 1; m <= 36; m++) {
      const pred = lastL + (m * lastT);
      currentRemaining -= pred;
      const safeRemaining = currentRemaining > 0 ? Number(currentRemaining.toFixed(2)) : 0;
      data.push({
        name: getPeriodLabel(startIndex + m - 1, 'short') as string,
        remaining: safeRemaining,
        warningThreshold: kapasitas * 0.2,
        criticalThreshold: kapasitas * 0.05
      });
      if (safeRemaining === 0 && currentRemaining < -pred) {
        // Just keep adding up to 36 months to show the continuation of full capacity
      }
    }
    return data;
  };

  const cumulativeChartData = getCumulativeChartData();

  const exportToCSV = () => {
    const headers = [
      'Periode', 
      'Volume Aktual (kg)', 
      'Volume Aktual (Ton)', 
      'Smoothed Level L_t (kg)', 
      'Smoothed Trend T_t (kg)', 
      'Hasil Peramalan F_t (kg)', 
      'Hasil Peramalan F_t (Ton)'
    ];
    
    const rows = F.map((f, i) => {
      const actualVal = i < y.length ? y[i] : null;
      const actualTon = actualVal !== null ? (actualVal / 1000).toFixed(2) : '-';
      const lVal = L[i] !== undefined ? L[i].toFixed(2) : '-';
      const tVal = T[i] !== undefined ? T[i].toFixed(2) : '-';
      const fVal = f !== null ? f.toFixed(2) : '-';
      const fTon = f !== null ? (f / 1000).toFixed(2) : '-';
      
      return [
        `"${getPeriodLabel(i, 'long')}"`,
        actualVal !== null ? actualVal.toString() : '-',
        actualTon,
        lVal,
        tVal,
        fVal,
        fTon
      ];
    });
    
    // Using semicolon as separator and including UTF-8 BOM for Indonesian Excel locale compatibility
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Simulasi_TPA_Putri_Cempo_DES_Alpha_${alpha}_Beta_${beta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAccuracyContext = (m: number) => {
    if (y.length < 2) return { label: 'Kurang Data', bgClass: 'bg-slate-100', textClass: 'text-slate-700' };
    if (m <= 10) return { label: 'Sangat Akurat', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' };
    if (m <= 20) return { label: 'Baik', bgClass: 'bg-blue-100', textClass: 'text-blue-700' };
    if (m <= 50) return { label: 'Cukup', bgClass: 'bg-orange-100', textClass: 'text-orange-700' };
    return { label: 'Tidak Akurat', bgClass: 'bg-red-100', textClass: 'text-red-700' };
  };

  const accContext = getAccuracyContext(mape);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const summaryContext = `
        Kapasitas Sisa: ${kapasitas} kg.
        TPA Overcapacity diprediksi dalam kelipatan bulan ke: ${sisaBln}.
        MAPE Model DES: ${mape.toFixed(2)}%.
        Alpha: ${alpha}, Beta: ${beta}.
      `;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context: summaryContext })
      });
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Maaf, terjadi kesalahan pada server saat menghubungi AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfografisDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleInfografisDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Url = event.target.result as string;
          setInfografisUrl(base64Url);
          localStorage.setItem('putri_cempo_infografis_url', base64Url);
          setInfografisMode('gambar');
          localStorage.setItem('putri_cempo_infografis_mode', 'gambar');
          setImageLoadError(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInfografisFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Url = event.target.result as string;
          setInfografisUrl(base64Url);
          localStorage.setItem('putri_cempo_infografis_url', base64Url);
          setInfografisMode('gambar');
          localStorage.setItem('putri_cempo_infografis_mode', 'gambar');
          setImageLoadError(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInputValue.trim()) {
      setInfografisUrl(urlInputValue.trim());
      localStorage.setItem('putri_cempo_infografis_url', urlInputValue.trim());
      setInfografisMode('gambar');
      localStorage.setItem('putri_cempo_infografis_mode', 'gambar');
      setImageLoadError(false);
    }
  };

  const resetInfografis = () => {
    setInfografisUrl('');
    localStorage.removeItem('putri_cempo_infografis_url');
    setUrlInputValue('');
    setInfografisMode('skema');
    localStorage.removeItem('putri_cempo_infografis_mode');
    setImageLoadError(false);
  };

  const MENU_ITEMS: { id: TabMenu; label: string; icon: React.FC<any> }[] = [
    { id: 'penjelasan_tpa', label: 'Penjelasan TPA', icon: Info },
    { id: 'teori', label: 'Materi & Teori', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'input', label: 'Input Data', icon: Database },
    { id: 'hitungan', label: 'Hitungan DES', icon: Calculator },
    { id: 'grafik_interpretasi', label: 'Grafik & Interpretasi', icon: TrendingUp },
    { id: 'pengembang', label: 'Profil Pengembang', icon: User },
  ];

  // Views mapping
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${sText}`}>Dashboard Utama</h2>
        <p className={`${sSubtext} mt-1`}>Ringkasan hasil peramalan volume sampah TPA Putri Cempo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className={`${sCard} p-6 rounded-3xl flex flex-col justify-between ${sCardHover} relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <p className={`text-sm ${sSubtext} font-bold uppercase tracking-wider`}>MAPE Terbaik</p>
            <h3 className={`text-3xl font-black ${sText} tracking-tight mt-3`}>
              {y.length > 1 ? formatIndoNumber(mape, 2) : '-'}%
            </h3>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg w-fit mt-6 relative z-10 shadow-sm ${accContext.bgClass} ${accContext.textClass}`}>
            {accContext.label}
          </span>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-3xl shadow-md border border-blue-400 flex flex-col justify-between hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Calculator className="w-16 h-16 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-blue-100 font-bold uppercase tracking-wider">Prediksi Bln Depan</p>
            <h3 className="text-3xl font-black tracking-tight mt-3 break-all">
              {y.length > 0 ? formatIndoNumber(mNext, 2) : '-'}
            </h3>
          </div>
          <p className="text-xs text-blue-100/90 font-bold mt-6 relative z-10 bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
            kg ({y.length > 0 ? formatIndoNumber(mNext / 1000, 2) : '-'} Ton)
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-md border border-emerald-400 flex flex-col justify-between hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-300 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <Wand2 className="w-16 h-16 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-emerald-100 font-bold uppercase tracking-wider">Alpha / Beta</p>
            <h3 className="text-3xl font-black tracking-tight mt-3">
              {formatIndoNumber(alpha, 2)} <span className="text-emerald-200/50 font-normal">/</span> {formatIndoNumber(beta, 2)}
            </h3>
          </div>
          <p className="text-xs text-emerald-50 font-bold mt-6 relative z-10 bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">Koefisien Optimal</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-3xl shadow-md border border-orange-400 flex flex-col justify-between hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:-rotate-12 transition-transform">
            <Lightbulb className="w-16 h-16 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-orange-100 font-bold uppercase tracking-wider">Estimasi Sisa Umur</p>
            <h3 className="text-4xl font-black tracking-tight mt-3 drop-shadow-sm">
              {sisaBln >= 120 ? '>120' : sisaBln}
            </h3>
          </div>
          <p className="text-xs text-orange-50 font-bold mt-6 relative z-10 bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">Bulan Hingga Penuh</p>
        </div>
      </div>

      <div className="mt-12 space-y-6">
        <div>
           <h3 className={`text-xl font-bold ${sText}`}>Laporan Volume Sampah Masuk (6 Bulan Terakhir)</h3>
           <p className={`${sSubtext} mt-1`}>Laporan historis volume sampah tercatat beberapa bulan belakangan.</p>
        </div>
        <div className={`${sCard} rounded-3xl overflow-hidden`}>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`${sTableHead} sticky top-0 z-10 backdrop-blur-md uppercase text-xs tracking-wider border-b`}>
                <tr>
                  <th className={`px-6 py-4 border-r ${sBorder} w-32`}>Tahun</th>
                  <th className={`px-6 py-4 border-r ${sBorder}`}>Bulan</th>
                  <th className="px-6 py-4 text-right">Volume Aktual</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {[...wasteData].slice(-6).reverse().map((d) => {
                  const originalIndex = wasteData.findIndex(w => w.id === d.id);
                  const period = getPeriodLabel(originalIndex, 'split') as { month: string, year: number };
                  return (
                    <tr key={d.id} className={`${sTableRow} transition-colors`}>
                      <td className={`px-6 py-4 font-bold border-r ${sBorder} ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>{period.year}</td>
                      <td className={`px-6 py-4 font-semibold border-r ${sBorder} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{period.month}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-500">
                        {formatIndoNumber(d.value, 0)} kg &nbsp;
                        <span className={`text-xs font-normal ${sSubtext}`}>({formatIndoNumber(d.value / 1000, 1)} Ton)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInput = () => (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className={`text-2xl font-bold ${sText}`}>Input Data Bulanan</h2>
        <p className={`${sSubtext} mt-1`}>Masukkan data realisasi volume sampah yang masuk secara historis (kg).</p>
      </div>
      
      <div className={`${sCard} p-6 rounded-3xl`}>
        <label className={`block text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-4`}>Volume Sampah Bulanan (kg)</label>
        <div className="max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <AnimatePresence initial={false}>
              {wasteData.map((d, index) => (
                <motion.div 
                  key={d.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex items-center group relative border ${isDark ? 'border-slate-800' : 'border-slate-200'} rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${isDark ? 'bg-slate-950/55' : 'bg-white'}`}
                >
                  <div className={`w-20 shrink-0 text-[11px] font-bold ${sSubtext} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} py-2 px-2 text-center border-r h-full flex items-center justify-center`}>
                    {getPeriodLabel(index, 'short') as string}
                  </div>
                  <input 
                    type="number" 
                    className={`w-full p-2 text-sm bg-transparent outline-none font-semibold ${sText} h-full`}
                    value={d.value}
                    onChange={(e) => updateRow(d.id, parseFloat(e.target.value))}
                  />
                  <button 
                    onClick={() => removeRow(d.id)}
                    className="absolute right-1 text-slate-350 hover:text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <button 
          onClick={addRow} 
          className={`mt-6 flex items-center justify-center gap-2 w-full text-sm font-bold transition-all py-3 px-4 rounded-xl ${isDark ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'}`}
        >
          <Plus className="w-5 h-5" /> Tambah Baris Data
        </button>
      </div>

      <div>
         <h2 className={`text-xl font-bold ${sText} mb-4`}>Pengaturan Kapasitas TPA</h2>
         <div className={`${sCard} p-6 lg:p-8 rounded-3xl`}>
            <label className={`block text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-3`}>Kapasitas Sisa Real-time (kg)</label>
            <div className="relative">
              <input 
                type="number" 
                value={kapasitas} 
                onChange={(e) => setKapasitas(parseFloat(e.target.value) || 0)}
                className={`w-full pl-5 pr-20 py-4 border rounded-2xl text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-700'}`}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 tracking-widest">KG</span>
            </div>
         </div>
      </div>
    </div>
  );

  const renderHitungan = () => (
    <div className="space-y-8">
      <div>
        <h2 className={`text-2xl font-bold ${sText}`}>Hitungan Peramalan DES</h2>
        <p className={`${sSubtext} mt-1`}>Konfigurasi parameter model dan tabel kalkulasi matematis (Holt's Linear Trend).</p>
      </div>

      <div className={`${sCard} p-6 lg:p-10 rounded-3xl max-w-3xl`}>
          <h3 className={`text-lg font-bold ${sText} mb-8`}>Parameter Model (Alpha & Beta)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                 <span className={`text-sm font-bold ${sSubtext}`}>Nilai Alpha (Level)</span>
                 <span className="text-xl font-black text-blue-500">{formatIndoNumber(alpha, 2)}</span>
              </div>
              <input 
                type="range" 
                min="0.01" max="0.99" step="0.01" 
                value={alpha} 
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-sm text-slate-400 mt-3 font-medium">Mempengaruhi tingkat kedetailan / pembobotan data pada komponen Level (L).</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                 <span className={`text-sm font-bold ${sSubtext}`}>Nilai Beta (Trend)</span>
                 <span className="text-xl font-black text-emerald-500">{formatIndoNumber(beta, 2)}</span>
              </div>
              <input 
                type="range" 
                min="0.01" max="0.99" step="0.01" 
                value={beta} 
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-sm text-slate-400 mt-3 font-medium">Mempengaruhi sensitivitas pembobotan pergerakan tren runtun waktu (T).</p>
            </div>
          </div>
          <button 
            onClick={optimizeParams} 
            className={`w-full py-4 text-sm rounded-2xl font-bold shadow-sm transition-all flex items-center justify-center gap-3 ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'}`}
          >
            <Wand2 className="w-5 h-5" /> Jalankan Optimasi Otomatis (Cari Parameter MAPE Terendah)
          </button>
      </div>

      <div className={`${sCard} p-6 lg:p-10 rounded-3xl max-w-3xl`}>
          <h3 className={`text-lg font-bold ${sText} mb-6`}>Persamaan Pemodelan Matematis (DES Holt)</h3>
          <div className="space-y-4">
             <div className={`${sBgSoft} p-4 rounded-xl border ${sBorder}`}>
                <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Persamaan Level (L<sub className="text-[10px]">t</sub>)</p>
                <div className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'} text-lg`}>
                   L<sub>t</sub> = αY<sub>t</sub> + (1 - α)(L<sub>t-1</sub> + T<sub>t-1</sub>)
                </div>
             </div>
             <div className={`${sBgSoft} p-4 rounded-xl border ${sBorder}`}>
                <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Persamaan Trend (T<sub className="text-[10px]">t</sub>)</p>
                <div className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'} text-lg`}>
                   T<sub>t</sub> = β(L<sub>t</sub> - L<sub>t-1</sub>) + (1 - β)T<sub>t-1</sub>
                </div>
             </div>
             <div className={`${sBgSoft} p-4 rounded-xl border ${sBorder}`}>
                <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Persamaan Peramalan (F<sub className="text-[10px]">t+m</sub>)</p>
                <div className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'} text-lg`}>
                   F<sub>t+m</sub> = L<sub>t</sub> + mT<sub>t</sub>
                </div>
             </div>
             <div className={`${isDark ? 'bg-blue-950/40 border-blue-900/50' : 'bg-blue-50/50 border-blue-200'} p-4 rounded-xl border mt-6 shadow-sm`}>
                <p className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-1 tracking-wide uppercase`}>Persamaan Akhir Hasil Pemodelan (TPA Putri Cempo)</p>
                <div className={`font-mono text-blue-500 text-base sm:text-lg font-bold ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'} px-4 py-3 rounded-lg border w-fit leading-relaxed`}>
                   F<sub>({y.length}+m)</sub> = {formatIndoNumber(lastL, 2)} + m({formatIndoNumber(lastT, 2)})
                </div>
                <p className="text-xs text-slate-500 mt-2">Dihitung otomatis berdasarkan titik level akhir (L<sub>n</sub>) dan pergerakan tren akhir (T<sub>n</sub>) dari data Anda.</p>
             </div>
          </div>
      </div>

      <div className={`${sCard} rounded-3xl overflow-hidden`}>
        <div className={`p-6 border-b ${sBorder} ${isDark ? 'bg-slate-900/60' : 'bg-slate-50/50'}`}>
           <h3 className={`font-bold ${sText} text-lg`}>Tabel Kalkulasi Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`${sTableHead} uppercase text-xs tracking-wider border-b`}>
              <tr>
                <th className={`px-6 py-4 border-r ${sBorder}`}>Periode</th>
                <th className={`px-6 py-4 text-right border-r ${sBorder}`}>Aktual <span className="text-slate-400 font-medium normal-case">(y)</span></th>
                <th className={`px-6 py-4 text-right border-r ${sBorder}`}>Level <span className="text-slate-400 font-medium normal-case">(L)</span></th>
                <th className={`px-6 py-4 text-right border-r ${sBorder}`}>Trend <span className="text-slate-400 font-medium normal-case">(T)</span></th>
                <th className="px-6 py-4 text-right">Prediksi <span className="text-slate-400 font-medium normal-case">(F)</span></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {F.map((f, i) => {
                const actual = i < y.length ? y[i] : null;
                const lVal = L[i] !== undefined ? L[i] : null;
                const tVal = T[i] !== undefined ? T[i] : null;

                if (actual === null && i >= y.length + 12) return null; 

                return (
                  <tr key={i} className={`${sTableRow} transition-colors`}>
                    <td className={`px-6 py-4 font-bold border-r ${sBorder} ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>{getPeriodLabel(i, 'long') as string}</td>
                    <td className={`px-6 py-4 font-semibold text-right border-r ${sBorder} text-blue-500`}>
                      {actual !== null ? formatIndoNumber(actual, 0) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className={`px-6 py-4 text-right border-r ${sBorder} font-mono ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                      {lVal !== null ? formatIndoNumber(lVal, 2) : '-'}
                    </td>
                    <td className={`px-6 py-4 text-right border-r ${sBorder} font-mono ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                      {tVal !== null ? formatIndoNumber(tVal, 2) : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500 text-right font-mono">
                      {f !== null ? formatIndoNumber(f, 2) : <span className="text-slate-300">-</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGrafikInterpretasi = () => (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${sText}`}>Grafik & Interpretasi Data</h2>
          <p className={`${sSubtext} mt-1`}>Visualisasi data peramalan beserta analisis otomatis dari model.</p>
        </div>
        
        {/* Export & Print actions */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={exportToCSV}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 hover:bg-emerald-110 text-emerald-700 border border-emerald-300/50'}`}
            title="Unduh data peramalan dalam format CSV untuk Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor (.csv)</span>
          </button>
          <button 
            onClick={() => window.print()}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>
      
      <div className={`${sCard} p-6 lg:p-10 rounded-3xl`}>
        <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 border-b ${sBorder} pb-5`}>
          <div>
            <h3 className={`text-lg font-bold ${sText}`}>
              {activeGraphType === 'bulanan' 
                ? 'Visualisasi Volume Sampah Masuk Bulanan (Inflow)' 
                : 'Proyeksi Sisa Kapasitas Kumulatif TPA Putri Cempo'}
            </h3>
            <p className={`text-xs ${sSubtext} mt-0.5`}>Sumbu-Y menyatakan volume sampah dalam Juta Kilogram (Jt kg)</p>
          </div>
          
          {/* Graph selector tabs */}
          <div className={`flex ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} p-1.5 rounded-xl border self-stretch sm:self-auto transition-all`}>
            <button
              onClick={() => setActiveGraphType('bulanan')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeGraphType === 'bulanan'
                  ? (isDark ? 'bg-slate-900 text-blue-400 shadow-sm' : 'bg-white text-blue-700 shadow-sm')
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Volume Bulanan
            </button>
            <button
              onClick={() => setActiveGraphType('kumulatif')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeGraphType === 'kumulatif'
                  ? (isDark ? 'bg-slate-900 text-blue-400 shadow-sm' : 'bg-white text-blue-700 shadow-sm')
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Akumulasi Sisa Kapasitas
            </button>
          </div>
        </div>

        {activeGraphType === 'bulanan' ? (
          /* MONTHLY INFLOW CHART */
          <div>
            <div className="w-full relative -left-4 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} 
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} 
                    tickFormatter={(val) => formatIndoNumber(val / 1000000, 1) + " Jt"}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      color: isDark ? '#cbd5e1' : '#334155',
                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' 
                    }}
                    formatter={(value: number, name: string) => {
                      const kgStr = `${formatIndoNumber(value, 0)} kg`;
                      const tonStr = `${formatIndoNumber(value / 1000, 1)} Ton`;
                      const label = name === 'actual' ? 'Data Historis (Aktual)' : 'Prediksi (DES)';
                      return [`${kgStr} (${tonStr})`, label];
                    }}
                    labelStyle={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#334155', marginBottom: '8px' }}
                  />
                  
                  {/* Monthly safety threshold (based on average sustainable month absorption space over remaining 31 months of 340 million kg capacity) removed as requested */}

                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke={isDark ? '#3b82f6' : '#1e40af'} 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    name="actual"
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    strokeDasharray="5 5"
                    dot={{ r: 0 }}
                    activeDot={{ r: 6 }}
                    name="forecast"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2"><Circle className={`w-3 h-3 ${isDark ? 'fill-blue-500 text-blue-500' : 'fill-blue-800 text-blue-800'}`} /> Data Aktual ( kg )</span>
              <span className="flex items-center gap-2"><Circle className="w-3 h-3 fill-red-500 text-red-500" /> Hasil Peramalan ( kg )</span>
            </div>
          </div>
        ) : (
          /* CUMULATIVE DECREASE OF CAPACITY CHART */
          <div>
            <div className="w-full relative -left-4 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} 
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} 
                    tickFormatter={(val) => formatIndoNumber(val / 1000000, 1) + " Jt"}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      color: isDark ? '#cbd5e1' : '#334155',
                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' 
                    }}
                    formatter={(value: number) => {
                      const kgStr = `${formatIndoNumber(value, 0)} kg`;
                      const tonStr = `${formatIndoNumber(value / 1000, 1)} Ton`;
                      return [`${kgStr} (${tonStr})`, 'Sisa Kapasitas TPA'];
                    }}
                    labelStyle={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#334155', marginBottom: '8px' }}
                  />
                  
                  {/* Critical full overload capacity limit */}
                  <ReferenceLine 
                    y={0} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    label={{ 
                      value: 'Overcapacity (TPA Penuh)', 
                      position: 'top', 
                      fill: '#dc2626', 
                      fontSize: 10, 
                      fontWeight: 800 
                    }} 
                  />

                  <Line 
                    type="monotone" 
                    dataKey="remaining" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    name="remaining"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2"><Circle className="w-3 h-3 fill-emerald-500 text-emerald-500" /> Tren Sisa Kapasitas TPA ( kg )</span>
              <span className="flex items-center gap-2"><div className="w-6 h-0.5 border-t-2 border-red-500"></div> Batas Kritis Titik Jenuh</span>
            </div>
          </div>
        )}
      </div>

      <div className={`${sCard} p-8 lg:p-10 rounded-3xl flex flex-col items-start gap-8 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-slate-900/95 to-slate-950/95' : 'from-white/95 to-blue-50/95'} backdrop-blur-sm z-0`}></div>
        <div className={`flex items-center gap-5 border-b ${isDark ? 'border-slate-800' : 'border-blue-200/50'} pb-6 w-full relative z-10`}>
           <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Bot className="w-7 h-7 text-white" />
           </div>
           <div>
              <h3 className={`text-2xl font-black ${sText} tracking-tight`}>Interpretasi Peramalan dan Kapasitas</h3>
              <p className="text-sm font-bold text-blue-500 mt-0.5 uppercase tracking-wider">Hasil Analisis Model Pembobotan</p>
           </div>
        </div>

        <div className={`space-y-8 text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} w-full z-10`}>
          <div>
             <h4 className={`font-bold ${sText} mb-2 flex items-center gap-2 uppercase tracking-wider text-sm`}>
                <Database className="w-4 h-4 text-slate-400" /> Analisis Laju Akurasi
             </h4>
             <p className="mb-3">
                Melalui koordinat parameter pemulusan <span className={`font-bold ${isDark ? 'text-slate-100 bg-slate-800' : 'text-slate-900 bg-slate-100'} px-2 py-0.5 rounded`}>Alpha: {formatIndoNumber(alpha, 2)}</span> dan penyesuaian kecenderungan tren <span className={`font-bold ${isDark ? 'text-slate-100 bg-slate-800' : 'text-slate-900 bg-slate-100'} px-2 py-0.5 rounded`}>Beta: {formatIndoNumber(beta, 2)}</span>, 
                metode Double Exponential Smoothing (DES) dari Holt menunjukkan kecocokan model yang sangat presisi dengan capaian Mean Absolute Percentage Error (MAPE) hanya sebesar <span className="font-black text-blue-500 text-lg mx-1">{formatIndoNumber(mape, 2)}%</span>.
             </p>
             <p>
                Merujuk pada kriteria interpretasi data, nilai galat di bawah 10% mengklasifikasikan keandalan prediksi ini ke dalam tingkat <b className={accContext.textClass}>{accContext.label.toUpperCase()}</b>. Hasil sisa tren akhir (<span className="font-mono text-blue-400">T<sub>t</sub></span>) bernilai positif mencerminkan kecenderungan volume timbulan sampah yang terus bertumbuh secara aktif.
             </p>
          </div>

          <div className={`${isDark ? 'bg-orange-950/20 border-orange-900/50 text-orange-200' : 'bg-orange-50 border-orange-200/80 text-orange-950'} border rounded-2xl p-6 lg:p-8 shadow-sm relative overflow-hidden`}>
            <h4 className="font-black text-orange-500 mb-3 flex items-center gap-3 uppercase tracking-wider text-sm relative z-10">
               <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
               Laju Pengurangan Kapasitas TPA Putri Cempo
             </h4>
            
            <p className="relative z-10 text-base leading-relaxed">
               Dengan ketersediaan volume tampung efektif tersisa sebesar <b className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{formatIndoNumber(kapasitas, 0)} kg</b> ({formatIndoNumber(kapasitas/1000, 0)} Ton), 
               laju peluruhan sisa daya tampung diperkirakan akan mencapai titik penumpukan puncak (0 kg) dalam kurun waktu 
               <span className="text-lg font-black bg-orange-600 text-white px-3 py-1 rounded-lg mx-2 shadow-sm inline-block">
                 {sisaBln >= 120 ? '> 120' : sisaBln} Bulan
               </span> 
               ke depan.
            </p>
            <p className="relative z-10 mt-3 text-sm opacity-90 leading-relaxed font-medium">
               Hasil simulasi kumulatif ini sangat penting digunakan sebagai basis penyusunan kebijakan pengelolaan lingkungan hidup Kota Surakarta. Hal ini mengonfirmasi urgensi penambahan infrastruktur pereduksi volume sampah (seperti PLTSa Putri Cempo) ataupun pemilahan hulu demi memperpanjang umur operasional TPA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeori = () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className={`text-2xl font-bold ${sText}`}>Materi & Teori Pemodelan</h2>
        <p className={`${sSubtext} mt-1`}>Penjelasan teoritis mengenai metode peramalan Double Exponential Smoothing (DES) dari Holt.</p>
      </div>

      <div className={`${sCard} p-6 lg:p-10 rounded-3xl space-y-8`}>
        <div>
          <h3 className={`text-xl font-bold ${sText} flex items-center gap-3`}>
            <span className={`p-2 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-xl`}><Lightbulb className="w-5 h-5" /></span>
            Apa itu Metode DES Holt?
          </h3>
          <p className={`${isDark ? 'text-slate-350' : 'text-slate-600'} mt-3 leading-relaxed text-sm sm:text-base`}>
            Metode <b>Double Exponential Smoothing (DES)</b> dari Holt—atau dikenal juga sebagai linear exponential smoothing—merupakan metode peramalan runtun waktu (<i>time series forecasting</i>) yang digunakan untuk data yang memiliki kecenderungan tren linier naik atau turun secara konstan, serta tidak mengandung pola musiman (<i>seasonal factors</i>).
          </p>
          <p className={`${isDark ? 'text-slate-350' : 'text-slate-600'} mt-3 leading-relaxed text-sm sm:text-base`}>
            Metode ini menggunakan dua parameter pemulusan (smoothing parameter) yaitu <b>Alpha (&alpha;)</b> untuk mereduksi fluktuasi level (nilai rata-rata lokal) dan <b>Beta (&beta;)</b> untuk mereduksi fluktuasi estimasi tren (perubahan kemiringan garis dari waktu ke waktu).
          </p>
        </div>

        <div className={`border-t ${sBorder} pt-8`}>
          <h3 className={`text-xl font-bold ${sText} flex items-center gap-3 mb-4`}>
            <span className={`p-2 ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'} rounded-xl`}>
              <BookOpen className="w-5 h-5" />
            </span>
            Sejarah Double Exponential Smoothing (Holt)
          </h3>
          <div className="space-y-4">
            <p className={`${isDark ? 'text-slate-350' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              Metode pemulusan eksponensial (<i>exponential smoothing</i>) pertama kali dipelopori pada akhir tahun 1950-an. Tokoh utama di balik dasar pemulusan eksponensial sederhana adalah <b>Robert Goodell Brown</b>, yang merumuskan konsep ini sekitar tahun 1956 saat bekerja sebagai analis riset operasi untuk Angkatan Laut Amerika Serikat. Tugasnya kala itu adalah merancang sistem estimasi permintaan suku cadang kapal selam yang efisien dan tidak memakan banyak memori penyimpanan komputer. Namun, model awal Brown hanya handal untuk data yang konstan (stasioner) dan kurang adaptif terhadap data yang terus naik atau turun (memiliki tren).
            </p>
            <p className={`${isDark ? 'text-slate-350' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              Untuk mengatasi keterbatasan tersebut, seorang matematikawan dan ekonom terkemuka, <b>Charles Clifton Holt</b>, menyempurnakan metode ini pada tahun <b>1957</b> di Carnegie Mellon University. Holt memperkenalkan parameter pemulusan kedua, yaitu <b>Beta (&beta;)</b> yang bertindak khusus untuk menyaring fluktuasi kemiringan (<i>trend</i>), sementara parameter pertama, yaitu <b>Alpha (&alpha;)</b>, tetap bertugas menyaring tingkat pergeseran lokal data (<i>level</i>). Karya Holt ini awalnya ditulis dalam laporan teknis yang didanai oleh *Office of Naval Research (ONR)*.
            </p>
            <p className={`${isDark ? 'text-slate-350' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              Penemuan Holt ini sangat brilian karena menawarkan efisiensi komputasi yang luar biasa pada masanya. Alih-alih menyimpan ribuan deret data masa lalu dalam memori komputer yang terbatas, metode ini hanya membutuhkan data historis satu langkah ke belakang (nilai level dan tren dari periode t-1) ditambah dengan nilai aktual saat ini guna memproyeksikan masa depan. Di kemudian hari, metode Holt dikembangkan lebih lanjut oleh murid bimbingannya, <b>Peter R. Winters</b>, pada tahun 1960 untuk mencakup pola musiman (<i>seasonal patterns</i>), melahirkan metode termasyhur bernama <b>Holt-Winters Exponential Smoothing</b> yang digunakan secara global hingga detik ini dalam dunia sains data dan bisnis makro.
            </p>
          </div>
        </div>

        <div className={`border-t ${sBorder} pt-8`}>
          <h3 className={`text-lg font-bold ${sText} mb-6`}>Tiga Persamaan Utama DES Holt</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${sBgSoft} p-5 rounded-2xl border ${sBorder}`}>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">Langkah 1</span>
              <h4 className={`font-bold ${sText} mt-3 mb-1 text-sm`}>Persamaan Level (L<sub>t</sub>)</h4>
              <div className={`font-mono text-xs ${isDark ? 'text-blue-400 bg-slate-950 border-blue-900/40' : 'text-blue-800 bg-white border-blue-100'} p-3 rounded-xl border my-3`}>
                L<sub>t</sub> = &alpha;Y<sub>t</sub> + (1-&alpha;)(L<sub>t-1</sub> + T<sub>t-1</sub>)
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                Menghitung estimasi rata-rata lokal (level) baru pada periode t dengan menggabungkan data aktual sekarang (Y<sub>t</sub>) dengan estimasi periode sebelumnya yang ditambah nilai tren.
              </p>
            </div>

            <div className={`${sBgSoft} p-5 rounded-2xl border ${sBorder}`}>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Langkah 2</span>
              <h4 className={`font-bold ${sText} mt-3 mb-1 text-sm`}>Persamaan Trend (T<sub>t</sub>)</h4>
              <div className={`font-mono text-xs ${isDark ? 'text-emerald-400 bg-slate-950 border-emerald-950/40' : 'text-emerald-800 bg-white border-emerald-100'} p-3 rounded-xl border my-3`}>
                T<sub>t</sub> = &beta;(L<sub>t</sub> - L<sub>t-1</sub>) + (1-&beta;)T<sub>t-1</sub>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                Menghitung estimasi kemiringan (tren) baru berdasarkan selisih tingkat level sekarang dengan level sebelumnya, dikombinasikan dengan tren periode sebelumnya.
              </p>
            </div>

            <div className={`${sBgSoft} p-5 rounded-2xl border ${sBorder}`}>
              <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Langkah 3</span>
              <h4 className={`font-bold ${sText} mt-3 mb-1 text-sm`}>Persamaan Peramalan (F<sub>t+m</sub>)</h4>
              <div className={`font-mono text-xs ${isDark ? 'text-red-400 bg-slate-950 border-red-950/40' : 'text-red-800 bg-white border-red-100'} p-3 rounded-xl border my-3`}>
                F<sub>t+m</sub> = L<sub>t</sub> + m &times; T<sub>t</sub>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                Memproyeksikan peramalan untuk m periode ke depan (m menyatakan <i>lead time</i>) dengan menambahkan nilai level terakhir dengan kelipatan tren terakhir.
              </p>
            </div>
          </div>
        </div>

        <div className={`border-t ${sBorder} pt-8`}>
          <h3 className={`text-lg font-bold ${sText} mb-4`}>Kriteria Akurasi MAPE (Lewis, 1982)</h3>
          <p className={`${isDark ? 'text-slate-350' : 'text-slate-600'} mb-4 text-sm`}>
            Untuk mengukur tingkat keandalan dan galat model, digunakan metrik persentase kesalahan rata-rata absolut (<b>Mean Absolute Percentage Error - MAPE</b>). Klasifikasi penilain acuan MAPE adalah sebagai berikut:
          </p>
          <div className={`${sCard} rounded-2xl border overflow-hidden max-w-md`}>
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className={`${sTableHead} font-bold border-b`}>
                <tr>
                  <th className="px-5 py-3">Rentang Nilai MAPE</th>
                  <th className="px-5 py-3">Kategori Kemampuan Model</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                <tr className={`${isDark ? 'bg-emerald-950/20 text-emerald-300' : 'bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50'} transition-colors`}>
                  <td className="px-5 py-3 font-semibold">&lt; 10%</td>
                  <td className="px-5 py-3 font-bold">Sangat Akurat (Highly Accurate)</td>
                </tr>
                <tr className={`${isDark ? 'bg-blue-950/20 text-blue-300' : 'bg-blue-50/50 text-blue-800 hover:bg-blue-50'} transition-colors`}>
                  <td className="px-5 py-3 font-semibold">10% - 20%</td>
                  <td className="px-5 py-3 font-bold">Baik (Good Forecasting)</td>
                </tr>
                <tr className={`${isDark ? 'bg-amber-950/20 text-amber-300' : 'bg-amber-50/50 text-amber-800 hover:bg-amber-50'} transition-colors`}>
                  <td className="px-5 py-3 font-semibold">20% - 50%</td>
                  <td className="px-5 py-3 font-bold">Cukup (Reasonable)</td>
                </tr>
                <tr className={`${isDark ? 'bg-rose-950/20 text-rose-300' : 'bg-rose-50/50 text-rose-800 hover:bg-rose-50'} transition-colors`}>
                  <td className="px-5 py-3 font-semibold">&gt; 50%</td>
                  <td className="px-5 py-3 font-bold">Tidak Akurat (Inaccurate)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPenjelasanTPA = () => (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${sText}`}>Penjelasan & Profil TPA Putri Cempo</h2>
          <p className={`${sSubtext} mt-1`}>Informasi umum, sejarah perkembangan teknologi, dan relevansi terhadap peramalan timbulan sampah.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100/80 text-emerald-800'} border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200'} shadow-sm flex items-center gap-1.5`}>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            Solo Bersih & Sehat
          </span>
        </div>
      </div>

      {/* Hero Banner Section with actual photo of TPA / Scenic waste management area or landscape */}
      <div className={`relative overflow-hidden rounded-3xl ${sCard} border`}>
        <div className="h-64 sm:h-80 md:h-[350px] relative overflow-hidden select-none">
          <img 
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80" 
            alt="TPA Putri Cempo Environmental Recycling" 
            className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 filter brightness-75"
            referrerPolicy="no-referrer"
          />
          {/* Gradients on Image */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent"></div>
          
          {/* Badge & Info Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 text-left">
              <span className="inline-block text-[10px] font-black tracking-wider uppercase bg-emerald-500 text-white px-3 py-1 rounded-full shadow-md mb-2">
                Fasilitas Pengelolaan Sampah Utama
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                TPA Putri Cempo Mojosongo, Surakarta
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed drop-shadow-sm">
                Pusat pengolahan limbah akhir perkotaan berbasis teknologi gasifikasi sampah (PLTSa) terdepan di Indonesia.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
               <div className="px-4 py-2.5 bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl text-center text-white">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">LOKASI</p>
                  <p className="text-xs font-black">Mojosongo, Solo</p>
               </div>
               <div className="px-4 py-2.5 bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl text-center text-white">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">SISTEM</p>
                  <p className="text-xs font-black">PLTSa Gasifikasi</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left main sections */}
        <div className="md:col-span-8 space-y-8">
          {/* Section 1: Pengantar */}
          <div className={`${sCard} p-6 sm:p-8 rounded-3xl border space-y-4 shadow-sm text-left`}>
            <div className="flex items-center gap-3.5 mb-2">
              <div className={`p-2.5 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-2xl ring-1 ring-blue-500/10`}>
                <Recycle className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-bold ${sText}`}>Pengantar & Peran Strategis</h3>
            </div>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              TPA Putri Cempo yang berlokasi secara administratif di Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta (Solo), Jawa Tengah, merupakan satu-satunya Tempat Pemrosesan Akhir utama yang melayani pengelolaan sampah domestik secara terpadu. Perannya sedemikian vital sebagai jantung kelestarian ekologis, melingkupi kebutuhan penampungan dan pemrosesan akhir dari seluruh kecamatan di Solo serta wilayah penyangga di sekitarnya.
            </p>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              Setiap hari, TPA Putri Cempo memikul amanah berat dengan menampung berton-ton sampah padat perkotaan (<i>municipal solid waste</i>). Keberadaannya menjamin lingkungan pemukiman masyarakat Solo terbebas dari pencemaran lingkungan yang dapat memicu darurat kesehatan publik.
            </p>
          </div>

          {/* Section 2: Sejarah & Profil */}
          <div className={`${sCard} p-6 sm:p-8 rounded-3xl border space-y-4 shadow-sm text-left`}>
            <div className="flex items-center gap-3.5 mb-2">
              <div className={`p-2.5 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} rounded-2xl ring-1 ring-emerald-500/10`}>
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-bold ${sText}`}>Profil Pengelolaan & PLTSa Putri Cempo</h3>
            </div>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              TPA Putri Cempo dikelola secara langsung oleh Pemerintah Kota Surakarta melalui Dinas Lingkungan Hidup (DLH) Kota Surakarta. Puluhan tahun beroperasi dengan metode penimbunan konvensional (open dumping & controlled landfill), TPA ini menghadapi risiko kejenuhan kapasitas lahan yang menumpuk tinggi hingga membentuk gunungan sampah ikonik. 
            </p>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              Guna mengatasi ancaman krisis overcapacity tersebut, Pemkot Surakarta bekerja sama dengan mitra strategis melahirkan lompatan inovasi mutakhir: <b>Pembangkit Listrik Tenaga Sampah (PLTSa) Putri Cempo</b>. Proyek strategis nasional ini meluncurkan sistem pemrosesan termal berbasis teknologi gasifikasi sampah (waste-to-energy), mengubah tumpukan limbah kering menjadi energi listrik bersih terbarukan yang berkontribusi langsung pada bauran energi nasional.
            </p>
          </div>

          {/* Section 3: Relevansi dengan Peramalan */}
          <div className={`${sCard} p-6 sm:p-8 rounded-3xl border space-y-4 shadow-sm text-left bg-gradient-to-br ${isDark ? 'from-slate-900 via-slate-900 to-blue-950/20' : 'from-white via-white to-blue-50/20'}`}>
            <div className="flex items-center gap-3.5 mb-2">
              <div className={`p-2.5 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-2xl ring-1 ring-blue-500/10`}>
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-bold ${sText}`}>Urgensi Peramalan Timbulan Sampah</h3>
            </div>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-sm sm:text-base`}>
              Efektivitas operasional PLTSa Putri Cempo dan kebijakan tata ruang pemkot sangat membutuhkan estimasi laju sampah yang presisi. Fluktuasi volume sampah yang tidak menentu dapat memicu instabilitas umpan gasifier (fuel feedstock) atau mengancam kegagalan pengelolaan penimbunan sisa residu abu sampah.
            </p>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-sm sm:text-base font-bold`}>
              Aplikasi Simulator Double Exponential Smoothing (DES) Holt ini dirancang untuk menyelesaikan tantangan logistik tersebut. Dengan mengidentifikasi pergerakan tren timbulan sampah historis dari waktu ke waktu secara akurat, sistem mampu menyuguhkan prediksi tepercaya bagi pengarah kebijakan di Kota Surakarta. Hal ini membantu mengoptimasi pasokan energi PLTSa, mencegah degradasi ekologis di Mojosongo, serta merumuskan tata kelola anggaran perlindungan lingkungan hidup yang berkesinambungan bagi Kota Solo tercinta.
            </p>
          </div>
        </div>

        {/* Right side stats/info layout */}
        <div className="md:col-span-4 space-y-6 text-left">
          <div className={`${sCard} p-6 rounded-3xl border shadow-sm space-y-4`}>
            <h4 className={`text-sm font-black text-slate-400 tracking-wider uppercase`}>Metrik & Info Teknis</h4>
            
            <div className="space-y-4 divide-y divide-slate-800">
              <div className="pt-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${sSubtext}`}>Lokasi Administratif</span>
                <p className={`text-sm font-bold ${sText} mt-0.5`}>Mojosongo, Kec. Jebres, Kota Surakarta</p>
              </div>

              <div className="pt-4">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${sSubtext}`}>Instansi Penanggung Jawab</span>
                <p className={`text-sm font-bold ${sText} mt-0.5`}>Dinas Lingkungan Hidup (DLH) Kota Surakarta</p>
              </div>

              <div className="pt-4">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${sSubtext}`}>Teknologi Utama PLTSa</span>
                <p className={`text-sm font-bold ${sText} mt-0.5`}>Gasifikasi Termal (Plasma Gasification)</p>
              </div>

              <div className="pt-4">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${sSubtext}`}>Keluaran Energi</span>
                <p className={`text-sm font-bold text-emerald-400 font-bold mt-0.5`}>Sinergi Listrik Bersih PLN</p>
              </div>

              <div className="pt-4">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${sSubtext}`}>Tipe Analisis Prediktif</span>
                <p className={`text-sm font-bold text-blue-400 font-bold mt-0.5`}>Double Exponential Smoothing (DES) Holt</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 rounded-3xl shadow-sm space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <Recycle className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10 space-y-2">
              <h4 className="text-xs font-black tracking-wider uppercase opacity-85">Adagium Lingkungan</h4>
              <p className="text-sm font-bold leading-relaxed">
                "Sampah bukan sekadar residu konsumsi yang dibuang, melainkan aset masa depan jika diproses dengan teknologi ramah lingkungan dan kepemimpinan visioner."
              </p>
              <div className="pt-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                <span className="text-[10px] font-black tracking-wider uppercase opacity-75">Solo Green Heritage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPengembang = () => (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className={`text-2xl font-bold ${sText}`}>Profil Tim Pengembang</h2>
        <p className={`${sSubtext} mt-1`}>
          Aplikasi Simulator Double Exponential Smoothing (DES) dari Holt ini dikembangkan oleh akademisi S2 Pendidikan Matematika Universitas Sebelas Maret.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile 1: Dzalfadina Tri Hastiti */}
        <div className={`${sCard} rounded-3xl p-6 border ${sBorder} relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between`}>
          {/* Decorative background grid and gradient blur */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/15 rounded-full blur-2xl group-hover:bg-blue-500/25 transition-all duration-500"></div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                Mahasiswa S2
              </span>
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>

            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-blue-500/20 mb-4 ring-2 ring-white/10">
                DTH
              </div>
              <h3 className={`text-lg font-extrabold ${sText} tracking-tight group-hover:text-blue-450 transition-colors`}>
                Dzalfadina Tri Hastiti
              </h3>
              <p className={`text-xs ${sSubtext} font-semibold mt-1`}>NIM: S852508002</p>
            </div>

            <div className={`mt-4 pt-4 border-t ${sBorder} space-y-3 text-xs`}>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Program Studi:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>S2 Pendidikan Matematika</span>
              </div>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Fakultas:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>FKIP</span>
              </div>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Universitas:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>Universitas Sebelas Maret</span>
              </div>
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t ${sBorder} relative z-10`}>
            <p className={`text-[11px] leading-relaxed italic ${isDark ? 'text-slate-400' : 'text-slate-500'} text-center`}>
              "Mengintegrasikan konsep pemodelan matematika dengan kepedulian lingkungan hidup secara presisi."
            </p>
          </div>
        </div>

        {/* Profile 2: Indra Jati Mukminan */}
        <div className={`${sCard} rounded-3xl p-6 border ${sBorder} relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between`}>
          {/* Decorative background grid and gradient blur */}
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all duration-500"></div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                Mahasiswa S2
              </span>
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-emerald-500/20 mb-4 ring-2 ring-white/10">
                IJM
              </div>
              <h3 className={`text-lg font-extrabold ${sText} tracking-tight group-hover:text-emerald-450 transition-colors`}>
                Indra Jati Mukminan
              </h3>
              <p className={`text-xs ${sSubtext} font-semibold mt-1`}>NIM: S852508010</p>
            </div>

            <div className={`mt-4 pt-4 border-t ${sBorder} space-y-3 text-xs`}>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Program Studi:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>S2 Pendidikan Matematika</span>
              </div>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Fakultas:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>FKIP</span>
              </div>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Universitas:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>Universitas Sebelas Maret</span>
              </div>
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t ${sBorder} relative z-10`}>
            <p className={`text-[11px] leading-relaxed italic ${isDark ? 'text-slate-400' : 'text-slate-500'} text-center`}>
              "Menerjemahkan keteraturan matematis dan data runtun waktu menjadi solusi ekologi yang berkelanjutan."
            </p>
          </div>
        </div>

        {/* Profile 3: Rubono Setiawan */}
        <div className={`${sCard} rounded-3xl p-6 border ${sBorder} relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between`}>
          {/* Decorative background grid and gradient blur */}
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all duration-500"></div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                Dosen S2
              </span>
              <User className="w-5 h-5 text-amber-400" />
            </div>

            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-650 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-amber-500/20 mb-4 ring-2 ring-white/10">
                RBS
              </div>
              <h3 className={`text-lg font-extrabold ${sText} tracking-tight group-hover:text-amber-450 transition-colors`}>
                Rubono Setiawan
              </h3>
              <p className={`text-xs ${sSubtext} font-semibold mt-1`}>Dosen S2 Pendidikan Matematika</p>
            </div>

            <div className={`mt-4 pt-4 border-t ${sBorder} space-y-3 text-xs`}>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Program Studi:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>S2 Pendidikan Matematika</span>
              </div>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Fakultas:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>FKIP</span>
              </div>
              <div className="flex justify-between">
                <span className={`${sSubtext} font-medium`}>Universitas:</span>
                <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>Universitas Sebelas Maret</span>
              </div>
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t ${sBorder} relative z-10`}>
            <p className={`text-[11px] leading-relaxed italic ${isDark ? 'text-slate-400' : 'text-slate-500'} text-center`}>
              "Membimbing riset guna melahirkan sumbangsih nyata dalam dunia sains data dan aplikasinya ke masyarakat."
            </p>
          </div>
        </div>
      </div>

      {/* Synergistic background statement card */}
      <div className={`${sCard} p-6 sm:p-8 rounded-3xl border ${sBorder} bg-gradient-to-br ${isDark ? 'from-slate-900/60 via-slate-900/40 to-blue-950/20' : 'from-slate-50 via-white to-blue-50/20'} shadow-sm text-center relative overflow-hidden`}>
         <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:12px_12px] opacity-5 pointer-events-none"></div>
         <div className="max-w-2xl mx-auto space-y-3.5 relative z-10">
            <h4 className={`text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider`}>
              Sinergi Akademis & Kebijakan Lingkungan Hidup
            </h4>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
              Pembuatan Simulator ini dilatarbelakangi oleh keinginan untuk menyelaraskan antara tuntutan teoretis dunia akademis (kuliah Pemodelan Matematika) dengan realitas ekologis Kota Surakarta. Melalui pemodelan Double Exponential Smoothing (DES) Holt atas material timbulan kuantitas sampah TPA Putri Cempo, diharapkan simulator ini dapat berguna sebagai alat proyeksi logis dalam penentuan keputusan strategis.
            </p>
         </div>
      </div>
    </div>
  );

  let content;
  switch (activeTab) {
    case 'penjelasan_tpa': content = renderPenjelasanTPA(); break;
    case 'dashboard': content = renderDashboard(); break;
    case 'input': content = renderInput(); break;
    case 'hitungan': content = renderHitungan(); break;
    case 'grafik_interpretasi': content = renderGrafikInterpretasi(); break;
    case 'teori': content = renderTeori(); break;
    case 'pengembang': content = renderPengembang(); break;
    default: content = renderDashboard(); break;
  }

  if (!isLoggedIn) {
     return (
        <div className="min-h-screen bg-gradient-to-tr from-emerald-50/65 via-green-50/35 to-teal-50/55 text-slate-800 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 relative overflow-x-hidden">
         {/* Beautiful environmental background image with soft overlay for readability */}
         <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden filter opacity-[0.09] grayscale contrast-125">
           <img 
             src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80" 
             alt="Environmental Eco Conservation Nature Forest Background" 
             className="w-full h-full object-cover"
             referrerPolicy="no-referrer"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/80 via-emerald-100/40 to-white/70"></div>
         </div>

         {/* Background gradient effects */}
         <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-100/40 via-green-50/20 to-transparent pointer-events-none z-0"></div>
         <div className="absolute top-24 left-1/4 w-[400px] h-[400px] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
         <div className="absolute bottom-16 right-1/4 w-[500px] h-[500px] bg-teal-200/15 rounded-full blur-[130px] pointer-events-none z-0"></div>
         <div className="absolute bottom-16 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[155px] pointer-events-none z-0"></div>

         {/* TOP NAVBAR */}
         <header className="relative z-10 border-b border-emerald-100/90 bg-white/75 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-xs">
           <div className="flex items-center gap-3.5">
             <Recycle className="w-8 h-8 p-1.5 bg-emerald-100 text-emerald-700 rounded-xl ring-1 ring-emerald-200/60" />
             <div>
               <h1 className="font-black text-sm md:text-base tracking-tight text-slate-900 leading-tight">Simulator DES Holt</h1>
               <p className="text-[10px] text-emerald-800/80 font-bold tracking-widest mt-0.5">S2 PENDIDIKAN MATEMATIKA 2026</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-750 bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-full uppercase shadow-xs">
                 TPA BERSIH & SEHAT
              </span>
           </div>
         </header>

         {/* MAIN HERO & LOGIN PANEL CONTAINER */}
         <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center justify-center">
           
           {/* LEFT CONTAINER (LANDING PAGE INFORMASI PENDUKUNG) */}
           <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              
              <div className="inline-flex items-center gap-2 bg-emerald-105 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold w-fit shadow-xs">
                <Bot className="w-4 h-4 text-emerald-600 animate-pulse" />
                Double Exponential Smoothing Solver
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-950">
                  Prediksi Timbulan Sampah <br />
                  <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                    TPA Putri Cempo Solo
                  </span>
                </h1>
                <p className="text-slate-650 text-sm leading-relaxed mt-4 max-w-xl font-medium">
                  Selamat datang di Sistem Proyeksi Laju Timbulan Sampah & Estimasi Usia Operasional TPA Putri Cempo Surakarta. Dengan pemikiran taktis dan model matematis <strong>Double Exponential Smoothing (DES) dari Holt</strong>, kami membantu melambungkan akurasi peramalan serta kesiapan penanganan mitigasi overcapacity.
                </p>
              </div>

              {/* Bento-styled metrics of Putri Cempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="bg-white/90 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-emerald-50/50 hover:border-emerald-300 transition-all group shadow-xs">
                  <div>
                    <span className="text-[10px] font-black text-emerald-800/80 uppercase tracking-widest block">Volume Masuk Harian</span>
                    <h3 className="text-xl font-black text-slate-950 mt-1 group-hover:text-emerald-700 transition-colors">260 s.d 300 Ton</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">Kuotasi sampah Kota Solo yang dikirimkan langsung ke TPA Putri Cempo Jebres setiap harinya.</p>
                </div>

                <div className="bg-white/90 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-teal-50/50 hover:border-teal-300 transition-all group shadow-xs">
                  <div>
                     <span className="text-[10px] font-black text-teal-800/85 uppercase tracking-widest block">Integrasi Hijau</span>
                     <h3 className="text-xl font-black text-teal-700 mt-1">PLTSa Gasifikasi 8 MW</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">Pengolah sampah menjadi energi listrik terbarukan berbasis gasifikasi thermal untuk mengurangi timbunan.</p>
                </div>

                <div className="bg-white/90 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-emerald-50/50 hover:border-emerald-300 transition-all group shadow-xs">
                  <div>
                    <span className="text-[10px] font-black text-emerald-800/80 uppercase tracking-widest block">Model Prediksi</span>
                    <h3 className="text-xl font-black text-emerald-800 mt-1">DES Holt Multilevel</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">Metode peramalan linear handal dengan parameter Alpha & Beta yang dioptimisasi secara presisi.</p>
                </div>

                <div className="bg-white/90 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-amber-50/50 hover:border-amber-300 transition-all group shadow-xs">
                  <div>
                    <span className="text-[10px] font-black text-amber-800/85 uppercase tracking-widest block">Mitigasi Overcapacity</span>
                    <h3 className="text-xl font-black text-amber-700 mt-1">Sisa Umur Pakai</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">Memberikan peringatan dini kuantita kapasitas kumulatif sisa wadah tampung TPA Solo.</p>
                </div>

              </div>

              {/* Dynamic live chart rendering of raw waste growth data */}
              <div className="bg-white/75 border border-emerald-150/90 rounded-2xl p-5 shadow-xs relative hidden sm:block backdrop-blur-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Peningkatan Historis Timbulan Sampah Masuk TPA
                  </h3>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">DATA HISTORIS</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.filter(d => d.actual !== null).slice(-18)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} width={65} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M kg`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                        labelStyle={{ color: '#475569', fontSize: '10px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#10b981', fontSize: '11px', fontWeight: 'extrabold' }}
                        formatter={(val: any) => [`${formatIndoNumber(val, 0)} kg`, 'Volume Aktual']}
                      />
                      <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2.5, fill: '#10b981' }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-emerald-850/70 mt-2 text-right">Grafik realisasi berdasarkan rekapitulasi data aktual TPA Putri Cempo.</p>
              </div>

           </div>

           {/* RIGHT CONTAINER: Premium Login / Register System */}
           <div className="lg:col-span-5 w-full">
             <div className="bg-white/95 border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="mb-6">
                  <h2 className="text-xl font-black text-slate-900">Gerbang Akses Simulator</h2>
                  <p className="text-xs text-emerald-850/80 mt-1">Gunakan tab pilihan di bawah untuk Masuk atau mendaftarkan akun baru.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-emerald-50 p-1 rounded-xl mb-6 border border-emerald-100">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      authTab === 'login'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                      : 'text-slate-600 hover:text-emerald-900 font-extrabold'
                    }`}
                  >
                    Log In (Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      authTab === 'register'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                      : 'text-slate-600 hover:text-emerald-900 font-extrabold'
                    }`}
                  >
                    Sign In (Daftar Baru)
                  </button>
                </div>

                {/* Feedback banners */}
                {authError && (
                  <div className="bg-red-500/15 border border-red-500/25 text-red-300 p-3.5 rounded-xl text-xs font-semibold mb-4 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}
                {authSuccess && (
                  <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 p-3.5 rounded-xl text-xs font-semibold mb-4 flex items-start gap-2.5 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Tab Content forms */}
                <AnimatePresence mode="wait">
                  {authTab === 'login' ? (
                    <motion.form
                      key="login_form"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onSubmit={handleLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1.5">Email atau NIM</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={loginIdent}
                            onChange={(e) => setLoginIdent(e.target.value)}
                            placeholder="mahasiswa@uns.ac.id atau I0123045"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1.5">Kata Sandi (Password)</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs mt-2 font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        <span>Masuk ke Simulator TPA</span>
                      </button>

                      {/* Quick demo signin box */}
                      <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-xl">
                        <p className="text-[11px] font-black text-emerald-800">💡 Masuk Cepat Tanpa Daftar:</p>
                        <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                          NIM: <span className="font-mono text-slate-900 bg-white px-1 py-0.5 rounded border border-emerald-200 font-bold">I0123045</span> &nbsp; Password: <span className="font-mono text-slate-900 bg-white px-1 py-0.5 rounded border border-emerald-200 font-bold">password123</span>
                        </p>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register_form"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Contoh: Budi Handoko"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1.5">NIM (Nomor Induk Mahasiswa)</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={regNim}
                            onChange={(e) => setRegNim(e.target.value)}
                            placeholder="Contoh: I0123045"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1.5">Email Mahasiswa</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="budi@student.uns.ac.id"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1.5">Kata Sandi (Password)</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs mt-2 font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        <span>Daftarkan Akun (Sign Up)</span>
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
             </div>
           </div>

         </main>

         {/* FOOTER */}
         <footer className="relative z-10 border-t border-emerald-100 bg-white/70 py-6 text-center text-emerald-800/80 text-[11px] font-bold">
           <p>© 2026 Pemodelan Matematika — Universitas Sebelas Maret (UNS) Surakarta — S2 Pendidikan Matematika.</p>
         </footer>
       </div>
     );
  }

  return (
    <div className={`flex flex-col md:flex-row h-full md:h-[100dvh] w-full overflow-hidden ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans selection:bg-blue-100 selection:text-blue-900 relative transition-all duration-300`}>
      
      {/* SIDEBAR NAVIGATION (DESKTOP) */}
      <aside className="w-72 shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-800 h-full hidden md:flex flex-col z-20 shadow-2xl">
        <div className="p-6 md:p-8 border-b border-white/5 mx-2 flex items-center justify-between">
          <div className="flex items-center gap-3.5 text-blue-400">
            <Recycle className="w-10 h-10 p-1.5 bg-blue-500/20 text-blue-400 rounded-xl ring-1 ring-blue-500/30" />
            <div>
              <h1 className="font-black text-xl tracking-tight leading-tight text-white">Putri Cempo</h1>
              <p className="text-[10px] font-black text-blue-400 tracking-widest mt-1">SIMULATOR DES</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl transition-all border border-white/5 flex items-center justify-center cursor-pointer shadow-sm relative group"
            title={isDark ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-450" /> : <Moon className="w-4 h-4 text-blue-350" />}
          </button>
        </div>

        <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black tracking-widest text-slate-500 mb-4 ml-2">MENU NAVIGASI</div>
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive 
                  ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            )
          })}
        </nav>
        
        <div className="p-5 border-t border-white/5 mb-2 mt-auto mx-2">
           <div className="bg-slate-800/50 p-4 rounded-2xl flex flex-col gap-3.5 border border-white/5 backdrop-blur-md">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-blue-500/20 text-xs tracking-wider ring-2 ring-white/10">
                   {currentUser?.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                   <p className="text-sm font-black text-white truncate">{currentUser?.name || 'User'}</p>
                   <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-snug truncate">NIM: {currentUser?.nim || '-'}</p>
                </div>
             </div>
             
             <button 
               onClick={handleLogout}
               className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all border border-red-500/15 flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
             >
               <LogOut className="w-3.5 h-3.5" />
               <span>Keluar (Log Out)</span>
             </button>
           </div>
        </div>
      </aside>

      {/* MOBILE NAVIGATION HEADER */}
      <div className="md:hidden flex flex-col shrink-0 bg-slate-900 z-20 shadow-xl border-b border-white/5 w-full">
         <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
               <Recycle className="w-8 h-8 p-1.5 bg-blue-500/20 text-blue-400 rounded-xl ring-1 ring-blue-500/30" />
               <h1 className="font-black text-xl tracking-tight leading-tight text-white">Putri Cempo</h1>
            </div>
            <div className="flex items-center gap-2">
               <button
                 onClick={toggleTheme}
                 className="p-2 bg-slate-800 border border-white/5 text-slate-350 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm"
                 title={isDark ? "Tema Terang" : "Tema Gelap"}
               >
                 {isDark ? <Sun className="w-4 h-4 text-amber-450" /> : <Moon className="w-4 h-4 text-blue-350" />}
               </button>
               <button 
                 onClick={handleLogout}
                 className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
               >
                 <LogOut className="w-3.5 h-3.5" />
                 <span>Keluar</span>
               </button>
            </div>
         </div>
         <div className="flex overflow-x-auto p-2 gap-2 custom-scrollbar no-scrollbar">
            {MENU_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive 
                    ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                    : 'text-slate-400 bg-white/5 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
         </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 overflow-y-auto p-5 sm:p-8 lg:p-12 z-0 relative ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-800'} h-full w-full transition-all duration-300`}>
         {/* Decorative Grid Background */}
         <div className={`absolute inset-0 bg-[radial-gradient(${isDark ? '#334155' : '#cbd5e1'}_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none`}></div>
         <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-slate-950/80' : 'from-slate-50/80'} via-transparent to-transparent pointer-events-none`}></div>

         <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl w-full mx-auto pb-32 relative z-10"
            >
              {content}
            </motion.div>
         </AnimatePresence>
      </main>

      {/* TANYA AI FLOATING BUTTON */}
      <button 
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-500/30 flex items-center gap-3 transition-transform hover:scale-105 z-40"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="font-bold pr-2 hidden md:inline">Tanya AI</span>
      </button>

      {/* TANYA AI MODAL/SLIDEOVER */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 h-full w-full max-w-md ${isDark ? 'bg-slate-900 border-white/5 shadow-2xl shadow-black/80' : 'bg-white border-slate-100'} shadow-2xl z-50 flex flex-col border-l`}
            >
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Asisten AI Putri Cempo</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Tanya soal prediksi volume sampah</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAiOpen(false)}
                  className={`p-2 ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} rounded-full transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed rounded-tl-none border font-bold ${isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      Halo! Saya adalah Asisten AI dalam Simulator DES Putri Cempo. Ada yang bisa saya bantu?
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                      m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/20' 
                      : (isDark ? 'bg-slate-950 text-slate-300 rounded-tl-none border border-slate-800' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200')
                    }`}>
                      {m.role === 'user' ? (
                        m.text
                      ) : (
                        <div className="markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{m.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`p-4 rounded-2xl rounded-tl-none border flex items-center gap-2 ${isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                       <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                       <span className="text-sm font-medium">AI sedang berpikir...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-6 border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'}`}>
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    placeholder="Tulis pertanyaan disini..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`w-full pl-5 pr-14 py-4 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
