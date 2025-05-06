import {NodeType} from "./NodeType.js"

/**
 * @class
 * Holds information about the D3 nodes
 */
export class Node {
    constructor(id, insId,  name, tangibleId, x, y, isActive) {
        this.id = id
        this.instanceId = insId
        this.name = name
        this.tangibleId = tangibleId
        this.x = x
        this.y = y
        this.isActive = isActive
        this.device = {}
        this.latestTuioObject = {}
        this.logic
    }

    update() {

    }
}