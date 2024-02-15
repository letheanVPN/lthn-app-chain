import { Module } from "danet/mod.ts";
import { LetheanDaemonController } from "./lthn/daemon.controller.ts";
import { LetheanWalletController } from "./lthn/wallet.controller.ts";
import { FileSystemService } from "../../Code/server/src/modules/io/filesystem/fileSystemService.ts";
import { ProcessManager } from "../../Code/server/src/modules/io/process/process.service.ts";

@Module({
  controllers: [
    LetheanDaemonController,
    LetheanWalletController
  ],
  injectables: [
    FileSystemService,
    ProcessManager
  ],
})
export class ChainsModule {}
