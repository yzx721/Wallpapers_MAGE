import prisma from './src/utils/prisma.js'

async function main() {
  console.log('Testing Prisma connection...')
  try {
    const count = await prisma.image.count()
    console.log('Image count:', count)
  } catch (error) {
    console.error('Connection/query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
