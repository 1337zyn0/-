import { NodeType } from "./NodeType.js"

export class NodeManager {
    constructor() {
        this._isDebugOn = false
        this.nodes = new Map()
        this.instances = new Map()
        this.simulation
        this.inSimulation = false
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

    updateNode(node) {
        if (this.instances.has(node.instanceId)) {
            let updatedNode = this.instances.get(node.instanceId)
            updatedNode = node
            this.#debug(`Update node ${updatedNode.id} (${node.instanceId})`)
        } else {
            this.#debug(`⚠ Attention | Cannot update node ${node.instanceId}`)
        }
    }

    addnewNode(nodeId, agentID) {
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
        newNode.page = 0
        newNode.agentID = agentID
        newNode.agentView = "Platzhalter für eine später hinzugefügte AgentView, Scheduel, Diagramm..."
        this.instances.set(parseInt(helpNode.tangible_id.toString() + objectNumber.toString()), newNode)
    }

    removeNode(node) {
        if (this.instances.has(node.instanceId)) {
            node.isActive = false
            this.instances.delete(node.instanceId)
            if (node.logic.isTypeOf(NodeType.trafo)) {
                this.nodes.get(node.id).isActive = false
            }
        } else {
            return
        }
    }

    setPage(instanceId, page) {
        if (page <= 2 && page >= 0) {
            let node = this.instances.get(instanceId)
            node.page = page
            this.updateNode(node)
        }
    }

    setAllPagesToZero() {
        let array = Array.from(this.instances.values())
        for (let i = 0; i < Array.from(this.instances.keys()).length; i++) {
            if (array[i].page !== 1) {
                let node = this.instances.get(array[i].instanceId)
                node.page = 1
                this.updateNode(node)
            }
        }
    }

    getActiveNodes() {
        //return Array.from(this.nodes.values()).filter((node) => node.isActive)
        return Array.from(this.instances.values()).filter((node) => node.isActive)
    }

    getNodes() {
        return Array.from(this.nodes.values())
    }

    getActiveInstances() {
        return Array.from(this.instances.values())
    }

    isInstanceActive(instanceId) {
        return this.instances.has(instanceId)
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

    initiateSimulation(attack) {
        this.simulation = this.simulation.get(attack)
        let agents = new Array()
        let neighbours = new Map()
        let numberAdded = 0
        this.instances.clear()
        for (let i = 0; i < Object.keys(this.simulation).length; i++) {
            for (let j = 0; j < Object.keys(this.simulation[Object.keys(this.simulation)[i]].receivers).length; j++) {
                if (!agents.includes((this.simulation[Object.keys(this.simulation)[i]].receivers)[j])) {
                    agents.push((this.simulation[Object.keys(this.simulation)[i]].receivers)[j])
                }
            }
        }

        agents.forEach(agent => {
            this.addnewNode("pv_system", agent)
        })

        for (let i = 0; i < Object.keys(this.simulation).length; i++) {
            if (!neighbours.has(this.simulation[Object.keys(this.simulation)[i]].sender)) {
                //neighbours.set(this.simulation[Object.keys(this.simulation)[i]].sender, this.simulation[Object.keys(this.simulation)[i]].receivers)
                let instanceId = Array.from(this.instances.values()).filter(agent => agent.agentID === this.simulation[Object.keys(this.simulation)[i]].sender)[0]
                let receiv = new Array
                for (let l = 0; l < Array.from(this.simulation[Object.keys(this.simulation)[i]].receivers).length; l++) {
                    receiv.push(Array.from(this.instances.values()).filter(agent => agent.agentID === this.simulation[Object.keys(this.simulation)[i]].receivers[l])[0])
                }
                neighbours.set(instanceId.instanceId, receiv)
            } else {
                for (let z = 0; z < neighbours.get(this.simulation[Object.keys(this.simulation)[i]].sender).length; z++) {
                    if (!neighbours.get(this.simulation[Object.keys(this.simulation)[i]].sender).includes(this.simulation[Object.keys(this.simulation)[i]].receivers[z])) {
                        neighbours.get(this.simulation[Object.keys(this.simulation)[i]].sender).push(this.simulation[Object.keys(this.simulation)[i]].receivers[z])
                    }
                }
            }
        }

        if (Array.from(neighbours).length !== Array.from(this.instances.keys()).length) {
            for (let g = 0; g < Array.from(this.instances.keys()).length; g++) {
                if (!neighbours.has(Array.from(this.instances.keys())[g])) {
                    neighbours.set(Array.from(this.instances.keys())[g], "No Sender")
                }
            }
        }

        for (let i = 0; i < agents.length; i++) {
            for (let j of this.instances.values()) {
                if (j.agentID == agents[i]) {
                    j.x = 0
                    j.y = 0
                    j.name = "Agent " + agents[i].split(/(?<=\D)(?=\d)/)[1]
                    j.agentView = "Dies ist der Platz für die Agentenview zu dem jeweiligen Zeitschritt"
                    j.page = 1
                    j.neighbours = neighbours.get(j.instanceId)
                    numberAdded++
                    this.updateNode(j)
                }
            }
        }
        for (let i = 0; i < Object.keys(this.simulation).length; i++) {
            for (let j of this.instances.values()) {
                if (this.simulation[Object.keys(this.simulation)[i]].sender === j.agentID) {
                    //console.log(this.simulation[Object.keys(this.simulation)[i]])
                    if (j.agentView === "Dies ist der Platz für die Agentenview zu dem jeweiligen Zeitschritt") {
                        j.agentView = this.simulation[Object.keys(this.simulation)[i]].solution_candidate
                        this.updateNode(j)
                    }
                }

                if (Object.values(this.simulation)[i].sender === j.agentID && j.agentView === "Dies ist der Platz für die Agentenview zu dem jeweiligen Zeitschritt") {
                    j.agentView = Object.values(this.simulation)[i].solution_candidate
                    //console.log(Object.values(this.simulation)[i].solution_candidate)
                }
            }
        }
        this.positionNodes()
    }

    createCommunicationLinks() {
        let energyDevices = this.getPureActiveEnergyDevices()
        var links = []
        for (let a = 0; a < energyDevices.length; a++) {
            for (let b = 0; b < energyDevices[a].neighbours.length; b++) {
                let device = energyDevices[a]
                links.push({
                    "id": `${device.agentID}-${device.neighbours[b]}`,
                    "source": device.agentID,
                    "sourceRef": device,
                    "target": device.neighbours[b],
                    "targetRef": energyDevices.find(agent => agent.agentID === device.neighbours[b])
                })
            }
        }
        return links
    }

    positionNodes() {
        let exisitingPositions = new Map
        let alreadyPlacedNodes = new Map
        let activeInstanceID = Array.from(this.instances.keys())
        let activeInstaceValue = Array.from(this.instances.values())
        let instances = Array.from(this.instances)
        exisitingPositions.set(0, [196, 197])
        exisitingPositions.set(1, [200, globalThis.window.innerHeight - 295])
        exisitingPositions.set(2, [globalThis.window.innerWidth - 198, 199])
        exisitingPositions.set(3, [globalThis.window.innerWidth - 630, globalThis.window.innerHeight - 280])
        //exisitingPositions.set()

        for (let j = 4; j < instances.length; j++) {
            if (activeInstaceValue[j].x === 0) {
                let newPosition = this.getHighestGap(exisitingPositions)
                exisitingPositions.set(j, [newPosition[0], newPosition[1]])
            }
        }

        for (let k = 0; k < activeInstanceID.length; k++) {
            let array = Array.from(exisitingPositions)
            let arrayLenght = array.length
            for (let y = 0; y < activeInstaceValue[k].neighbours.length; y++) {
                if (alreadyPlacedNodes.has(activeInstaceValue[k].neighbours[y].instanceId)) {
                    let alreadyPlacedNeighbour = alreadyPlacedNodes.get(activeInstaceValue[k].neighbours[y].instanceId)
                    let allDistances = new Map
                    for (let z = 0; z < arrayLenght; z++) {
                        if (exisitingPositions.length !== 0) {
                            let distance = this.euclideanDistance([alreadyPlacedNeighbour[0], alreadyPlacedNeighbour[1]], [Array.from(exisitingPositions.values())[z][0], Array.from(exisitingPositions.values())[z][1]])
                            allDistances.set(distance, [array[z][0], Array.from(exisitingPositions.values())[z]])
                        }
                    }
                    let lowestDistance = Math.min(...Array.from(allDistances.keys()))
                    alreadyPlacedNodes.set(activeInstanceID[k], allDistances.get(lowestDistance)[1])
                    exisitingPositions.delete(allDistances.get(lowestDistance)[0])
                    break
                } else {
                    if (y == activeInstaceValue[k].neighbours.length - 1) {
                        let random = Math.floor(Math.random() * array.length)
                        let a = Array.from(exisitingPositions.keys())[random]
                        alreadyPlacedNodes.set(activeInstanceID[k], exisitingPositions.get(a))
                        exisitingPositions.delete(a)
                    }
                }
            }
        }

        for (let f = 0; f < activeInstanceID.length; f++) {
            let instances = Array.from(this.instances.values())[f]
            if (alreadyPlacedNodes.get(instances.instanceId) == undefined) {
                let newPosition = Array.from(exisitingPositions)[0][1]
                alreadyPlacedNodes.set(instances.instanceId, [newPosition[0], newPosition[1]])
                exisitingPositions.delete(Array.from(exisitingPositions)[0][0])
            }
        }

        for (let g = 0; g < Array.from(alreadyPlacedNodes.keys()).length; g++) {
            let array = Array.from(alreadyPlacedNodes)
            let node = this.instances.get(array[g][0])
            node.x = array[g][1][0]
            node.y = array[g][1][1]
            this.updateNode(node)
        }
    }

    getHighestGap(exisitingPositions) {
        let allDistances = new Map
        let array = Array.from(exisitingPositions)
        let margin = 100
        for (let i = 0; i < array.length; i++) {
            for (let x = 0; x < array.length; x++) {
                let a = array[i][1]
                let b = array[x][1]
                let distance = this.euclideanDistance([a[0], a[1]], [b[0], b[1]])
                allDistances.set(distance, [a, b])
            }
        }
        let keys = [...allDistances.keys()].sort((a, b) => b - a)

        for (let j = 0; j < Array.from(allDistances.keys()).length; j++) {
            let a = allDistances.get(keys[j])
            if (this.checkPosition(exisitingPositions, [(a[0][0] + a[1][0]) * 0.5, (a[0][1] + a[1][1]) * 0.5])) {
                return [(a[0][0] + a[1][0]) * 0.5, (a[0][1] + a[1][1]) * 0.5]
            }
        }
        for (let x = 0; x < Array.from(allDistances.keys()).length; x++) {
            let random = [margin + Math.random() * (globalThis.window.innerWidth - 2 * margin), margin + Math.random() * (globalThis.window.innerHeight - 2 * margin)]
            if (this.checkPosition(exisitingPositions, random)) {
                return random
            }
        }
        return [margin + Math.random() * (globalThis.window.innerWidth - 2 * margin), margin + Math.random() * (globalThis.window.innerHeight - 2 * margin)]
    }

    checkPosition(exisitingPositions, xy) {
        for (let [key, value] of exisitingPositions.entries()) {
            if (value[0] === xy[0] && value[1] === xy[1]) {
                return false
            }
            if (this.euclideanDistance([value[0], value[1]], [xy[0], xy[1]]) < 300) {
                return false
            }
            if (xy[0] > globalThis.window.innerWidth) {
                if (xy[0] < 0) {
                    return false
                }
            }
            if (xy[0] > globalThis.window.innerWidth - 600 - 10 && xy[1] > globalThis.window.innerHeight - 720 - 600) {
                return false
            }
            if (xy[1] > globalThis.window.innerHeight - 280) {
                return false
            }
            if (xy[1] > globalThis.window.innerHeight) {
                if (xy[1] < 0) {
                    if (xy[1] < 200) {
                        return false
                    }
                }
            }
        }
        return true
    }
}