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
    const [villa, duplex] = await Promise.all([
        prisma.houseType.create({
            data: {
                key: 'villa',
                label: 'Villa',
                description: 'Private standalone house build flow.',
            },
        }),
        prisma.houseType.create({
            data: {
                key: 'duplex',
                label: 'Duplex',
                description: 'Semi-attached family home build flow.',
            },
        }),
    ]);
    await prisma.buildCostItem.createMany({
        data: [
            { code: 'LAND_PURCHASE', stage: 'Land Purchase', name: 'Land cost', amountIls: 3000000, order: 1, houseTypeId: villa.id },
            { code: 'LAND_TAX', stage: 'Land Purchase', name: 'Purchase tax (6%)', amountIls: 180000, percentHint: 6, order: 2, houseTypeId: villa.id },
            { code: 'BROKER_FEE', stage: 'Land Purchase', name: 'Broker fee (2%)', amountIls: 60000, percentHint: 2, order: 3, houseTypeId: villa.id },
            { code: 'MEMBERSHIP', stage: 'Land Purchase', name: 'Membership fee', amountIls: 250000, order: 4, houseTypeId: villa.id },
            { code: 'LAWYER', stage: 'Land Purchase', name: 'Real-estate lawyer', amountIls: 30000, percentHint: 1, order: 5, houseTypeId: villa.id },
            { code: 'SURVEYOR', stage: 'Land Purchase', name: 'Surveyor / appraiser', amountIls: 6000, order: 6, houseTypeId: villa.id },
            { code: 'ARCHITECT', stage: 'Planning', name: 'Architect', amountIls: 100000, order: 7, houseTypeId: villa.id },
            { code: 'STRUCTURE_ENG', stage: 'Planning', name: 'Structural engineer', amountIls: 30000, order: 8, houseTypeId: villa.id },
            { code: 'SOIL_CONSULTANT', stage: 'Planning', name: 'Soil consultant', amountIls: 7000, order: 9, houseTypeId: villa.id },
            { code: 'ELECTRIC_CONSULTANT', stage: 'Planning', name: 'Electrical consultant', amountIls: 5000, order: 10, houseTypeId: villa.id },
            { code: 'PLUMBING_CONSULTANT', stage: 'Planning', name: 'Plumbing consultant', amountIls: 5000, order: 11, houseTypeId: villa.id },
            { code: 'FIRE_SAFETY', stage: 'Planning', name: 'Fire safety consultant', amountIls: 5000, order: 12, houseTypeId: villa.id },
            { code: 'PERMITS', stage: 'Planning', name: 'Building permits and municipal fees', amountIls: 50000, order: 13, houseTypeId: villa.id },
            { code: 'PROJECT_MANAGER', stage: 'Planning', name: 'Project manager', amountIls: 45000, order: 14, houseTypeId: villa.id },
            { code: 'MAIN_BUILD', stage: 'Construction', name: 'Main build', amountIls: 2400000, order: 15, houseTypeId: villa.id },
            { code: 'GENERAL_CONTRACTOR', stage: 'Construction', name: 'General contractor', amountIls: 180000, order: 16, houseTypeId: villa.id },
            { code: 'SITE_SUPERVISOR', stage: 'Construction', name: 'Site supervisor engineer', amountIls: 60000, order: 17, houseTypeId: villa.id },
            { code: 'DEVELOPMENT', stage: 'Construction', name: 'Site development', amountIls: 200000, order: 18, houseTypeId: villa.id },
            { code: 'UTILITY_CONNECTIONS', stage: 'Closeout', name: 'Utility connections', amountIls: 55000, order: 19, houseTypeId: villa.id },
            { code: 'INTERIOR_FINISHES', stage: 'Closeout', name: 'Interior finishes', amountIls: 350000, order: 20, houseTypeId: villa.id },
            { code: 'LANDSCAPING', stage: 'Closeout', name: 'Landscaping and outdoor works', amountIls: 120000, order: 21, houseTypeId: villa.id },
            { code: 'DUPLEX_MAIN_BUILD', stage: 'Construction', name: 'Main build', amountIls: 2000000, order: 1, houseTypeId: duplex.id },
            { code: 'DUPLEX_DEVELOPMENT', stage: 'Construction', name: 'Site development', amountIls: 300000, order: 2, houseTypeId: duplex.id },
            { code: 'DUPLEX_CONSTRUCTOR', stage: 'Construction', name: 'General contractor', amountIls: 140000, order: 3, houseTypeId: duplex.id },
            { code: 'DUPLEX_STRUCTURE_ENG', stage: 'Planning', name: 'Structural engineer', amountIls: 28000, order: 4, houseTypeId: duplex.id },
            { code: 'DUPLEX_UTILITY', stage: 'Closeout', name: 'Utility connections', amountIls: 42000, order: 5, houseTypeId: duplex.id },
        ],
    });
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
