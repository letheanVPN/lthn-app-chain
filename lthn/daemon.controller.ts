import * as path from "std/path/mod.ts";
import {Body, Controller, Logger, Post} from "danet/mod.ts";
import {Tag, ReturnedType} from "danetSwagger/decorators.ts";
import {FileSystemService} from "../../../Code/server/src/modules/io/filesystem/fileSystemService.ts";
import {IniService} from "../../../Code/server/src/modules/config/ini/ini.service.ts";
import {ProcessManager} from "../../../Code/server/src/modules/io/process/process.service.ts";
import {ProcessManagerRequest} from "../../../Code/server/src/modules/io/process/process.interface.ts";
import {BlockchainLetheanDaemonStartDTO, BlockchainLetheanRPCDTO} from "./lethean.interface.ts";
import {LetheanDownloadService} from "../../../Code/server/src/modules/io/tcp/download.service.ts";

import { ServerResponse } from "../../../Code/server/src/interfaces/http.ts";

@Tag("blockchain")
@Controller("blockchain/lethean")
export class LetheanDaemonController {
    log: any;

    constructor(private process: ProcessManager,
                private fileSystem: FileSystemService,
                private ini: IniService,
                private download: LetheanDownloadService) {

                    this.log = new Logger('LetheanDaemonController');
    }

    @Post("daemon/start")
    @ReturnedType(ServerResponse)
    startDaemon(@Body() body: BlockchainLetheanDaemonStartDTO): ServerResponse {
       
        let cmd: any = {};

        const configFile = this.fileSystem.path(path.join("conf", "lthn", body.configFile));

        if (!this.fileSystem.isFile(path.join("conf", "lthn", body.configFile))) {
            this.log.log(`Config file ${configFile} not found`);
            if (!this.fileSystem.isDir(path.join("conf", "lthn"))) {
                this.fileSystem.ensureDir(path.join("conf", "lthn"));
            }
            this.fileSystem.write(
                configFile,
                this.ini.stringify({
                    "log-file": body.logDir
                })
            );
        }
        cmd["configFile"] = configFile;
        if (!this.fileSystem.isDir(body.dataDir)) {
            this.fileSystem.ensureDir(body.dataDir);
        }

        if (!this.fileSystem.isDir(body.logDir)) {
            this.fileSystem.ensureDir(body.logDir);
        }

        const exeFile = path.join("apps", 'blockchain', 'lthn',`letheand${Deno.build.os === "windows" ? ".exe" : ""}`);

        if (!this.fileSystem.isFile(exeFile)) {
            this.log.error(`Lethean Daemon executable not found: ${exeFile}`);
            return new ServerResponse(404, "Lethean Daemon executable not found, please install the daemon");
        }

        this.process.run(
            this.fileSystem.path(exeFile),
            cmd,
            {
                key: exeFile.split("/").pop(),
                stdErr: (stdErr: unknown) => console.log(stdErr),
                stdIn: (stdIn: unknown) => console.log(stdIn),
                stdOut: (stdOut: unknown) => console.log(stdOut)
            } as ProcessManagerRequest
        );
        return new ServerResponse(200, "Daemon started");

    }

    @Post("daemon/json_rpc")
    @ReturnedType(String)
    async jsonRpc(@Body() body: BlockchainLetheanRPCDTO): Promise<string> {
        let url = "json_rpc";
        if (body["url"]) {
            url = body["url"];
        }

        const postReq = await fetch(
            `http://127.0.0.1:48782/${url}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: body["req"]
            }
        );
        return await postReq.text();

    }

    @Post("daemon/export")
    exportBlockchain(@Body() body: any) {
        const exeFile = `lethean-blockchain-export${
            Deno.build.os === "windows" ? ".exe" : ""
        }`;
        this.process.run(
            this.fileSystem.path(["apps", 'blockchain', 'lthn', exeFile]),
            body,
            {
                key: exeFile.split("/").pop(),
                stdErr: (stdErr: unknown) => console.log(stdErr),
                stdIn: (stdIn: unknown) => console.log(stdIn),
                stdOut: (stdOut: unknown) => console.log(stdOut)
            } as ProcessManagerRequest
        );
    }

    @Post("daemon/import")
    importBlockchain(@Body() body: any) {
        const exeFile = `lethean-blockchain-import${
            Deno.build.os === "windows" ? ".exe" : ""
        }`;
        this.process.run(
            this.fileSystem.path(["apps", 'blockchain', 'lthn', exeFile]),
            body,
            {
                key: exeFile.split("/").pop(),
                stdErr: (stdErr: unknown) => console.log(stdErr),
                stdIn: (stdIn: unknown) => console.log(stdIn),
                stdOut: (stdOut: unknown) => console.log(stdOut)
            } as ProcessManagerRequest
        );
    }

    @Post("daemon/downloadDaemon")
    downloadDaemon(@Body() body: any) {
        const urls = {
            'linux': 'https://github.com/letheanVPN/blockchain-iz/releases/latest/download/lethean-cli-linux.tar',
            'windows': 'https://github.com/letheanVPN/blockchain-iz/releases/latest/download/lethean-cli-windows.tar',
            'mac': 'https://github.com/letheanVPN/blockchain-iz/releases/latest/download/lethean-cli-macos.tar'
        }
        if(urls[Deno.build.os]){
            this.download.downloadContents(urls[Deno.build.os], 'cli/lthn').catch((err) => {
                console.log(err);
            });
            return {status: 'Download Requested'};
        }else{
            return {status: 'OS not supported'};
        }

    }

}

