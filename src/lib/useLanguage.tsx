import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'tl';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const translations = {
  en: {
    'landing.title': 'Welcome to MathVenture!',
    'landing.subtitle': 'A jungle expedition for curious minds to learn colors, shapes, numbers, and sequencing.',
    'landing.student': 'I am a Student',
    'landing.teacher': 'I am a Teacher',
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.role': 'I am a...',
    'auth.firstName': 'First Name',
    'auth.classCode': 'Class Code',
    'auth.lastName': 'Last Name',
    'auth.studentLoginHelp': 'Use your last name and first name.',
    'auth.studentSignupHelp': 'Use your last name, first name, and class code.',
    'student.dashboard': 'My Basecamp',
    'student.streak': 'Day Streak',
    'student.lessonsCompleted': 'Lessons Completed',
    'student.playNow': 'Play Now',
    'student.recent': 'Recent Adventures',
    'teacher.dashboard': 'Teacher Dashboard',
    'teacher.classes': 'My Classes',
    'teacher.assignments': 'Assignments',
    'teacher.newClass': 'New Class',
    'teacher.joinCode': 'Join Code',
    'teacher.students': 'Students',
    'teacher.avgScore': 'Avg Score',
    'game.identify': 'Find the',
    'game.match': 'Match the pairs!',
    'game.sequence': 'Put them in order!',
    'game.excellent': 'Excellent!',
    'game.tryAgain': 'Try Again!',
    'game.next': 'Next Lesson',
    'game.back': 'Back to Basecamp',
    'common.logout': 'Log Out',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'settings.language': 'Language / Wika',
  },
  tl: {
    'landing.title': 'Maligayang pagdating sa MathVenture!',
    'landing.subtitle': 'Isang ekspedisyon sa gubat para matuto ng mga kulay, hugis, numero, at pagkakasunod-sunod.',
    'landing.student': 'Ako ay Estudyante',
    'landing.teacher': 'Ako ay Guro',
    'auth.signin': 'Mag-login',
    'auth.signup': 'Mag-sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Buong Pangalan',
    'auth.role': 'Ako ay isang...',
    'auth.firstName': 'Unang Pangalan',
    'auth.classCode': 'Class Code',
    'auth.lastName': 'Apelyido',
    'auth.studentLoginHelp': 'Gamitin ang iyong apelyido at unang pangalan.',
    'auth.studentSignupHelp': 'Gamitin ang iyong apelyido, unang pangalan, at class code.',
    'student.dashboard': 'Aking Basecamp',
    'student.streak': 'Araw ng Streak',
    'student.lessonsCompleted': 'Tapos na Mga Aralin',
    'student.playNow': 'Maglaro Ngayon',
    'student.recent': 'Mga Kamakailang Pakikipagsapalaran',
    'teacher.dashboard': 'Dashboard ng Guro',
    'teacher.classes': 'Aking Mga Klase',
    'teacher.assignments': 'Mga Gawain',
    'teacher.newClass': 'Bagong Klase',
    'teacher.joinCode': 'Join Code',
    'teacher.students': 'Mga Estudyante',
    'teacher.avgScore': 'Katamtamang Iskor',
    'game.identify': 'Hanapin ang',
    'game.match': 'Pagtambalin ang mga pares!',
    'game.sequence': 'Ayusin ang pagkakasunod-sunod!',
    'game.excellent': 'Magaling!',
    'game.tryAgain': 'Subukan Muli!',
    'game.next': 'Susunod na Aralin',
    'game.back': 'Bumalik sa Basecamp',
    'common.logout': 'Mag-log Out',
    'common.loading': 'Naglo-load...',
    'common.save': 'I-save',
    'common.cancel': 'Kanselahin',
    'settings.language': 'Wika / Language',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: () => '',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('mathventure-lang') as Language;
    if (saved === 'en' || saved === 'tl') {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('mathventure-lang', l);
  };

  const t = (key: string) => {
    return translations[lang][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
