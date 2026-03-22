-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "email" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_householdId_idx" ON "invitations"("householdId");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
