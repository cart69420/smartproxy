import { Entity, EntityType } from "prismarine-entity";
import { PacketMeta, Client } from "minecraft-protocol";
import { fromNotchianYawByte, fromNotchianPitchByte, fromNotchVelocity } from './Conversions';
import { Vec3 } from 'vec3';
import { ChatMessage } from "prismarine-chat";

const NAMED_ENTITY_HEIGHT = 1.62
const NAMED_ENTITY_WIDTH = 0.6

declare module 'minecraft-protocol' {
    interface Client {
        players: { [username: string]: Player },
        entities: { [id: string]: Entity },
        uuidToUsername: { [uuid: string]: string },
        entity: Entity,
        player: Player,

        swingArm: (arm: "right" | "left", show: boolean) => void,
        attack: (target: Entity, swing: boolean) => void,
        useEntity: (target: Entity, click: 0 | 1, x?: number, y?: number, z?: number) => void
    }
}

declare module 'prismarine-entity' {
    interface Entity {
        objectData: any,
        vehicle: any,
        crouching: boolean,
    }
}

export interface Player {
    uuid: string,
    username: string,
    displayName: ChatMessage,
    gamemode: number,
    ping: number,
    entity: Entity | null | undefined
}

export const entityStatusEvents = {
    2: 'entityHurt',
    3: 'entityDead',
    6: 'entityTaming',
    7: 'entityTamed',   
    8: 'entityShakingOffWater',
    10: 'entityEatingGrass'
}

export function inject(INSTANCE: Client) {    
    const Entity = require("prismarine-entity")(INSTANCE.version)
    const Item = require("prismarine-item")(INSTANCE.version)
    const { mobs, entitiesArray } = INSTANCE.registry
    const IChatMessage = require("prismarine-chat")(INSTANCE.registry)
    
    INSTANCE.on("packet", (data: any, meta: PacketMeta) => {
        switch (meta.name) {
            case "login": {
                INSTANCE.players = {}
                INSTANCE.entities = {}
                INSTANCE.uuidToUsername = {}

                INSTANCE.entity = fetch(data.entityId)
                INSTANCE.entity.username = INSTANCE.username
                INSTANCE.entity.type = 'player'
                INSTANCE.entity.name = 'player'
            }
            
            case "spawn_entity": {
                const e = fetch(data.entityId)

                const entityData = INSTANCE.registry.entities[data.type]
                e.type = entityData ? entityData.type as EntityType : data.type || "object"
                setEntityData(e, data.type, entityData)

                e.uuid = data.objectUUID
                e.objectData = data.objectData
                e.position.set(data.x, data.y, data.z)
                e.yaw = fromNotchianYawByte(data.yaw)
                e.pitch = fromNotchianPitchByte(data.pitch)
            }

            case "spawn_entity_living": {
                const e = fetch(data.entityId)

                e.type = "mob"
                e.uuid = data.entityUUID

                const entityData = mobs[data.type]
                setEntityData(e, data.type, entityData)

                e.position.set(data.x, data.y, data.z)
                e.yaw = fromNotchianYawByte(data.yaw)   
                e.pitch = fromNotchianPitchByte(data.pitch)
                
                const vel = new Vec3(data.velocityX, data.velocityY, data.velocityZ)
                e.velocity.update(fromNotchVelocity(vel))
                // @ts-ignore
                e.metadata = parseMetadata(data.metadata, e.metadata)
            }

            case "named_entity_spawn": {
                if (data.playerUUID in INSTANCE.uuidToUsername) {
                    const e = fetch(data.entityId)
                    e.type = 'player'
                    e.name = 'player'
                    e.username = INSTANCE.uuidToUsername[data.playerUUID]
                    e.uuid = data.playerUUID
                    e.position.set(data.x, data.y, data.z)
                    e.yaw = fromNotchianYawByte(data.yaw)
                    e.pitch = fromNotchianPitchByte(data.pitch)
                    e.height = NAMED_ENTITY_HEIGHT
                    e.width = NAMED_ENTITY_WIDTH
                    // @ts-ignore
                    e.metadata = parseMetadata(data.metadata, data.metadata)
                    if (INSTANCE.players[e.username] !== undefined && !INSTANCE.players[e.username].entity) {
                        INSTANCE.players[e.username].entity = e
                    }
                }
            }

            case "entity_equipment": {
                const e = fetch(data.entityId)
                if (data.equipments !== undefined) {
                    data.equipments.forEach((equipment: any) => e.setEquipment(equipment.slot, equipment.item ? Item.fromNotch(equipment.item) : null))
                } else {
                    e.setEquipment(data.slot, data.item ? Item.fromNotch(data.item) : null)
                }
            }

            case "spawn_entity_experience_orb": {
                const e = fetch(data.entityId)
                e.type = 'orb'
                e.name = 'experience_orb'
                e.width = 0.5
                e.height = 0.5
                e.position.set(data.x, data.y, data.z)
                e.count = data.count
            }

            case "entity_velocity": {
                const e = fetch(data.entityId)
                const vel = new Vec3(data.velocityX, data.velocityY, data.velocityZ)
                e.velocity.update(fromNotchVelocity(vel))
            }

            case "entity_destroy": {
                if (data.entityId && !data.entityIds) {
                    const e = fetch(data.entityId)
                    e.isValid = false
                    if (e.username && INSTANCE.players[e.username]) {
                        INSTANCE.players[e.username].entity = null
                    }
                    delete INSTANCE.entities[data.entityId]
                    return
                }

                if (!data.entityIds || data.entityIds.length < 1) return
                data.entityIds.forEach((id: any) => {
                    const e = fetch(id)
                    e.isValid = false
                    if (e.username && INSTANCE.players[e.username]) {
                        INSTANCE.players[e.username].entity = null
                    }
                    delete INSTANCE.entities[id]
                })
            }

            case "rel_entity_move": {
                const e = fetch(data.entityId)
                e.position.translate(data.dX / 32, data.dY / 32, data.dZ / 32)
            }

            case "entity_look": {
                const e = fetch(data.entityId)
                e.yaw = fromNotchianYawByte(data.yaw)
                e.pitch = fromNotchianPitchByte(data.pitch)
            }

            case "entity_move_look": {
                const e = fetch(data.entityId)
                e.position.translate(data.dX / 32, data.dY / 32, data.dZ / 32)
                e.yaw = fromNotchianYawByte(data.yaw)
                e.pitch = fromNotchianPitchByte(data.pitch)
            }

            case "entity_teleport": {
                const e = fetch(data.entityId)
                e.position.set(data.x, data.y, data.z)
                e.yaw = fromNotchianYawByte(data.yaw)
                e.pitch = fromNotchianPitchByte(data.pitch)
            }

            case "attach_entity": {
                const e = fetch(data.entityId)
                if (data.vehicleId === -1) {
                    delete e.vehicle
                } else {
                    e.vehicle = fetch(data.vehicleId)
                }
            }

            case "spawn_entity_weather": {
                const e = fetch(data.entityId)
                e.type = "global"
                e.uuid = data.entityUUID
                e.position.set(data.x / 32, data.y / 32, data.z / 32)
            }

            case "player_info": {
                if (!data.data || data.data.length < 1) return
                for (const i of data.data) {
                    let p = INSTANCE.uuidToUsername[i.UUID] ? INSTANCE.players[INSTANCE.uuidToUsername[i.UUID]] : null
                    
                    if (data.action === 0) {
                        if (!p) {
                            p = INSTANCE.players[i.name] = {
                                username: i.name,
                                ping: i.ping,
                                uuid: i.UUID,
                                displayName: new IChatMessage(i.name),
                                gamemode: i.gamemode,
                                entity: null,
                            }

                            INSTANCE.uuidToUsername[i.UUID] = i.name
                        } else {
                            p.gamemode = i.gamemode
                            p.ping = i.ping
                        }

                        if (i.displayName) {
                            p.displayName = new IChatMessage(JSON.parse(i.displayName))
                        }

                        const pe = Object.values(INSTANCE.entities).find(e => e.type === 'player' && e.username === i.name)
                        p.entity = pe

                        if (pe === INSTANCE.entity) {
                            INSTANCE.player = p
                        }
                    } else if (p) {
                        if (data.action === 1) {
                            p.gamemode = i.gamemode
                        } else if (data.action === 2) {
                            p.ping = i.ping
                        } else if (data.action === 3 && !i.displayName) {
                            p.displayName = new IChatMessage(p.username)
                        } else if (data.action === 3 && i.displayName) {
                            p.displayName = new IChatMessage(JSON.parse(i.displayName))
                        } else if (data.action === 4) { 
                            if (p.entity === INSTANCE.entity) continue

                            p.entity = null
                            delete INSTANCE.players[p.username!!]
                            delete INSTANCE.uuidToUsername[i.UUID]

                            continue
                        } else {
                            continue
                        }
                    }
                }
            }
        }
    })



    INSTANCE.swingArm = (arm: "right" | "left" = "right", show: boolean = true) => {
        const hand = arm === "right" ? 0 : 1
        INSTANCE.write("arm_animation", show ? { hand: hand } : {})
    }

    INSTANCE.useEntity = (target: Entity, click: 0 | 1, x?: number, y?: number, z?: number) => {
        if (x && y && z) {
            INSTANCE.write("use_entity", {
                target: target.id,
                mouse: click,
                x, y, z
            })
        } else {
            INSTANCE.write("use_entity", {
                target: target.id,
                mouse: click
            })
        }
    }

    INSTANCE.attack = (target: Entity, swing: boolean = true) => {
        if (swing) INSTANCE.swingArm("right", true)
        INSTANCE.useEntity(target, 1)
    }



    function fetch(id: number) {
        return INSTANCE.entities[id] || (INSTANCE.entities[id] = new Entity(id))
    }

    // @ts-ignore
    function parseMetadata (metadata, entityMetadata = {}) {
        if (metadata !== undefined) {
            try {
                for (const { key, value } of metadata) {
                    // @ts-ignore
                    entityMetadata[key] = value
                }
            } catch (err: any) {
                return entityMetadata
            }
        }
      
        return entityMetadata
    }

    function setEntityData (entity: any, type: any, entityData: any) {
        if (entityData === undefined) {
          entityData = entitiesArray.find((entity: any) => entity.internalId === type)
        }
        if (entityData) {
            entity.mobType = entityData.displayName
            entity.objectType = entityData.displayName
            entity.displayName = entityData.displayName
            entity.entityType = entityData.id
            entity.name = entityData.name
            entity.kind = entityData.category
            entity.height = entityData.height
            entity.width = entityData.width
        } else {
            // unknown entity
            entity.type = 'other'
            entity.entityType = type
            entity.mobType = 'unknown'
            entity.displayName = 'unknown'
            entity.name = 'unknown'
            entity.kind = 'unknown'
        }
    }
}