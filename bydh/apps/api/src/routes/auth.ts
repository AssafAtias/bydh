import { compare, hash } from 'bcryptjs'
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getUserIdFromRequest, signAuthToken } from '../lib/auth.js'

const router = Router()

const asString = (value: unknown): string => String(value ?? '').trim()
const hasValue = (value: string): boolean => value.length > 0

router.post('/register', async (req, res) => {
  const name = asString(req.body?.name)
  const email = asString(req.body?.email).toLowerCase()
  const password = asString(req.body?.password)

  if (!hasValue(name) || !hasValue(email) || password.length < 8) {
    res.status(400).json({ message: 'name, email and password (min 8 chars) are required.' })
    return
  }

  const existing = await prisma.appUser.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    res.status(409).json({ message: 'Email already in use.' })
    return
  }

  const passwordHash = await hash(password, 10)
  const created = await prisma.appUser.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  const token = signAuthToken({ id: created.id, email })
  res.status(201).json({
    token,
    user: {
      id: created.id,
      name,
      email,
    },
  })
})

router.post('/login', async (req, res) => {
  const email = asString(req.body?.email).toLowerCase()
  const password = asString(req.body?.password)
  if (!hasValue(email) || !hasValue(password)) {
    res.status(400).json({ message: 'email and password are required.' })
    return
  }

  const user = await prisma.appUser.findUnique({
    where: { email },
  })

  if (!user || !user.passwordHash || !user.email || !user.name || !(await compare(password, user.passwordHash))) {
    res.status(401).json({ message: 'Invalid email or password.' })
    return
  }

  const token = signAuthToken({ id: user.id, email: user.email })
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  })
})

router.get('/me', async (req, res) => {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized.' })
    return
  }

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })
  if (!user || !user.email || !user.name) {
    res.status(401).json({ message: 'Unauthorized.' })
    return
  }

  res.json(user)
})

export const authRouter = router
