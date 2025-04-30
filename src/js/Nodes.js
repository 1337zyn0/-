import {NodeType} from "./NodeType.js"

/**
 * @class
 * Holds information about the D3 nodes
 */
export class Node {
    constructor(id, name, tangibleId, x, y, type) {
        this.id = id
        this.name = name
        this.tangibleId = tangibleId
        this.x = x
        this.y = y
        this.device = {}
        this.latestTuioObject = {}
        this.logic
    }

    update() {

    }
}