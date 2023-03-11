import { Client } from 'minecraft-protocol';
import { inject as entityInject } from './Entities'
import { inject as healthInject } from './Health'

declare module 'minecraft-protocol' {
    interface Client {
        registry: any
    }
}

export default function inject(INSTANCE: Client) {
    INSTANCE.registry = require("prismarine-registry")(INSTANCE.version)

    entityInject(INSTANCE)
    healthInject(INSTANCE)
}