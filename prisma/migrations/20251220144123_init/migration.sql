-- CreateTable
CREATE TABLE `Agency` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `picName` VARCHAR(191) NULL,
    `picNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Terminal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `area` ENUM('TANJUNG_UNCANG', 'BATU_AMPAR', 'KABIL', 'REMPANG_GALANG', 'LAUT') NOT NULL DEFAULT 'TANJUNG_UNCANG',

    UNIQUE INDEX `Terminal_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssistTug` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shipName` VARCHAR(191) NOT NULL,
    `masterId` INTEGER NULL,
    `horsePower` INTEGER NOT NULL,
    `companyId` INTEGER NULL,

    UNIQUE INDEX `AssistTug_masterId_key`(`masterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('SYS_ADMIN', 'ADMIN', 'PILOT', 'TUG_MASTER', 'MANAGER') NOT NULL DEFAULT 'ADMIN',
    `picture` VARCHAR(191) NULL,
    `companyId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NULL,
    `serviceType` ENUM('PILOTAGE', 'TUG', 'SYS_PILOTAGE', 'SYS_TUGS', 'OTHER') NOT NULL,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServiceLog_serviceType_serviceId_idx`(`serviceType`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PilotageService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `docNumber` VARCHAR(191) NULL,
    `idJasa` INTEGER NULL,
    `agencyId` INTEGER NOT NULL,
    `companyId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITTED', 'REJECTED', 'PAID', 'CHECK', 'CANCELED') NOT NULL DEFAULT 'REQUESTED',
    `submitTime` DATETIME(3) NULL,
    `submittedBy` INTEGER NULL,
    `createdBy` INTEGER NULL,

    UNIQUE INDEX `PilotageService_docNumber_key`(`docNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pilotageServiceId` INTEGER NOT NULL,
    `pilotId` INTEGER NULL,
    `terminalStartId` INTEGER NULL,
    `terminalEndId` INTEGER NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `activity` ENUM('PILOT_IN', 'PILOT_OUT', 'PILOT_SHIFTING', 'PILOT_SEATRIAL') NOT NULL,
    `sequence` INTEGER NOT NULL,

    UNIQUE INDEX `ActivityDetail_pilotageServiceId_sequence_key`(`pilotageServiceId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShipDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pilotageServiceId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `master` VARCHAR(191) NULL,
    `grt` INTEGER NULL,
    `loa` DECIMAL(6, 2) NULL,
    `flag` VARCHAR(191) NULL,
    `lastPort` VARCHAR(100) NULL,
    `lastPortCountry` VARCHAR(60) NULL,
    `nextPort` VARCHAR(100) NULL,
    `nextPortCountry` VARCHAR(60) NULL,
    `callSign` VARCHAR(15) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TugService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pilotageServiceId` INTEGER NOT NULL,
    `idJasa` INTEGER NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITTED', 'REJECTED', 'PAID', 'CHECK', 'CANCELED') NOT NULL DEFAULT 'REQUESTED',
    `submitTime` DATETIME(3) NULL,
    `submittedBy` INTEGER NULL,
    `createdBy` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TugServiceDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tugServiceId` INTEGER NOT NULL,
    `assistTugId` INTEGER NOT NULL,
    `connectTime` DATETIME(3) NULL,
    `disconnectTime` DATETIME(3) NULL,
    `mobTime` DATETIME(3) NULL,
    `demobTime` DATETIME(3) NULL,
    `status` ENUM('WAITING', 'ON_MOB', 'ON_WORK', 'ON_DEMOB', 'COMPLETED') NOT NULL DEFAULT 'WAITING',
    `activity` ENUM('ASSIST_BERTHING', 'ASSIST_UNBERTHING') NOT NULL DEFAULT 'ASSIST_BERTHING',
    `sequence` INTEGER NOT NULL,

    UNIQUE INDEX `TugServiceDetail_tugServiceId_assistTugId_sequence_key`(`tugServiceId`, `assistTugId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Billing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `serviceType` ENUM('PILOTAGE', 'TUG') NOT NULL,
    `idJasa` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paidDate` DATETIME(3) NULL,

    INDEX `Billing_serviceType_serviceId_idx`(`serviceType`, `serviceId`),
    INDEX `Billing_idJasa_idx`(`idJasa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocSignature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('MANAGER', 'PILOT', 'TUG_MASTER', 'MASTER') NOT NULL,
    `userId` INTEGER NULL,
    `pilotageServiceId` INTEGER NOT NULL,
    `signedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `token` VARCHAR(191) NULL,
    `signatureImage` LONGTEXT NULL,
    `sequence` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentCounter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyCode` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `DocumentCounter_companyCode_year_month_key`(`companyCode`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PilotCurrentStatus` (
    `userId` INTEGER NOT NULL,
    `pilotageServiceId` INTEGER NULL,
    `status` ENUM('STAND_BY', 'WORKING') NOT NULL,
    `startTime` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PilotCurrentStatus_pilotageServiceId_key`(`pilotageServiceId`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TugCurrentStatus` (
    `assistTugId` INTEGER NOT NULL,
    `pilotageServiceId` INTEGER NULL,
    `status` ENUM('STAND_BY', 'ON_MOB', 'WORKING', 'ON_DEMOB') NOT NULL,
    `startTime` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TugCurrentStatus_pilotageServiceId_key`(`pilotageServiceId`),
    PRIMARY KEY (`assistTugId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AssistTug` ADD CONSTRAINT `AssistTug_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssistTug` ADD CONSTRAINT `AssistTug_masterId_fkey` FOREIGN KEY (`masterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceLog` ADD CONSTRAINT `ServiceLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_submittedBy_fkey` FOREIGN KEY (`submittedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityDetail` ADD CONSTRAINT `ActivityDetail_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityDetail` ADD CONSTRAINT `ActivityDetail_pilotId_fkey` FOREIGN KEY (`pilotId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityDetail` ADD CONSTRAINT `ActivityDetail_terminalStartId_fkey` FOREIGN KEY (`terminalStartId`) REFERENCES `Terminal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityDetail` ADD CONSTRAINT `ActivityDetail_terminalEndId_fkey` FOREIGN KEY (`terminalEndId`) REFERENCES `Terminal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShipDetail` ADD CONSTRAINT `ShipDetail_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugService` ADD CONSTRAINT `TugService_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugService` ADD CONSTRAINT `TugService_submittedBy_fkey` FOREIGN KEY (`submittedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugService` ADD CONSTRAINT `TugService_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugServiceDetail` ADD CONSTRAINT `TugServiceDetail_tugServiceId_fkey` FOREIGN KEY (`tugServiceId`) REFERENCES `TugService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugServiceDetail` ADD CONSTRAINT `TugServiceDetail_assistTugId_fkey` FOREIGN KEY (`assistTugId`) REFERENCES `AssistTug`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocSignature` ADD CONSTRAINT `DocSignature_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocSignature` ADD CONSTRAINT `DocSignature_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotCurrentStatus` ADD CONSTRAINT `PilotCurrentStatus_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotCurrentStatus` ADD CONSTRAINT `PilotCurrentStatus_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugCurrentStatus` ADD CONSTRAINT `TugCurrentStatus_assistTugId_fkey` FOREIGN KEY (`assistTugId`) REFERENCES `AssistTug`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugCurrentStatus` ADD CONSTRAINT `TugCurrentStatus_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
