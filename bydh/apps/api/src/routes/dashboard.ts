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
const makeTypeKey = (prefix: 'income' | 'expense', label: string): string =>
  `${prefix}_${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)}_${Math.random().toString(36).slice(2, 7)}`
const makeHouseTypeKey = (label: string): string =>
  `house_${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)}_${Math.random().toString(36).slice(2, 7)}`

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

router.post('/build/types', async (req, res) => {
  const label = asString(req.body?.label)
  const description = asString(req.body?.description)

  if (!hasValue(label)) {
    res.status(400).json({ message: 'label is required.' })
    return
  }

  const duplicate = await prisma.houseType.findFirst({
    where: { label: { equals: label, mode: 'insensitive' } },
    select: { id: true },
  })
  if (duplicate) {
    res.status(409).json({ message: 'House type already exists.' })
    return
  }

  const created = await prisma.houseType.create({
    data: {
      key: makeHouseTypeKey(label),
      label,
      description: hasValue(description) ? description : null,
    },
  })

  res.status(201).json({
    id: created.id,
    key: created.key,
    label: created.label,
    description: created.description,
    total: 0,
    items: [],
  })
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
      incomes: { include: { typeRef: true } },
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
  const expenseTypes = await prisma.expenseType.findMany({
    where: {
      ownerUserId: userId,
      familyId: resolvedFamilyId,
    },
    orderBy: { label: 'asc' },
  })
  const incomeTypes = await prisma.incomeType.findMany({
    where: {
      ownerUserId: userId,
      familyId: resolvedFamilyId,
    },
    orderBy: { label: 'asc' },
  })

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
      type: item.typeRef?.label ?? item.type,
      typeId: item.typeId,
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
    incomeTypes: incomeTypes.map((item) => ({
      id: item.id,
      key: item.key,
      label: item.label,
    })),
  })
})

router.get('/finances/income-types', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }
  const familyId = await resolveRequestedFamilyId(userId, req.query.profileId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }
  const types = await prisma.incomeType.findMany({
    where: {
      ownerUserId: userId,
      familyId,
    },
    orderBy: { label: 'asc' },
  })
  res.json(
    types.map((type) => ({
      id: type.id,
      key: type.key,
      label: type.label,
    })),
  )
})

router.post('/finances/income-types', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }
  const label = asString(req.body?.label)
  if (!hasValue(label)) {
    res.status(400).json({ message: 'label is required.' })
    return
  }
  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.body?.familyId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const existing = await prisma.incomeType.findFirst({
    where: {
      ownerUserId: userId,
      familyId,
      label: { equals: label, mode: 'insensitive' },
    },
  })
  if (existing) {
    res.status(409).json({ message: 'Income type already exists.' })
    return
  }

  const created = await prisma.incomeType.create({
    data: {
      key: makeTypeKey('income', label),
      label,
      ownerUserId: userId,
      familyId,
    },
  })

  res.status(201).json({
    id: created.id,
    key: created.key,
    label: created.label,
  })
})

router.patch('/finances/income-types/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }
  const id = asString(req.params.id)
  const label = asString(req.body?.label)
  if (!hasValue(label)) {
    res.status(400).json({ message: 'label is required.' })
    return
  }
  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.query.profileId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const existing = await prisma.incomeType.findFirst({
    where: {
      id,
      ownerUserId: userId,
      familyId,
    },
  })
  if (!existing) {
    res.status(404).json({ message: 'Income type not found.' })
    return
  }

  const duplicate = await prisma.incomeType.findFirst({
    where: {
      id: { not: id },
      ownerUserId: userId,
      familyId,
      label: { equals: label, mode: 'insensitive' },
    },
  })
  if (duplicate) {
    res.status(409).json({ message: 'Income type already exists.' })
    return
  }

  const updated = await prisma.incomeType.update({
    where: { id },
    data: { label },
  })
  await prisma.incomeSource.updateMany({
    where: { typeId: id },
    data: { type: label },
  })

  res.json({
    id: updated.id,
    key: updated.key,
    label: updated.label,
  })
})

router.delete('/finances/income-types/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }
  const id = asString(req.params.id)
  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.query.profileId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const existing = await prisma.incomeType.findFirst({
    where: {
      id,
      ownerUserId: userId,
      familyId,
    },
    include: { _count: { select: { items: true } } },
  })
  if (!existing) {
    res.status(404).json({ message: 'Income type not found.' })
    return
  }
  await prisma.$transaction(async (tx) => {
    if (existing._count.items > 0) {
      await tx.incomeSource.updateMany({
        where: { typeId: id },
        data: { typeId: null },
      })
    }
    await tx.incomeType.delete({ where: { id } })
  })
  res.status(204).send()
})

router.post('/finances/expense-types', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }
  const label = asString(req.body?.label)
  if (!hasValue(label)) {
    res.status(400).json({ message: 'label is required.' })
    return
  }
  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.body?.familyId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const existing = await prisma.expenseType.findFirst({
    where: {
      ownerUserId: userId,
      familyId,
      label: { equals: label, mode: 'insensitive' },
    },
  })
  if (existing) {
    res.status(409).json({ message: 'Expense type already exists.' })
    return
  }

  const created = await prisma.expenseType.create({
    data: {
      key: makeTypeKey('expense', label),
      label,
      ownerUserId: userId,
      familyId,
    },
  })

  res.status(201).json({
    id: created.id,
    key: created.key,
    label: created.label,
  })
})

router.patch('/finances/expense-types/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }
  const id = asString(req.params.id)
  const label = asString(req.body?.label)
  if (!hasValue(label)) {
    res.status(400).json({ message: 'label is required.' })
    return
  }
  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.query.profileId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const existing = await prisma.expenseType.findFirst({
    where: {
      id,
      ownerUserId: userId,
      familyId,
    },
  })
  if (!existing) {
    res.status(404).json({ message: 'Expense type not found.' })
    return
  }

  const duplicate = await prisma.expenseType.findFirst({
    where: {
      id: { not: id },
      ownerUserId: userId,
      familyId,
      label: { equals: label, mode: 'insensitive' },
    },
  })
  if (duplicate) {
    res.status(409).json({ message: 'Expense type already exists.' })
    return
  }

  const updated = await prisma.expenseType.update({
    where: { id },
    data: { label },
  })

  res.json({
    id: updated.id,
    key: updated.key,
    label: updated.label,
  })
})

router.delete('/finances/expense-types/:id', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }
  const id = asString(req.params.id)
  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.query.profileId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  const existing = await prisma.expenseType.findFirst({
    where: {
      id,
      ownerUserId: userId,
      familyId,
    },
    include: { _count: { select: { items: true } } },
  })
  if (!existing) {
    res.status(404).json({ message: 'Expense type not found.' })
    return
  }
  if (existing._count.items > 0) {
    res.status(400).json({ message: 'Cannot delete expense type that is in use.' })
    return
  }

  await prisma.expenseType.delete({ where: { id } })
  res.status(204).send()
})

router.post('/finances/incomes', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const name = asString(req.body?.name)
  const type = asString(req.body?.type)
  const typeId = asString(req.body?.typeId)
  const typeLabel = asString(req.body?.typeLabel)
  const monthlyIls = asOptionalNumber(req.body?.monthlyIls)

  if (!hasValue(name) || monthlyIls === null || (!hasValue(typeId) && !hasValue(typeLabel) && !hasValue(type))) {
    res.status(400).json({ message: 'name, monthlyIls and typeId/typeLabel/type are required.' })
    return
  }

  const familyId = await resolveRequestedFamilyId(userId, req.body?.profileId ?? req.body?.familyId)
  if (!familyId) {
    res.status(404).json({ message: 'Family profile not found.' })
    return
  }

  let resolvedTypeId = typeId
  let resolvedTypeLabel = type
  if (hasValue(resolvedTypeId)) {
    const selectedType = await prisma.incomeType.findFirst({
      where: {
        id: resolvedTypeId,
        ownerUserId: userId,
        familyId,
      },
    })
    if (!selectedType) {
      res.status(400).json({ message: 'Invalid income type.' })
      return
    }
    resolvedTypeLabel = selectedType.label
  } else {
    const normalizedLabel = hasValue(typeLabel) ? typeLabel : type
    const existingType = await prisma.incomeType.findFirst({
      where: {
        ownerUserId: userId,
        familyId,
        label: { equals: normalizedLabel, mode: 'insensitive' },
      },
      select: { id: true, label: true },
    })
    if (existingType) {
      resolvedTypeId = existingType.id
      resolvedTypeLabel = existingType.label
    } else {
      const createdType = await prisma.incomeType.create({
        data: {
          key: makeTypeKey('income', normalizedLabel),
          label: normalizedLabel,
          ownerUserId: userId,
          familyId,
        },
      })
      resolvedTypeId = createdType.id
      resolvedTypeLabel = createdType.label
    }
  }

  const created = await prisma.incomeSource.create({
    data: { name, type: resolvedTypeLabel, typeId: resolvedTypeId, monthlyIls, familyId },
    include: { typeRef: true },
  })

  res.status(201).json({
    id: created.id,
    name: created.name,
    type: created.typeRef?.label ?? created.type,
    typeId: created.typeId,
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
  const typeId = asString(req.body?.typeId)
  const typeLabel = asString(req.body?.typeLabel)
  const monthlyIls = asOptionalNumber(req.body?.monthlyIls)

  let resolvedTypeId = existing.typeId ?? null
  let resolvedTypeLabel = existing.type
  if (hasValue(typeId)) {
    const selectedType = await prisma.incomeType.findFirst({
      where: {
        id: typeId,
        ownerUserId: userId,
        familyId: existing.familyId,
      },
    })
    if (!selectedType) {
      res.status(400).json({ message: 'Invalid income type.' })
      return
    }
    resolvedTypeId = selectedType.id
    resolvedTypeLabel = selectedType.label
  } else if (hasValue(typeLabel) || hasValue(type)) {
    const normalizedLabel = hasValue(typeLabel) ? typeLabel : type
    const existingType = await prisma.incomeType.findFirst({
      where: {
        ownerUserId: userId,
        familyId: existing.familyId,
        label: { equals: normalizedLabel, mode: 'insensitive' },
      },
      select: { id: true, label: true },
    })
    if (existingType) {
      resolvedTypeId = existingType.id
      resolvedTypeLabel = existingType.label
    } else {
      const createdType = await prisma.incomeType.create({
        data: {
          key: makeTypeKey('income', normalizedLabel),
          label: normalizedLabel,
          ownerUserId: userId,
          familyId: existing.familyId,
        },
      })
      resolvedTypeId = createdType.id
      resolvedTypeLabel = createdType.label
    }
  }

  const updated = await prisma.incomeSource.update({
    where: { id },
    data: {
      name: hasValue(name) ? name : existing.name,
      type: resolvedTypeLabel,
      typeId: resolvedTypeId,
      monthlyIls: monthlyIls ?? asNumber(existing.monthlyIls),
    },
    include: { typeRef: true },
  })

  res.json({
    id: updated.id,
    name: updated.name,
    type: updated.typeRef?.label ?? updated.type,
    typeId: updated.typeId,
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
  if (hasValue(resolvedTypeId)) {
    const selectedType = await prisma.expenseType.findFirst({
      where: {
        id: resolvedTypeId,
        ownerUserId: userId,
        familyId,
      },
      select: { id: true },
    })
    if (!selectedType) {
      res.status(400).json({ message: 'Invalid expense type.' })
      return
    }
  } else if (hasValue(typeLabel)) {
    const existingType = await prisma.expenseType.findFirst({
      where: {
        ownerUserId: userId,
        familyId,
        label: { equals: typeLabel, mode: 'insensitive' },
      },
      select: { id: true },
    })

    if (existingType) {
      resolvedTypeId = existingType.id
    } else {
      const createdType = await prisma.expenseType.create({
        data: {
          key: makeTypeKey('expense', typeLabel),
          label: typeLabel,
          ownerUserId: userId,
          familyId,
        },
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
  if (hasValue(typeId)) {
    const selectedType = await prisma.expenseType.findFirst({
      where: {
        id: typeId,
        ownerUserId: userId,
        familyId: existing.familyId,
      },
      select: { id: true },
    })
    if (!selectedType) {
      res.status(400).json({ message: 'Invalid expense type.' })
      return
    }
  } else if (hasValue(typeLabel)) {
    const existingType = await prisma.expenseType.findFirst({
      where: {
        ownerUserId: userId,
        familyId: existing.familyId,
        label: { equals: typeLabel, mode: 'insensitive' },
      },
      select: { id: true },
    })

    if (existingType) {
      resolvedTypeId = existingType.id
    } else {
      const createdType = await prisma.expenseType.create({
        data: {
          key: makeTypeKey('expense', typeLabel),
          label: typeLabel,
          ownerUserId: userId,
          familyId: existing.familyId,
        },
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

router.get('/scenarios', async (req, res) => {
  const userId = await resolveCurrentUserId(req, res)
  if (!userId) {
    return
  }

  const resolvedFamilyId = await resolveRequestedFamilyId(userId, req.query.profileId)
  if (!resolvedFamilyId) {
    res.json([])
    return
  }

  const defaultFamilyId = await getDefaultFamilyId(userId)
  const includeLegacyGlobalScenarios = defaultFamilyId === resolvedFamilyId
  const scenarios = await prisma.scenario.findMany({
    where: includeLegacyGlobalScenarios
      ? {
          OR: [{ familyId: resolvedFamilyId }, { familyId: null }],
        }
      : { familyId: resolvedFamilyId },
    orderBy: { monthlyPayIls: 'asc' },
  })

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
