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
    'auth.signin': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.role': 'I am a...',
    'auth.firstName': 'First Name',
    'auth.teacherFirstName': 'Teacher First Name',
    'auth.classCode': 'Class Code',
    'auth.lastName': 'Last Name',
    'auth.studentLoginHelp': "Use your teacher's first name, your last name, and your first name.",
    'auth.studentSignupHelp': "Use your teacher's first name, your last name, and your first name.",
    'student.dashboard': 'My Basecamp',
    'student.streak': 'Day Streak',
    'student.lessonsCompleted': 'Lessons Completed',
    'student.playNow': 'Play Now',
    'student.recent': 'Recent Adventures',
    'student.portal.allLessons': 'All Lessons',
    'student.portal.nextAssignment': 'Next Assignment',
    'student.portal.playThisNext': 'Play this next',
    'student.portal.noAssignmentsTitle': 'Pick any lesson to play.',
    'student.portal.noAssignmentsBody': 'Choose your next adventure.',
    'student.portal.tapAnyLesson': 'Tap any lesson',
    'student.portal.myClass': 'My Class',
    'student.portal.noClasses': 'You have not joined a class yet.',
    'student.portal.joinPrompt': 'Ask your teacher for a join code.',
    'student.portal.joinClass': 'Join a Class',
    'student.portal.myProgress': 'My Progress',
    'student.portal.days': 'Days',
    'student.portal.done': 'Done',
    'student.portal.recent': 'Recent',
    'student.portal.score': 'Best',
    'student.portal.dashboardUnavailableTitle': 'Your dashboard took a little detour.',
    'student.portal.dashboardUnavailableBody': 'We could not load all of your progress yet, but you can still tap any lesson and keep learning.',
    'student.portal.loadingTitle': 'Getting your jungle ready...',
    'student.portal.loadingBody': 'Loading your lessons and class updates.',
    'teacher.dashboard': 'My Classes',
    'teacher.classes': 'My Classes',
    'teacher.reports': 'Reports',
    'teacher.settings': 'Settings',
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
    'common.join': 'Join',
    'common.tryAgain': 'Try Again',
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
    'auth.teacherFirstName': 'Unang Pangalan ng Guro',
    'auth.classCode': 'Class Code',
    'auth.lastName': 'Apelyido',
    'auth.studentLoginHelp': 'Gamitin ang unang pangalan ng iyong guro, ang iyong apelyido, at ang iyong unang pangalan.',
    'auth.studentSignupHelp': 'Gamitin ang unang pangalan ng iyong guro, ang iyong apelyido, at ang iyong unang pangalan.',
    'student.dashboard': 'Aking Basecamp',
    'student.streak': 'Araw ng Streak',
    'student.lessonsCompleted': 'Tapos na Mga Aralin',
    'student.playNow': 'Maglaro Ngayon',
    'student.recent': 'Mga Kamakailang Pakikipagsapalaran',
    'student.portal.allLessons': 'Lahat ng Aralin',
    'student.portal.nextAssignment': 'Susunod na Gawain',
    'student.portal.playThisNext': 'Ito ang sunod mong laruin',
    'student.portal.noAssignmentsTitle': 'Pumili ng kahit anong aralin.',
    'student.portal.noAssignmentsBody': 'Piliin ang susunod mong adventure.',
    'student.portal.tapAnyLesson': 'Pumili ng aralin',
    'student.portal.myClass': 'Aking Klase',
    'student.portal.noClasses': 'Wala ka pang nasalihang klase.',
    'student.portal.joinPrompt': 'Humingi ng join code sa iyong guro.',
    'student.portal.joinClass': 'Sumali sa Klase',
    'student.portal.myProgress': 'Aking Progress',
    'student.portal.days': 'Araw',
    'student.portal.done': 'Tapos',
    'student.portal.recent': 'Huli',
    'student.portal.score': 'Best',
    'student.portal.dashboardUnavailableTitle': 'Naligaw nang kaunti ang dashboard mo.',
    'student.portal.dashboardUnavailableBody': 'Hindi pa namin makuha ang buo mong progress, pero puwede ka pa ring pumili ng kahit anong aralin at magpatuloy.',
    'student.portal.loadingTitle': 'Inihahanda ang iyong jungle...',
    'student.portal.loadingBody': 'Ikinakarga ang iyong mga aralin at class updates.',
    'teacher.dashboard': 'Aking Mga Klase',
    'teacher.classes': 'Aking Mga Klase',
    'teacher.reports': 'Mga Report',
    'teacher.settings': 'Settings',
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
    'common.join': 'Sumali',
    'common.tryAgain': 'Subukan Muli',
    'common.loading': 'Naglo-load...',
    'common.save': 'I-save',
    'common.cancel': 'Kanselahin',
    'settings.language': 'Wika / Language',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => { },
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
