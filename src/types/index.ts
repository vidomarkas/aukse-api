export type AuthUser = {
  id: string
  email: string
  name?: string | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}