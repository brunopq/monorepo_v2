import { Hono } from "hono"
import { showRoutes } from "hono/dev"
import { describeRoute, openAPISpecs } from "hono-openapi"
import { resolver, validator } from "hono-openapi/zod"
import { HTTPException } from "hono/http-exception"
import { Scalar } from "@scalar/hono-api-reference"
import { z } from "zod"

import { verifyPassword } from "./hashing"

import { seed } from './db/seeding'

import { authGuard } from "./middlewares/authGuard"
import { getUser } from "./middlewares/getUser"
import { jwtMiddleware, makeJwt } from "./utils/jwt"

import UserService from "./services/UserService"

import {
  loginSchema,
  userSchema,
  newUserSchema,
  userRolesSchema,
  responseUserSchema,
  updateUserSchema,
  loginResponseSchema,
  LoginResponseDTO,
} from "./dtos/index"

if (process.env.SEED === 'true') {
  console.log("Seeding database...")
  await seed()
  console.log("Database seeded successfully.")
}

const app = new Hono()

app.post(
  "/login",
  describeRoute({
    tags: ["Login"],
    description: "User login endpoint",
    responses: {
      200: {
        description: "Successful login",
        content: {
          "application/json": {
            schema: resolver(loginResponseSchema),
          },
        },
      },
      401: {
        description: "Invalid credentials",
      },
    },
  }),
  validator("json", loginSchema),
  async (c) => {
    const { username, password } = c.req.valid("json")

    const userInfo = await UserService.findByName(username)

    if (!userInfo || !userInfo.accountActive) {
      throw new HTTPException(401, { message: "Invalid credentials" })
    }

    const userPawssordValid = verifyPassword(password, userInfo.passwordHash)

    if (!userPawssordValid) {
      throw new HTTPException(401, { message: "Invalid credentials" })
    }

    const jwt = await makeJwt(userInfo)

    return c.json({ token: jwt, user: userInfo })
  },
)

const userRouter = new Hono().use(jwtMiddleware(), getUser())

userRouter.get("/", async (c) => {
  const users = await UserService.findAll()
  return c.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      fullName: u.fullName,
      role: u.role,
      accountActive: u.accountActive,
    })),
  })
})

userRouter.get("/me", (c) => {
  const user = c.get("user")
  return c.json({
    id: user.id,
    name: user.name,
    fullName: user.fullName,
    role: user.role,
    accountActive: user.accountActive,
  })
})

userRouter.get(
  "/:id",
  validator(
    "param",
    z.object({
      id: z.string().uuid(),
    }),
  ),
  async (c) => {
    const userId = c.req.param("id")

    const user = await UserService.findById(userId)

    if (!user) {
      throw new HTTPException(404, {
        message: `User with id "${userId}" not found`,
      })
    }

    return c.json({
      id: user.id,
      name: user.name,
      fullName: user.fullName,
      role: user.role,
      accountActive: user.accountActive,
    })
  },
)

userRouter.post(
  "/",
  authGuard("ADMIN"),
  validator("json", newUserSchema),
  async (c) => {
    const createUser = c.req.valid("json")

    const userExists = await UserService.findByName(createUser.name)

    if (userExists) {
      throw new HTTPException(400, {
        message: `User with name "${createUser.name}" already exists`,
      })
    }

    const createdUser = await UserService.create(createUser)

    if (!createdUser) {
      throw new HTTPException(500, { message: "Error creating user" })
    }

    return c.json({
      user: {
        id: createdUser.id,
        name: createdUser.name,
        fullName: createdUser.fullName,
        role: createdUser.role,
        accountActive: createdUser.accountActive,
      },
    })
  },
)

userRouter.patch(
  "/:id",
  authGuard("ADMIN"),
  validator("json", updateUserSchema),
  async (c) => {
    const userId = c.req.param("id")
    const updateUser = c.req.valid("json")

    const userExists = await UserService.findById(userId)

    if (!userExists) {
      throw new HTTPException(404, {
        message: `User with id "${userId}" does not exist`,
      })
    }

    const updatedUser = await UserService.update(userId, updateUser)

    if (!updatedUser) {
      throw new HTTPException(500, { message: "Error update user" })
    }

    return c.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        accountActive: updatedUser.accountActive,
      },
    })
  },
)

userRouter.delete("/:id", authGuard("ADMIN"), async (c) => {
  const userId = c.req.param("id")

  const userExists = await UserService.findById(userId)

  if (!userExists) {
    throw new HTTPException(404, {
      message: `User with id "${userId}" does not exist`,
    })
  }

  await UserService.delete(userId)

  return c.status(204)
})

app.route("/users", userRouter)

app.get("/scalar", Scalar({ url: "/openapi" }))
app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Auauth API",
        description: "API for user authentication and user management",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local development server",
        },
      ],
    },
  }),
)

showRoutes(app, { colorize: true })
export default app
