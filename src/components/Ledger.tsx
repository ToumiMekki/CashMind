import { Language, Transaction } from '../App';
import { Send, Download, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LedgerProps {
  language: Language;
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

export function Ledger({ language, transactions, onTransactionClick }: LedgerProps) {
  const content = {
    ar: {
      title: 'السجل',
      subtitle: 'سجل غير قابل للتغيير',
      empty: 'لا توجد عمليات بعد',
      emptyDesc: 'ستظهر جميع عملياتك هنا',
      currency: 'دج',
      balance: 'الرصيد',
      sent: 'أرسلت',
      received: 'استلمت',
    },
    fr: {
      title: 'Registre',
      subtitle: 'Enregistrement immuable',
      empty: 'Aucune opération',
      emptyDesc: 'Toutes vos opérations apparaîtront ici',
      currency: 'DA',
      balance: 'Solde',
      sent: 'Envoyé',
      received: 'Reçu',
    },
    en: {
      title: 'Ledger',
      subtitle: 'Immutable record',
      empty: 'No transactions yet',
      emptyDesc: 'All your operations will appear here',
      currency: 'DZD',
      balance: 'Balance',
      sent: 'Sent',
      received: 'Received',
    },
  };

  const t = content[language];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return language === 'ar' ? 'اليوم' : language === 'fr' ? 'Aujourd\'hui' : 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return language === 'ar' ? 'أمس' : language === 'fr' ? 'Hier' : 'Yesterday';
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const date = formatDate(tx.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-full bg-[#F8F6F3] px-4 sm:px-5 md:px-6 py-4 sm:py-6 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] mb-1">{t.title}</h1>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl sm:text-4xl">📋</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#2D2D2D] mb-2">{t.empty}</h3>
          <p className="text-sm text-gray-400">{t.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <span className="text-sm font-medium text-gray-500 flex-shrink-0">{date}</span>
                <div className="flex-1 h-px bg-gray-200 min-w-0" />
              </div>

              {/* Transactions for this date */}
              <div className="space-y-2">
                {txs.map((tx, index) => (
                  <motion.button
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onTransactionClick(tx)}
                    className="touch-target w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow text-left min-h-[64px]"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      {/* Left: Icon and Details */}
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'send' ? 'bg-red-50' : 'bg-green-50'
                        }`}>
                          {tx.type === 'send' ? (
                            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                          ) : (
                            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#2D2D2D] mb-1 truncate text-sm sm:text-base">
                            {tx.type === 'send' ? tx.receiver || t.sent : tx.sender || t.received}
                          </p>
                          <p className="text-xs text-gray-400">{formatTime(tx.timestamp)}</p>

                          {/* Balance change indicator */}
                          <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                            <span className="text-gray-400">{t.balance}:</span>
                            <span className="text-gray-600 tabular-nums">
                              {tx.balanceBefore.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`font-medium tabular-nums ${
                              tx.type === 'send' ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {tx.balanceAfter.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount and Arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className={`font-bold tabular-nums text-sm sm:text-base ${
                            tx.type === 'send' ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {tx.type === 'send' ? '-' : '+'}
                            {tx.amount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
                          </p>
                          <p className="text-xs text-gray-400">{t.currency}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-300 flex-shrink-0 ${language === 'ar' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Transaction ID (crypto-style) */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 flex-shrink-0">ID:</span>
                        <code className="text-xs font-mono text-gray-500 truncate flex-1 min-w-0">
                          {tx.id}
                        </code>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
