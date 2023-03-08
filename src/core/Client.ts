import { createClient, Client as ProtocolClient, Server as ProtocolServer, PacketMeta, states, ServerClient } from "minecraft-protocol";
import Server from './Server';
import inject from './libs/Loader';

export default class Client {
    public INSTANCE: ProtocolClient;
    public packets: {data: any, meta: PacketMeta}[] = [];

    constructor(options: ClientOptions, server: Server, middleware: MiddlewareOptions) {
        const pClient = createClient({
            username: options.username,
            password: options.password || "",
            accessToken: options.accessToken,
            clientToken: options.accessToken,
            host: options.host,
            port: options.port,
            version: options.version,
            keepAlive: true
        })

        pClient.on("packet", (data: any, meta: PacketMeta, buffer: Buffer) => {
            if (meta.name == "keep_alive") return
            if (!["success", "disconnect", "encryption_begin", "compress", "custom_payload", "playerlist_header", "player_info"])
                this.packets.push({data, meta})
            if (!server.connected || meta.state != states.PLAY || server.connected.state != states.PLAY) return
            if (meta.name == "set_compression") server.connected.compressionThreshold = data.threshold
            
            data = middleware.proxyToUser?.(this, server, meta, data) ?? data

            server.connected?.write(meta.name, data)
        })

        pClient.on("end", (reason: string) => {
            this.packets = []
            if (server.connected) 
                return server.connected.end(`Proxy Client kicked from Server:\n${reason}`)
            
            server.unlink()
        })

        pClient.on("error", (error: Error) => {
            if (server.connected) 
                return server.connected.end(error.message)
        })


        inject(pClient)
        this.INSTANCE = pClient
    }
}

export interface ClientOptions {
    accessToken?: string,
    username: string,
    password?: string,
    host: string,
    port: number,
    version: string
}

export interface MiddlewareOptions {
    proxyToUser?: (client: Client, server: Server, meta: PacketMeta, data: any) => any,
    userToProxy?: (pClient: Client, uClient: ServerClient, server: ProtocolServer, meta: PacketMeta, data: any) => any
}