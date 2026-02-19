import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@ogp/database";
import { UserRole } from "@ogp/types";

/**
 * NextAuth configuration with credentials provider
 * Extends session with user role and municipality
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email ou Telefone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email/telefone e senha são obrigatórios");
        }

        // Try to find user by email or phone
        const identifier = credentials.email;
        let user = await prisma.user.findUnique({
          where: { email: identifier },
          include: {
            municipality: true,
          },
        });

        // If not found by email, try by phone
        if (!user) {
          user = await prisma.user.findFirst({
            where: { phone: identifier },
            include: {
              municipality: true,
            },
          });
        }

        if (!user || !user.active) {
          throw new Error("Credenciais inválidas");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Credenciais inválidas");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          municipalityId: user.municipalityId,
          neighborhoodId: user.neighborhoodId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.municipalityId = user.municipalityId;
        token.neighborhoodId = user.neighborhoodId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.municipalityId = token.municipalityId as string;
        session.user.neighborhoodId = token.neighborhoodId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: UserRole;
      municipalityId: string;
      neighborhoodId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: UserRole;
    municipalityId: string;
    neighborhoodId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    municipalityId: string;
    neighborhoodId?: string;
  }
}

