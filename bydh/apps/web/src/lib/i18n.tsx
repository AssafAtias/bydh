import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Locale = 'he' | 'en'
type Direction = 'rtl' | 'ltr'

const STORAGE_KEY = 'bydh_locale'

const translations = {
  en: {
    appName: 'PlanYourHome',
    langHebrew: 'עברית',
    langEnglish: 'English',
    heroTitle: 'Build a house in Israel with full financial visibility',
    heroSubtitle: 'Model costs, family income, investments, and mortgage scenarios in one place.',
    tabInvestments: 'Investments & income',
    tabExpenses: 'Expenses',
    tabBuild: 'Build the house',
    tabDescInvestments: 'Understand family income, assets, and available capital.',
    tabDescExpenses: 'Track monthly outflow and stress test affordability.',
    tabDescBuild: 'Break down each stage of house construction costs in Israel.',
    scenariosTitle: 'Scenarios',
    apiError: 'Could not load data from API. Check API URL and database connection.',
    metricMonthlyIncome: 'Monthly income',
    metricMonthlyExpenses: 'Monthly expenses',
    metricNetMonthly: 'Net monthly',
    metricInvestmentTotal: 'Investment total',
    incomeTitle: 'Income',
    incomeTypesTitle: 'Income types',
    investmentsTitle: 'Investments and savings',
    expensesTitle: 'Family monthly expenses',
    expenseTypesTitle: 'Expense types',
    fieldName: 'Name',
    fieldType: 'Type',
    fieldMonthlyIls: 'Monthly ILS',
    fieldAccountType: 'Account type',
    fieldProvider: 'Provider',
    fieldCurrentValueIls: 'Current value ILS',
    fieldYearlyDepositIls: 'Yearly deposit ILS',
    fieldStage: 'Stage',
    fieldItem: 'Item',
    fieldAmountIls: 'Amount ILS',
    fieldPercentHint: 'Percent hint',
    fieldOrder: 'Order',
    fieldNotes: 'Notes',
    typeNewLabel: 'New type name',
    buttonAdd: 'Add',
    buttonAddBuildStep: 'Add build step',
    buildAddHint: 'Add step (constructor, engineer, permits, finishes, etc.)',
    currentValueLabel: 'Current',
    scenarioTotalCost: 'Total build cost',
    scenarioEquity: 'Equity needed',
    scenarioMortgage: 'Mortgage',
    scenarioMonthlyPayment: 'Monthly payment',
    profileLabel: 'Profile',
    profileNewLabel: 'New profile name',
    profileCreate: 'Create profile',
    profileEmptyState: 'No profiles yet. Create one to start planning.',
    authLoginTitle: 'Sign in',
    authRegisterTitle: 'Create account',
    authEmail: 'Email',
    authName: 'Full name',
    authPassword: 'Password',
    authLoginButton: 'Login',
    authRegisterButton: 'Register',
    authSwitchToRegister: 'Need an account? Register',
    authSwitchToLogin: 'Already have an account? Login',
    authLogout: 'Logout',
    authError: 'Authentication failed. Check your details.',
  },
  he: {
    appName: 'תכנון הבית שלי',
    langHebrew: 'עברית',
    langEnglish: 'English',
    heroTitle: 'בנו בית בישראל עם שליטה מלאה בתמונה הפיננסית',
    heroSubtitle: 'נהלו עלויות, הכנסות משפחתיות, השקעות ותרחישי משכנתא במקום אחד.',
    tabInvestments: 'השקעות והכנסות',
    tabExpenses: 'הוצאות',
    tabBuild: 'בניית הבית',
    tabDescInvestments: 'קבלו תמונה ברורה של הכנסות המשפחה, נכסים והון זמין.',
    tabDescExpenses: 'עקבו אחרי ההוצאה החודשית ובדקו עמידות כלכלית.',
    tabDescBuild: 'פרקו כל שלב בתהליך בניית בית בישראל לעלויות מעשיות.',
    scenariosTitle: 'תרחישים',
    apiError: 'לא ניתן לטעון נתונים מה-API. בדקו כתובת שרת וחיבור למסד הנתונים.',
    metricMonthlyIncome: 'הכנסה חודשית',
    metricMonthlyExpenses: 'הוצאות חודשיות',
    metricNetMonthly: 'נטו חודשי',
    metricInvestmentTotal: 'סך השקעות',
    incomeTitle: 'הכנסות',
    incomeTypesTitle: 'סוגי הכנסה',
    investmentsTitle: 'השקעות וחסכונות',
    expensesTitle: 'הוצאות משפחתיות חודשיות',
    expenseTypesTitle: 'סוגי הוצאה',
    fieldName: 'שם',
    fieldType: 'סוג',
    fieldMonthlyIls: 'ש״ח חודשי',
    fieldAccountType: 'סוג חשבון',
    fieldProvider: 'ספק',
    fieldCurrentValueIls: 'שווי נוכחי בש״ח',
    fieldYearlyDepositIls: 'הפקדה שנתית בש״ח',
    fieldStage: 'שלב',
    fieldItem: 'פריט',
    fieldAmountIls: 'סכום בש״ח',
    fieldPercentHint: 'אחוז משוער',
    fieldOrder: 'סדר',
    fieldNotes: 'הערות',
    typeNewLabel: 'שם סוג חדש',
    buttonAdd: 'הוסף',
    buttonAddBuildStep: 'הוסף שלב בנייה',
    buildAddHint: 'הוסיפו שלב (קבלן, מהנדס, אישורים, גמרים ועוד)',
    currentValueLabel: 'נוכחי',
    scenarioTotalCost: 'עלות בנייה כוללת',
    scenarioEquity: 'הון עצמי נדרש',
    scenarioMortgage: 'משכנתא',
    scenarioMonthlyPayment: 'החזר חודשי',
    profileLabel: 'פרופיל',
    profileNewLabel: 'שם פרופיל חדש',
    profileCreate: 'צור פרופיל',
    profileEmptyState: 'עדיין אין פרופילים. צרו פרופיל כדי להתחיל לתכנן.',
    authLoginTitle: 'התחברות',
    authRegisterTitle: 'יצירת חשבון',
    authEmail: 'אימייל',
    authName: 'שם מלא',
    authPassword: 'סיסמה',
    authLoginButton: 'התחבר',
    authRegisterButton: 'הרשם',
    authSwitchToRegister: 'אין חשבון? להרשמה',
    authSwitchToLogin: 'יש חשבון? להתחברות',
    authLogout: 'התנתק',
    authError: 'האימות נכשל. בדקו את הפרטים.',
  },
} as const

type TranslationKey = keyof typeof translations.en

interface I18nContextValue {
  locale: Locale
  direction: Direction
  t: (key: TranslationKey) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'he' || saved === 'en') {
    return saved
  }
  return 'he'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)
  const direction: Direction = locale === 'he' ? 'rtl' : 'ltr'

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale
    document.documentElement.dir = direction
  }, [locale, direction])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction,
      setLocale,
      t: (key: TranslationKey) => translations[locale][key] ?? translations.en[key],
    }),
    [locale, direction],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
