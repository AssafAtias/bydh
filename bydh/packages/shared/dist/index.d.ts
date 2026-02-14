import { z } from 'zod';
export declare const buildItemSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    stage: z.ZodString;
    name: z.ZodString;
    amountIls: z.ZodNumber;
    percentHint: z.ZodNullable<z.ZodNumber>;
    notes: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const houseBuildSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    label: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    total: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        stage: z.ZodString;
        name: z.ZodString;
        amountIls: z.ZodNumber;
        percentHint: z.ZodNullable<z.ZodNumber>;
        notes: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const financeSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    familyName: z.ZodString;
    monthlyGoal: z.ZodNullable<z.ZodNumber>;
    totals: z.ZodObject<{
        monthlyIncome: z.ZodNumber;
        monthlyExpenses: z.ZodNumber;
        netMonthly: z.ZodNumber;
        investmentsTotal: z.ZodNumber;
    }, z.core.$strip>;
    incomes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        monthlyIls: z.ZodNumber;
    }, z.core.$strip>>;
    investments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        accountType: z.ZodString;
        provider: z.ZodNullable<z.ZodString>;
        currentValueIls: z.ZodNumber;
        yearlyDepositIls: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>>;
    expenses: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        monthlyIls: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const scenarioSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    label: z.ZodString;
    totalCostIls: z.ZodNumber;
    equityIls: z.ZodNumber;
    mortgageIls: z.ZodNumber;
    monthlyPayIls: z.ZodNumber;
    notes: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type HouseBuild = z.infer<typeof houseBuildSchema>;
export type FamilyFinance = z.infer<typeof financeSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
