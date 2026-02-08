import { Language, Transaction } from '../App';
import { X, Send, Download, Copy, Check, Image } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionDetailsProps {
  language: Language;
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetails({ language, transaction, onClose }: TransactionDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const content = {
    ar: {
      title: 'تفاصيل العملية',
      type: 'النوع',
      sent: 'إرسال',
      received: 'استقبال',
      amount: 'المبلغ',
      currency: 'دج',
      to: 'إلى',
      from: 'من',
      date: 'التاريخ',
      time: 'الوقت',
      balanceBefore: 'الرصيد قبل',
      balanceAfter: 'الرصيد بعد',
      transactionId: 'معرّف العملية',
      copy: 'نسخ',
      copied: 'تم النسخ',
      close: 'إغلاق',
      receipt: 'الوصل',
      viewReceipt: 'عرض صورة الوصل',
    },
    fr: {
      title: 'Détails de l\'opération',
      type: 'Type',
      sent: 'Envoi',
      received: 'Réception',
      amount: 'Montant',
      currency: 'DA',
      to: 'À',
      from: 'De',
      date: 'Date',
      time: 'Heure',
      balanceBefore: 'Solde avant',
      balanceAfter: 'Solde après',
      transactionId: 'ID de transaction',
      copy: 'Copier',
      copied: 'Copié',
      close: 'Fermer',
      receipt: 'Reçu',
      viewReceipt: 'Voir le reçu',
    },
    en: {
      title: 'Transaction Details',
      type: 'Type',
      sent: 'Sent',
      received: 'Received',
      amount: 'Amount',
      currency: 'DZD',
      to: 'To',
      from: 'From',
      date: 'Date',
      time: 'Time',
      balanceBefore: 'Balance Before',
      balanceAfter: 'Balance After',
      transactionId: 'Transaction ID',
      copy: 'Copy',
      copied: 'Copied',
      close: 'Close',
      receipt: 'Receipt',
      viewReceipt: 'View receipt',
    },
  };

  const t = content[language];

  const handleCopyId = () => {
    navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen h-dvh min-h-screen min-h-dvh w-full max-w-[430px] sm:max-w-[480px] md:max-w-[520px] mx-auto bg-black/50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-2xl sm:rounded-t-3xl max-h-[90vh] max-h-90dvh overflow-auto"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#2D2D2D] truncate">{t.title}</h2>
          <button onClick={onClose} className="touch-target p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-6">
          {/* Amount Card */}
          <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 ${
            transaction.type === 'send'
              ? 'bg-gradient-to-br from-red-500 to-red-600'
              : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {transaction.type === 'send' ? (
                  <Send className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                ) : (
                  <Download className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                )}
              </div>
            </div>
            <p className="text-center text-white/80 text-sm mb-2">
              {transaction.type === 'send' ? t.sent : t.received}
            </p>
            <p className="text-center text-4xl sm:text-5xl font-bold text-white tabular-nums mb-1 break-all">
              {transaction.type === 'send' ? '-' : '+'}
              {transaction.amount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
            </p>
            <p className="text-center text-white/80 text-base sm:text-lg">{t.currency}</p>
          </div>

          {/* Details */}
          <div className="space-y-3 sm:space-y-4">
            {/* Type */}
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <p className="text-sm text-gray-500 mb-1">{t.type}</p>
              <p className="font-medium text-[#2D2D2D]">
                {transaction.type === 'send' ? t.sent : t.received}
              </p>
            </div>

            {/* Recipient/Sender */}
            {transaction.type === 'send' && transaction.receiver && (
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-sm text-gray-500 mb-1">{t.to}</p>
                <p className="font-medium text-[#2D2D2D] truncate">{transaction.receiver}</p>
              </div>
            )}
            {transaction.type === 'receive' && transaction.sender && (
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-sm text-gray-500 mb-1">{t.from}</p>
                <p className="font-medium text-[#2D2D2D] truncate">{transaction.sender}</p>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-w-0">
                <p className="text-sm text-gray-500 mb-1">{t.date}</p>
                <p className="font-medium text-[#2D2D2D] text-xs sm:text-sm">{formatDate(transaction.timestamp)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-w-0">
                <p className="text-sm text-gray-500 mb-1">{t.time}</p>
                <p className="font-medium text-[#2D2D2D] text-xs sm:text-sm tabular-nums">{formatTime(transaction.timestamp)}</p>
              </div>
            </div>

            {/* Balance Before/After */}
            <div className="bg-[#2D5F4F]/5 border border-[#2D5F4F]/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">{t.balanceBefore}</span>
                <span className="font-bold text-[#2D2D2D] tabular-nums">
                  {transaction.balanceBefore.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.currency}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t.balanceAfter}</span>
                  <span className={`font-bold tabular-nums text-lg ${
                    transaction.type === 'send' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {transaction.balanceAfter.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Image */}
            {transaction.recipeImage && (
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-sm text-gray-500 mb-3">{t.receipt}</p>
                <button
                  onClick={() => setShowFullImage(true)}
                  className="touch-target w-full group relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] flex items-center justify-center"
                >
                  <img
                    src={transaction.recipeImage}
                    alt={t.receipt}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full">
                      <Image className="w-5 h-5 text-[#2D5F4F]" />
                      <span className="text-sm font-medium text-[#2D2D2D]">{t.viewReceipt}</span>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Transaction ID */}
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm text-gray-500 flex-shrink-0">{t.transactionId}</p>
                <button
                  onClick={handleCopyId}
                  className="touch-target flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-[#2D5F4F] hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{t.copy}</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-xs font-mono text-gray-600 break-all block">
                {transaction.id}
              </code>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="touch-target w-full mt-4 sm:mt-6 bg-[#2D5F4F] text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg active:scale-95 transition-transform min-h-[52px]"
          >
            {t.close}
          </button>
        </div>
      </motion.div>

      {/* Fullscreen Receipt Image Modal */}
      <AnimatePresence>
        {showFullImage && transaction.recipeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setShowFullImage(false); }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors touch-target"
              aria-label={t.close}
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={transaction.recipeImage}
              alt={t.receipt}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
