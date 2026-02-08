import { useState, useRef } from 'react';
import { Language } from '../App';
import { X, Check, Camera, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickPaymentProps {
  language: Language;
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number, receiver: string, recipeImage?: string) => void;
}

export function QuickPayment({ language, balance, onClose, onConfirm }: QuickPaymentProps) {
  const [amount, setAmount] = useState('');
  const [receiver, setReceiver] = useState('');
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const content = {
    ar: {
      title: 'دفع سريع',
      amount: 'المبلغ',
      receiver: 'المستلم',
      balance: 'الرصيد المتاح',
      currency: 'دج',
      presets: [100, 500, 1000, 5000],
      confirm: 'تأكيد',
      cancel: 'إلغاء',
      confirmTitle: 'تأكيد العملية',
      confirmMessage: 'هل تريد إرسال هذا المبلغ؟',
      to: 'إلى',
      success: 'تمت العملية بنجاح',
      recorded: 'تم تسجيل العملية',
      done: 'تم',
      insufficientBalance: 'الرصيد غير كافٍ',
      addReceipt: 'إضافة صورة الوصل',
      receiptAdded: 'تم إضافة الوصل',
      removeReceipt: 'إزالة',
    },
    fr: {
      title: 'Paiement rapide',
      amount: 'Montant',
      receiver: 'Destinataire',
      balance: 'Solde disponible',
      currency: 'DA',
      presets: [100, 500, 1000, 5000],
      confirm: 'Confirmer',
      cancel: 'Annuler',
      confirmTitle: 'Confirmer l\'opération',
      confirmMessage: 'Envoyer ce montant?',
      to: 'À',
      success: 'Opération réussie',
      recorded: 'Opération enregistrée',
      done: 'OK',
      insufficientBalance: 'Solde insuffisant',
      addReceipt: 'Ajouter photo du reçu',
      receiptAdded: 'Reçu ajouté',
      removeReceipt: 'Supprimer',
    },
    en: {
      title: 'Quick Payment',
      amount: 'Amount',
      receiver: 'Receiver',
      balance: 'Available Balance',
      currency: 'DZD',
      presets: [100, 500, 1000, 5000],
      confirm: 'Confirm',
      cancel: 'Cancel',
      confirmTitle: 'Confirm Operation',
      confirmMessage: 'Send this amount?',
      to: 'To',
      success: 'Operation Successful',
      recorded: 'Operation recorded',
      done: 'Done',
      insufficientBalance: 'Insufficient balance',
      addReceipt: 'Add receipt photo',
      receiptAdded: 'Receipt added',
      removeReceipt: 'Remove',
    },
  };

  const t = content[language];
  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= balance && receiver.trim() !== '';

  const handleConfirm = () => {
    if (isValid) {
      setShowConfirm(true);
    }
  };

  const handleFinalConfirm = () => {
    setShowConfirm(false);
    setShowSuccess(true);
    setTimeout(() => {
      onConfirm(numAmount, receiver, recipeImage ?? undefined);
    }, 1500);
  };

  const handleReceiptCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setRecipeImage(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
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
        {/* Balance Display */}
        <div className="bg-[#2D5F4F]/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-sm text-gray-600 mb-1">{t.balance}</p>
          <p className="text-xl sm:text-2xl font-bold text-[#2D5F4F] tabular-nums truncate">
            {balance.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.currency}
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

        {/* Receiver Input */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.receiver}</label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder={language === 'ar' ? 'اسم المستلم' : language === 'fr' ? 'Nom du destinataire' : 'Receiver name'}
            className="w-full bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl px-4 py-3 text-[#2D2D2D] focus:border-[#2D5F4F] focus:outline-none min-h-[48px]"
          />
        </div>

        {/* Receipt Photo */}
        <div className="mb-4 sm:mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleReceiptCapture}
          />
          {recipeImage ? (
            <div className="bg-white border-2 border-[#2D5F4F]/30 rounded-xl sm:rounded-2xl p-3 overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Image className="w-5 h-5 text-[#2D5F4F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2D2D2D] text-sm">{t.receiptAdded}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRecipeImage(null)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium touch-target px-2 py-1"
                >
                  {t.removeReceipt}
                </button>
              </div>
              <img src={recipeImage} alt="Receipt" className="w-full max-h-40 object-cover rounded-lg" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="touch-target w-full flex items-center justify-center gap-2 py-3 sm:py-4 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl text-gray-500 hover:border-[#2D5F4F] hover:text-[#2D5F4F] transition-colors min-h-[52px]"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">{t.addReceipt}</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {numAmount > balance && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 sm:mb-6">
            <p className="text-red-600 text-sm">{t.insufficientBalance}</p>
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex-shrink-0">
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 sm:px-6 z-50"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-sm"
            >
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">{t.confirmTitle}</h3>
              <p className="text-gray-600 mb-6">{t.confirmMessage}</p>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">{t.amount}</span>
                  <span className="text-2xl font-bold text-[#2D5F4F] tabular-nums">
                    {numAmount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">{t.to}</span>
                  <span className="font-medium text-[#2D2D2D]">{receiver}</span>
                </div>
                {recipeImage && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <img src={recipeImage} alt="Receipt" className="w-full max-h-32 object-contain rounded-lg" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="py-3 rounded-xl font-medium text-gray-600 bg-gray-100 active:scale-95 transition-transform"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleFinalConfirm}
                  className="py-3 rounded-xl font-medium text-white bg-[#2D5F4F] active:scale-95 transition-transform"
                >
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
