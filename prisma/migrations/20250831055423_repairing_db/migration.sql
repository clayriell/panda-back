/*
  Warnings:

  - The values [SUBMITED] on the enum `TugService_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUBMITED] on the enum `TugService_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `agency` MODIFY `address` VARCHAR(191) NULL,
    MODIFY `picName` VARCHAR(191) NULL,
    MODIFY `picNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `pilotageservice` MODIFY `startDate` DATE NOT NULL DEFAULT CURRENT_DATE,
    MODIFY `startTime` TIME NOT NULL DEFAULT CURRENT_TIME,
    MODIFY `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITTED', 'REJECTED', 'PAID', 'CANCELED') NOT NULL DEFAULT 'REQUESTED',
    MODIFY `rate` INTEGER NULL;

-- AlterTable
ALTER TABLE `terminal` MODIFY `area` ENUM('TANJUNG_UNCANG', 'BATU_AMPAR', 'KABIL', 'REMPANG_GALANG', 'LAUT') NOT NULL DEFAULT 'TANJUNG_UNCANG';

-- AlterTable
ALTER TABLE `tugservice` MODIFY `status` ENUM('REQUESTED', 'APPROVED', 'IN_PROCESS', 'COMPLETED', 'SUBMITTED', 'REJECTED', 'PAID', 'CANCELED') NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE `tugservicedetail` ADD COLUMN `activity` ENUM('ASSIST_BERTHING', 'ASSIST_UNBERTHING', 'SEA_TRIAL', 'ASSIST_SHIFTING') NOT NULL DEFAULT 'ASSIST_BERTHING',
    ADD COLUMN `demobTime` DATETIME(3) NULL,
    ADD COLUMN `mobTime` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('SYS_ADMIN', 'ADMIN', 'PILOT', 'TUG_MASTER') NOT NULL DEFAULT 'ADMIN';
