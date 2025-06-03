// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {NodeLogic} from "./NodeLogic.js"
import {NodeType} from "./NodeType.js"
import { ScenarioSimulator } from "./ScenarioSimulator.js";

export class EnergyDevice extends NodeLogic{
  constructor() {
    super()
    this.types.push(NodeType.energyDevice)
    this._scaleFactor = 1
    this.inputElectricalMaxW = 0
    this.inputElectricalMinW = 0
    this.outputElectricalMaxW = 0
    this.outputElectricalMinW = 0
    this.storageElectricalCapacityWh = 0
    this._now_value_in_w = 0
    // this.history_in_w = []
    this.prediction_in_w = []
    this._historyInW = []
    this.diagram = null
  }

  set historyInW(data) {
    this._historyInW = data
  }

  get historyInW() {
    return this._historyInW.map((item) => item*this._scaleFactor)
  }

  getHistoryInWSlice(step) {
    return this.historyInW.slice(0, step)
  }

  getHistoryInWSliceSteps(fromStep, toStep) {
    return this.historyInW.slice(fromStep, toStep)
  }

  get nowInW() {
    return this._now_value_in_w
  }

  set scaleFactor(factor) {
    if(factor > 0) {
      this._scaleFactor = factor
    }    
  }

  drawLoadDiagram(currentStep, ref = null) {
    const diagramHeight = 100

    const xScale = d3.scaleLinear()
      .range([0, 330]) //pixel
      .domain([0, 95]); //steps

    let yScale = d3.scaleLinear()
      .range([diagramHeight, 0])
      .domain([0, 100]); //kW

    let xAxis = d3.axisBottom(xScale)
      .ticks(4)
      .tickFormat(step => ScenarioSimulator.getTimeByStep(step))
      .tickSizeOuter(0)

    if(this.isTypeOf(NodeType.producer)) {
      yScale = d3.scaleLinear()
        .range([diagramHeight, 0])
        .domain([ d3.min(this.historyInW)/1000, 0]); //kW

      xAxis = d3.axisTop(xScale)
        .ticks(4)
        .tickFormat(step => ScenarioSimulator.getTimeByStep(step))
        .tickSizeOuter(0)
    }

    if(ref) {
      this.diagram = ref

      this.diagram
        .append("g")
          .classed("text-white stroke-1 border-1", true)
          .call(d3.axisLeft(yScale)
            .ticks(4)
          );

      this.diagram
        .append("g")
          .classed("text-white stroke-1 border-1", true)
          .attr("transform", `translate(0, ${ yScale(0) })`)
          .call(
            xAxis
          );
    }
    
    const lineGenerator = d3.line()
      .x((d, i) => { return xScale(i) })
      .y((d, i) => { return yScale(d) })

    let historicalData = this.historyInW.slice(0, currentStep).map((x) => x/1000)

    this.diagram.selectAll(".line")
      .data([historicalData])
      .join(enter => {
        return enter
          .append("path")
          .attr("class", "line")
        },
        update => {
          return update
        },
        exit => exit.remove()
      )
      .attr("d", lineGenerator)
      .classed("diagram-historical", true)
      .classed("stroke-white stroke-2 fill-none", true)

    const prognosisLineGenerator = d3.line()
      .x((d, i) => { return xScale(i+currentStep) })
      .y((d, i) => { return yScale(d) })

    let prognosisData = this.historyInW.slice(currentStep+1, globalThis.config.scenario.steps-1).map((x) => x/1000)

    this.diagram.selectAll(".line-prognosis")
      .data([prognosisData])
      .join(enter => {
        return enter
          .append("path")
          .attr("class", "line")
        },
        update => {
          return update
        },
        exit => exit.remove()
      )
      .attr("d", prognosisLineGenerator)
      .classed("diagram-prognosis prognosis-dependant-view", true)
      .classed("stroke-yellow-400 stroke-2 fill-none stroke-dashed", true)

  }
}

export class Heatpump extends EnergyDevice {
  constructor() {
    super()
    this.types.push(NodeType.smart)
  }
}

export class PVSystem extends EnergyDevice {
  constructor() {
    super()
    this.types.push(NodeType.smart)
    this.types.push(NodeType.producer)
  }
}

export class Crane extends EnergyDevice {
  constructor() {
    super()
  }
}

export class OfficeBuilding extends EnergyDevice {
  constructor() {
    super()
  }
}

export class Battery extends EnergyDevice {
  constructor() {
    super()
    this.types.push(NodeType.smart)
  }
}

export class Wallbox extends EnergyDevice {
  constructor() {
    super()
    this.types.push(NodeType.smart)
  }
}

export class TrafoClassic extends EnergyDevice {
  constructor() {
    super()
    this.types.push(NodeType.trafo)
    this._now_value_in_w = 0
  }
}

export class TrafoD3 extends EnergyDevice {
  constructor() {
    super()
    this.types.push(NodeType.smart)
    this.types.push(NodeType.trafo)
    this._now_value_in_w = 0
  }

  drawCustomElements(ref) {
    this.drawBackground(ref)
  }

  drawBackground(ref) {
      let length = 1000
      let height = 750

      function scale(pixel, factor) {
        return pixel*factor
      }

      /* d3.select(ref)
          .append("svg:image")
              .attr('width', scale(length, 0.3))
              .attr('height', scale(height, 0.3))
              .attr('x', -scale(length, 0.6))
              .attr('y', 0)
              .style("text-anchor", "left")
              .attr("xlink:href", "./images/efen_small.jpg") */
  }
}