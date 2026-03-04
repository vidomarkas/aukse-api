import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const defaultCategories = [
  { name: "Food & Drink", icon: "🍔", color: "#f97316", isIncome: false },
  { name: "Transport", icon: "🚗", color: "#3b82f6", isIncome: false },
  { name: "Shopping", icon: "🛍️", color: "#a855f7", isIncome: false },
  { name: "Housing", icon: "🏠", color: "#14b8a6", isIncome: false },
  { name: "Health", icon: "🏥", color: "#ef4444", isIncome: false },
  { name: "Entertainment", icon: "🎬", color: "#f59e0b", isIncome: false },
  { name: "Salary", icon: "💰", color: "#22c55e", isIncome: true },
  { name: "Freelance", icon: "💻", color: "#06b6d4", isIncome: true },
]

async function main() {
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { id: category.name },
      update: {},
      create: category,
    })
  }
  console.log("Seeded default categories")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())