-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyOrder" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "DailyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "dailyOrderId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "variantKey" TEXT,
    "pastaType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDayStatus" (
    "id" SERIAL NOT NULL,
    "dailyOrderId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "MemberDayStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyOrder_date_key" ON "DailyOrder"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MemberDayStatus_dailyOrderId_memberId_key" ON "MemberDayStatus"("dailyOrderId", "memberId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_dailyOrderId_fkey" FOREIGN KEY ("dailyOrderId") REFERENCES "DailyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDayStatus" ADD CONSTRAINT "MemberDayStatus_dailyOrderId_fkey" FOREIGN KEY ("dailyOrderId") REFERENCES "DailyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDayStatus" ADD CONSTRAINT "MemberDayStatus_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
