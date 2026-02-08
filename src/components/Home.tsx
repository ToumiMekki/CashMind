import { Language, Transaction } from '../App';
import { Send, QrCode, Download, WifiOff, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  language: Language;
  balance: number;
  transactions: Transaction[];
  onPayment: () => void;
  onQRScan: () => void;
  onReceive: () => void;
}

export function Home({ language, balance, transactions, onPayment, onQRScan, onReceive }: HomeProps) {
  const content = {
    ar: {
      balance: 'الرصيد',
      currency: 'دج',
      todaySpending: 'الإنفاق اليوم',
      quickActions: 'إجراءات سريعة',
      pay: 'دفع',
      scan: 'مسح QR',
      receive: 'استقبال',
      recentTransactions: 'العمليات الأخيرة',
      noTransactions: 'لا توجد عمليات بعد',
      offline: 'غير متصل',
      local: 'محلي',
      sent: 'أرسلت',
      received: 'استلمت',
    },
    fr: {
      balance: 'Solde',
      currency: 'DA',
      todaySpending: 'Dépenses aujourd\'hui',
      quickActions: 'Actions rapides',
      pay: 'Payer',
      scan: 'Scanner QR',
      receive: 'Recevoir',
      recentTransactions: 'Opérations récentes',
      noTransactions: 'Aucune opération',
      offline: 'Hors ligne',
      local: 'Local',
      sent: 'Envoyé',
      received: 'Reçu',
    },
    en: {
      balance: 'Balance',
      currency: 'DZD',
      todaySpending: 'Today\'s Spending',
      quickActions: 'Quick Actions',
      pay: 'Pay',
      scan: 'Scan QR',
      receive: 'Receive',
      recentTransactions: 'Recent Transactions',
      noTransactions: 'No transactions yet',
      offline: 'Offline',
      local: 'Local',
      sent: 'Sent',
      received: 'Received',
    },
  };

  const t = content[language];

  // Calculate today's spending
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySpending = transactions
    .filter(tx => tx.type === 'send' && tx.timestamp >= today.getTime())
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-full px-4 sm:px-5 md:px-6 py-4 sm:py-6 pb-20">
      {/* Header with offline indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D]">CashMind</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#2D5F4F]/10 px-3 py-1.5 rounded-full">
            <WifiOff className="w-4 h-4 text-[#2D5F4F] flex-shrink-0" />
            <span className="text-xs font-medium text-[#2D5F4F]">{t.offline}</span>
          </div>
          <div className="flex items-center gap-1 bg-[#2D5F4F]/10 px-3 py-1.5 rounded-full">
            <Database className="w-4 h-4 text-[#2D5F4F] flex-shrink-0" />
            <span className="text-xs font-medium text-[#2D5F4F]">{t.local}</span>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-[#2D5F4F] to-[#1E4538] rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg"
      >
        <p className="text-[#B8D4C8] text-sm mb-2">{t.balance}</p>
        <div className="flex items-baseline gap-2 mb-3 sm:mb-4 flex-wrap">
          <motion.span
            key={balance}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-4xl sm:text-5xl font-bold text-white tabular-nums break-all"
          >
            {balance.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
          </motion.span>
          <span className="text-lg sm:text-xl text-[#B8D4C8]">{t.currency}</span>
        </div>

        {/* Today's Spending */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <span className="text-[#B8D4C8] text-xs sm:text-sm truncate">{t.todaySpending}</span>
          <span className="text-white font-bold tabular-nums text-sm sm:text-base truncate">
            {todaySpending.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.currency}
          </span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-2 sm:mb-3">{t.quickActions}</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={onPayment}
            className="touch-target bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform min-h-[72px] sm:min-h-[88px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2D5F4F] rounded-full flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#2D2D2D]">{t.pay}</span>
          </button>

          <button
            onClick={onQRScan}
            className="touch-target bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform min-h-[72px] sm:min-h-[88px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D5F4F]" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#2D2D2D]">{t.scan}</span>
          </button>

          <button
            onClick={onReceive}
            className="touch-target bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform min-h-[72px] sm:min-h-[88px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2D5F4F] rounded-full flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#2D2D2D]">{t.receive}</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-2 sm:mb-3">{t.recentTransactions}</h2>
        {recentTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl sm:text-3xl">💸</span>
            </div>
            <p className="text-gray-400 text-sm">{t.noTransactions}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-sm min-h-[64px]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'send' ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    {tx.type === 'send' ? (
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    ) : (
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#2D2D2D] text-sm truncate">
                      {tx.type === 'send' ? tx.receiver || t.sent : tx.sender || t.received}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-bold tabular-nums flex-shrink-0 text-sm sm:text-base ${
                  tx.type === 'send' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {tx.type === 'send' ? '-' : '+'}
                  {tx.amount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
