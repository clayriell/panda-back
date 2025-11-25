/*
  Warnings:

  - You are about to drop the column `master` on the `assisttug` table. All the data in the column will be lost.
  - You are about to alter the column `loa` on the `shipdetail` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(6,2)`.
  - A unique constraint covering the columns `[masterId]` on the table `AssistTug` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[docNumber]` on the table `PilotageService` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tugServiceId,assistTugId]` on the table `TugServiceDetail` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `agency` MODIFY `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `assisttug` DROP COLUMN `master`,
    ADD COLUMN `masterId` INTEGER NULL;

-- AlterTable
ALTER TABLE `pilotageservice` MODIFY `startDate` DATE NOT NULL DEFAULT CURRENT_DATE,
    MODIFY `startTime` TIME NOT NULL DEFAULT CURRENT_TIME,
    MODIFY `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITTED', 'REJECTED', 'PAID', 'CHECK', 'CANCELED') NOT NULL DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE `shipdetail` MODIFY `loa` DECIMAL(6, 2) NULL;

-- AlterTable
ALTER TABLE `tugservice` ADD COLUMN `createdBy` INTEGER NULL,
    ADD COLUMN `submitTime` DATETIME(3) NULL,
    ADD COLUMN `submittedBy` INTEGER NULL,
    MODIFY `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITTED', 'REJECTED', 'PAID', 'CHECK', 'CANCELED') NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE `tugservicedetail` ADD COLUMN `status` ENUM('WAITING', 'ON_MOB', 'ON_WORK', 'ON_DEMOB', 'COMPLETED') NOT NULL DEFAULT 'WAITING';

-- CreateTable
CREATE TABLE `ServiceLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServiceLog_serviceType_serviceId_idx`(`serviceType`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocSignature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `pilotageServiceId` INTEGER NOT NULL,
    `signedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `AssistTug_masterId_key` ON `AssistTug`(`masterId`);

-- CreateIndex
CREATE UNIQUE INDEX `PilotageService_docNumber_key` ON `PilotageService`(`docNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `TugServiceDetail_tugServiceId_assistTugId_key` ON `TugServiceDetail`(`tugServiceId`, `assistTugId`);

-- AddForeignKey
ALTER TABLE `AssistTug` ADD CONSTRAINT `AssistTug_masterId_fkey` FOREIGN KEY (`masterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_pilotId_fkey` FOREIGN KEY (`pilotId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugService` ADD CONSTRAINT `TugService_submittedBy_fkey` FOREIGN KEY (`submittedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugService` ADD CONSTRAINT `TugService_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocSignature` ADD CONSTRAINT `DocSignature_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocSignature` ADD CONSTRAINT `DocSignature_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
