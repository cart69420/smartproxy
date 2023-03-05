import { Client } from 'minecraft-protocol';
import { Registry } from 'prismarine-registry';
import { inject as entityInject } from './Entities'
import { inject as healthInject } from './Health'

declare module 'minecraft-protocol' {
    interface Client {
        registry: Registry
    }
}

export default function inject(INSTANCE: Client) {
    INSTANCE.registry = require("prismarine-registry")(INSTANCE.version)

    entityInject(INSTANCE)
    healthInject(INSTANCE)
}