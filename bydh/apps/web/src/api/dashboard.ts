import axios from 'axios'
import { z } from 'zod'

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

export type HouseBuild = z.infer<typeof houseBuildSchema>
export type FamilyFinance = z.infer<typeof financeSchema>
export type Scenario = z.infer<typeof scenarioSchema>

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4010/api',
})

export async function getBuildData(): Promise<HouseBuild[]> {
  const response = await api.get('/build')
  return z.array(houseBuildSchema).parse(response.data)
}

export async function getFinanceData(): Promise<FamilyFinance> {
  const response = await api.get('/finances')
  return financeSchema.parse(response.data)
}

export async function getScenarios(): Promise<Scenario[]> {
  const response = await api.get('/scenarios')
  return z.array(scenarioSchema).parse(response.data)
}

export async function createIncome(payload: {
  name: string
  type: string
  monthlyIls: number
  familyId?: string
}): Promise<void> {
  await api.post('/finances/incomes', payload)
}

export async function updateIncome(
  id: string,
  payload: {
    name: string
    type: string
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
  familyId?: string
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
  familyId?: string
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
