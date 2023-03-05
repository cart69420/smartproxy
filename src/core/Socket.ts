import express, { Request, Response } from "express"
import Server from "./Server"

export default function createSocket(server: Server, port: number = 6969) {
    const app = express()

    app.get('/requestserver', (req: Request, res: Response) => {
        if (server.connected) {
            console.log(req.headers.authorization)
            if (!req.headers.authorization)
                return res.sendStatus(403)
            if (!server.verify(req.headers.authorization))
                return res.sendStatus(403)
        }

        if (!Object.keys(req.query).includes("host"))
            return res.status(404).send("Missing params: [host, port]")

        console.log(req.ip + " requested a server change of " + req.query["host"] + ":" + req.query["port"] ?? 25565)
        // @ts-ignore
        server.changeServer(req.query["host"], parseInt(req.query["port"] ?? 25565))
        res.sendStatus(200)
    })

    app.get('/access', (req: Request, res: Response) => {
        if (server.connected) {
            if (!req.headers.authorization)
                return res.sendStatus(403)
            if (!server.verify(req.headers.authorization))
                return res.sendStatus(403)
        }

        if (!Object.keys(req.query).includes("token")) 
            return res.status(404).send("Missing param: [token]")

        console.log(req.ip + " requested to log in with an access token.")
        // @ts-ignore
        if (req.query.token?.length < 128)
            return res.sendStatus(403)
        // @ts-ignore
        server.updateAccessToken(req.query.token)
        res.sendStatus(200)
    })

    app.listen(port, () => {
        console.log("[Socket]: Listening on port " + port)
    })
}

export interface SocketOptions {
    port?: number,
}