import { useState } from 'react';
import { Language } from '../App';
import { X, QrCode, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScanProps {
  language: Language;
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number, receiver: string) => void;
}

export function QRScan({ language, balance, onClose, onConfirm }: QRScanProps) {
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState({ amount: 500, receiver: 'محمد علي' });
  const [showSuccess, setShowSuccess] = useState(false);

  const content = {
    ar: {
      title: 'مسح رمز QR',
      scanning: 'ضع الرمز في الإطار',
      scanned: 'تم المسح',
      amount: 'المبلغ',
      receiver: 'المستلم',
      currency: 'دج',
      confirm: 'تأكيد الدفع',
      cancel: 'إلغاء',
      success: 'تمت العملية بنجاح',
      simulateText: 'محاكاة: اضغط للمسح',
    },
    fr: {
      title: 'Scanner QR',
      scanning: 'Placez le code dans le cadre',
      scanned: 'Code scanné',
      amount: 'Montant',
      receiver: 'Destinataire',
      currency: 'DA',
      confirm: 'Confirmer le paiement',
      cancel: 'Annuler',
      success: 'Opération réussie',
      simulateText: 'Simulation: Tap to scan',
    },
    en: {
      title: 'Scan QR',
      scanning: 'Place code in frame',
      scanned: 'Code scanned',
      amount: 'Amount',
      receiver: 'Receiver',
      currency: 'DZD',
      confirm: 'Confirm Payment',
      cancel: 'Cancel',
      success: 'Operation Successful',
      simulateText: 'Simulation: Tap to scan',
    },
  };

  const t = content[language];

  const handleSimulateScan = () => {
    setScanned(true);
  };

  const handleConfirm = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onConfirm(scanData.amount, scanData.receiver);
    }, 1500);
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
      </motion.div>
    );
  }

  return (
    <div className="h-screen h-dvh min-h-screen min-h-dvh w-full max-w-[430px] sm:max-w-[480px] md:max-w-[520px] mx-auto bg-[#1E1E1E] flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10">
        <h1 className="text-lg sm:text-xl font-bold text-white truncate">{t.title}</h1>
        <button onClick={onClose} className="touch-target p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>

      {/* Scanning Area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 min-h-0">
        <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
          {/* Scan Frame */}
          <motion.div
            animate={!scanned ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-64 h-64 sm:w-[280px] sm:h-[280px] mx-auto relative"
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-10 h-10 sm:w-12 sm:h-12 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 border-b-4 border-r-4 border-[#D4AF37] rounded-br-2xl" />

            {/* Scanning line */}
            {!scanned && (
              <motion.div
                animate={{ y: [0, 220, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute left-0 right-0 top-0 h-0.5 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]"
              />
            )}

            {/* Center QR Icon or Checkmark */}
            <div className="absolute inset-0 flex items-center justify-center">
              {scanned ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-[#D4AF37] rounded-full flex items-center justify-center"
                >
                  <Check className="w-7 h-7 sm:w-8 sm:h-8 text-[#1E1E1E]" />
                </motion.div>
              ) : (
                <button
                  onClick={handleSimulateScan}
                  className="touch-target w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-white/50" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Instructions */}
          <p className="text-white text-center mt-4 sm:mt-6 text-sm sm:text-base">
            {scanned ? t.scanned : t.scanning}
          </p>
          {!scanned && (
            <p className="text-[#D4AF37] text-xs sm:text-sm text-center mt-2">{t.simulateText}</p>
          )}
        </div>
      </div>

      {/* Scanned Data Sheet */}
      <AnimatePresence>
        {scanned && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="bg-white rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6 flex-shrink-0"
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:mb-6" />

            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <span className="text-sm text-gray-600 flex-shrink-0">{t.amount}</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#2D5F4F] tabular-nums truncate">
                  {scanData.amount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.currency}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600 flex-shrink-0">{t.receiver}</span>
                <span className="font-medium text-[#2D2D2D] truncate">{scanData.receiver}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="touch-target py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-gray-600 bg-gray-100 active:scale-95 transition-transform min-h-[48px]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirm}
                className="touch-target py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white bg-[#2D5F4F] active:scale-95 transition-transform min-h-[48px]"
              >
                {t.confirm}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
