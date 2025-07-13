import { EnergyDevice } from "./EnergyDevices.js"
import { NodeType } from "./NodeType.js"

export const ScenarioState = {
    notrafos: 1,
    classic: 2,
    d3: 3,
    masterslave: 4,
    d3Ems: 5
}

/**
 * @class
 * Calculates values for GUI
 */
export class ScenarioSimulator {
    /**
     * @param {number} annualElectricityCosts Expected anually electricity costs
     * @param {number} selfConsumption Share of renewable electricity, that is used within the microgrid
     * @param {Array} gridConnectionPointPower Array, representing the amount of power, that is imported or exported from the grid
     * @param {number} step Current scenario step
     */

    constructor() {
        this.latestElectricityLinks = []
        this._isDebugOn = true
        this._annualElectricityCosts = 0
        this._selfConsumption = 0
        this._gridConnectionPointPower = []
        // this._currentScheduler = "enum"
        this._energyDeviceList = {}
        this._simulationData
        this._scenarioStepAmount = 96;
        this._step = 0;

        this.scenarioD3TotalKwh = 0
        this.scenarioD3TotalPvKwh = 0
        this.scenarioD3ElectricityFedOut = 0
        this.scenarioD3UsedPvEnergyKwh = 0
        this.scenarioD3ElectricityFromGrid = 0
        this.scenarioD3SelfConsumptionRate = 0
        this.scenarioD3TotalCo2 = 0
        this.targetValue = []
        this.simulationPerformance = []
        this.currentState = []
        this.currentDiff = []
        this.inSimulation = false
        this.simulationSteps = 0
        this.attackScenario = -1
        this._activeNodes
        this.allConfig = new Map
    }


    get scenarioState() {
        let isTrafoClassicActive = this._energyDeviceList['trafo_classic'] ? true : false
        let isTrafoD3Active = this._energyDeviceList['trafo_d3'] ? true : false
        let isEmsActive = this._energyDeviceList['qems'] ? true : false

        console.log(`isTrafoClassicActive: ${isTrafoClassicActive}`)
        console.log(`isTrafoD3Active: ${isTrafoD3Active}`)
        console.log(`isEmsActive: ${isEmsActive}`)

        if (!isTrafoClassicActive && !isTrafoD3Active) {
            console.log("notrafos")
            return ScenarioState.notrafos

        } else if (isTrafoClassicActive && !isTrafoD3Active) {
            console.log("classic")
            return ScenarioState.classic

        } else if (isTrafoD3Active && !isEmsActive) {
            console.log("d3")
            return ScenarioState.d3

        } else if (isTrafoD3Active && isEmsActive) {
            console.log("d3ems")
            return ScenarioState.d3Ems
        }

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

    // set co2emissionGramPerKwh(value) {
    //     this._co2emissionGramPerKwh = value
    // }

    // get co2emissionGramPerKwh() {
    //     return this._co2emissionGramPerKwh
    // }

    // set industryElectricityPriceCtPerKwh(value) {
    //     this._industryElectricityPriceCtPerKwh = value
    // }

    // get industryElectricityPriceCtPerKwh() {
    //     return this._industryElectricityPriceCtPerKwh
    // }

    set scenarioSteps(steps) {
        this._scenarioStepAmount = steps
    }

    get scenarioSteps() {
        return this._scenarioStepAmount
    }

    set simulationData(d) {
        this._simulationData = d
    }

    set activeNodes(nodes) {
        this._activeNodes = nodes
    }

    // get annualElectricityCosts() {
    //     return this._annualElectricityCosts
    // }

    // get selfConsumption() {
    //     return this._selfConsumption
    // }

    // get gridConnectionPointPower() {
    //     return this._gridConnectionPointPower
    // }

    /**
     * @param {number} step
     */
    set step(step) {
        if (step < 0) {
            this._step = 0
        } else if (step > this._scenarioStepAmount) {
            this._step = this._scenarioStepAmount
        } else {
            this._step = step
        }
        this.updateEnergyDevices()
    }

    get step() {
        return this._step
    }

    /**
     * Get current time
     * @param {step} Desired step
     */
    static getTimeByStep(step) {
        let hours = Math.floor((15 * step) / 60)
        let minutes = (15 * step) % 60
        hours = String(hours).padStart(2, '0')
        minutes = String(minutes).padStart(2, '0')
        return `${hours}:${minutes}`
    }

    getCurrentTime() {
        return ScenarioSimulator.getTimeByStep(this._step)
    }

    getCurrentStep() {
        return this._step
    }

    getAllSteps() {
        return this._scenarioStepAmount
    }

    goToStep(step) {
        this._step = step
    }

    getTargetValueDiagramData() {
        return this.targetValue
    }

    getCurrentSimulationState() {
        return this.currentState[this._step]
    }

    getCurrentConfiguration() {
        return this.allConfig.get(this._step)
    }

    getcurrentSolutionCandidate() {
        return Object.values(this._simulationData)[this._step]
    }

    getCurrentDiff() {
        return this.currentDiff[this._step]
    }

    getAllPerformance(i) {
        if (i == 0) {
            return this.simulationPerformance[this._step]
        }
        if (i == 1) {
            return this.simulationPerformance
        }
    }

    getAttackScenario() {
        return this.attackScenario
    }

    getCurrentCommunicationLinks() {
        if (this.inSimulation) {
            if (this._step == -1) {
                if (this.allConfig.size === 0) {
                    this.generateAllAgentStatistics()
                    this.generateAgentView()
                }
                var links = []
                for (let a = 0; a < this._activeNodes.length; a++) {
                    for (let b = 0; b < this._activeNodes[a].neighbours.length; b++) {
                        let device = this._activeNodes[a]
                        links.push({
                            "id": `${device.agentID}-${device.neighbours[b].agentID}`,
                            "source": device.agentID,
                            "sourceRef": device,
                            "target": device.neighbours[b].agentID,
                            "targetRef": this._activeNodes.find(agent => agent.agentID === device.neighbours[b].agentID)
                        })
                    }
                }
                return links
            } else {
                var links = []

                let currentNegotiation = Object.values(this._simulationData)[this.step]
                let device = this._activeNodes.find(agent => agent.agentID === currentNegotiation.sender)
                for (let a = 0; a < device.neighbours.length; a++) {
                    links.push({
                        "negotiationID": currentNegotiation.negotiation_id,
                        "id": `${device.agentID}-${device.neighbours[a].agentID}`,
                        "source": device.agentID,
                        "sourceRef": device,
                        "target": device.neighbours[a].agentID,
                        "targetRef": this._activeNodes.find(agent => agent.agentID === device.neighbours[a].agentID),
                        "performance": currentNegotiation.performance
                    })
                }
                return links
            }
        }
    }

    initiateSimulation(attack) {
        this.inSimulation = true
        this._simulationData = this._simulationData.get(attack)
        this._scenarioStepAmount = Object.keys(this._simulationData).length
        this._step = -1
        this.attackScenario = attack
    }

    stepBack() {
        if (this._step > -1) {
            this._step--
            if (!this.inSimulation) {
                this.updateEnergyDevices()
            }
        }
    }

    stepForward() {
        if (this._step < this._scenarioStepAmount - 1) {
            this._step++
            if (!this.inSimulation) {
                this.updateEnergyDevices()
            }
        }
    }

    getActiveNodes() {
        return Array.from(Object.entries(this._energyDeviceList).map(([key, device]) => {
            return device
        }))
    }

    getActiveEnergyDevices() {
        return this.getActiveNodes()
            .filter((node) => !node.logic.isTypeOf(NodeType.trafo))
            .filter((node) => node.logic.isTypeOf(NodeType.energyDevice))
    }

    getActiveEnergyDevicesConsumers() {
        return this.getActiveEnergyDevices()
            .filter((node) => !node.logic.isTypeOf(NodeType.producer))
    }

    getActiveEnergyDevicesProducers() {
        return this.getActiveEnergyDevices()
            .filter((node) => node.logic.isTypeOf(NodeType.producer))
    }

    /**
     * 
     * @param {string} id 
     * @param {EnergyDevice} device 
     */

    addEnergyDevice(id, device) {
        if (this._energyDeviceList[id]) return

        this._energyDeviceList[id] = device;
        if (this._isDebugOn) this.#debug(`Added '${id}' to Scenario (${Object.keys(this._energyDeviceList).length} devices in total)`)
        this.updateEnergyDevices()
    }

    removeEnergyDevice(id) {
        if (!this._energyDeviceList[id]) return

        delete this._energyDeviceList[id]
        if (this._isDebugOn) this.#debug(`After removing ${id} from Array. Amount energyDeviceList: ${Object.keys(this._energyDeviceList).length}`)
        this.updateEnergyDevices()
    }

    updateEnergyDevices() {
        if (!this.inSimulation) {
            this.calculateLoadsByLatestLinks()
        }
    }

    generateAgentView() {
        let configuration = new Map
        for (let z = 0; z < this._scenarioStepAmount; z++) {
            let currentSimulationStep = Object.values(this._simulationData)[z]
            let senderNode = this._activeNodes.find(agent => agent.agentID === currentSimulationStep.sender)
            let receiverNodes = []
            for (let i = 0; i < currentSimulationStep.receivers.length; i++) {
                receiverNodes[i] = this._activeNodes.find(agent => agent.agentID === currentSimulationStep.receivers[i])
            }
            let array = Array.from(Object.entries(currentSimulationStep.solution_candidate))
            configuration.set(senderNode.instanceId, array)
            for (let j = 0; j < 4; j++) {
                let instanceId = receiverNodes[j].instanceId
                let currentConfig = configuration.get(instanceId)
                if (currentConfig === undefined) {
                    configuration.set(instanceId, array.map(item => [...item]))
                } else {
                    for (let x = 0; x < array.length; x++) {
                        if (currentConfig.find(agent => agent[0] === array[x][0]) === undefined) {
                            currentConfig.push(array[x])
                        } else {
                            currentConfig[x] = array[x]
                        }
                    }
                }
            }
            let saveConfig = new Map
            for (const [instanceId, agentConfig] of configuration.entries()) {
                let deepCopy = configuration.get(instanceId)
                saveConfig.set(instanceId, deepCopy.map(item => [...item]))
            }
            this.allConfig.set(z, saveConfig)
        }
    }

    generateAllAgentStatistics() {
        if (this.targetValue.length === 0) {
            for (let i = 0; i < Object.values(this._simulationData)[0].target_parameters[0].length; i++) {
                this.targetValue[i] = Object.values(this._simulationData)[0].target_parameters[0][i]
            }
        }

        for (let a = 0; a < Object.keys(this._simulationData).length; a++) { // simulationsschritt
            //console.log(Object.values(this._simulationData)[a].solution_candidate)
            let values = []
            let solution_candidate = Object.values(Object.values(this._simulationData)[a].solution_candidate)
            for (let i = 0; i < solution_candidate[0].length; i++) {//24 zeitschritte eines einzelnen Agenten
                let sum = 0
                for (let t = 0; t < solution_candidate.length; t++) { //solutionCandidate im jeweiligen Simulationsschritt
                    //console.log(solution_candidate[t][i])
                    sum = sum + solution_candidate[t][i]
                }
                values.push(sum)
            }
            this.currentState[a] = values
        }

        if (this.simulationPerformance.length === 0) {
            this.simulationPerformance.push([Object.values(this._simulationData)[0].performance])
            for (let k = 1; k < Object.entries(this._simulationData).length; k++) {
                let simulation = Object.values(this._simulationData)[k].performance
                let asdf = this.simulationPerformance.at(k - 1)
                let newPerf = [...asdf, simulation]
                this.simulationPerformance.push(newPerf)
            }
        }
    }

    calculateLoadsByLatestLinks() {
        let activeNodes = Array.from(Object.entries(this._energyDeviceList).map(([key, device]) => {
            return device
        }))

        let trafos = activeNodes
            .filter((node) => node.logic.isTypeOf(NodeType.trafo))

        // reset all now values in trafos
        trafos.forEach(trafo => trafo._now_value_in_w = 0)

        // set new now values and balance
        this.latestElectricityLinks.forEach(link => {
            if (link.targetRef.logic.historyInW.length > 0) {
                link.targetRef.logic._now_value_in_w = Math.round(link.targetRef.logic.historyInW[this._step] * 100) / 100
            }
            link.sourceRef.logic._now_value_in_w += link.targetRef.logic._now_value_in_w
        });
    }

    setElectricityLinks(links) {
        this.latestElectricityLinks = links
        this.updateEnergyDevices()
    }

    calculateScenarioD3() {
        if (this.getActiveNodes().length == 0) return

        this.scenarioD3TotalKwh = this.sumActiveEnergyDevicesConsumerKWh()
        this.scenarioD3TotalPvKwh = this.sumActivePvDevicesKwh()
        this.scenarioD3ElectricityFedOut = this.calculateElectricityFedOut(this.getActiveEnergyDevicesProducers(), this.getActiveEnergyDevicesConsumers())
        this.scenarioD3UsedPvEnergyKwh = this.scenarioD3TotalPvKwh - this.scenarioD3ElectricityFedOut
        this.scenarioD3ElectricityFromGrid = this.scenarioD3TotalKwh + this.scenarioD3UsedPvEnergyKwh
        this.scenarioD3SelfConsumptionRate = this.scenarioD3TotalPvKwh ? 100 / this.scenarioD3TotalPvKwh * this.scenarioD3UsedPvEnergyKwh : 0
        this.scenarioD3TotalCo2 = (this.scenarioD3ElectricityFromGrid * this.co2emissionGramPerKwh) / 1000

        if (this._energyDeviceList['trafo_d3']) {
            this._energyDeviceList['trafo_d3'].historyInW = this.sumHistoryByStep(this.getActiveEnergyDevices(), 0, this._scenarioStepAmount)
        }

        // console.log(`scenarioD3TotalKwh: ${this.scenarioD3TotalKwh}`)
        // console.log(`scenarioD3TotalPvKwh: ${this.scenarioD3TotalPvKwh}`)
        // console.log(`scenarioD3ElectricityFedOut: ${this.scenarioD3ElectricityFedOut}`)
        // console.log(`scenarioD3UsedPvEnergyKwh: ${this.scenarioD3UsedPvEnergyKwh}`)
        // console.log(`scenarioD3ElectricityFromGrid: ${this.scenarioD3ElectricityFromGrid}`)
        // console.log(`scenarioD3SelfConsumptionRate: ${this.scenarioD3SelfConsumptionRate}`)
        // console.log(`scenarioD3TotalCo2: ${this.scenarioD3TotalCo2} kg today`)
        // console.log(`sumHistoryByStep: `); console.log(this.sumHistoryByStep(this.getActiveEnergyDevices()))
    }

    calculateScenarioEMS() {
    }

    sumNodesKwh(nodes) {
        // console.log("---sumNodesKwH")
        // iterate all active energydevices
        const initialValue = 0

        // console.log("nodes")
        // console.log(nodes)

        let reducedNodeHistories = nodes.map((node) => {
            return node.logic.getHistoryInWSlice(this.step).reduce((accumulator, node) => {
                return accumulator + node
            }, initialValue)
        })

        // console.log("nodeHistories")
        // console.log(reducedNodeHistories)

        let totalSumKw = reducedNodeHistories.reduce((accumulator, node) => {
            return accumulator + node
        }, initialValue)

        // console.log("totalSumKw")
        // console.log(totalSumKw)

        return totalSumKw / 4 / 1000

        // add all kwh values of all active devices
    }

    sumActiveEnergyDevicesConsumerKWh() {
        return this.sumNodesKwh(this.getActiveEnergyDevicesConsumers())
    }

    sumActivePvDevicesKwh() {
        if (this._energyDeviceList['pv_system']) {
            return this.sumNodesKwh([this._energyDeviceList['pv_system']])
        } else {
            return 0
        }
    }

    sumHistoryByStep(devices, fromStep, toStep) {
        // console.log(`devices:`); console.log(devices)

        const devicesHistory = devices.map((node) => {
            return node.getHistoryInWSliceSteps(fromStep, toStep)
        })

        const transposedDevicesHistory = this.transpose(devicesHistory)

        const devicesHistorySumByStep = transposedDevicesHistory.map((step) => {
            const initialValue = 0
            return step.reduce((accumulator, currentValue) => {
                return accumulator + currentValue
            }, initialValue)
        })

        return devicesHistorySumByStep
    }


    calculateElectricityFedOut(producers, consumers) {
        // if(consumers.length == 0) return 0
        // console.log("calculate")
        // console.log(producers)
        // console.log(consumers)

        let consumersHistory = consumers.map((node) => {
            return node.logic.getHistoryInWSlice(this.step)
        })

        let producersHistory = producers.map((node) => {
            return node.logic.getHistoryInWSlice(this.step)
        })

        // console.log("consumersHistory")
        // console.log(consumersHistory)

        // console.log("producersHistory")
        // console.log(producersHistory)

        let transposedConsumers = this.transpose(consumersHistory)
        // console.log("transposedConsumers")
        // console.log(transposedConsumers)

        let transposedProducers = this.transpose(producersHistory)
        // console.log("transposedProducers")
        // console.log(transposedProducers)

        const consumersHistorySumByStep = transposedConsumers.map((step) => {
            const initialValue = 0
            return step.reduce((accumulator, currentValue) => {
                return accumulator + currentValue
            }, initialValue)
        })

        // console.log("reducedConsumerHistoryByStep")
        // console.log(consumersHistorySumByStep)

        const elOut = transposedProducers.map((stepKw, index) => {

            let consumerSum = (consumersHistorySumByStep.length > 1) ? Number(consumersHistorySumByStep[index]) : 0
            const dif = Number(stepKw) + consumerSum
            // console.log(`${Number(stepKw)} + ${consumerSum}`)

            if (dif < 0) {
                return dif
            } else {
                return 0
            }
        })

        // console.log("elOut")
        // console.log(elOut)

        return elOut.reduce((accumulator, currentValue) => {
            return accumulator + currentValue
        }, 0) / 4 / 1000
    }

    getD3Statistics() {
        // console.log("getD3Stats")
        this.calculateScenarioD3()

        return [
            ["Verbrauch", this.round(this.scenarioD3TotalKwh), "kWh", globalThis.config.ui.icons.building_office_2],
            ["Erzeugung", this.round(this.scenarioD3TotalPvKwh), "kWh", globalThis.config.ui.icons.sun],
            ["Ausgespeist", this.round(this.scenarioD3ElectricityFedOut), "kWh", globalThis.config.ui.icons.arrow_up_on_square],
            // ["Eigenverbrauch", this.round(this.scenarioD3UsedPvEnergyKwh), "kWh", globalThis.config.ui.icons.bolt],
            ["Netzbezug", this.round(this.scenarioD3ElectricityFromGrid), "kWh", globalThis.config.ui.icons.arrow_down_on_square],
            ["Eigenverbrauch", this.round(this.scenarioD3SelfConsumptionRate), "%", globalThis.config.ui.icons.bolt],
            ["CO₂ Emission", this.round(this.scenarioD3TotalCo2), "kg/Tag", globalThis.config.ui.icons.cloud],
        ]
    }

    getEmsStatistics() {
        // console.log("getD3Stats")
        this.calculateScenarioD3()

        return [
            // ["Verbrauch", this.round(this.scenarioD3TotalKwh), "kWh", globalThis.config.ui.icons.building_office_2],
            // ["Erzeugung", this.round(this.scenarioD3TotalPvKwh), "kWh", globalThis.config.ui.icons.sun],
            ["Ausgespeist", this.round(this.scenarioD3ElectricityFedOut * 0.9), "kWh", globalThis.config.ui.icons.arrow_up_on_square],
            // ["Eigenverbrauch", this.round(this.scenarioD3UsedPvEnergyKwh), "kWh", globalThis.config.ui.icons.bolt],
            ["Netzbezug", this.round(this.scenarioD3ElectricityFromGrid * 0.9), "kWh", globalThis.config.ui.icons.arrow_down_on_square],
            ["Eigenverbrauch", this.round(this.scenarioD3SelfConsumptionRate * 1.1), "%", globalThis.config.ui.icons.bolt],
            ["CO₂ Emission", this.round(this.scenarioD3TotalCo2 * 0.9), "kg/Tag", globalThis.config.ui.icons.cloud],
        ]
    }

    round(val) {
        return Math.round(val * 100) / 100
    }

    transpose(matrix) {
        // https://stackoverflow.com/a/46805290

        if (matrix.length == 0) return []
        return matrix[0].map((col, i) => matrix.map(row => row[i]));
    }
}