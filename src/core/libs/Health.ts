import { Client, PacketMeta } from "minecraft-protocol";

declare module 'minecraft-protocol' {
    interface Client {
        isAlive: boolean,
        health: number,
        food: number,
        foodSaturation: number
    }
}

export function inject(INSTANCE: Client) {
    INSTANCE.isAlive = true

    INSTANCE.on("packet", (data: any, meta: PacketMeta) => {
        if (meta.name == "respawn") {
            INSTANCE.isAlive = false
        } else if (meta.name == "update_health") {
            INSTANCE.health = data.health
            INSTANCE.food = data.food
            INSTANCE.foodSaturation = data.foodSaturation

            if (INSTANCE.health <= 0) {
                if (INSTANCE.isAlive) {
                    INSTANCE.isAlive = false
                }
                INSTANCE.write('client_command', { payload: 0 })
            } else if (INSTANCE.health > 0 && !INSTANCE.isAlive) {
                INSTANCE.isAlive = true
            }
        }
    })
}