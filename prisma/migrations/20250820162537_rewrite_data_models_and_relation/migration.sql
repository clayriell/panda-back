-- CreateTable
CREATE TABLE `Agency` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `picName` VARCHAR(191) NOT NULL,
    `picNumber` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssistTug` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shipName` VARCHAR(191) NOT NULL,
    `master` VARCHAR(191) NOT NULL,
    `horsePower` INTEGER NOT NULL,
    `companyId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PilotageService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `docNumber` VARCHAR(191) NULL,
    `idJasa` INTEGER NULL,
    `agencyId` INTEGER NOT NULL,
    `companyId` INTEGER NULL,
    `activity` ENUM('BERTHING', 'UNBERTHING', 'SEA_TRIAL', 'SHIFTING') NOT NULL DEFAULT 'BERTHING',
    `terminalStartId` INTEGER NULL,
    `terminalEndId` INTEGER NULL,
    `lastPort` VARCHAR(191) NULL,
    `nextPort` VARCHAR(191) NULL,
    `pilotId` INTEGER NULL,
    `startDate` DATE NOT NULL DEFAULT CURRENT_DATE,
    `startTime` TIME NOT NULL DEFAULT CURRENT_TIME,
    `endDate` DATE NULL,
    `endTime` TIME NULL,
    `note` VARCHAR(191) NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITED', 'REJECTED', 'PAID', 'CANCELED') NOT NULL DEFAULT 'REQUESTED',
    `amount` DECIMAL(10, 2) NOT NULL,
    `rate` INTEGER NOT NULL DEFAULT 5,
    `submitTime` DATETIME(3) NULL,
    `submittedBy` INTEGER NULL,
    `createdBy` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShipDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pilotageServiceId` INTEGER NOT NULL,
    `shipName` VARCHAR(191) NOT NULL,
    `master` VARCHAR(191) NOT NULL,
    `grt` INTEGER NULL,
    `loa` INTEGER NULL,
    `flag` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Terminal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `area` ENUM('TANJUNG_UNCANG', 'BATU_AMPAR', 'KABIL') NOT NULL DEFAULT 'TANJUNG_UNCANG',

    UNIQUE INDEX `Terminal_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TugService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pilotageServiceId` INTEGER NOT NULL,
    `idJasa` INTEGER NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITED', 'REJECTED', 'PAID', 'CANCELED') NOT NULL DEFAULT 'APPROVED',
    `amount` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TugServiceDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tugServiceId` INTEGER NOT NULL,
    `assistTugId` INTEGER NOT NULL,
    `connectTime` DATETIME(3) NULL,
    `disconnectTime` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('SYS_ADMIN', 'ADMIN', 'PILOT') NOT NULL DEFAULT 'ADMIN',
    `picture` VARCHAR(191) NULL,
    `companyId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AssistTug` ADD CONSTRAINT `AssistTug_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_submittedBy_fkey` FOREIGN KEY (`submittedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_terminalStartId_fkey` FOREIGN KEY (`terminalStartId`) REFERENCES `Terminal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_terminalEndId_fkey` FOREIGN KEY (`terminalEndId`) REFERENCES `Terminal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PilotageService` ADD CONSTRAINT `PilotageService_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShipDetail` ADD CONSTRAINT `ShipDetail_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugService` ADD CONSTRAINT `TugService_pilotageServiceId_fkey` FOREIGN KEY (`pilotageServiceId`) REFERENCES `PilotageService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugServiceDetail` ADD CONSTRAINT `TugServiceDetail_tugServiceId_fkey` FOREIGN KEY (`tugServiceId`) REFERENCES `TugService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TugServiceDetail` ADD CONSTRAINT `TugServiceDetail_assistTugId_fkey` FOREIGN KEY (`assistTugId`) REFERENCES `AssistTug`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
