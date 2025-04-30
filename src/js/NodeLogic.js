import {NodeType} from "./NodeType.js"
// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {Tuio11Object} from "../libs/tuio11/Tuio11Object.js";

export class NodeLogic {
    constructor() {
        this.types = []
        this.description = ""
    }

    isTypeOf(targetType) {
        return this.types.filter((type) => type == targetType).length > 0
    }

    drawCustomElements(ref) {

    }
}

export class Clock extends NodeLogic {
    constructor(tuioListener, tangibleId) {
        super()
        this.tangibleId = tangibleId
        this.types.push(NodeType.ui)
        this.types.push(NodeType.clock)
        this.types.push(NodeType.io)
        this.showLabel = false
        this.showBackground = true
        this.tuioListener = tuioListener
        this.angle = 350
    }

    drawCustomElements(ref) {
        this.drawBackground(ref)
        let that = this

        const manualR = 40
        d3.select(ref)
            .append("circle")
                .attr("cx", -manualR)
                .attr("r", manualR)
                .classed("opacity-0", true)
            .on("click", function(d, i) {
                that.angle = that.angle-5
                console.log(`Set angle manually to: ${that.angle}`)
                that.tuioListener.updateTuioObject(new Tuio11Object(Date.now(), -1, that.tangibleId, 0.5, 0.5, that.angle/(360/(2*Math.PI)), -1, -1, -1, -1, -1))
            }) 

        d3.select(ref)
            .append("circle")
                .attr("cx", manualR)
                .attr("r", manualR)
                .classed("opacity-0", true)
            .on("click", function(d, i) {
                that.angle = that.angle+5
                console.log(`Set angle manually to: ${that.angle}`)
                that.tuioListener.updateTuioObject(new Tuio11Object(Date.now(), -1, that.tangibleId, 0.5, 0.5, that.angle/(360/(2*Math.PI)), -1, -1, -1, -1, -1))
            }) 

        d3.select(ref).selectAll("circle")
            .call(d3.drag()
            .on("start", null)
            .on("drag", null)
            .on("end", null))
    }

    drawBackground(ref) {
        let length = 400

        d3.select(ref)
            .append("svg:image")
                .attr('width', length)
                .attr('height', length)
                .attr('x', -length/2)
                .attr('y', -length/2)
                .style("text-anchor", "middle")
                .attr("xlink:href", "./images/24clockDial.svg")
            .call(d3.drag()
                .on("start", null)
                .on("drag", null)
                .on("end", null))   
    }
    
    degreeToStep(degree, stepSize) {
        if(degree < 0) {
            degree = 0
        } else if(degree >= 360) {
            degree = 359
        }

        if(stepSize < 1) {
          stepSize = 1
        } else if(stepSize > globalThis.config.scenario.steps) {
          stepSize = globalThis.config.scenario.steps
        }

        // console.log(`Degree: ${degree}`)
        let stepDegree = 360/(globalThis.config.scenario.steps)   // 360/96=3,75
        // console.log("stepDegree: ", stepDegree)
        let targetStep = Math.floor(degree/stepDegree) // 359/3,75=96
        // console.log("targetStep: ", targetStep)

        let virtualStepRange = (globalThis.config.scenario.steps/stepSize) / globalThis.config.scenario.steps //=0,25
        // console.log("virtualStepRange: ", virtualStepRange)
        let virtualTarget = Math.floor(virtualStepRange * targetStep) * stepSize
        // console.log("virtualTarget: ", Math.floor(virtualTarget))

        return virtualTarget > globalThis.config.scenario.steps -1 ? globalThis.config.scenario.steps-1 : virtualTarget
      }
}

export class MagnifyingGlass extends NodeLogic {
    constructor(cb) {
        super()
        this.types.push(NodeType.ui)
        this.types.push(NodeType.io)
        this.cb = cb
    }

    drawCustomElements(ref) {
        this.drawBackground(ref)
        this.addActionButton(ref)
    }

    drawBackground(ref) {
        let length = 395
        let height = 270

        d3.select(ref)
            .append("svg:image")
                .attr('width', 0.5*length)
                .attr('height', 0.5*height)
                .attr('x', 0.5*length)
                .style("text-anchor", "middle")
                .attr("xlink:href", "./images/lupe_ableseprotokoll.png")
    }

    addActionButton(ref) {
        let that = this

        let button = d3.select(ref)
            .append("g")
                .attr("transform", "translate(0, 300)")
                // .call(d3.drag()
                //     .on("start", null)
                //     .on("drag", null)
                //     .on("end", null))
                .on("touchstart pointerdown", function() {
                    d3.selectAll(".labelGroup").selectAll(".tile-text-value")
                        .classed("invisible", false)
                    
                    d3.selectAll(".energyDevice")
                        .classed("bounce", true)
                })
                .on("touchend pointerup", function() {
                    d3.selectAll(".nodeLabel")
                        .classed("bounce", false)
                    d3.selectAll(".labelGroup").selectAll(".tile-text-value")
                        .classed("invisible", true)
                })
        
        var animation = button
            .append("circle")
                .classed('stroke-[6px] stroke-black fill-none drop-shadow-lg', true)
        
        button
            .append("circle")
                .attr("r", 50)
                .classed(`stroke-black fill-[${globalThis.config.ui.colors.classic_bg}] opacity-95 drop-shadow-lg`, true)


                // .call(d3.drag()
                //     .on("start", () => {
                //         // console.log("start")
                //         d3.selectAll(".power")
                //             .style('opacity', 1)
                    
                //         d3.selectAll(".energyDevice")
                //             .classed("bounce", true)
                //     })
                //     .on("end", () => {
                //         // console.log("end")
                //         d3.selectAll(".nodeLabel")
                //             .classed("bounce", false)
                //         d3.selectAll(".power")
                //             .style('opacity', 0)
                //     })
                // )
        
        button
            .append("circle")
                .attr("r", 45)
                .classed('stroke-white stroke-1 fill-none', true)
        
        button
            .append("text")
                .classed('text-white fill-white font-mono text-sm', true)
                .text("Recherche")
                .style("text-anchor", "middle")

        expandCircle()

        function expandCircle() {
            animation
                .attr("r", 45)
                .style('opacity', 1)
                .transition()
                .duration(1800)
                .attr('r', 65)
                .style('opacity', 0.0)
                .on("end", expandCircle)
                
        }
    }
}

export class Forecasts extends NodeLogic {
    constructor() {
        super()
        this.types.push(NodeType.ems)
        this.types.push(NodeType.data)
    }
}

export class EnergyManagementSystem extends NodeLogic {
    constructor() {
        super()
        this.types.push(NodeType.ems)
    }
}