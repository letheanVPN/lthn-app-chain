import {Body, Controller, Logger, Post} from "danet/mod.ts";
import {Tag} from "danetSwagger/decorators.ts";
import * as path from "std/path/mod.ts";
import {FileSystemService} from "../../../Code/server/src/modules/io/filesystem/fileSystemService.ts";
import {ProcessManager} from "../../../Code/server/src/modules/io/process/process.service.ts";
import {ProcessManagerRequest} from "../../../Code/server/src/modules/io/process/process.interface.ts";
import {BlockchainLetheanWalletStartDTO} from "./lethean.interface.ts";
import {ReturnedType} from "https://deno.land/x/danet_swagger@1.6.1/decorators.ts";

@Tag("blockchain")
@Controller("blockchain/lethean")
export class LetheanWalletController {
    log: any;
    constructor(private process: ProcessManager,
                private fileSystem: FileSystemService) {
                    this.log = new Logger('LetheanWalletController');
    }

    @Post("wallet/start")
    startWallet(@Body() body: BlockchainLetheanWalletStartDTO) {
        let exeFile = "lethean-wallet-rpc" +
            (Deno.build.os === "windows" ? ".exe" : "");

        body["walletDir"] = this.fileSystem.path(body["walletDir"]);
        body['rpcBindPort'] = body['rpcBindPort'];
        body['trustedDaemon'] = true
        exeFile = this.fileSystem.path(["apps", 'blockchain', 'lthn', exeFile]);

        if (!this.fileSystem.isFile(exeFile)) {
            this.log.error("Wallet executable not found");
        }
        return this.process.run(
            exeFile,
            body,
            {
                key: exeFile.split("/").pop(),
                stdErr: (stdErr: unknown) => console.log(stdErr),
                stdIn: (stdIn: unknown) => console.log(stdIn),
                stdOut: (stdOut: unknown) => console.log(stdOut)
            } as ProcessManagerRequest
        );
    }

    @Post("wallet/json_rpc")
    @ReturnedType(String)
    async walletJsonRpc(@Body() body: any): Promise<string> {
        let url = "json_rpc";
        if (body["url"]) {
            url = body["url"];
        }
        delete body["url"];
        const postReq = await fetch(
            `http://127.0.0.1:36963/${url}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: body['req']
            }
        );

        return await postReq.text();
    }

}
