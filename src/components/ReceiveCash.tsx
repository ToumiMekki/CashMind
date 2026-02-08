import { useState } from 'react';
import { Language, Transaction } from '../App';
import { X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ReceiveCashProps {
  language: Language;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  transactions: Transaction[];
}

export function ReceiveCash({ language, onClose, onConfirm, transactions }: ReceiveCashProps) {
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const content = {
    ar: {
      title: 'استقبال نقد',
      amount: 'المبلغ',
      currency: 'دج',
      presets: [100, 500, 1000, 5000],
      generateQR: 'إنشاء رمز QR',
      confirm: 'تأكيد الاستلام',
      todayTotal: 'إجمالي اليوم',
      qrTitle: 'اعرض هذا الرمز للمرسل',
      success: 'تم استلام النقد',
      recorded: 'تم تسجيل العملية',
    },
    fr: {
      title: 'Recevoir du cash',
      amount: 'Montant',
      currency: 'DA',
      presets: [100, 500, 1000, 5000],
      generateQR: 'Générer QR',
      confirm: 'Confirmer réception',
      todayTotal: 'Total aujourd\'hui',
      qrTitle: 'Montrez ce code au payeur',
      success: 'Cash reçu',
      recorded: 'Opération enregistrée',
    },
    en: {
      title: 'Receive Cash',
      amount: 'Amount',
      currency: 'DZD',
      presets: [100, 500, 1000, 5000],
      generateQR: 'Generate QR',
      confirm: 'Confirm Receipt',
      todayTotal: 'Today\'s Total',
      qrTitle: 'Show this code to sender',
      success: 'Cash Received',
      recorded: 'Operation recorded',
    },
  };

  const t = content[language];
  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0;

  // Calculate today's total received
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayReceived = transactions
    .filter(tx => tx.type === 'receive' && tx.timestamp >= today.getTime())
    .reduce((sum, tx) => sum + tx.amount, 0);

  const handleGenerateQR = () => {
    if (isValid) {
      setShowQR(true);
    }
  };

  const handleConfirm = () => {
    if (isValid) {
      setShowSuccess(true);
      setTimeout(() => {
        onConfirm(numAmount);
      }, 1500);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen h-dvh min-h-screen min-h-dvh w-full max-w-[430px] sm:max-w-[480px] md:max-w-[520px] mx-auto bg-[#2D5F4F] flex flex-col items-center justify-center px-4 sm:px-6"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mb-4 sm:mb-6"
        >
          <Check className="w-10 h-10 sm:w-12 sm:h-12 text-[#2D5F4F]" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">{t.success}</h2>
        <p className="text-[#B8D4C8] text-center text-sm sm:text-base">{t.recorded}</p>
      </motion.div>
    );
  }

  if (showQR) {
    return (
      <div className="h-screen h-dvh min-h-screen min-h-dvh w-full max-w-[430px] sm:max-w-[480px] md:max-w-[520px] mx-auto bg-[#F8F6F3] flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="bg-white px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg sm:text-xl font-bold text-[#2D2D2D] truncate">{t.title}</h1>
          <button onClick={() => setShowQR(false)} className="touch-target p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* QR Code Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 min-h-0 overflow-auto py-6">
          <p className="text-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{t.qrTitle}</p>

          {/* Mock QR Code */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl mb-4 sm:mb-6 w-full max-w-[280px] sm:max-w-[320px]"
          >
            <div className="w-full aspect-square max-w-[256px] sm:max-w-[280px] mx-auto bg-gradient-to-br from-[#2D5F4F] to-[#1E4538] rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden">
              {/* QR pattern simulation */}
              <div className="absolute inset-0 opacity-30">
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="relative z-10 text-center">
                <div className="text-4xl sm:text-6xl mb-2">💰</div>
                <div className="text-white text-xl sm:text-2xl font-bold tabular-nums">
                  {numAmount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
                </div>
                <div className="text-[#B8D4C8] text-sm sm:text-base">{t.currency}</div>
              </div>
            </div>
          </motion.div>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 w-full max-w-sm">
            <p className="text-center text-xs sm:text-sm text-gray-600">
              {language === 'ar' ? 'رمز QR جاهز للمسح' : language === 'fr' ? 'Code QR prêt à scanner' : 'QR Code ready to scan'}
            </p>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleConfirm}
            className="touch-target w-full bg-[#2D5F4F] text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg active:scale-95 transition-transform min-h-[52px]"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-dvh min-h-screen min-h-dvh w-full max-w-[430px] sm:max-w-[480px] md:max-w-[520px] mx-auto bg-[#F8F6F3] flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
        <h1 className="text-lg sm:text-xl font-bold text-[#2D2D2D] truncate">{t.title}</h1>
        <button onClick={onClose} className="touch-target p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0 px-4 sm:px-5 md:px-6 py-4 sm:py-6">
        {/* Today's Total */}
        <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-sm text-green-700 mb-1">{t.todayTotal}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 tabular-nums">
            {todayReceived.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.currency}
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.amount}</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold text-[#2D2D2D] tabular-nums focus:border-[#2D5F4F] focus:outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" style={{ left: language === 'ar' ? 'auto' : '1rem', right: language === 'ar' ? '1rem' : 'auto' }}>
              {t.currency}
            </span>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {t.presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className="touch-target bg-white border border-gray-200 rounded-lg sm:rounded-xl py-2 text-xs sm:text-sm font-medium text-[#2D2D2D] hover:border-[#2D5F4F] hover:text-[#2D5F4F] transition-colors active:scale-95 min-h-[44px]"
              >
                {preset.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#2D5F4F] to-[#1E4538] rounded-2xl sm:rounded-3xl flex items-center justify-center">
            <span className="text-4xl sm:text-6xl">🏪</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 sm:p-5 bg-white border-t border-gray-200 space-y-3 flex-shrink-0">
        <button
          onClick={handleGenerateQR}
          disabled={!isValid}
          className={`touch-target w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all min-h-[52px] ${
            isValid
              ? 'bg-[#D4AF37] text-[#2D5F4F] active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t.generateQR}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`touch-target w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all min-h-[52px] ${
            isValid
              ? 'bg-[#2D5F4F] text-white active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
}
