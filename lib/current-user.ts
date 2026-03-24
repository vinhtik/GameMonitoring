import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const authCookieName = 'user_id'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get(authCookieName)?.value

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  return user
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?error=unauthorized')
  }

  return user
}