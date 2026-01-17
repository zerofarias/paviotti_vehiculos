-- CreateTable
CREATE TABLE `maintenanceconfig` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `serviceKmInterval` INTEGER NULL DEFAULT 10000,
    `serviceMonthInterval` INTEGER NULL DEFAULT 6,
    `tireChangeKmInterval` INTEGER NULL DEFAULT 40000,
    `alertOnService` BOOLEAN NULL DEFAULT true,
    `checkIntervalDays` INTEGER NULL DEFAULT 7,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'EMPLOYEE') NULL DEFAULT 'EMPLOYEE',
    `active` BOOLEAN NULL DEFAULT true,
    `licenseExpiration` DATETIME(0) NULL,
    `licensePhoto` LONGTEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `photo` LONGTEXT NULL,

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle` (
    `id` VARCHAR(191) NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `currentMileage` INTEGER NULL DEFAULT 0,
    `lastServiceMileage` INTEGER NULL DEFAULT 0,
    `lastServiceDate` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` ENUM('ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE') NULL DEFAULT 'ACTIVE',
    `damagePoints` LONGTEXT NULL,
    `fuelLogs` LONGTEXT NULL,
    `inventory` LONGTEXT NULL,
    `mainPhotoIndex` INTEGER NOT NULL DEFAULT 0,
    `chassisNumber` VARCHAR(191) NULL,
    `motorNumber` VARCHAR(191) NULL,
    `photos` LONGTEXT NULL,
    `lastCheckDate` DATETIME(0) NULL,
    `greenCardPhoto` LONGTEXT NULL,
    `insuranceExpiry` DATETIME(0) NULL,
    `insurancePolicy` LONGTEXT NULL,
    `vtvExpiry` DATETIME(0) NULL,
    `vtvPhoto` LONGTEXT NULL,
    `lastCheckUser` VARCHAR(191) NULL,

    UNIQUE INDEX `plate`(`plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `damage_history` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(255) NOT NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NULL,
    `reportedDate` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `repairedDate` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `repairedBy` VARCHAR(191) NULL,
    `repairCost` DOUBLE NULL,
    `repairNotes` TEXT NULL,

    INDEX `vehicleId`(`vehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklog` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `mileage` INTEGER NOT NULL,
    `tirePressurePsi` INTEGER NULL,
    `oilLevel` ENUM('NORMAL', 'LOW') NULL DEFAULT 'NORMAL',
    `brakeFluidLevel` ENUM('NORMAL', 'LOW') NULL DEFAULT 'NORMAL',
    `wiperFluidLevel` ENUM('NORMAL', 'LOW') NULL DEFAULT 'NORMAL',
    `coolantLevel` ENUM('NORMAL', 'LOW') NULL DEFAULT 'NORMAL',
    `notes` TEXT NULL,
    `fireExtinguisherExpiry` VARCHAR(191) NULL,
    `fireExtinguisherOk` BOOLEAN NULL DEFAULT true,
    `fuelCost` DOUBLE NULL,
    `fuelLiters` DOUBLE NULL,
    `hornOk` BOOLEAN NULL DEFAULT true,
    `itemsChecked` LONGTEXT NULL,
    `lightsOk` BOOLEAN NULL DEFAULT true,
    `serviceCost` DOUBLE NULL,
    `spareTireOk` BOOLEAN NULL DEFAULT true,
    `type` VARCHAR(191) NULL DEFAULT 'WEEKLY_SAFETY',
    `userName` VARCHAR(191) NULL,
    `workshopName` VARCHAR(191) NULL,
    `cleanlinessOk` BOOLEAN NULL DEFAULT true,
    `uniformOk` BOOLEAN NULL DEFAULT true,

    INDEX `userId`(`userId`),
    INDEX `vehicleId`(`vehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_note` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(255) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `type` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `cost` DOUBLE NULL DEFAULT 0,
    `attachment` LONGTEXT NULL,
    `createdBy` VARCHAR(191) NULL,

    INDEX `vehicleId_note_idx`(`vehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tire` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(255) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,
    `installDate` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `installMileage` INTEGER NOT NULL,
    `estimatedLife` INTEGER NOT NULL DEFAULT 50000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'GOOD',
    `currentTread` DOUBLE NULL,

    INDEX `vehicleId_tire_idx`(`vehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_log` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `sentAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `sentTo` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `response` TEXT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,

    INDEX `status_idx`(`status`),
    INDEX `sentAt_idx`(`sentAt`),
    INDEX `entity_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `checklog` ADD CONSTRAINT `checklog_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `checklog` ADD CONSTRAINT `checklog_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tire` ADD CONSTRAINT `tire_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
