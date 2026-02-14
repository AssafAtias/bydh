import type { Request, Response } from 'express'
import { Router } from 'express'
import { getUserIdFromRequest } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

const asNumber = (value: unknown): number => Number(value ?? 0)
const asOptionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
const asString = (value: unknown): string => String(value ?? '').trim()
const hasValue = (value: string): boolean => value.length > 0

const makeProfileKey = (): string => `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const resolveCurrentUserId = async (req: Request, res: Response): Promise<string | null> => {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized.' })
    return null
  }

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    res.status(401).json({ message: 'Unauthorized.' })
    return null
  }

  return user.id
}

const getDefaultFamilyId = async (userId: string): Promise<string | null> => {
  const family = await prisma.familyProfile.findFirst({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  return family?.id ?? null
}

const resolveRequestedFamilyId = async (userId: string, rawProfileId: unknown): Promise<string | null> => {
  const providedProfileId = asString(rawProfileId)
  const profileId = hasValue(providedProfileId) ? providedProfileId : await getDefaultFamilyId(userId)
  if (!profileId) {
    return null
  }

  const profile = await prisma.familyProfile.findFirst({
    where: {
      id: profileId,
      ownerUserId: userId,
    },
    select: { id: true },
  })

  return profile?.id ?? null
}

router.get('/build', async (_req, res) => {
  const [houseTypes, items] = await Promise.all([
    prisma.houseType.findMany({ orderBy: { label: 'asc' } }),
    prisma.buildCostItem.findMany({ orderBy: [{ stage: 'asc' }, { order: 'asc' }] }),
  ])

  const grouped = houseTypes.map((houseType) => {
    const costs = items.filter((item) => item.houseTypeId === houseType.id)
    const total = costs.reduce((sum, item) => sum + asNumber(item.amountIls), 0)

    return {
      id: houseType.id,
      key: houseType.key,
      label: houseType.label,
      description: houseType.description,
      total,
      items: costs.map((item) => ({
        id: item.id,
        code: item.code,
        stage: item.stage,
        name: item.name,
        amountIls: asNumber(item.amountIls),
        percentHint: item.percentHint ? asNumber(item.percentHint) : null,
        notes: item.notes,
      })),
    }
  })

  res.json(grouped)
})

router.get('/profiles', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const profiles = await prisma.familyProfile.findMany({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      key: true,
      familyName: true,
      monthlyGoal: true,
      createdAt: true,
    },
  })

  res.json(
    profiles.map((profile) => ({
      id: profile.id,
      key: profile.key,
      familyName: profile.familyName,
      monthlyGoal: profile.monthlyGoal ? asNumber(profile.monthlyGoal) : null,
      createdAt: profile.createdAt.toISOString(),
    })),
  )
})

router.post('/profiles', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const familyName = asString(req.body?.familyName)
  const monthlyGoal = asOptionalNumber(req.body?.monthlyGoal)

  if (!hasValue(familyName)) {
    res.status(400).json({ message: 'familyName is required.' })
    return
  }

  const profile = await prisma.familyProfile.create({
    data: {
      key: makeProfileKey(),
      familyName,
      monthlyGoal,
      ownerUserId: userId,
    },
    select: {
      id: true,
      key: true,
      familyName: true,
      monthlyGoal: true,
      createdAt: true,
    },
  })

  res.status(201).json({
    id: profile.id,
    key: profile.key,
    familyName: profile.familyName,
    monthlyGoal: profile.monthlyGoal ? asNumber(profile.monthlyGoal) : null,
    createdAt: profile.createdAt.toISOString(),
  })
})

router.get('/finances', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const resolvedFamilyId = await resolveRequestedFamilyId(userId, req.query.profileId)
  if (!resolvedFamilyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const family = await prisma.familyProfile.findFirst({
    where: {
      id: resolvedFamilyId,
      ownerUserId: userId,
    },
    include: {
      incomes: true,
      investments: true,
      expenses: { include: { type: true } },
    },
  })

  if (!family) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const monthlyIncome = family.incomes.reduce((sum, income) => sum + asNumber(income.monthlyIls), 0)
  const monthlyExpenses = family.expenses.reduce((sum, expense) => sum + asNumber(expense.monthlyIls), 0)
  const netMonthly = monthlyIncome - monthlyExpenses
  const investmentsTotal = family.investments.reduce((sum, item) => sum + asNumber(item.currentValueIls), 0)
  const expenseTypes = await prisma.expenseType.findMany({ orderBy: { label: 'asc' } })

  res.json({
    id: family.id,
    key: family.key,
    familyName: family.familyName,
    monthlyGoal: family.monthlyGoal ? asNumber(family.monthlyGoal) : null,
    totals: {
      monthlyIncome,
      monthlyExpenses,
      netMonthly,
      investmentsTotal,
    },
    incomes: family.incomes.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      monthlyIls: asNumber(item.monthlyIls),
    })),
    investments: family.investments.map((item) => ({
      id: item.id,
      name: item.name,
      accountType: item.accountType,
      provider: item.provider,
      currentValueIls: asNumber(item.currentValueIls),
      yearlyDepositIls: item.yearlyDepositIls ? asNumber(item.yearlyDepositIls) : null,
    })),
    expenses: family.expenses.map((item) => ({
      id: item.id,
      name: item.name,
      typeId: item.typeId,
      type: item.type.label,
      monthlyIls: asNumber(item.monthlyIls),
    })),
    expenseTypes: expenseTypes.map((item) => ({
      id: item.id,
      key: item.key,
      label: item.label,
    })),
  })
})

router.post('/finances/incomes', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const name = asString(req.body?.name)
  const type = asString(req.body?.type) || 'salary'
  const monthlyIls = asOptionalNumber(req.body?.monthlyIls)

  if (!hasValue(name) || monthlyIls === null) {
    res.status(400).json({ message: 'name and monthlyIls are required.' })
    return
  }

  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.body?.familyId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const created = await prisma.incomeSource.create({
    data: { name, type, monthlyIls, familyId },
  })

  res.status(201).json({
    id: created.id,
    name: created.name,
    type: created.type,
    monthlyIls: asNumber(created.monthlyIls),
  })
})

router.patch('/finances/incomes/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const id = asString(req.params.id)
  const existing = await prisma.incomeSource.findFirst({
    where: {
      id,
      family: {
        ownerUserId: userId,
      },
    },
  })
  if (!existing) {
    res.status(404).json({ message: 'Income source not found.' })
    return
  }

  const name = asString(req.body?.name)
  const type = asString(req.body?.type)
  const monthlyIls = asOptionalNumber(req.body?.monthlyIls)

  const updated = await prisma.incomeSource.update({
    where: { id },
    data: {
      name: hasValue(name) ? name : existing.name,
      type: hasValue(type) ? type : existing.type,
      monthlyIls: monthlyIls ?? asNumber(existing.monthlyIls),
    },
  })

  res.json({
    id: updated.id,
    name: updated.name,
    type: updated.type,
    monthlyIls: asNumber(updated.monthlyIls),
  })
})

router.delete('/finances/incomes/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const id = asString(req.params.id)
  const existing = await prisma.incomeSource.findFirst({
    where: {
      id,
      family: {
        ownerUserId: userId,
      },
    },
    select: { id: true },
  })
  if (!existing) {
    res.status(404).json({ message: 'Income source not found.' })
    return
  }
  await prisma.incomeSource.delete({ where: { id } })
  res.status(204).send()
})

router.post('/finances/investments', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const name = asString(req.body?.name)
  const accountType = asString(req.body?.accountType)
  const provider = asString(req.body?.provider)
  const currentValueIls = asOptionalNumber(req.body?.currentValueIls)
  const yearlyDepositIls = asOptionalNumber(req.body?.yearlyDepositIls)

  if (!hasValue(name) || !hasValue(accountType) || currentValueIls === null) {
    res.status(400).json({ message: 'name, accountType and currentValueIls are required.' })
    return
  }

  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.body?.familyId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const created = await prisma.investment.create({
    data: {
      name,
      accountType,
      provider: hasValue(provider) ? provider : null,
      currentValueIls,
      yearlyDepositIls,
      familyId,
    },
  })

  res.status(201).json({
    id: created.id,
    name: created.name,
    accountType: created.accountType,
    provider: created.provider,
    currentValueIls: asNumber(created.currentValueIls),
    yearlyDepositIls: created.yearlyDepositIls ? asNumber(created.yearlyDepositIls) : null,
  })
})

router.patch('/finances/investments/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const id = asString(req.params.id)
  const existing = await prisma.investment.findFirst({
    where: {
      id,
      family: {
        ownerUserId: userId,
      },
    },
  })
  if (!existing) {
    res.status(404).json({ message: 'Investment not found.' })
    return
  }

  const name = asString(req.body?.name)
  const accountType = asString(req.body?.accountType)
  const provider = asString(req.body?.provider)
  const currentValueIls = asOptionalNumber(req.body?.currentValueIls)
  const yearlyDepositIls = asOptionalNumber(req.body?.yearlyDepositIls)

  const updated = await prisma.investment.update({
    where: { id },
    data: {
      name: hasValue(name) ? name : existing.name,
      accountType: hasValue(accountType) ? accountType : existing.accountType,
      provider: hasValue(provider) ? provider : null,
      currentValueIls: currentValueIls ?? asNumber(existing.currentValueIls),
      yearlyDepositIls,
    },
  })

  res.json({
    id: updated.id,
    name: updated.name,
    accountType: updated.accountType,
    provider: updated.provider,
    currentValueIls: asNumber(updated.currentValueIls),
    yearlyDepositIls: updated.yearlyDepositIls ? asNumber(updated.yearlyDepositIls) : null,
  })
})

router.delete('/finances/investments/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const id = asString(req.params.id)
  const existing = await prisma.investment.findFirst({
    where: {
      id,
      family: {
        ownerUserId: userId,
      },
    },
    select: { id: true },
  })
  if (!existing) {
    res.status(404).json({ message: 'Investment not found.' })
    return
  }
  await prisma.investment.delete({ where: { id } })
  res.status(204).send()
})

router.post('/finances/expenses', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const name = asString(req.body?.name)
  const monthlyIls = asOptionalNumber(req.body?.monthlyIls)
  const typeId = asString(req.body?.typeId)
  const typeLabel = asString(req.body?.typeLabel)

  if (!hasValue(name) || monthlyIls === null || (!hasValue(typeId) && !hasValue(typeLabel))) {
    res.status(400).json({ message: 'name, monthlyIls and typeId/typeLabel are required.' })
    return
  }

  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.body?.familyId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  let resolvedTypeId = typeId
  if (!hasValue(resolvedTypeId) && hasValue(typeLabel)) {
    const existingType = await prisma.expenseType.findFirst({
      where: { label: { equals: typeLabel, mode: 'insensitive' } },
      select: { id: true },
    })

    if (existingType) {
      resolvedTypeId = existingType.id
    } else {
      const createdType = await prisma.expenseType.create({
        data: { key: `type_${Date.now()}`, label: typeLabel },
      })
      resolvedTypeId = createdType.id
    }
  }

  const created = await prisma.familyExpense.create({
    data: { name, monthlyIls, typeId: resolvedTypeId, familyId },
    include: { type: true },
  })

  res.status(201).json({
    id: created.id,
    name: created.name,
    typeId: created.typeId,
    type: created.type.label,
    monthlyIls: asNumber(created.monthlyIls),
  })
})

router.patch('/finances/expenses/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const id = asString(req.params.id)
  const existing = await prisma.familyExpense.findFirst({
    where: {
      id,
      family: {
        ownerUserId: userId,
      },
    },
  })
  if (!existing) {
    res.status(404).json({ message: 'Expense not found.' })
    return
  }

  const name = asString(req.body?.name)
  const monthlyIls = asOptionalNumber(req.body?.monthlyIls)
  const typeId = asString(req.body?.typeId)
  const typeLabel = asString(req.body?.typeLabel)

  let resolvedTypeId = hasValue(typeId) ? typeId : existing.typeId
  if (!hasValue(typeId) && hasValue(typeLabel)) {
    const existingType = await prisma.expenseType.findFirst({
      where: { label: { equals: typeLabel, mode: 'insensitive' } },
      select: { id: true },
    })

    if (existingType) {
      resolvedTypeId = existingType.id
    } else {
      const createdType = await prisma.expenseType.create({
        data: { key: `type_${Date.now()}`, label: typeLabel },
      })
      resolvedTypeId = createdType.id
    }
  }

  const updated = await prisma.familyExpense.update({
    where: { id },
    data: {
      name: hasValue(name) ? name : existing.name,
      monthlyIls: monthlyIls ?? asNumber(existing.monthlyIls),
      typeId: resolvedTypeId,
    },
    include: { type: true },
  })

  res.json({
    id: updated.id,
    name: updated.name,
    typeId: updated.typeId,
    type: updated.type.label,
    monthlyIls: asNumber(updated.monthlyIls),
  })
})

router.delete('/finances/expenses/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const id = asString(req.params.id)
  const existing = await prisma.familyExpense.findFirst({
    where: {
      id,
      family: {
        ownerUserId: userId,
      },
    },
    select: { id: true },
  })
  if (!existing) {
    res.status(404).json({ message: 'Expense not found.' })
    return
  }
  await prisma.familyExpense.delete({ where: { id } })
  res.status(204).send()
})

router.post('/build/items', async (req, res) => {
  const houseTypeId = asString(req.body?.houseTypeId)
  const stage = asString(req.body?.stage)
  const name = asString(req.body?.name)
  const amountIls = asOptionalNumber(req.body?.amountIls)
  const percentHint = asOptionalNumber(req.body?.percentHint)
  const notes = asString(req.body?.notes)
  const order = asOptionalNumber(req.body?.order)

  if (!hasValue(houseTypeId) || !hasValue(stage) || !hasValue(name) || amountIls === null) {
    res.status(400).json({ message: 'houseTypeId, stage, name and amountIls are required.' })
    return
  }

  const created = await prisma.buildCostItem.create({
    data: {
      code: `ITEM_${Date.now()}`,
      houseTypeId,
      stage,
      name,
      amountIls,
      percentHint,
      notes: hasValue(notes) ? notes : null,
      order: order ?? 0,
    },
  })

  res.status(201).json({
    id: created.id,
    code: created.code,
    stage: created.stage,
    name: created.name,
    amountIls: asNumber(created.amountIls),
    percentHint: created.percentHint ? asNumber(created.percentHint) : null,
    notes: created.notes,
    houseTypeId: created.houseTypeId,
    order: created.order,
  })
})

router.patch('/build/items/:id', async (req, res) => {
  const id = asString(req.params.id)
  const existing = await prisma.buildCostItem.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Build item not found.' })
    return
  }

  const stage = asString(req.body?.stage)
  const name = asString(req.body?.name)
  const amountIls = asOptionalNumber(req.body?.amountIls)
  const percentHint = asOptionalNumber(req.body?.percentHint)
  const notes = asString(req.body?.notes)
  const order = asOptionalNumber(req.body?.order)

  const updated = await prisma.buildCostItem.update({
    where: { id },
    data: {
      stage: hasValue(stage) ? stage : existing.stage,
      name: hasValue(name) ? name : existing.name,
      amountIls: amountIls ?? asNumber(existing.amountIls),
      percentHint,
      notes: hasValue(notes) ? notes : null,
      order: order ?? existing.order,
    },
  })

  res.json({
    id: updated.id,
    code: updated.code,
    stage: updated.stage,
    name: updated.name,
    amountIls: asNumber(updated.amountIls),
    percentHint: updated.percentHint ? asNumber(updated.percentHint) : null,
    notes: updated.notes,
    houseTypeId: updated.houseTypeId,
    order: updated.order,
  })
})

router.delete('/build/items/:id', async (req, res) => {
  const id = asString(req.params.id)
  await prisma.buildCostItem.delete({ where: { id } })
  res.status(204).send()
})

router.get('/scenarios', async (_req, res) => {
  const scenarios = await prisma.scenario.findMany({ orderBy: { monthlyPayIls: 'asc' } })

  res.json(
    scenarios.map((item) => ({
      id: item.id,
      key: item.key,
      label: item.label,
      totalCostIls: asNumber(item.totalCostIls),
      equityIls: asNumber(item.equityIls),
      mortgageIls: asNumber(item.mortgageIls),
      monthlyPayIls: asNumber(item.monthlyPayIls),
      notes: item.notes,
    })),
  )
})

export const dashboardRouter = router
