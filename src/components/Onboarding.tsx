import { Language } from '../App';
import { Shield, Smartphone, Lock } from 'lucide-react';

interface OnboardingProps {
  language: Language;
  onComplete: () => void;
}

export function Onboarding({ language, onComplete }: OnboardingProps) {
  const content = {
    ar: {
      title: 'CashMind',
      subtitle: 'محفظتك الرقمية الشخصية',
      features: [
        { icon: Shield, text: 'هذا ليس بنكًا' },
        { icon: Smartphone, text: 'كل شيء محلي وخاص' },
        { icon: Lock, text: 'محاكاة نقود رقمية بالنقد الحقيقي' },
      ],
      privacy: 'لا إنترنت • لا خوادم • لا بنوك',
      button: 'ابدأ الآن',
    },
    fr: {
      title: 'CashMind',
      subtitle: 'Votre portefeuille digital personnel',
      features: [
        { icon: Shield, text: 'Ce n\'est PAS une banque' },
        { icon: Smartphone, text: 'Tout est local et privé' },
        { icon: Lock, text: 'Simulez l\'argent digital avec du cash réel' },
      ],
      privacy: 'Pas d\'internet • Pas de serveurs • Pas de banques',
      button: 'Commencer',
    },
    en: {
      title: 'CashMind',
      subtitle: 'Your personal digital wallet',
      features: [
        { icon: Shield, text: 'This is NOT a bank' },
        { icon: Smartphone, text: 'Everything is offline & private' },
        { icon: Lock, text: 'Simulate digital money with real cash' },
      ],
      privacy: 'No internet • No servers • No banks',
      button: 'Get Started',
    },
  };

  const t = content[language];

  return (
    <div className="h-screen h-dvh min-h-screen min-h-dvh w-full max-w-[430px] sm:max-w-[480px] md:max-w-[520px] mx-auto bg-gradient-to-b from-[#2D5F4F] to-[#1E4538] flex flex-col items-center justify-between px-4 sm:px-6 py-8 sm:py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-12 w-full min-h-0 overflow-auto py-4">
        {/* Logo */}
        <div className="text-center flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#D4AF37] rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <span className="text-2xl sm:text-3xl">💰</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-[#B8D4C8] text-base sm:text-lg">{t.subtitle}</p>
        </div>

        {/* Features */}
        <div className="space-y-4 sm:space-y-6 w-full">
          {t.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#2D5F4F]" />
              </div>
              <p className="text-white text-base sm:text-lg">{feature.text}</p>
            </div>
          ))}
        </div>

        {/* Privacy Message */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <p className="text-[#B8D4C8] text-center text-xs sm:text-sm">{t.privacy}</p>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onComplete}
        className="touch-target w-full bg-[#D4AF37] text-[#2D5F4F] py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg active:scale-95 transition-transform flex-shrink-0"
      >
        {t.button}
      </button>
    </div>
  );
}
