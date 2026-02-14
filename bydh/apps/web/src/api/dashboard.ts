import axios from 'axios'
import { z } from 'zod'

const AUTH_TOKEN_STORAGE_KEY = 'bydh_auth_token'

const buildItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  stage: z.string(),
  name: z.string(),
  amountIls: z.number(),
  percentHint: z.number().nullable(),
  notes: z.string().nullable(),
})

const houseBuildSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  total: z.number(),
  items: z.array(buildItemSchema),
})

const financeSchema = z.object({
  id: z.string(),
  key: z.string(),
  familyName: z.string(),
  monthlyGoal: z.number().nullable(),
  totals: z.object({
    monthlyIncome: z.number(),
    monthlyExpenses: z.number(),
    netMonthly: z.number(),
    investmentsTotal: z.number(),
  }),
  incomes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      typeId: z.string().nullable(),
      monthlyIls: z.number(),
    }),
  ),
  investments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      accountType: z.string(),
      provider: z.string().nullable(),
      currentValueIls: z.number(),
      yearlyDepositIls: z.number().nullable(),
    }),
  ),
  expenses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      typeId: z.string(),
      type: z.string(),
      monthlyIls: z.number(),
    }),
  ),
  expenseTypes: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      label: z.string(),
    }),
  ),
  incomeTypes: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      label: z.string(),
    }),
  ),
})

const scenarioSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  totalCostIls: z.number(),
  equityIls: z.number(),
  mortgageIls: z.number(),
  monthlyPayIls: z.number(),
  notes: z.string().nullable(),
})

const profileSchema = z.object({
  id: z.string(),
  key: z.string(),
  familyName: z.string(),
  monthlyGoal: z.number().nullable(),
  createdAt: z.string(),
})

const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

const authResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

export type HouseBuild = z.infer<typeof houseBuildSchema>
export type FamilyFinance = z.infer<typeof financeSchema>
export type Scenario = z.infer<typeof scenarioSchema>
export type FamilyProfile = z.infer<typeof profileSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type FinanceType = FamilyFinance['expenseTypes'][number]

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4010/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export async function register(payload: {
  name: string
  email: string
  password: string
}): Promise<{ token: string; user: AuthUser }> {
  const response = await api.post('/auth/register', payload)
  return authResponseSchema.parse(response.data)
}

export async function login(payload: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> {
  const response = await api.post('/auth/login', payload)
  return authResponseSchema.parse(response.data)
}

export async function getMe(): Promise<AuthUser> {
  const response = await api.get('/auth/me')
  return authUserSchema.parse(response.data)
}

export async function getBuildData(): Promise<HouseBuild[]> {
  const response = await api.get('/build')
  return z.array(houseBuildSchema).parse(response.data)
}

export async function getProfiles(): Promise<FamilyProfile[]> {
  const response = await api.get('/profiles')
  return z.array(profileSchema).parse(response.data)
}

export async function createProfile(payload: {
  familyName: string
  monthlyGoal?: number | null
}): Promise<FamilyProfile> {
  const response = await api.post('/profiles', payload)
  return profileSchema.parse(response.data)
}

export async function getFinanceData(profileId?: string): Promise<FamilyFinance> {
  const response = await api.get('/finances', {
    params: profileId ? { profileId } : undefined,
  })
  return financeSchema.parse(response.data)
}

export async function getScenarios(profileId?: string): Promise<Scenario[]> {
  const response = await api.get('/scenarios', {
    params: profileId ? { profileId } : undefined,
  })
  return z.array(scenarioSchema).parse(response.data)
}

export async function createIncome(payload: {
  name: string
  type?: string
  typeId?: string
  typeLabel?: string
  monthlyIls: number
  profileId?: string
}): Promise<void> {
  await api.post('/finances/incomes', payload)
}

export async function updateIncome(
  id: string,
  payload: {
    name: string
    type?: string
    typeId?: string
    typeLabel?: string
    monthlyIls: number
  },
): Promise<void> {
  await api.patch(`/finances/incomes/${id}`, payload)
}

export async function deleteIncome(id: string): Promise<void> {
  await api.delete(`/finances/incomes/${id}`)
}

export async function createInvestment(payload: {
  name: string
  accountType: string
  provider?: string
  currentValueIls: number
  yearlyDepositIls?: number | null
  profileId?: string
}): Promise<void> {
  await api.post('/finances/investments', payload)
}

export async function updateInvestment(
  id: string,
  payload: {
    name: string
    accountType: string
    provider?: string
    currentValueIls: number
    yearlyDepositIls?: number | null
  },
): Promise<void> {
  await api.patch(`/finances/investments/${id}`, payload)
}

export async function deleteInvestment(id: string): Promise<void> {
  await api.delete(`/finances/investments/${id}`)
}

export async function createExpense(payload: {
  name: string
  monthlyIls: number
  typeId?: string
  typeLabel?: string
  profileId?: string
}): Promise<void> {
  await api.post('/finances/expenses', payload)
}

export async function updateExpense(
  id: string,
  payload: {
    name: string
    monthlyIls: number
    typeId?: string
    typeLabel?: string
  },
): Promise<void> {
  await api.patch(`/finances/expenses/${id}`, payload)
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/finances/expenses/${id}`)
}

export async function createExpenseType(payload: { label: string }): Promise<void> {
  await api.post('/finances/expense-types', payload)
}

export async function updateExpenseType(id: string, payload: { label: string }): Promise<void> {
  await api.patch(`/finances/expense-types/${id}`, payload)
}

export async function deleteExpenseType(id: string): Promise<void> {
  await api.delete(`/finances/expense-types/${id}`)
}

export async function createIncomeType(payload: { label: string }): Promise<void> {
  await api.post('/finances/income-types', payload)
}

export async function updateIncomeType(id: string, payload: { label: string }): Promise<void> {
  await api.patch(`/finances/income-types/${id}`, payload)
}

export async function deleteIncomeType(id: string): Promise<void> {
  await api.delete(`/finances/income-types/${id}`)
}

export async function createBuildItem(payload: {
  houseTypeId: string
  stage: string
  name: string
  amountIls: number
  percentHint?: number | null
  notes?: string
  order?: number
}): Promise<void> {
  await api.post('/build/items', payload)
}

export async function updateBuildItem(
  id: string,
  payload: {
    stage: string
    name: string
    amountIls: number
    percentHint?: number | null
    notes?: string
    order?: number
  },
): Promise<void> {
  await api.patch(`/build/items/${id}`, payload)
}

export async function deleteBuildItem(id: string): Promise<void> {
  await api.delete(`/build/items/${id}`)
}
