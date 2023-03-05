import Server from "./core/Server";

const server = new Server(
    {
        host: "localhost",
        port: 25566,
        motdMsg: "nice cool proxy server",
        keepAlive: false
    }, 
    {
        host: "crystalpvp.cc",
        port: 25565,
        version: "1.12.2",
        flexible: true,
    }, 
    {
        port: 6969
    },
    {
        proxyToUser: (client, server, meta, data) => {
            switch(meta.name) {
                case "entity_velocity": {
                    if (data.entityId == client.INSTANCE.entity.id) {
                        data.velocityX = data.velocityY = data.velocityZ = 0
                    }
                }
                
                case "explosion": {
                    data.playerMotionX = data.playerMotionY = data.playerMotionZ = 0
                }
            }

            return data
        },
    }
)

server.INSTANCE?.on("listening", () => {
    console.log("[Proxy]: Listening on port 25566")
})