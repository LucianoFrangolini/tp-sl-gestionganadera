import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb"

/**
 * GET /api/users
 * Obtiene la lista de usuarios
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const query: any = {}
    if (search) {
      const safeRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      query.$or = [
        { name: safeRegex },
        { email: safeRegex },
        { role: safeRegex },
      ]
    }

    const usersCollection = db.collection("users")
    const total = await usersCollection.countDocuments(query)
    const users = await usersCollection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    return NextResponse.json(
      {
        success: true,
        data: users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener usuarios",
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/users
 * Crea un nuevo usuario
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb()
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "El formato del email no es válido" },
        { status: 400 },
      )
    }

    // Verificar si el usuario ya existe
    const usersCollection = db.collection("users")
    const existing = await usersCollection.findOne({ email })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "El usuario ya existe" },
        { status: 400 },
      )
    }

    const newUser = {
      name,
      email,
      password, // En producción deberías hashear la contraseña
      role: "Operador",
      createdAt: new Date().toISOString().split("T")[0],
    }

    const result = await usersCollection.insertOne(newUser)

    return NextResponse.json(
      {
        success: true,
        data: { ...newUser, id: result.insertedId },
        message: "Usuario creado correctamente",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear usuario",
      },
      { status: 500 },
    )
  }
}
