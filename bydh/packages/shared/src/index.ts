import { z } from 'zod'

export const buildItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  stage: z.string(),
  name: z.string(),
  amountIls: z.number(),
  percentHint: z.number().nullable(),
  notes: z.string().nullable(),
})

export const houseBuildSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  total: z.number(),
  items: z.array(buildItemSchema),
})

export const financeSchema = z.object({
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
      type: z.string(),
      monthlyIls: z.number(),
    }),
  ),
})

export const scenarioSchema = z.object({
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
