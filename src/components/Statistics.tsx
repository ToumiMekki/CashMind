import { Language, Transaction } from '../App';
import { TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface StatisticsProps {
  language: Language;
  transactions: Transaction[];
  balance: number;
}

export function Statistics({ language, transactions, balance }: StatisticsProps) {
  const content = {
    ar: {
      title: 'الإحصائيات',
      currentBalance: 'الرصيد الحالي',
      currency: 'دج',
      totalSpent: 'إجمالي الإنفاق',
      totalReceived: 'إجمالي الاستلام',
      transactions: 'عملية',
      dailySpending: 'الإنفاق اليومي',
      last7Days: 'آخر 7 أيام',
      noData: 'لا توجد بيانات بعد',
      startUsing: 'ابدأ باستخدام CashMind لرؤية إحصائياتك',
      avgDaily: 'المتوسط اليومي',
    },
    fr: {
      title: 'Statistiques',
      currentBalance: 'Solde actuel',
      currency: 'DA',
      totalSpent: 'Total dépensé',
      totalReceived: 'Total reçu',
      transactions: 'opérations',
      dailySpending: 'Dépenses journalières',
      last7Days: '7 derniers jours',
      noData: 'Pas encore de données',
      startUsing: 'Commencez à utiliser CashMind pour voir vos stats',
      avgDaily: 'Moyenne quotidienne',
    },
    en: {
      title: 'Statistics',
      currentBalance: 'Current Balance',
      currency: 'DZD',
      totalSpent: 'Total Spent',
      totalReceived: 'Total Received',
      transactions: 'transactions',
      dailySpending: 'Daily Spending',
      last7Days: 'Last 7 days',
      noData: 'No data yet',
      startUsing: 'Start using CashMind to see your stats',
      avgDaily: 'Daily Average',
    },
  };

  const t = content[language];

  // Calculate totals
  const totalSpent = transactions
    .filter(tx => tx.type === 'send')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalReceived = transactions
    .filter(tx => tx.type === 'receive')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate daily spending for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const dailyData = last7Days.map(date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const daySpending = transactions
      .filter(tx => 
        tx.type === 'send' &&
        tx.timestamp >= date.getTime() &&
        tx.timestamp < nextDay.getTime()
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      date: date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { 
        weekday: 'short' 
      }),
      amount: daySpending,
    };
  });

  const avgDaily = totalSpent / 7;

  if (transactions.length === 0) {
    return (
      <div className="min-h-full bg-[#F8F6F3] px-4 sm:px-5 md:px-6 py-4 sm:py-6 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] mb-4 sm:mb-6">{t.title}</h1>
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl sm:text-4xl">📊</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#2D2D2D] mb-2">{t.noData}</h3>
          <p className="text-sm text-gray-400">{t.startUsing}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8F6F3] px-4 sm:px-5 md:px-6 py-4 sm:py-6 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] mb-4 sm:mb-6">{t.title}</h1>

      {/* Current Balance */}
      <div className="bg-gradient-to-br from-[#2D5F4F] to-[#1E4538] rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
        <p className="text-[#B8D4C8] text-sm mb-2">{t.currentBalance}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
            {balance.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
          </span>
          <span className="text-lg sm:text-xl text-[#B8D4C8]">{t.currency}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Total Spent */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm min-h-[100px]">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">{t.totalSpent}</p>
          <p className="text-lg sm:text-xl font-bold text-red-500 tabular-nums truncate">
            {totalSpent.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {transactions.filter(tx => tx.type === 'send').length} {t.transactions}
          </p>
        </div>

        {/* Total Received */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm min-h-[100px]">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">{t.totalReceived}</p>
          <p className="text-lg sm:text-xl font-bold text-green-500 tabular-nums truncate">
            {totalReceived.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {transactions.filter(tx => tx.type === 'receive').length} {t.transactions}
          </p>
        </div>
      </div>

      {/* Daily Spending Chart */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="font-bold text-[#2D2D2D] text-sm sm:text-base">{t.dailySpending}</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{t.last7Days}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3 sm:mb-4">
          {t.avgDaily}: {avgDaily.toFixed(0)} {t.currency}
        </p>

        <div className="h-40 sm:h-48 md:h-56 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => `${value}`}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {dailyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.amount > avgDaily ? '#EF4444' : '#2D5F4F'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">
            {language === 'ar' ? 'أكبر عملية' : language === 'fr' ? 'Plus grande opération' : 'Largest Transaction'}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#2D2D2D] tabular-nums truncate">
            {Math.max(...transactions.map(tx => tx.amount), 0).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
          </p>
        </div>

        <div className="bg-[#2D5F4F]/10 border border-[#2D5F4F]/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">
            {language === 'ar' ? 'عدد العمليات' : language === 'fr' ? 'Total opérations' : 'Total Transactions'}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#2D2D2D] tabular-nums">
            {transactions.length}
          </p>
        </div>
      </div>
    </div>
  );
}
