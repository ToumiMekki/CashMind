import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Ledger } from './components/Ledger';
import { Statistics } from './components/Statistics';
import { Settings } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { QuickPayment } from './components/QuickPayment';
import { QRScan } from './components/QRScan';
import { ReceiveCash } from './components/ReceiveCash';
import { TransactionDetails } from './components/TransactionDetails';
import { Wallet, BookOpen, BarChart3, SettingsIcon } from 'lucide-react';

export type Language = 'ar' | 'fr' | 'en';

export interface Transaction {
  id: string;
  amount: number;
  type: 'send' | 'receive';
  timestamp: number;
  balanceBefore: number;
  balanceAfter: number;
  receiver?: string;
  sender?: string;
  category?: string;
  recipeImage?: string; // Base64 data URL of receipt photo
}

export default function App() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'ledger' | 'stats' | 'settings'>('wallet');
  const [language, setLanguage] = useState<Language>('ar');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showQRScan, setShowQRScan] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const onboarded = localStorage.getItem('cashmind_onboarded');
    const storedLanguage = localStorage.getItem('cashmind_language') as Language;
    const storedBalance = localStorage.getItem('cashmind_balance');
    const storedTransactions = localStorage.getItem('cashmind_transactions');

    if (onboarded) setHasOnboarded(true);
    if (storedLanguage) setLanguage(storedLanguage);
    if (storedBalance) setBalance(parseFloat(storedBalance));
    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (hasOnboarded) {
      localStorage.setItem('cashmind_balance', balance.toString());
      localStorage.setItem('cashmind_transactions', JSON.stringify(transactions));
    }
  }, [balance, transactions, hasOnboarded]);

  const completeOnboarding = () => {
    localStorage.setItem('cashmind_onboarded', 'true');
    setHasOnboarded(true);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('cashmind_language', newLang);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp' | 'balanceBefore' | 'balanceAfter'> & { recipeImage?: string }) => {
    const balanceBefore = balance;
    const newBalance = transaction.type === 'receive' 
      ? balance + transaction.amount 
      : balance - transaction.amount;
    
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      balanceBefore,
      balanceAfter: newBalance,
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setBalance(newBalance);
  };

  const resetData = () => {
    setBalance(0);
    setTransactions([]);
    localStorage.removeItem('cashmind_balance');
    localStorage.removeItem('cashmind_transactions');
  };

  if (!hasOnboarded) {
    return <Onboarding language={language} onComplete={completeOnboarding} />;
  }

  // Show overlays
  if (showPayment) {
    return (
      <QuickPayment
        language={language}
        balance={balance}
        onClose={() => setShowPayment(false)}
        onConfirm={(amount, receiver, recipeImage) => {
          addTransaction({ amount, type: 'send', receiver, recipeImage });
          setShowPayment(false);
        }}
      />
    );
  }

  if (showQRScan) {
    return (
      <QRScan
        language={language}
        balance={balance}
        onClose={() => setShowQRScan(false)}
        onConfirm={(amount, receiver) => {
          addTransaction({ amount, type: 'send', receiver });
          setShowQRScan(false);
        }}
      />
    );
  }

  if (showReceive) {
    return (
      <ReceiveCash
        language={language}
        onClose={() => setShowReceive(false)}
        onConfirm={(amount) => {
          addTransaction({ amount, type: 'receive', sender: 'نقدي' });
          setShowReceive(false);
        }}
        transactions={transactions}
      />
    );
  }

  if (selectedTransaction) {
    return (
      <TransactionDetails
        language={language}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    );
  }

  return (
    <div className="h-screen h-dvh min-h-screen min-h-dvh w-full max-w-[430px] sm:max-w-[480px] md:max-w-[520px] mx-auto bg-[#F8F6F3] flex flex-col overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Main Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === 'wallet' && (
          <Home
            language={language}
            balance={balance}
            transactions={transactions}
            onPayment={() => setShowPayment(true)}
            onQRScan={() => setShowQRScan(true)}
            onReceive={() => setShowReceive(true)}
          />
        )}
        {activeTab === 'ledger' && (
          <Ledger
            language={language}
            transactions={transactions}
            onTransactionClick={setSelectedTransaction}
          />
        )}
        {activeTab === 'stats' && (
          <Statistics
            language={language}
            transactions={transactions}
            balance={balance}
          />
        )}
        {activeTab === 'settings' && (
          <Settings
            language={language}
            onLanguageChange={handleLanguageChange}
            onResetData={resetData}
            transactions={transactions}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 safe-area-bottom flex-shrink-0">
        <div className="flex items-center justify-around max-w-md mx-auto gap-1">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`touch-target flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-colors min-w-0 flex-1 ${
              activeTab === 'wallet' ? 'text-[#2D5F4F]' : 'text-gray-400'
            }`}
          >
            <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${activeTab === 'wallet' ? 'fill-[#2D5F4F]' : ''}`} />
            <span className="text-xs font-medium truncate max-w-full">
              {language === 'ar' ? 'المحفظة' : language === 'fr' ? 'Portefeuille' : 'Wallet'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`touch-target flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-colors min-w-0 flex-1 ${
              activeTab === 'ledger' ? 'text-[#2D5F4F]' : 'text-gray-400'
            }`}
          >
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="text-xs font-medium truncate max-w-full">
              {language === 'ar' ? 'السجل' : language === 'fr' ? 'Registre' : 'Ledger'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`touch-target flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-colors min-w-0 flex-1 ${
              activeTab === 'stats' ? 'text-[#2D5F4F]' : 'text-gray-400'
            }`}
          >
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="text-xs font-medium truncate max-w-full">
              {language === 'ar' ? 'الإحصائيات' : language === 'fr' ? 'Stats' : 'Stats'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`touch-target flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-colors min-w-0 flex-1 ${
              activeTab === 'settings' ? 'text-[#2D5F4F]' : 'text-gray-400'
            }`}
          >
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="text-xs font-medium truncate max-w-full">
              {language === 'ar' ? 'الإعدادات' : language === 'fr' ? 'Paramètres' : 'Settings'}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
