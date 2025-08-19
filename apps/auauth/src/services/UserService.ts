import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "../db"
import { user } from "../db/schema"

import type { NewUserDTO, UpdateUserDTO, UserDTO } from '../dtos'

import { hashPassword } from "../hashing"


class UserService {
  async findAll(): Promise<UserDTO[]> {
    return await db.query.user.findMany()
  }

  async findById(id: string): Promise<UserDTO | undefined> {
    return await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    })
  }

  async findByName(name: string) {
    return await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.name, name),
    })
  }

  async create(newUser: NewUserDTO): Promise<UserDTO> {
    const passwordHash = hashPassword(newUser.password)
    const [created] = await db
      .insert(user)
      .values({ ...newUser, passwordHash })
      .returning()

    return created
  }

  async update(id: string, updateUser: UpdateUserDTO): Promise<UserDTO> {
    const u: Partial<UserDTO> = { ...updateUser, id }

    if (updateUser.password) {
      u.passwordHash = hashPassword(updateUser.password)
    }

    const [updatedUser] = await db
      .update(user)
      .set(u)
      .where(eq(user.id, id))
      .returning()

    return updatedUser
  }

  async delete(id: string) {
    return await db.delete(user).where(eq(user.id, id))
  }
}

export default new UserService()
