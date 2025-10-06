import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours for HIPAA compliance
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}

// Role-based access control helpers
export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF'

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole)
}

export function isAdmin(userRole: Role): boolean {
  return userRole === 'ADMIN'
}

export function isDoctor(userRole: Role): boolean {
  return userRole === 'DOCTOR'
}

export function canAccessPatientData(userRole: Role): boolean {
  return ['ADMIN', 'DOCTOR', 'NURSE'].includes(userRole)
}

export function canModifyEncounters(userRole: Role): boolean {
  return ['ADMIN', 'DOCTOR'].includes(userRole)
}

export function canAccessAnalytics(userRole: Role): boolean {
  return ['ADMIN', 'DOCTOR'].includes(userRole)
}
