import { password } from "bun"

export function hashPassword(pswd: string) {
  return password.hashSync(pswd, { algorithm: 'bcrypt' })
}

export function verifyPassword(pswd: string, hash: string) {
  return password.verifySync(pswd, hash, "bcrypt")
}
