-- AlterTable
ALTER TABLE "Database" ADD COLUMN     "sshHost" TEXT,
ADD COLUMN     "sshPassphrase" TEXT,
ADD COLUMN     "sshPassword" TEXT,
ADD COLUMN     "sshPort" INTEGER DEFAULT 22,
ADD COLUMN     "sshPrivateKey" TEXT,
ADD COLUMN     "sshUsername" TEXT,
ADD COLUMN     "useSSH" BOOLEAN NOT NULL DEFAULT false;
