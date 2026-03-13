import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = [
  "Rahul", "Priya", "Arjun", "Sneha", "Amit", "Anjali", "Vikram", "Kavita", "Sanjay", "Meera",
  "Rajesh", "Sunita", "Anil", "Pooja", "Suresh", "Neha", "Ramesh", "Swati", "Mahesh", "Aarti",
  "Vijay", "Ritu", "Ajay", "Shweta", "Kishore", "Madhu", "Sunil", "Rekha", "Manoj", "Geeta",
  "Ashok", "Maya", "Vinod", "Lata", "Arvind", "Asha", "Deepak", "Jyoti", "Pradeep", "Shanti",
  "Satish", "Nirmala", "Harish", "Pushpa", "Kailash", "Sarita", "Bhagwan", "Savitri", "Om", "Kamla"
];

const lastNames = [
  "Sharma", "Patel", "Mehta", "Iyer", "Gupta", "Singh", "Kumar", "Rao", "Reddy", "Nair",
  "Joshi", "Kulkarni", "Deshmukh", "Patil", "More", "Shinde", "Yadav", "Chauhan", "Tiwari", "Mishra",
  "Pandey", "Dubey", "Jha", "Chatterjee", "Mukherjee", "Banerjee", "Das", "Bose", "Sen", "Ghosh"
];

function generateName(index: number) {
  const first = firstNames[index % firstNames.length];
  const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  return `${first} ${last}`;
}

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.maintenanceBill.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.wing.deleteMany();
  await prisma.tower.deleteMany();

  // 1. Create Tower
  const tower = await prisma.tower.create({
    data: { name: 'TowerTech Residency' }
  });

  const wings = ['A', 'B', 'C', 'D'];
  let residentIndex = 0;

  for (const wingName of wings) {
    const wing = await prisma.wing.create({
      data: {
        name: `${wingName} Wing`,
        towerId: tower.id
      }
    });

    console.log(`Generating flats for ${wingName} Wing...`);

    for (let floor = 1; floor <= 7; floor++) {
      for (let flatNum = 1; flatNum <= 4; flatNum++) {
        const flatNumber = `${wingName}${floor}${flatNum.toString().padStart(2, '0')}`;
        const name = generateName(residentIndex);
        const email = `${name.toLowerCase().replace(/\s/g, '.')}@email.com`;
        const phone = `9876543${residentIndex.toString().padStart(3, '0')}`;

        const flat = await prisma.flat.create({
          data: {
            number: flatNumber,
            floor: floor,
            wingId: wing.id
          }
        });

        await prisma.resident.create({
          data: {
            name,
            email,
            phone,
            flatId: flat.id
          }
        });

        residentIndex++;
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
