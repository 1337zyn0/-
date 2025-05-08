import { Tuio11Listener } from "../libs/tuio11/Tuio11Listener.js";
import { Node } from './Nodes.js'

/**
 * @class
 * Evaluates TUIO Events for the Microgrid Demonstrator
 */
export class TuioListener extends Tuio11Listener {
    constructor(defaultCb) {
        super();
        this._isDebugOn = true;
        this._tuioEntityMap = new Map();
        this._callback_on_update = defaultCb;
        this._existingObjects = new Map();
        this._nodeToTuioObjectMap = new Map();
    }

    /**
     * Helps to print internal debug messages
     * @param {*} string 
     * @returns 
     */
    #debug(string) {
        if (!this._isDebugOn) return false
        console.log(`| ${this.constructor.name} | ${string}`)
    }

    /**
     * Connects a tangible ID to the passed object
     * @param {number} tangibleId 
     * @param {object} object 
     */
    connectTangibleToObject(tangibleId, object) {
        if (this._tuioEntityMap.has(tangibleId)) {
            this.#debug(`⚠ Attention | Tangible ${tangibleId} is already connected.`)
        }
        this._tuioEntityMap.set(tangibleId, object)
        this.#debug(`Connected Tangible ${tangibleId} with Node ${object.id} (${this._tuioEntityMap.size} connections in total )`)
    }

    /**
     * Removes a given connection between a tangible ID and an object
     * @param {number} tangibleId 
     */
    disconnectTangibleFromObject(tangibleId) {
        this._tuioEntityMap.delete(tangibleId)
    }

    /**
     * Get the object connected to the passed tangible ID
     * @param {number} tangibleId 
     * @returns connected object
     */
    getObjectByTangibleId(tangibleId) {
        return this._tuioEntityMap.get(tangibleId)
    }

    /**
     * Get the object connected to the passed instance ID
     * @param {number} instanceId 
     * @returns object
     */
    getObjectByInstanceId(instanceId) {
        return this._existingObjects.get(instanceId)
    }

    /**
     * Executed on adding Tangibles
     * @param tuioObject 
     */
    addTuioObject(tuioObject) {
        let objectNumber = 0
        this.#debug(`TuioObject added (ID: ${tuioObject.symbolId}) at position (x: ${tuioObject.xPos}, y: ${tuioObject.yPos})`)

        if (!this._tuioEntityMap.has(tuioObject.symbolId)) {
            this.#debug(`Tangible ID ${tuioObject.symbolId} has not been connected to an object.`)
            return false
        }
        //counts how many objects are already existing with the same tangible ID
        if (Array.from(this._existingObjects.values()).some(object => object.tangible_id === tuioObject.symbolId)) {
            this._existingObjects.forEach((value, key) => {
                if (value.tangible_id === tuioObject.symbolId) {
                    if (objectNumber < 80)
                        objectNumber++
                } else {
                    return
                }
            })
        }
        //creates a new node depending on if the object already exists or not
        let node
        if (!Array.from(this._existingObjects.values()).some(node => node.tangible_id === tuioObject.symbolId)) {
            node = this.getObjectByTangibleId(tuioObject.symbolId)
        } else {
            let helpNode = this.getObjectByTangibleId(tuioObject.symbolId)
            node = Object.create(Object.getPrototypeOf(helpNode))
            Object.assign(node, helpNode)
        }
        tuioObject.instanceId = node.instanceId
        node.isActive = true
        node.tuioObject = tuioObject
        node.page = 1
        node.instanceId = parseInt(tuioObject.symbolId.toString() + objectNumber.toString())
        this._existingObjects.set(parseInt(tuioObject.symbolId.toString() + objectNumber.toString()), node)
        this._callback_on_update()
    }

    /**
     * Executed on moving Tangibles
     * @param tuioObject 
     */
    updateTuioObject(tuioObject) {
        // this.#debug(`TuioObject update (ID: ${tuioObject.symbolId}) at position (x: ${tuioObject.xPos}, y: ${tuioObject.yPos})`)

        //let node = this.getObjectByTangibleId(tuioObject.symbolId)
        let node = this.getObjectByInstanceId(tuioObject.instanceId)
        node.isActive = true
        node.tuioObject = tuioObject

        this._callback_on_update()
    }

    /**
     * Executed on removing Tangibles 
     * @param tuioObject 
     * @returns 
     */
    removeTuioObject(tuioObject) {
        this.#debug(`TuioObject removed (ID: ${tuioObject.instanceId}) at position (x: ${tuioObject.x}, y: ${tuioObject.y})`)
        /* if (!this._tuioEntityMap.has(tuioObject.symbolId)) {
            this.#debug(`Tangible ID ${tuioObject.symbolId} has not been connected to an object.`)
            return false
        } */
        if (this._existingObjects.get(tuioObject.instanceId)) {
            this._existingObjects.delete(tuioObject.instanceId)
        }
        this._callback_on_update()
    }

    /**
     * Events caused by fingers
     * @param tuioCursor 
     */
    addTuioCursor(tuioCursor) {
        // not implemented
    }

    updateTuioCursor(tuioCursor) {
        // not implemented
    }

    removeTuioCursor(tuioCursor) {
        // not implemented
    }

    addTuioBlob(tuioBlob) {
        // not implemented
    }

    updateTuioBlob(tuioBlob) {
        // not implemented
    }

    removeTuioBlob(tuioBlob) {
        // not implemented
    }

    refresh(frameTime) {
        // not implemented
    }


}