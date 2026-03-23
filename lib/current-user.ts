import { prisma } from '@/lib/prisma'

export async function getOrCreateCurrentUser() {
  const existing = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (existing) {
    return existing
  }

  return prisma.user.create({
    data: {
      name: 'Local User',
    },
  })
}