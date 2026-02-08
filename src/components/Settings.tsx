import { Language, Transaction } from '../App';
import { Globe, Trash2, Download, Shield, Database, WifiOff, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onResetData: () => void;
  transactions: Transaction[];
}

export function Settings({ language, onLanguageChange, onResetData, transactions }: SettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const content = {
    ar: {
      title: 'الإعدادات',
      language: 'اللغة',
      languages: {
        ar: 'العربية',
        fr: 'Français',
        en: 'English',
      },
      data: 'البيانات',
      exportData: 'تصدير البيانات',
      resetData: 'إعادة تعيين البيانات',
      privacy: 'الخصوصية والأمان',
      offlineMode: 'وضع غير متصل',
      offlineDesc: 'كل شيء يعمل بدون إنترنت',
      localStorage: 'تخزين محلي',
      localDesc: 'البيانات محفوظة على هاتفك فقط',
      noServer: 'لا خوادم',
      noServerDesc: 'لا يتم إرسال أي بيانات',
      resetConfirmTitle: 'إعادة تعيين جميع البيانات؟',
      resetConfirmMessage: 'سيتم حذف جميع العمليات والرصيد. هذا الإجراء لا يمكن التراجع عنه.',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      exported: 'تم التصدير بنجاح',
      version: 'الإصدار',
    },
    fr: {
      title: 'Paramètres',
      language: 'Langue',
      languages: {
        ar: 'العربية',
        fr: 'Français',
        en: 'English',
      },
      data: 'Données',
      exportData: 'Exporter les données',
      resetData: 'Réinitialiser les données',
      privacy: 'Confidentialité & Sécurité',
      offlineMode: 'Mode hors ligne',
      offlineDesc: 'Tout fonctionne sans internet',
      localStorage: 'Stockage local',
      localDesc: 'Données sauvegardées uniquement sur votre téléphone',
      noServer: 'Pas de serveurs',
      noServerDesc: 'Aucune donnée n\'est envoyée',
      resetConfirmTitle: 'Réinitialiser toutes les données?',
      resetConfirmMessage: 'Toutes les opérations et le solde seront supprimés. Cette action est irréversible.',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      exported: 'Exporté avec succès',
      version: 'Version',
    },
    en: {
      title: 'Settings',
      language: 'Language',
      languages: {
        ar: 'العربية',
        fr: 'Français',
        en: 'English',
      },
      data: 'Data',
      exportData: 'Export Data',
      resetData: 'Reset Data',
      privacy: 'Privacy & Security',
      offlineMode: 'Offline Mode',
      offlineDesc: 'Everything works without internet',
      localStorage: 'Local Storage',
      localDesc: 'Data saved only on your phone',
      noServer: 'No Servers',
      noServerDesc: 'No data is sent anywhere',
      resetConfirmTitle: 'Reset all data?',
      resetConfirmMessage: 'All transactions and balance will be deleted. This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      exported: 'Exported successfully',
      version: 'Version',
    },
  };

  const t = content[language];

  const handleExport = () => {
    const data = {
      transactions,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashmind-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 2000);
  };

  const handleReset = () => {
    onResetData();
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-full bg-[#F8F6F3] px-4 sm:px-5 md:px-6 py-4 sm:py-6 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] mb-4 sm:mb-6">{t.title}</h1>

      {/* Language Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <h2 className="font-medium text-[#2D2D2D]">{t.language}</h2>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-2 shadow-sm">
          {(['ar', 'fr', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`touch-target w-full px-4 py-3 rounded-xl font-medium transition-all min-h-[48px] ${
                language === lang
                  ? 'bg-[#2D5F4F] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.languages[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Data Section */}
      <div className="mb-4 sm:mb-6">
        <h2 className="font-medium text-[#2D2D2D] mb-2 sm:mb-3">{t.data}</h2>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="touch-target w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow min-h-[64px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#2D5F4F]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-[#2D5F4F]" />
              </div>
              <span className="font-medium text-[#2D2D2D] truncate">{t.exportData}</span>
            </div>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="touch-target w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow min-h-[64px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-medium text-red-500 truncate">{t.resetData}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Shield className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <h2 className="font-medium text-[#2D2D2D]">{t.privacy}</h2>
        </div>
        <div className="bg-gradient-to-br from-[#2D5F4F] to-[#1E4538] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white mb-1">{t.offlineMode}</p>
                <p className="text-sm text-[#B8D4C8]">{t.offlineDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white mb-1">{t.localStorage}</p>
                <p className="text-sm text-[#B8D4C8]">{t.localDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white mb-1">{t.noServer}</p>
                <p className="text-sm text-[#B8D4C8]">{t.noServerDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#D4AF37] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl sm:text-3xl">💰</span>
        </div>
        <h3 className="font-bold text-[#2D2D2D] mb-1">CashMind</h3>
        <p className="text-sm text-gray-500">{t.version} 1.0.0</p>
      </div>

      {/* Export Success Toast */}
      <AnimatePresence>
        {showExportSuccess && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 w-max max-w-[calc(100%-2rem)] mx-auto px-4 sm:px-6 py-3 bg-[#2D5F4F] text-white rounded-full shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="font-medium">{t.exported}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-50"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-sm"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-2 text-center">{t.resetConfirmTitle}</h3>
              <p className="text-gray-600 mb-6 text-center text-sm">{t.resetConfirmMessage}</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="py-3 rounded-xl font-medium text-gray-600 bg-gray-100 active:scale-95 transition-transform"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleReset}
                  className="py-3 rounded-xl font-medium text-white bg-red-500 active:scale-95 transition-transform"
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
