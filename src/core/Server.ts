import { createServer, Server as ProtocolServer, ServerOptions, ServerClient, PacketMeta, states } from "minecraft-protocol";
import Client, { MiddlewareOptions } from "./Client";
import createSocket, { SocketOptions } from './Socket';
import NodeRSA from 'node-rsa';

export default class Server {
    public INSTANCE: ProtocolServer | null = null
    public pClient: Client | null = null
    public connected: ServerClient | null = null
    private accessToken: string | null = null
    private securityToken: string | null = null
    private privateKey: NodeRSA | null

    constructor(public options: ServerOptions, public connectOptions: ConnectOptions, socketOptions: SocketOptions, public middleware: MiddlewareOptions) {
        this.privateKey = new NodeRSA({ b: 512 })
        
        options.maxPlayers = 1
        options["online-mode"] = false
        options.version = connectOptions.version

        connectOptions.flexible ??= true
        
        this.INSTANCE = createServer(options)

        this.INSTANCE.on("login", (client: ServerClient) => {
            if (this.connected) return
            this.securityToken = this.privateKey!!.encrypt(`${client.username}|${client.socket.remoteAddress}/${client.socket.remotePort}`, 'base64')
            this.connected = client
            this.INSTANCE!!.motdMsg = `Occupied by ${client.username} going to ${connectOptions.host}:${connectOptions.port}`
            const pClient = new Client({
                accessToken: this.accessToken ?? "",
                username: client.username,
                host: connectOptions.host,
                port: connectOptions.port,
                version: connectOptions.version
            }, this, middleware)

            this.link(pClient)
            this.register(client)

            client.registerChannel("PROXY|security_token", ['string', []], true)
            client.writeChannel("PROXY|security_token", this.securityToken)
        })

        createSocket(this, socketOptions.port)
    }

    register(client: ServerClient) {
        this.pClient?.packets.forEach(p => {
            client.write(p.meta.name, p.data)
        })

        client.on("packet", (data: any, meta: PacketMeta, buffer: Buffer) => {
            if (meta.name === "keep_alive") return
            if (!this.pClient || meta.state !== states.PLAY || this.pClient.INSTANCE?.state !== states.PLAY) return
            
            data = this.middleware.userToProxy?.(this.pClient, client, this.INSTANCE!!, meta, data) ?? data

            this.pClient.INSTANCE?.write(meta.name, data)
        })

        client.on("end", (reason: string) => {
            this.INSTANCE!!.motdMsg = "Available!"
            this.connected = null
            this.pClient?.INSTANCE?.end(reason)
            this.accessToken = null
            this.securityToken = null
        })
    }

    link(pClient: Client) {
        this.pClient = pClient
    }

    unlink() {
        this.pClient = null
    }

    changeServer(host: string, port: number = 25565) {
        if (!this.connectOptions.flexible) return

        let s: string[] = []
        if (host.includes(":")) {
            s = host.split(":")
        } else if (host.includes("/")) {
            s = host.split("/")
        } else if (host.includes("\\")) {
            s = host.split("\\")
        }
        if (s.length > 0) {
            host = s[0]
            port = parseInt(s[1])
        }

        this.connectOptions.host = host ?? this.connectOptions.host
        this.connectOptions.port = port ?? this.connectOptions.port
    }

    updateAccessToken(token: string) {
        this.accessToken = (token || token.length > 0) ? token : null
    }

    verify(anotherToken: string) {
        if (!this.securityToken) return true
        return anotherToken === this.securityToken
    }
}

export interface ConnectOptions {
    host: string,
    port: number,
    version: string,
    flexible?: boolean,
}