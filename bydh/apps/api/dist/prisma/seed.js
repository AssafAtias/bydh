import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const workspaceEnvPath = path.resolve(process.cwd(), 'apps/api/.env');
const rootEnvPath = path.resolve(process.cwd(), '.env');
loadEnv({ path: existsSync(workspaceEnvPath) ? workspaceEnvPath : rootEnvPath });
const prisma = new PrismaClient();
async function main() {
    await prisma.scenario.deleteMany();
    await prisma.familyExpense.deleteMany();
    await prisma.investment.deleteMany();
    await prisma.incomeSource.deleteMany();
    await prisma.familyProfile.deleteMany();
    await prisma.appUser.deleteMany();
    await prisma.incomeType.deleteMany();
    await prisma.expenseType.deleteMany();
    await prisma.buildCostItem.deleteMany();
    await prisma.houseType.deleteMany();
    const [salaryIncomeType, freelanceIncomeType, rentalIncomeType] = await Promise.all([
        prisma.incomeType.create({ data: { key: 'salary', label: 'Salary' } }),
        prisma.incomeType.create({ data: { key: 'freelance', label: 'Freelance' } }),
        prisma.incomeType.create({ data: { key: 'rental', label: 'Rental' } }),
    ]);
    const [livingType, loanType, childType] = await Promise.all([
        prisma.expenseType.create({ data: { key: 'living', label: 'Living Expenses' } }),
        prisma.expenseType.create({ data: { key: 'debt', label: 'Debt / Loans' } }),
        prisma.expenseType.create({ data: { key: 'children', label: 'Children / Education' } }),
    ]);
    const defaultUser = await prisma.appUser.create({
        data: {
            name: 'Default User',
            email: 'demo@planyourhome.local',
            passwordHash: await hash('demo123456', 10),
        },
    });
    const family = await prisma.familyProfile.create({
        data: {
            key: 'family_default',
            familyName: 'Asaf & Talia',
            monthlyGoal: 22668,
            ownerUserId: defaultUser.id,
        },
    });
    await prisma.incomeSource.createMany({
        data: [
            {
                name: 'Asaf salary',
                monthlyIls: 23800,
                type: salaryIncomeType.label,
                typeId: salaryIncomeType.id,
                familyId: family.id,
            },
            {
                name: 'Talia salary',
                monthlyIls: 13000,
                type: salaryIncomeType.label,
                typeId: salaryIncomeType.id,
                familyId: family.id,
            },
            {
                name: 'Side freelance',
                monthlyIls: 2500,
                type: freelanceIncomeType.label,
                typeId: freelanceIncomeType.id,
                familyId: family.id,
            },
            {
                name: 'Rent income',
                monthlyIls: 4200,
                type: rentalIncomeType.label,
                typeId: rentalIncomeType.id,
                familyId: family.id,
            },
        ],
    });
    await prisma.investment.createMany({
        data: [
            { name: 'Asaf portfolio', accountType: 'Stocks', provider: 'Meitav', currentValueIls: 952747, yearlyDepositIls: 12570, familyId: family.id },
            { name: 'Talia portfolio', accountType: 'Savings + Funds', provider: 'Migdal', currentValueIls: 220794, yearlyDepositIls: 0, familyId: family.id },
            { name: 'Ashkelon apartment', accountType: 'Real Estate', provider: null, currentValueIls: 1900000, yearlyDepositIls: null, familyId: family.id },
        ],
    });
    await prisma.familyExpense.createMany({
        data: [
            { name: 'Mortgage payment', monthlyIls: 5300, typeId: loanType.id, familyId: family.id },
            { name: 'Household baseline', monthlyIls: 9000, typeId: livingType.id, familyId: family.id },
            { name: 'Education and kids', monthlyIls: 3000, typeId: childType.id, familyId: family.id },
        ],
    });
    await prisma.scenario.createMany({
        data: [
            {
                key: 'moderate',
                label: 'Moderate Case',
                totalCostIls: 4840000,
                equityIls: 3200000,
                mortgageIls: 1640000,
                monthlyPayIls: 9840,
                familyId: family.id,
            },
            {
                key: 'good',
                label: 'Good Case',
                totalCostIls: 5471000,
                equityIls: 3300000,
                mortgageIls: 2171000,
                monthlyPayIls: 13026,
                familyId: family.id,
            },
            {
                key: 'stress',
                label: 'Stress Case',
                totalCostIls: 6095500,
                equityIls: 3100000,
                mortgageIls: 2995500,
                monthlyPayIls: 17973,
                familyId: family.id,
            },
        ],
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});
