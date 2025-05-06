import { NodeType } from "./NodeType.js"
import { Node } from "./Nodes.js"

export class NodeManager {
    constructor() {
        this._isDebugOn = false
        this.nodes = new Map()
        this.instances = new Map()
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

    addNode(node) {
        //console.log(node.instanceId + " InstanceID from node")
        this.nodes.set(node.id, node)
        //this.instances.set(node.id, node)
        this.#debug(`Add node ${node.id} to NodeManager (${this.nodes.size} nodes in total)`)
    }

    updateNode(instanceId, x, y){
        if (this.instances.has(instanceId)) {
            let node = this.instances.get(instanceId)
            node.x = x
            node.y = y
            this.#debug(`Update node ${node.id} (${instanceId})`)
        } else {
            this.#debug(`⚠ Attention | Cannot update node ${instanceId}`)
        }
    }

    addnewNode(nodeId) {
        let objectNumber = 0
        let helpNode = this.nodes.get(nodeId)
        this.instances.forEach((value, key) => {
            if (value.id === nodeId) {
                if (objectNumber < 80) {
                    objectNumber++
                    //console.log("Counter: " + objectNumber)
                } else {
                    return
                }
            }
        })
        let newNode = Object.create(Object.getPrototypeOf(helpNode));
        Object.assign(newNode, helpNode)
        newNode.instanceId = parseInt(helpNode.tangible_id.toString() + objectNumber.toString())
        newNode.isActive = true
        this.instances.set(parseInt(helpNode.tangible_id.toString() + objectNumber.toString()), newNode)
        this.#debug(`Add node ${newNode.id} to NodeManager (${this.nodes.size} nodes in total)`)

    }

    removeNode(node) {
        if (this.instances.has(node.instanceId)) {
            node.isActive = false
            this.instances.delete(node.instanceId)
            if(node.logic.isTypeOf(NodeType.trafo)){
                this.nodes.get(node.id).isActive = false
            }
            console.log(this.instances.values())
            this.#debug(`Remove node ${node.instanceId} from NodeManager (${this.instances.size} nodes in total)`)
        } else {
            this.#debug(`⚠ Attention | Cannot remove node ${node.instanceId} from NodeManager`)
        }
    }

    getActiveNodes() {
        //return Array.from(this.nodes.values()).filter((node) => node.isActive)
        return Array.from(this.instances.values()).filter((node) => node.isActive)
    }

    getNodes() {
        return Array.from(this.nodes.values())
    }

    isNodeActive(nodeId) {
        if (this.nodes.has(nodeId)) {
            this.#debug(`Node ${nodeId} is ${this.nodes.get(nodeId).isActive}`)
            return this.nodes.get(nodeId).isActive
        } else {
            this.#debug(`Cannot find node ${nodeId}`)
            return false
        }
    }


    getTangibleIdByNodeId(nodeId) {
        if (this.nodes.has(nodeId)) {
            return this.nodes.get(nodeId).tangible_id
        } else {
            return false
        }
    }

    getTrafoSlaves() {
        return this.getActiveNodes()
            .filter((node) => node.logic.isTypeOf(NodeType.trafo))
            .filter((node) => !node.logic.isTypeOf(NodeType.smart))

    }

    getTrafoMasters() {
        return this.getActiveNodes()
            .filter((node) => node.logic.isTypeOf(NodeType.smart))
            .filter((node) => node.logic.isTypeOf(NodeType.trafo))
    }

    getEmsNodes() {
        return this.getActiveNodes()
            .filter((node) => node.logic.isTypeOf(NodeType.ems))
    }

    getSmartNodes() {
        return this.getActiveNodes()
            .filter((node) => node.logic.isTypeOf(NodeType.smart))
    }

    getPureActiveEnergyDevices() {
        return this.getActiveNodes()
            .filter((node) => node.logic.isTypeOf(NodeType.energyDevice))
            .filter((node) => !node.logic.isTypeOf(NodeType.trafo))
    }

    defineClusters(nodes) {
        let masterCluster = []
        let slaveCluster = []
        let maxSlaveConnections = 2
        let minSlaveConnections = 1
        // let amountNodes = this.getActiveNodes.length

        // console.log(this.getTrafoSlaves())
        // console.log(this.getPureEnergyDevices())

        let slaveDistances = new Map()
        this.getTrafoSlaves().map((slave) => {
            // this.getPureActiveEnergyDevices().map((device) => {
            nodes.map((device) => {
                slaveDistances.set(device.id, this.euclideanDistance([slave.x, slave.y], [device.x, device.y]))
            })
        })
        slaveDistances = Array.from(slaveDistances).sort((a, b) => a[1] - b[1])
        // console.log("distanz")
        // console.log(Array.from(slaveDistances).sort((a, b) => a[1] - b[1]))
        // console.log(slaveDistances)

        let requiredConnections = 0

        if (nodes.length > maxSlaveConnections) {
            requiredConnections = maxSlaveConnections
        } else if (nodes.length > minSlaveConnections) {
            requiredConnections = minSlaveConnections
        }

        for (let i = 0; i < requiredConnections; i++) {
            slaveCluster.push(slaveDistances[i][0])
        }

        for (let i = requiredConnections; i < nodes.length; i++) {
            masterCluster.push(slaveDistances[i][0])
        }

        return [masterCluster, slaveCluster]

    }

    euclideanDistance(a, b) {
        return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
    }

    createElectricityLinks() {
        this.#debug("createElectricityLinks")

        let activeEnergyDevices = this.getActiveNodes()
            .filter((node) => node.logic.isTypeOf(NodeType.energyDevice))

        let isTrafoClassicActive = this.getTrafoSlaves().length > 0
        let isTrafoD3Active = this.getTrafoMasters().length > 0

        var links = []
        let energyDevices = this.getPureActiveEnergyDevices()
        // console.log(energyDevices)



        if (isTrafoClassicActive && !isTrafoD3Active) {
            this.#debug("Scenario state: Classic Trafo")
            let trafo = activeEnergyDevices.filter((node) => node.id == "trafo_classic")[0]
            // console.log(trafo)

            energyDevices.map((node) => {
                links.push({
                    "id": `${trafo.id}-${node.id}`,
                    "source": trafo.id,
                    "sourceRef": trafo,
                    "target": node.id,
                    "targetRef": node
                })
            })

        } else if (!isTrafoClassicActive && isTrafoD3Active) {
            this.#debug("Scenario state: D3 Trafo")
            let trafo = activeEnergyDevices.filter((node) => node.id == "trafo_d3")[0]

            energyDevices.map((node) => {
                links.push({
                    "id": `${trafo.id}-${node.id}`,
                    "source": trafo.id,
                    "sourceRef": trafo,
                    "target": node.id,
                    "targetRef": node
                })
            })

        } else if (isTrafoClassicActive && isTrafoD3Active) {
            this.#debug("Scenario state: Classic & D3 Station")
            let trafo_classic = activeEnergyDevices.filter((node) => node.id == "trafo_classic")[0]
            let trafo_d3 = activeEnergyDevices.filter((node) => node.id == "trafo_d3")[0]

            const [masterCluster, slaveCluster] = this.defineClusters(this.getPureActiveEnergyDevices())

            this.getTrafoMasters().map((trafo) => {
                masterCluster.map((node) => {
                    links.push({
                        "id": `${trafo.id}-${this.nodes.get(node).id}`,
                        "source": trafo.id,
                        "sourceRef": trafo,
                        "target": this.nodes.get(node).id,
                        "targetRef": this.nodes.get(node)
                    })
                })
            })

            this.getTrafoSlaves().map((trafo) => {
                slaveCluster.map((node) => {
                    links.push({
                        "id": `${trafo.id}-${this.nodes.get(node).id}`,
                        "source": trafo.id,
                        "sourceRef": trafo,
                        "target": this.nodes.get(node).id,
                        "targetRef": this.nodes.get(node)
                    })
                })
            })

            links.push({
                "id": `${trafo_d3.id}-${trafo_classic.id}`,
                "source": trafo_d3.id,
                "sourceRef": trafo_d3,
                "target": trafo_classic.id,
                "targetRef": trafo_classic
            })


        } else {
            this.#debug("no trafo station")
        }
        return links
    }

    createDataLinks() {
        this.#debug("createDataLinks")

        let emsNode = this.getEmsNodes()
            .filter((node) => !node.logic.isTypeOf(NodeType.data))

        let emsData = this.getEmsNodes()
            .filter((node) => node.logic.isTypeOf(NodeType.data))

        let isTrafoClassicActive = this.getTrafoSlaves().length > 0
        let isTrafoD3Active = this.getTrafoMasters().length > 0

        var links = []

        if (emsNode.length == 0) return []

        // connect ems node with ems data nodes
        emsNode.map((emsNode) => {
            emsData.map((emsData) => {
                links.push({
                    "id": `${emsNode.id}-${emsData.id}`,
                    "source": emsNode.id,
                    "sourceRef": emsNode,
                    "target": emsData.id,
                    "targetRef": emsData
                })
            })
        })

        // connect ems node with master trafos
        this.getTrafoMasters().map((master) => {
            emsNode.map((emsNode) => {
                links.push({
                    "id": `${emsNode.id}-${master.id}`,
                    "source": emsNode.id,
                    "sourceRef": emsNode,
                    "target": master.id,
                    "targetRef": master
                })
            })
        })

        // connect master trafo to slave trafos
        this.getTrafoMasters().map((master) => {
            this.getTrafoSlaves().map((slave) => {
                links.push({
                    "id": `${master.id}-${slave.id}`,
                    "source": master.id,
                    "sourceRef": master,
                    "target": slave.id,
                    "targetRef": slave
                })
            })
        })

        if (!isTrafoClassicActive && isTrafoD3Active) {
            this.#debug("Scenario state: D3 Trafo")

            // connect master trafo to all smart nodes
            this.getTrafoMasters().map((master) => {
                this.getSmartNodes().map((node) => {
                    links.push({
                        "id": `${master.id}-${node.id}`,
                        "source": master.id,
                        "sourceRef": master,
                        "target": node.id,
                        "targetRef": node
                    })
                })
            })


        } else if (isTrafoClassicActive && isTrafoD3Active) {
            const [masterCluster, slaveCluster] = this.defineClusters(this.getPureActiveEnergyDevices())

            // connect master to all smart nodes
            this.getTrafoMasters().map((master) => {
                masterCluster.map((node) => {
                    if (!this.nodes.get(node).logic.isTypeOf(NodeType.smart)) return

                    links.push({
                        "id": `${master.id}-${this.nodes.get(node).id}`,
                        "source": master.id,
                        "sourceRef": master,
                        "target": this.nodes.get(node).id,
                        "targetRef": this.nodes.get(node)
                    })
                })
            })

            // connect slave to all smart nodes
            this.getTrafoSlaves().map((slave) => {
                slaveCluster.map((node) => {
                    if (!this.nodes.get(node).logic.isTypeOf(NodeType.smart)) return

                    links.push({
                        "id": `${slave.id}-${this.nodes.get(node).id}`,
                        "source": slave.id,
                        "sourceRef": slave,
                        "target": this.nodes.get(node).id,
                        "targetRef": this.nodes.get(node)
                    })
                })
            })


        }

        return links
    }

    isEnergyFlowingBetweenNodes(nodeA, nodeB) {
        let energyNode = nodeA
        let trafo = nodeB

        if (energyNode.isTypeOf(NodeType.trafo)) {
            energyNode = nodeB
            trafo = nodeA
        }
        return energyNode.nowInW != 0
    }

    isD3ActiveAndEnergyFlowing(nodeA, nodeB) {
        return this.isNodeActive('trafo_d3') && this.isEnergyFlowingBetweenNodes(nodeA, nodeB)
    }

    determineEnergySource(electricityLink) {
        let energyNode = electricityLink.sourceRef
        let trafo = electricityLink.targetRef

        if (electricityLink.sourceRef.logic.isTypeOf(NodeType.trafo)) {
            energyNode = electricityLink.targetRef
            trafo = electricityLink.sourceRef
        }

        if (energyNode.logic.nowInW < 0) {
            return energyNode
        }
        return trafo
    }

    determineEnergyTarget(electricityLink) {
        let energyNode = electricityLink.sourceRef
        let trafo = electricityLink.targetRef

        if (electricityLink.sourceRef.logic.isTypeOf(NodeType.trafo)) {
            energyNode = electricityLink.targetRef
            trafo = electricityLink.sourceRef
        }

        if (energyNode.logic.nowInW < 0) {
            return trafo
        }
        return energyNode
    }
}