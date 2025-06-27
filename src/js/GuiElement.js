import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { toMultilineText, wrapTextArray } from "./helper.js"
import { ScenarioSimulator, ScenarioState } from "./ScenarioSimulator.js"
import { Tuio11Object } from "../libs/tuio11/Tuio11Object.js";

class GuiElement {
    constructor(guiRef) {
        this.guiRef = guiRef
        // this.dataRef = dataRef
        this._x = 0
        this._y = 0
        this.parentSvgEntry = null
        this.inSimulation = false
    }

    set x(value) {
        this._x = value
    }

    get x() {
        return this._x
    }

    set y(value) {
        this._y = value
    }

    get y() {
        return this._y
    }

    draw() {
    }
}

export class TileIconTextGroup extends GuiElement {
    constructor(instanceId) {
        super(null)
        this.instanceId = instanceId
        this.width = 0
        this.height = 0
        this.element = null
        this.textHead = ""
        this.textValue = 0
        this.textUnit = ""
        this.iconPath = ""
        this.rectCss = ""
        this.cssHead = ""
        this.cssValue = ""
        this.cssUnit = ""
        this.x = 0
        this.y = 0
    }

    draw() {
        const iconWidth = 10
        const g = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"))
            .attr("id", "tile-" + this.instanceId)
            .attr("transform", d => `translate(${this.x}, ${this.y})`)

        this.element = g

        const rect = g
            .append("rect")
            .classed("invisible", false)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("rx", 3)
            .classed(`tile-rect ${this.rectCss}`, true)

        g
            .append("path")
            .attr("transform", d => `translate(${(this.width / 2) - (this.textHead.length / 2 * 7 + 20)}, 3) scale(0.9)`)
            .attr("id", "tile-" + this.instanceId)
            .classed("stroke-white fill-none stroke-[1.5px]", true)
            .attr("d", this.iconPath)

        let text = g
            .append("text")

        text
            .append("tspan")
            .attr("id", "tile-" + this.instanceId)
            .attr("x", this.width / 2 + iconWidth)
            .attr("y", 20)
            .classed(`tile-text-head ${this.cssHead}`, true)
            .text(d => `${this.textHead}`)
            .style("text-anchor", "middle")

        text
            .append("tspan")
            .attr("id", "tile-" + this.instanceId)
            .attr("x", this.width / 2)
            .attr("dy", "1.2em")
            .classed(`tile-text-value ${this.cssValue}`, true)
            .style("text-anchor", "middle")
            .text(this.textValue.toFixed(0))

        text
            .attr("id", "tile-" + this.instanceId)
            .append("tspan")
            .classed(`tile-text-unit ${this.cssUnit}`, true)
            .text(d => ` ${this.textUnit}`)
    }
}

export class InfoBox extends GuiElement {
    constructor(cssId) {
        super(null)
        this.width = 0
        this.height = 0
        this.element = null
        this.id = cssId ? cssId : ""
        this.textHead = ""
        this.textContent = ""
        this.x = 0
        this.y = 0
        // this.rectClasses = ""

    }

    draw() {
        if (this.element) return

        const group = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"))
            .attr("id", this.id)
            .attr("transform", d => `translate(${this.x}, ${this.y})`)
        this.element = group

        const rect = group
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("rx", 5)
            .classed(`${this.rectCss}`, true)

        const rectText = group
            .append("text")
            .text(this.textHead)
            .attr("x", this.width / 2)
            .attr("y", this.height / 3)
            .classed(`text-head ${this.textHeadCss}`, true)
            .style("text-anchor", "middle")

        toMultilineText(rectText, this.textContent, this.width / 10, `text-content ${this.textContentCss}`)

        d3.select(rectText).node().selectAll("tspan")
            .style("text-anchor", "middle")
            .attr("x", this.width / 2)

        d3.select(rectText).node()
            .insert("tspan", ":first-child")
            .text(" ")
            .attr("x", 0)
            .attr("dy", "0.5em")

        // rectText
        //     .append("tspan")
        //         .text(this.textContent)
        //         .classed(`text-content ${this.textContentCss}`, true)
        //         .attr("x", this.width/2)
        //         .attr("dy", "1.2em")
        //         .style("text-anchor", "middle")

        return group
    }
}

export class DevArea extends GuiElement {
    constructor(guiRef, nodeManager, tuioListener) {
        super(guiRef)
        this.nodeManager = nodeManager
        this.tuioListener = tuioListener
    }

    draw() {
        let that = this
        if (d3.select("#devArea").size() > 0) return false

        let devButtonHeight = 30;
        let devButtonPadding = 5;
        // let devAreaBackgroundHeight = config.nodes.length*(devButtonHeight + devButtonPadding) + devButtonPadding
        let devAreaBackgroundHeight = this.nodeManager.getNodes().length * (devButtonHeight + devButtonPadding) + devButtonPadding

        const devArea = this.guiRef
            .append("g")
            .attr('class', () => config.ui.isDevAreaVisible ? "visible" : "invisible")
            .attr("id", "devArea")
            .attr("transform", `translate(0, ${globalThis.window.innerHeight - devAreaBackgroundHeight})`)

        const devAreaHead = devArea
            .append("text")
            .classed('font-mono fill-cyan-200 text-xl uppercase', true)
            .text(d => `Dev Area`)

        const devAreaBackground = devArea
            .append("rect")
            .attr('width', 310)
            .attr('height', this.nodeManager.getNodes().length * devAreaBackgroundHeight)
            .attr('rx', '0')
            .classed('stroke-orange-700 fill-white opacity-75 drop-shadow-lg', true)

        const devButton = devArea
            .selectAll()
            .data(this.nodeManager.getNodes())
            .join("g")
            .attr("transform", (d, i) => `translate(5, ${devButtonPadding + i * (devButtonHeight + devButtonPadding)})`)

        // Add background textfield 
        const devButtonBackground = devButton
            .append("rect")
            .attr('width', d => {
                let output = `Toggle ${d.name}`
                return output.length * 10
            })
            .attr('height', devButtonHeight)
            .attr('rx', '0')
            .classed('stroke-cyan-500 fill-[#74c2d9] hover:fill-cyan-400 opacity-75 drop-shadow-lg', true)
            .on("click", function (d, i) {

                console.log("Dev click event");
                /* if(that.nodeManager.isNodeActive(i.id)) {                
                  console.log(i.id, "is active")
                  let tangibleId = that.nodeManager.getTangibleIdByNodeId(i.id)
                  that.tuioListener.removeTuioObject(new Tuio11Object(Date.now(), -1, tangibleId, 0, 0, 0, -1, -1, -1, -1, -1))
  
                } else { */
                switch (i.id) {
                    case "trafo_classic":
                    case "trafo_d3":
                    case "qems":
                    case "forecasts":
                        if (!that.nodeManager.isNodeActive(i.id)) {
                            let tangibleId = that.nodeManager.getTangibleIdByNodeId(i.id)
                            that.nodeManager.addnewNode(i.id)
                            that.tuioListener.addTuioObject(new Tuio11Object(Date.now(), -1, tangibleId, (1 / globalThis.window.innerWidth * i.x), (1 / globalThis.window.innerHeight * i.y), 0, -1, -1, -1, -1, -1))
                        }
                        break
                    default:
                        let tangibleId = that.nodeManager.getTangibleIdByNodeId(i.id)
                        that.nodeManager.addnewNode(i.id)
                        that.tuioListener.addTuioObject(new Tuio11Object(Date.now(), -1, tangibleId, (1 / globalThis.window.innerWidth * i.x), (1 / globalThis.window.innerHeight * i.y), 0, -1, -1, -1, -1, -1))
                }
            });

        const devButtonText = devButton
            .append("text")
            .attr("dx", 5)
            .attr("dy", 20)
            .classed('font-mono fill-amber-200 text-base', true)
            .text(d => `Toggle ${d.name}`)
    }
}

export class Time extends GuiElement {
    constructor(guiRef, scenario) {
        super(guiRef)
        this._scenario = scenario
        this.lastValue = 0
        this.x
        this.xScale
        this.play = false
        this.simSpeed = 1
    }

    draw(cbUpdate) {
        //Credits: https://coreui.io/blog/how-to-sleep-in-javascript/
        let that = this
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        }

        async function cycleSimulation() {
            while (that.play && that._scenario.getCurrentStep() < that._scenario.getAllSteps() - 1) {
                let speed
                if (that.simSpeed < 4) {
                    speed = that.simSpeed * that.simSpeed
                } else if (that.simSpeed > 3) {
                    speed = that.simSpeed * (that.simSpeed + 20)
                }
                else if (that.simSpeed > 7) {
                    speed = that.simSpeed * (that.simSpeed + 60)
                }
                that._scenario.stepForward()
                cbUpdate()
                await sleep(8000 / speed)
            }
        }

        let controllPanel = this.guiRef
            .append("g")
            .attr("id", "controllPanel")
            .attr("transform", d => `translate(${globalThis.innerWidth / 2 - ((globalThis.window.innerWidth / 2.5 * 1.165) / 2)}, ${globalThis.innerHeight - globalThis.window.innerHeight / 11})`)

        let rect = controllPanel
            .append("rect")
            .attr("id", "controllPanelRect")
            .attr("x", 0)
            .attr("width", function () {
                return globalThis.window.innerWidth / 2.5 * 1.165
            })
            .attr("height", function () {
                return globalThis.window.innerHeight / 11
            })
            .classed('stroke-0 fill-[#252e42] opacity-95 drop-shadow-lg', true)

        let controllPanelText = controllPanel
            .append("text")
            // .attr("dx", -30)
            .attr("id", "conrollPanelText")
            .attr("transform", `translate(250, 0)`)
            .classed('time fill-white text-2xl font-bold', true)
            .text(``)
            .style("text-anchor", "middle")
            .classed("invisible", true)

        controllPanelText
            .append("tspan")
            .text("Die Simulation umfasst 6 Stunden")
            .attr("dy", "1.2em")

        controllPanelText
            .append("tspan")
            .text("in einer Auflösung von 15 Minuten")
            .attr("dy", "1.2em")
            .attr("x", 0)

        controllPanel
            .append("text")
            .attr("id", "controllPanelStep")
            .attr("transform", `translate(${globalThis.window.innerWidth / 2.75 * 1.165}, 50)`)
            .classed('time fill-white text-2xl font-bold', true)
            .text(``)
            .style("text-anchor", "middle")

        let svg = controllPanel
            .append("svg")
            .attr("id", "controllPanelSVG")
            .attr("transform", `translate(20,0)`)
            .attr("width", function () {
                return globalThis.window.innerWidth
            })

        let playButton = svg
            .append("g")
            .attr("id", "playButton")
            .attr("fill", "white")
            .style("cursor", "pointer")
            .on("click", function () {
                if (!that.play) {
                    that.play = true
                    d3.select(this).attr("fill", "red")
                    d3.select("#pauseButton1").attr("fill", "white")
                    d3.select("#pauseButton2").attr("fill", "white")
                    cycleSimulation()
                }
            })

        playButton
            .append("path")
            .attr("d", "M 20 0 L 0 -15 L 0 15 Z")
            .attr("transform", `translate(${globalThis.window.innerWidth / 6}, 45)`)

        let pause = svg
            .append("g")
            .attr("id", "pauseButton1")
            .attr("fill", "red")
            .style("cursor", "pointer")
            .on("click", function () {
                if (that.play) {
                    that.play = false
                    d3.select("#pauseButton1").attr("fill", "red")
                    d3.select("#pauseButton2").attr("fill", "red")
                    d3.select("#playButton").attr("fill", "white")
                    cbUpdate()
                }
            })

        pause
            .append("path")
            .attr("d", "M 0 0 L 0 25 L 10 25 L 10 0 Z")
            .attr("transform", `translate(${globalThis.window.innerWidth / 5.5}, 33)`)

        let pause1 = svg
            .append("g")
            .attr("id", "pauseButton2")
            .attr("fill", "red")
            .style("cursor", "pointer")
            .on("click", function () {
                if (that.play) {
                    that.play = false
                    console.log(that.play)
                    d3.select("#pauseButton1").attr("fill", "red")
                    d3.select("#pauseButton2").attr("fill", "red")
                    d3.select("#playButton").attr("fill", "white")
                    cbUpdate()
                }
            })

        pause1
            .append("path")
            .attr("d", "M 0 0 L 0 25 L 10 25 L 10 0 Z")
            .attr("transform", `translate(${globalThis.window.innerWidth / 5.5 + 15}, 33)`)

        this.xScale = d3.scaleLinear()
            .domain([1, 10])
            .range([0, 200])
            .clamp(true)

        svg
            .append("line")
            .attr("id", "simScale")
            .attr("x1", this.xScale(1))
            .attr("x2", this.xScale(10))
            .attr("y1", 45)
            .attr("y2", 45)
            .attr("stroke", "#444")
            .attr("stroke-width", 15)
            .attr("transform", `translate(${globalThis.window.innerWidth / 4}, 0)`)

        let axisScale = svg
            .append("g")
            .attr("id", "simAxis")
            .attr("transform", `translate(${globalThis.window.innerWidth / 4}, 55)`)

        let scaleAxisBottom = d3.axisBottom(this.xScale)
            .ticks(10)
            .tickFormat(d3.format("d"))

        axisScale.call(scaleAxisBottom)

        axisScale.selectAll(".tick text")
            .style("fill", "white")
            .style("font-size", "20px")

        axisScale.selectAll(".tick line")
            .style("stroke", "white")

        let scaleSlider = svg
            .append("circle")
            .attr("id", "simSliderCircle")
            .attr("r", 10)
            .attr("cx", this.xScale(1))
            .attr("transform", `translate(${globalThis.window.innerWidth / 4}, 45)`)
            .attr("fill", "red")
            .style("cursor", "pointer")

        let simDrag = d3.drag()
            .on("start", () => d3.select("#simSliderCircle").style("cursor", "grabbing"))
            .on("drag", (event) => {
                let xPosition = event.x - globalThis.window.innerWidth / 4
                xPosition = Math.max(1, Math.min(rect.attr("width") - 100, xPosition))
                let value = Math.round(this.xScale.invert(xPosition))
                this.simSpeed = value
                d3.select("#simSliderCircle").attr("cx", this.xScale(value))
            })
            .on("end", (event) => {
                d3.select("#simSliderCircle").style("cursor", "grab")
                let xPosition = event.x - globalThis.window.innerWidth / 4
                xPosition = Math.max(1, Math.min(rect.attr("width") - 100, xPosition))
                let value = Math.round(this.xScale.invert(xPosition))
                this.simSpeed = value
                d3.select("#simSliderCircle").attr("cx", this.xScale(value))
            })
        scaleSlider.call(simDrag)

        let backArrow = svg
            .append("g")
            .attr("id", "backArrow")
            .attr("transform", "translate(40,120)")
            .style("cursor", "pointer")
            .style("fill", "#3498db")
            .style("transition", "fill 0.2s ease-in-out")
            .on("click", function () {
                that._scenario.stepBack()
                cbUpdate()
            })

        backArrow
            .append("path")
            .attr("d", "M -20 0 L 0 -15 L 0 15 Z")
            .attr("transform", "scale(2)")

        let forwardArrow = svg
            .append("g")
            .attr("id", "forwardArrow")
            .attr("transform", `translate(${rect.attr("width") - 80},120)`)
            .style("cursor", "pointer")
            .style("fill", "#3498db")
            .style("transition", "fill 0.2s ease-in-out")
            .on("click", function () {
                that._scenario.stepForward()
                cbUpdate()
            })
        forwardArrow
            .append("path")
            .attr("d", "M 20 0 L 0 -15 L 0 15 Z")
            .attr("transform", `translate(0, 0) scale(2)`)

        let maxSteps = that._scenario.getAllSteps()

        this.x = d3.scaleLinear()
            .domain([0, maxSteps - 2])
            .range([80, rect.attr("width") - 150])
            .clamp(true)

        svg
            .append("line")
            .attr("id", "sliderLine")
            .attr("x1", 40)
            .attr("x2", this.x(maxSteps + 1))
            .attr("y1", 80)
            .attr("y2", 80)
            .attr("stroke", "#444")
            .attr("stroke-width", 15)

        let axis = svg
            .append("g")
            .attr("id", "sliderAxis")
        //.attr("height", 200)
        //.attr("stroke", "#444")
        //.attr("stroke-width", 10)
        //.attr("transform", "translate(0, 60)")
        //  .call(d3.axisBottom(x).ticks(maxSteps - 0).tickFormat(d3.format("d")).tickValues(x.ticks(maxSteps).filter((d, i) => i % 20 === 0)))

        let axisBottom = d3.axisBottom(this.x)
            .ticks(maxSteps - 0)
            .tickFormat(d3.format("d"))
            .tickValues(this.x.ticks(maxSteps).filter((d, i) => i % 20 === 0))

        axis.call(axisBottom)

        axis.selectAll(".tick text")
            .attr("fill", "white")
            .attr("font-size", "20px")

        axis.selectAll(".tick line")
            .attr("stroke", "white")

        let slider = svg
            .append("circle")
            .attr("id", "sliderCircle")
            .attr("r", 10)
            .attr("cx", 0)
            .attr("cy", 110)
            .attr("fill", "red")
            .style("cursor", "grab")

        let drag = d3.drag()
            .on("start", () => d3.select("#sliderCircle").style("cursor", "grabbing"))
            .on("drag", (event) => {
                let xPosition = event.x
                xPosition = Math.max(80, Math.min(rect.attr("width") - 150, xPosition))
                let value = Math.round(this.x.invert(xPosition))
                d3.select("#sliderCircle").attr("cx", this.x(value))
                d3.select("#conrollPanelTime")
                    .text(`${ScenarioSimulator.getTimeByStep(value)} Uhr`)
                d3.select("#controllPanelStep")
                    .text(`${value} von ${this._scenario.getAllSteps() - 2} Schritten`)
            })
            .on("end", (event) => {
                d3.select("#sliderCircle").style("cursor", "grab")
                let xPosition = event.x
                xPosition = Math.max(80, Math.min(rect.attr("width") - 150, xPosition))
                let value = Math.round(this.x.invert(xPosition))
                this._scenario.step = value
                cbUpdate()
                this.update()
            })
        slider.call(drag)
    }

    update() {
        if (this._scenario.inSimulation) {
            d3.select("#conrollPanelText").classed("invisible", true)
        }
        d3.select("#controllPanelStep")
            .text(`${this._scenario.getCurrentStep()} von ${this._scenario.getAllSteps() - 1} Schritten`)

        let maxSteps = this._scenario.getAllSteps()
        let currentStep = this._scenario.getCurrentStep
        let rect = d3.select("#controllPanelRect").attr("width")
        let svg = d3.select("#controllPanelSVG")
        this.x = d3.scaleLinear()
            .domain([0, maxSteps - 1])
            .range([80, rect - 150])
            .clamp(true)
        if (maxSteps !== parseInt(d3.select("#sliderLine").attr("x2"))) {
            d3.select("#sliderLine")
                .attr("x2", rect - 191)
                .attr("transform", "translate(40,30)")
            d3.select("#sliderAxis").remove()
            svg
                .append("g")
                .attr("id", "sliderAxis")
                .attr("transform", "translate(0,120)")
                .call(d3.axisBottom(this.x).ticks(maxSteps - 0).tickFormat(d3.format("d")).tickValues(this.x.ticks(maxSteps).filter((d, i) => i % 40 === 0)))

            d3.select("#sliderAxis").selectAll(".tick text")
                .attr("fill", "white")
                .attr("font-size", "24px")

            d3.select("#sliderAxis").selectAll(".tick line")
                .attr("stroke", "white")
        }
        d3.select("#sliderCircle").attr("cx", this.x(this._scenario.getCurrentStep()))
        d3.select("#simSliderCircle").attr("cx", this.xScale(this.simSpeed))
    }
}

export class SideBarSmall extends GuiElement {
    constructor(guiRef, nodeManager, tuioListener, scenario) {
        super(guiRef)
        this.nodeManager = nodeManager
        this._scenario = scenario
        this.tuioListener = tuioListener
        this.currentDiagram = 0
    }

    draw() {
        const panelWidth = 440

        const padding = 10

        const panelHeaderHeight = 250
        const panelFooterHeight = 100
        const panelClassicHeight = 100
        const panelD3Height = 540
        const panelEmsHeight = 490

        const panelContentHeight = padding + panelClassicHeight + padding + panelD3Height + padding + panelEmsHeight + padding
        const panelHeight = panelHeaderHeight + panelContentHeight + panelFooterHeight + 6 * padding

        const diagramHeight = 100
        const diagramWidth = 250
        const that = this

        this._xScale = d3.scaleLinear()
            .range([0, diagramWidth]) //pixel
            .domain([0, 95]); //steps

        this._yScale = d3.scaleLinear()
            .range([diagramHeight, 0])
            .domain([0, 100]); //kW     

        this.aXScale = d3.scaleLinear()
            .range([0, 300])
            .domain([-1, 25])

        this.aYScale = d3.scaleLinear()
            .range([400, 0])
            .domain([0, 5000])

        this.parentSvgEntry = this.guiRef
            .append("g")
            .attr("id", "sideBarSVG")
            .attr("transform", d => `translate(${this.x - panelWidth - 30}, ${this.y - panelHeight - 30}) scale(1)`)

        this.parentSvgEntry
            .append("rect")
            .attr("id", "parentSvgEntry")
            .attr('width', panelWidth)
            .attr('height', panelHeight)
            .attr('rx', '0')
            .classed('stroke-0 fill-[#252e42] opacity-95 drop-shadow-lg', true)


        const innerPanel = this.parentSvgEntry
            .append("g")
            .attr("id", "sideBar")
            .attr("transform", d => `translate(${padding}, ${padding})`)

        drawPanelHeader(innerPanel)

        const panelContentBorder = innerPanel
            .append("g")
            .attr("id", "panelStatsClassic")
            .attr("transform", d => `translate(${padding}, ${padding + panelHeaderHeight + padding})`)

        panelContentBorder
            .append("rect")
            .attr("width", panelWidth - (4 * padding))
            .attr("height", panelContentHeight)
            .classed('stroke-0 stroke-white fill-none opacity-100', true)


        const panelContent = panelContentBorder
            .append("g")
            .attr("id", "panelContent")
            .attr("transform", d => `translate(${padding}, ${padding})`)

        panelContent
            .append("text")
            .classed("text-lg font-bold fill-white", "true")
            .classed("panelContent", true)
            .text("Szenarioübersicht")
            .attr("x", (panelWidth - (7 * padding)) / 2)
            .attr("y", padding)
            .style("text-anchor", "middle")

        drawPanelContentClassic(panelContent)

        const panelD3 = panelContent
            .append("g")
            .attr("transform", d => `translate(${padding}, ${panelClassicHeight + padding})`)
            .classed("panelContent", true)

        drawPanelD3Content(panelD3)

        drawPanelD3Diagram(panelD3)

        const panelEMS = panelContent
            .append("g")
            .attr("transform", d => `translate(${padding}, ${panelClassicHeight + padding + panelD3Height + padding})`)
            .classed("panelContent", true)

        drawPanelEmsContent(panelEMS)

        drawPanelEmsDiagram(panelEMS)

        const agentView = panelContent
            .append("g")
            .attr("id", "agentViewPanelContent")
            //.attr("transform", d => `translate(${padding}, ${ padding})`)
            .classed("invisible", true)

        drawAgentContent(agentView)

        drawAgentStatsDiagram(agentView, 0, [0, 5000])

        const panelFooter = innerPanel
            .append("g")
            .attr("id", "panelFooter")
            .attr("transform", d => `translate(${padding}, ${padding + panelHeaderHeight + padding + panelContentHeight + padding})`)

        panelFooter
            .append("rect")
            .attr("width", panelWidth - (4 * padding))
            .attr("height", panelFooterHeight)
            .classed('stroke-0 stroke-white fill-[#252e42] opacity-0', true)

        const footerText = panelFooter
            .append("text")
            .attr("transform", d => `translate(${padding}, ${padding})`)
            .attr("id", "panelFooterText")
            // .attr('x', padding)
            .attr('y', -4)
            .style("text-anchor", "left")
            .text(" ")

        let text = "Dieses Industrie-Areal bildet ein modernes Microgrid aus eigenen Verbrauchern und Erzeugern. "
        text += "Der wichtigste Schritt dahin ist die Energietransparenz."

        toMultilineText(footerText, text, 55, "fill-white font-normal text-sm")

        let textHeight = Math.ceil(text.length / 55) * 23

        const footerButton = panelFooter
            .append("g")
            .attr("transform", d => `translate(${padding}, ${padding + textHeight + 10})`)
            .attr("width", 55)
            .attr("height", 50)
            .attr("fill", "white")
            .style("cursor", "pointer")
            .on("click", async () => {
                that.showScenarioInfomation()
                let attack = await this.openAttackWindow()
                if (attack > -1 && attack < 5) {
                    that.nodeManager.initiateSimulation(attack)
                    that._scenario.initiateSimulation(attack)
                    that.tuioListener.initiateSimulation(globalThis, attack)
                    that.changeToAgentInfoBar()
                    that.inSimulation = true
                }
            })

        footerButton
            .append("rect")
            .attr("width", 170)
            .attr("height", 30)
            .attr("fill", "blue")
            .style("cursor", "pointer")

        footerButton
            .append("text")
            .attr("width", 55)
            .attr("height", 50)
            .attr("x", 85)
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .text("Lade Simulationsdatei")

        const hideButton = panelFooter
            .append("g")
            .attr("transform", d => `translate(${padding}, ${padding + textHeight + 10})`)
            .attr("width", 55)
            .attr("height", 50)
            .attr("fill", "white")
            .style("cursor", "pointer")
            .on("click", (d) => {
                if (!(parseInt(d3.select("#parentSvgEntry").attr("height")) === panelFooterHeight)) {
                    d3.select("#panelHeaderREF").classed("invisible", true)
                    d3.select("#panelStatsClassic").classed("invisible", true)
                    d3.select("#parentSvgEntry").attr("height", panelFooterHeight)
                    d3.select("#parentSvgEntry").attr("y", panelHeight - panelFooterHeight / 2)
                    d3.select("#panelFooterText").classed("invisible", true)
                } else {
                    d3.select("#panelHeaderREF").classed("invisible", false)
                    d3.select("#panelStatsClassic").classed("invisible", false)
                    d3.select("#parentSvgEntry").attr("height", panelHeight)
                    d3.select("#parentSvgEntry").attr("y", 0)
                    d3.select("#panelFooterText").classed("invisible", false)
                }

            })

        hideButton
            .append("rect")
            .attr("width", 150)
            .attr("height", 30)
            .attr("x", 224)
            .attr("fill", "blue")
            .style("cursor", "pointer")

        hideButton
            .append("text")
            .attr("width", 55)
            .attr("height", 50)
            .attr("x", 300)
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .text("Pannel umschalten")

        function drawPanelHeader(ref) {
            const panelHeader = ref
                .append("g")
                .attr("id", "panelHeaderREF")
                .attr("transform", d => `translate(${padding - 10}, ${padding})`)
                .classed("pheader", true)

            panelHeader
                .append("rect")
                .attr("id", "panelHeader")
                .attr("width", panelWidth - (4 * padding))
                .attr("height", panelHeaderHeight)
                .classed('stroke-0 stroke-white fill-[#252e42] opacity-0', true)

            const panelHeaderContent = panelHeader
                .append("g")
                .attr("transform", d => `translate(${padding}, ${padding})`)
                .attr("id", "panelHeaderContent")

            panelHeaderContent
                .append("svg:image")
                .classed("headerRemove", true)
                .attr('width', (panelWidth - (7 * padding)) / 2)
                .attr("xlink:href", "./images/graeper-logo.svg")

            panelHeaderContent
                .append("svg:image")
                .attr('width', (panelWidth - (7 * padding)) / 2)
                .attr('x', (panelWidth - (7 * padding)) / 2 + padding + 10)
                .attr('y', 20)
                .attr("xlink:href", "./images/offis-logo.svg")
                .on("click", function () {
                    let isDevAreaVisible = !d3.select("#devArea").classed("invisible")

                    if (isDevAreaVisible) {
                        d3.select("#devArea")
                            .classed("invisible", true)
                    } else {
                        d3.select("#devArea")
                            .classed("invisible", false)
                    }
                })

            panelHeaderContent
                .append("text")
                .attr("id", "textInfoBox")
                .attr('y', 180)
                .style("text-anchor", "middle")
                .text("")
                .classed("text-lg fill-white", "true")
                .append("tspan").text("Gemeinsam Forschen in Norddeutschland").attr("x", (panelWidth - (7 * padding)) / 2).attr("dy", "1.2em")
            // .append("tspan").text("in Norddeutschland").attr("x", (panelWidth-(7*padding))/2).attr("dy", "1.2em")
        }

        d3.selectAll(".statistic-panel-text")
            .classed("fill-white text-base", true)



        function drawPanelContentClassic(ref) {
            const panelClassic = ref
                .append("g")
                .attr("transform", d => `translate(${padding}, ${3 * padding})`)
                .attr("id", "panelClassic")

            const panelClassicColor = panelClassic
                .append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .classed(`fill-[${globalThis.config.ui.colors.classic_bg}]`, true)
                .classed("panelContent", true)

            const panelClassicContent = panelClassic
                .append("text")
                .attr("transform", d => `translate(${3 * padding}, 0)`)
                .classed("statistic-panel-text font-bold", true)
                .classed("panelContent", true)
                .text("Klassisches Stromnetz ")
                .attr("dy", "1.2em")

            const classicFeatrues = [
                "Keine Energie-Transparenz im Netz",
                "Verbrauchsdaten manuell erfassen"
            ]

            panelClassicContent
                .selectAll("tspan")
                .data(classicFeatrues)
                .join("tspan")
                .text(d => d).attr("x", 20).attr("dy", "1.3em").classed("font-normal", true)
                .classed("panelContent", true)

            ref
                .selectAll("path")
                .data(classicFeatrues)
                .join("path")
                .attr("transform", (d, i) => `translate(35, ${i * 21 + 55}) scale(0.9)`)
                .classed("stroke-[#f03a17] fill-none stroke-[4px]", true)
                .classed("panelContent", true)
                .attr("d", globalThis.config.ui.icons.x)

        }

        function drawPanelD3Content(ref) {

            const tutorialD3 = new InfoBox("infobox-d3")
            tutorialD3.width = 300
            tutorialD3.height = panelD3Height - 100
            tutorialD3.x = 3 * padding
            tutorialD3.y = 40
            tutorialD3.rectCss = "stroke-0 stroke-black fill-[#364d6f]"
            tutorialD3.textHead = "Hinweis"
            tutorialD3.textHeadCss = "fill-white text-xl font-bold"
            tutorialD3.textContent = "Noch kein Messequipment installiert."
            tutorialD3.textContentCss = "fill-white font-normal"
            tutorialD3.draw()

            ref
                .append(function () { return tutorialD3.element.node() })

            const d3Features = [
                "Transparenz in der Niederspannung",
                "Energiedashboard",
                "Erkennung kritischer Ströme",
                "Manuelle Fernschaltung"
            ]

            const panelD3Color = ref
                .append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .classed("fill-[#2784c7]", true)

            const panelD3Content = ref
                .append("text")
                .attr("transform", d => `translate(${3 * padding}, 0)`)
                .classed("statistic-panel-text font-bold", true)
                .classed("panelContent", true)
                .text("Smart Monitoring")
                .attr("dy", "1.3em")

            panelD3Content
                .selectAll("tspan")
                .data(d3Features)
                .join("tspan")
                .text(d => d).attr("x", 20).attr("dy", "1.3em").classed("d3-dependant-view font-normal", true)
                .classed("panelContent", true)

            ref
                .selectAll("path")
                .data(d3Features)
                .join("path")
                .attr("transform", (d, i) => `translate(28, ${i * 21 + 25}) scale(0.7)`)
                .classed(`stroke-[${globalThis.config.ui.colors.d3_bg}] fill-none stroke-[4px] d3-dependant-view`, true)
                .classed("panelContent", true)
                .attr("d", globalThis.config.ui.icons.check)

            const dailyStats = ref
                .append("g")
                .attr("id", "panelD3Statistics")
                .classed("d3-dependant-view", true)
                .classed("panelContent", true)
                .attr("transform", d => `translate(${3 * padding}, 150)`)

            dailyStats
                .append("text")
                .text("Tagesstatistik")
                .attr("y", -10)
                .classed("statistic-panel-text font-bold", true)
                .classed("panelContent", true)
        }

        function drawPanelD3Diagram(ref) {
            const d3Diagram = ref
                .append("g")
                .classed("d3-dependant-view", true)
                .attr("id", "panelD3Diagram")
                .attr("transform", d => `translate(${6 * padding}, 370)`)

            d3Diagram
                .append("g")
                .classed("yAxis text-white stroke-1 border-1", true)
                .call(d3.axisLeft(that._yScale)
                    .ticks(4)
                );

            d3Diagram
                .append("g")
                .classed("xAxis text-white stroke-1 border-1", true)
                .attr("transform", `translate(0, ${diagramHeight})`)
                .call(
                    d3.axisBottom(that._xScale)
                        .ticks(4)
                        .tickFormat(step => ScenarioSimulator.getTimeByStep(step))
                        .tickSizeOuter(0)
                );

            const label = d3Diagram
                .append("g")
                .attr("transform", `translate(0, ${diagramHeight + 40})`)

            label
                .append("text")
                .text("Gemessene Last (kW) am Netzübergabepunkt")
                // .attr("y", )
                .classed("statistic-panel-text text-sm", true)

            label
                .append("line")
                .attr("x1", -20)
                .attr("y1", -5)
                .attr("x2", -10)
                .attr("y2", -5)
                .classed("stroke-2 stroke-white", true)
        }

        function drawPanelEmsContent(ref) {

            const tutorialD3 = new InfoBox("infobox-ems")
            tutorialD3.width = 300
            tutorialD3.height = panelEmsHeight - 100
            tutorialD3.x = 3 * padding
            tutorialD3.y = 40
            tutorialD3.rectCss = "stroke-0 stroke-black fill-[#364d6f]"
            tutorialD3.textHead = "Hinweis"
            tutorialD3.textHeadCss = "fill-white text-xl font-bold"
            tutorialD3.textContent = "Noch kein Energiemanagementsystem installiert."
            tutorialD3.textContentCss = "fill-white font-normal"
            tutorialD3.draw()

            ref
                .append(function () { return tutorialD3.element.node() })

            const panelEmsColor = ref
                .append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .classed(`fill-[${globalThis.config.ui.colors.ems_bg}]`, true)

            const panelEmsContent = ref
                .append("text")
                .attr("transform", d => `translate(${3 * padding}, 0)`)
                .classed("statistic-panel-text font-bold", true)
                .text("Energiemanagement")
                .attr("dy", "1.3em")

            const emsFeatures = [
                "Erfassung diverser Umgebungsdaten",
                "Detaillierte Auswertung",
                "Verarbeitung von Prognosen",
                "Optimierung von Anlagenfahrplänen",
                "Netzdienliche Spitzenlastglättung"
            ]

            panelEmsContent
                .selectAll("tspan")
                .data(emsFeatures)
                .join("tspan")
                .text(d => d).attr("x", 20).attr("dy", "1.3em").classed("ems-dependant-view font-normal", true)

            ref
                .selectAll("path")
                .data(emsFeatures)
                .join("path")
                .attr("transform", (d, i) => `translate(28, ${i * 21 + 25}) scale(0.7)`)
                .classed(`stroke-[${globalThis.config.ui.colors.ems_bg}] fill-none stroke-[4px] ems-dependant-view`, true)
                .attr("d", globalThis.config.ui.icons.check)

            const dailyStats = ref
                .append("g")
                .attr("id", "panelEmsStatistics")
                .classed("ems-dependant-view", true)
                .attr("transform", d => `translate(${3 * padding}, 170)`)

            dailyStats
                .append("text")
                .text("Tagesstatistik")
                .attr("y", -10)
                .classed("statistic-panel-text font-bold", true)
        }

        function drawPanelEmsDiagram(ref) {
            const emsDiagram = ref
                .append("g")
                .classed("ems-dependant-view", true)
                .attr("id", "panelEmsDiagram")
                .attr("transform", d => `translate(${6 * padding}, 320)`)

            emsDiagram
                .append("g")
                .classed("yAxis text-white stroke-1 border-1", true)
                .call(d3.axisLeft(that._yScale)
                    .ticks(4));

            emsDiagram
                .append("g")
                .classed("xAxis text-white stroke-1 border-1", true)
                .attr("transform", `translate(0, ${diagramHeight})`)
                .call(
                    d3.axisBottom(that._xScale)
                        .ticks(4)
                        .tickFormat(step => ScenarioSimulator.getTimeByStep(step))
                        .tickSizeOuter(0)
                );

            const label = emsDiagram
                .append("g")
                .attr("transform", `translate(0, ${diagramHeight + 40})`)

            label
                .append("text")
                .text("Optimierte Last (kW) am Netzübergabepunkt")
                // .attr("y", )
                .classed("fill-green-400 statistic-panel-text text-sm", true)

            label
                .append("line")
                .attr("x1", -20)
                .attr("y1", -5)
                .attr("x2", -10)
                .attr("y2", -5)
                .classed("stroke-green-400 stroke-2", true)

            label
                .append("text")
                .text("Erwartete Last (kW) am Netzübergabepunkt")
                .attr("y", 20)
                .classed("fill-white statistic-panel-text text-sm", true)

            label
                .append("line")
                .attr("x1", -20)
                .attr("y1", 15)
                .attr("x2", -10)
                .attr("y2", 15)
                .classed("stroke-yellow-400 stroke-2", true)
        }

        function drawAgentContent(ref) {

            const agentStats = new InfoBox("infobox-agent")
            agentStats.width = 300
            agentStats.height = panelD3Height - 130
            agentStats.x = 3 * padding
            agentStats.y = -60
            agentStats.rectCss = "stroke-0 stroke-black fill-[#364d6f]"
            //agentStats.textHead = "Hinweis"
            agentStats.textHeadCss = "fill-white text-xl font-bold"
            //agentStats.textContent = "Noch keine Agenten initialisiert"
            agentStats.textContentCss = "fill-white font-normal"
            agentStats.draw()

            ref
                .append(function () { return agentStats.element.node() })

            const agentFeatures = [
                "Erfassung diverser Umgebungsdaten",
                "Detaillierte Auswertung",
                "Verarbeitung von Prognosen",
                "Optimierung von Anlagenfahrplänen",
                "Netzdienliche Spitzenlastglättung"
            ]

            const dailyStats = ref
                .append("g")
                .attr("id", "panelAgentStatistics")
                .classed("ems-dependant-view", true)
                .classed("agentStats", true)
                .attr("transform", d => `translate(${3 * padding}, 120)`)

            if (!that.inSimulation) {
                d3.select("#infobox-agent").classed("invisible", true)
            } else {
                d3.select("#infobox-agent").classed("invisible", false)
            }
        }

        function drawAgentStatsDiagram(ref, domainX, domainY) {

            let scalarY = (Math.abs(domainY[0]) + Math.abs(domainY[1])) / 12.5

            let agentTargetDiagram = ref
                .append("g")
                .attr("id", "agentTargetDiagram")

            agentTargetDiagram
                .append("g")
                .attr("id", "agentTargetDiagramY")
                .classed("yAxis text-white stroke-1 border-1", true)
                .attr("transform", "translate(30, -50)")
                .call(d3.axisLeft(that.aYScale)
                    .ticks(10)
                    .tickFormat(d3.format("d"))
                    .tickValues(d3.range(domainY[0], domainY[1], scalarY)))

            agentTargetDiagram
                .append("g")
                .attr("id", "agentTargetX")
                .classed("xAxis text-white stroke-1 border-1", true)
                .attr("transform", `translate(30, ${350})`)
                .call(
                    d3.axisBottom(that.aXScale)
                        .ticks(24)
                        .tickFormat(d3.format("d"))
                        .tickValues(d3.range(0, 25, 4))
                )

            agentTargetDiagram.selectAll(".tick text")
                .attr("font-size", "20px")

        }
    }

    update() {
        // d3.selectAll(".d3-dependant-view")
        //     .classed("invisible", !isTrafoD3Active)

        // d3.selectAll(".ems-dependant-view")
        //     .classed("invisible", !isEmsActive && !isTrafoD3Active)


        this.updateD3Statistics()
        this.updateEmsStatistics()
        // console.log(this._scenario._energyDeviceList['trafo_d3'].historyInW)

        if (Object.keys(this._scenario._energyDeviceList).length > 0 && this._scenario._energyDeviceList['trafo_d3']) {
            this.updateD3Diagram(this._scenario._energyDeviceList['trafo_d3'].historyInW)
            this.updateEmsDiagram(this._scenario._energyDeviceList['trafo_d3'].historyInW)
        }
        if (this.inSimulation) {
            this.updateAgentDiagram()
        }
    }

    updateD3Statistics() {
        const ref = d3.select("#panelD3Statistics")
        // console.log("updateD3Statistics")
        //console.log(this._scenario.getD3Statistics())
        d3.select("#panelD3Statistics")
            .selectAll("g")
            .data(this._scenario.getD3Statistics())
            .join((enter) => {

                let tile = new TileIconTextGroup()
                enter.append((d, i) => {
                    // console.log(d)
                    tile.width = 150
                    tile.height = 60
                    tile.x = (i % 2) * (tile.width + 10)
                    tile.y = Math.floor(i / 2) * 70
                    tile.textHead = d[0]
                    tile.textValue = d[1]
                    tile.textUnit = d[2]
                    tile.iconPath = d[3]
                    tile.draw()
                    return tile.element.node()
                })

                enter.selectAll(".tile-rect")
                    .classed("stroke-0 fill-[#364d6f] opacity-95 drop-shadow-lg", true)

                enter.selectAll(".tile-text-head")
                    .classed("fill-gray-200 text-base font-normal", true)

                enter.selectAll("tspan")
                    .classed("fill-white text-2xl font-bold", true)

            },
                update => {
                    // update.call(d => { console.log("Exiting lines"); console.log(d) })
                    update.select(".tile-text-value")
                        .text(d => d[1].toFixed(0))
                }
            )
    }

    updateD3Diagram(data) {
        if (this._scenario._energyDeviceList['trafo_d3'].historyInW.length > 0) {
            let min = d3.min(this._scenario._energyDeviceList['trafo_d3'].historyInW) / 1000 > 0 ? 0 : d3.min(this._scenario._energyDeviceList['trafo_d3'].historyInW) / 1000
            this._yScale = d3.scaleLinear()
                .range([100, 0])
                .domain([min, d3.max(this._scenario._energyDeviceList['trafo_d3'].historyInW) / 1000]); //kW

            d3.select("#sideBar").selectAll(".yAxis")
                .call(d3.axisLeft(this._yScale)
                    .ticks(4)
                )

            d3.select("#sideBar").selectAll(".xAxis")
                .attr("transform", `translate(0, ${this._yScale(0)} )`)
        }

        const lineGenerator = d3.line()
            .x((d, i) => { return this._xScale(i) })
            .y((d, i) => { return this._yScale(d) })

        let historicalData = data.slice(0, this._scenario.step).map((x) => x / 1000)
        // let historicalData = data.map((x) => x/1000)

        d3.select("#panelD3Diagram")
            .selectAll(".line")
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
            .classed("stroke-white stroke-2 fill-none", true)
    }

    updateEmsStatistics() {
        // console.log("updateEmsStatistics")

        d3.select("#panelEmsStatistics")
            .selectAll("g")
            .data(this._scenario.getEmsStatistics())
            .join((enter) => {

                let tile = new TileIconTextGroup()
                enter.append((d, i) => {
                    //console.log(d)
                    tile.width = 150
                    tile.height = 60
                    tile.x = (i % 2) * (tile.width + 10)
                    tile.y = Math.floor(i / 2) * 70
                    tile.textHead = d[0]
                    tile.textValue = d[1]
                    tile.textUnit = d[2]
                    tile.iconPath = d[3]
                    tile.draw()
                    return tile.element.node()
                })

                enter.selectAll(".tile-rect")
                    .classed("stroke-0 fill-[#364d6f] opacity-95 drop-shadow-lg", true)

                enter.selectAll(".tile-text-head")
                    .classed("fill-gray-200 text-base font-normal", true)

                enter.selectAll("tspan")
                    .classed("fill-white text-2xl font-bold", true)

            },
                update => {
                    // update.call(d => { console.log("Exiting lines"); console.log(d) })
                    update.select(".tile-text-value")
                        .text(d => d[1].toFixed(0))
                }
            )
    }

    updateEmsDiagram(data) {
        const lineGenerator = d3.line()
            .x((d, i) => { return this._xScale(i) })
            .y((d, i) => { return this._yScale(d) })

        const prognosisLineGenerator = d3.line()
            .x((d, i) => { return this._xScale(i + this._scenario.step) })
            .y((d, i) => { return this._yScale(d) })

        let historicalData = data.slice(0, this._scenario.step).map((x) => x / 1000)
        let prognosisData = data.slice(this._scenario.step + 1, globalThis.config.scenario.steps - 1).map((x) => x / 1000)

        d3.select("#panelEmsDiagram")
            .selectAll(".line")
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
            .classed("diagram-historical ems-dependant-view", true)
            .classed("stroke-green-400 stroke-2 fill-none", true)

        d3.select("#panelEmsDiagram")
            .selectAll(".line-prognosis")
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

    updateAgentDiagram() {

        switch (this.currentDiagram) {
            case 0: {
                let coordinate = []
                d3.select("#agentHeader").text("Übersicht der Zielfunktion")
                d3.select("#agentTargetDiagram")
                    .selectAll(".line")
                    .data(this._scenario.getTargetValueDiagramData())
                    .join(enter => {
                        enter.each(function (d, i) {
                            coordinate[i] = [i, d]
                        })

                        let lineGenerator = d3.line()
                            .x(d => this.aXScale(d[0]))
                            .y(d => this.aYScale(d[1]))

                        let g = enter.append("g").attr("class", "line")
                            .classed("agentDiagram", true)

                        g
                            .append("path")
                            .datum(coordinate)
                            .attr("d", lineGenerator)
                            .attr("transform", "translate(30, -50)")
                            .attr("fill", "none")
                            .attr("stroke", "red")
                            .classed("agentDiagram", true)

                        console.log(coordinate)
                        g.selectAll("circle")
                            .data(coordinate)
                            .join("circle")
                            .attr("cx", d => this.aXScale(d[0]))
                            .attr("cy", d => this.aYScale(d[1]))
                            .attr("transform", "translate(30, -50)")
                            .attr("r", 4)
                            .attr("fill", "black")
                            .classed("agentDiagram", true)

                    },
                        update => {
                            let lineGenerator = d3.line()
                                .x(d => this.aXScale(d[0]))
                                .y(d => this.aYScale(d[1]))
                            update.each(function (d, i) {
                                coordinate[i] = [i, d]
                            })
                            update.select("path")
                                .datum(coordinate)
                                .transition()
                                .duration(100)
                                .attr("d", lineGenerator)

                            update.selectAll("circle")
                                .data(coordinate)
                                .join(enter =>
                                    enter.append("circle")
                                        .attr("r", 4)
                                        .attr("fill", "black"),
                                    update => update,
                                    exit => exit.remove()
                                )
                                .transition()
                                .duration(100)
                                .attr("cx", d => this.aXScale(d[0]))
                                .attr("cy", d => this.aYScale(d[1]))

                            return update
                        },
                        exit => exit.remove()
                    )
                break
            }
            case 1: {
                let currentValue = this._scenario.getCurrentSimulationState()
                let coordinate = []

                this.aYScale = d3.scaleLinear()
                    .range([400, 0])
                    .domain([0, 5000])

                d3.select("#agentTargetDiagramY")
                    .call(d3.axisLeft(this.aYScale)
                        .ticks(10)
                        .tickFormat(d3.format("d"))
                        .tickValues(d3.range(0, 5000, 400)))

                d3.select("#agentTargetDiagramY").selectAll(".tick text")
                    .attr("font-size", "20px")

                d3.select("#agentHeader").text("Aktueller Simulationswert")
                d3.selectAll(".agentDiagram").remove()
                d3.select("#agentTargetDiagram")
                    .selectAll(".line")
                    .data(this._scenario.getCurrentSimulationState())
                    .join(enter => {
                        enter.each(function (d, i) {
                            coordinate[i] = [i, d]
                        })
                        let lineGenerator = d3.line()
                            .x(d => this.aXScale(d[0]))
                            .y(d => this.aYScale(d[1]))

                        let g = enter.append("g").attr("class", "line")

                        g
                            .append("path")
                            .datum(coordinate)
                            .attr("d", lineGenerator)
                            .attr("transform", "translate(30, -50)")
                            .attr("fill", "none")
                            .attr("stroke", "red")

                        g.selectAll("circle")
                            .data(coordinate)
                            .join("circle")
                            .attr("cx", d => this.aXScale(d[0]))
                            .attr("cy", d => this.aYScale(d[1]))
                            .attr("transform", "translate(30, -50)")
                            .attr("r", 4)
                            .attr("fill", "black")
                    },
                        update => {
                            let lineGenerator = d3.line()
                                .x(d => this.aXScale(d[0]))
                                .y(d => this.aYScale(d[1]))
                            update.each(function (d, i) {
                                coordinate[i] = [i, d]
                            })
                            update.select("path")
                                .datum(coordinate)
                                .transition()
                                .duration(100)
                                .attr("d", lineGenerator)

                            update.selectAll("circle")
                                .data(coordinate)
                                .join(enter =>
                                    enter.append("circle")
                                        .attr("r", 4)
                                        .attr("fill", "black"),
                                    update => update,
                                    exit => exit.remove()
                                )
                                .transition()
                                .duration(100)
                                .attr("cx", d => this.aXScale(d[0]))
                                .attr("cy", d => this.aYScale(d[1]))

                            return update
                        },
                        exit => exit.remove())
                break
            }
            case 2:
                {
                    d3.select("#agentHeader").text("Differenzwert")

                    let currentValue = this._scenario.getCurrentDiff()
                    let coordinate = []

                    let min = Math.floor(Math.min(...currentValue) / 100) * 100
                    let max = Math.floor(Math.max(...currentValue) / 100) * 100
                    if (min < this.aYScale.domain()[0]) {
                        this.aYScale = d3.scaleLinear()
                            .range([400, 0])
                            .domain([min * 1.1, this.aYScale.domain()[1]])
                    } else if (min - 1000 > this.aYScale.domain()[0]) {
                        this.aYScale = d3.scaleLinear()
                            .range([400, 0])
                            .domain([min * 1.1, this.aYScale.domain()[1]])
                    }

                    if (max > this.aYScale.domain()[1]) {
                        this.aYScale = d3.scaleLinear()
                            .range([400, 0])
                            .domain([this.aYScale.domain()[0], max * 1.1])
                    } else if (max + 1000 < this.aYScale.domain()[1]) {
                        this.aYScale = d3.scaleLinear()
                            .range([400, 0])
                            .domain([this.aYScale.domain()[0], max * 1.1])
                    }

                    let scale = (Math.abs(this.aYScale.domain()[1]) + Math.abs(this.aYScale.domain()[0])) / 10
                    console.log(scale / 8.8)




                    d3.select("#agentTargetDiagramY")
                        .call(d3.axisLeft(this.aYScale)
                            .ticks(10)
                            .tickFormat(d3.format("d"))
                            .tickValues(d3.range(this.aYScale.domain()[0], this.aYScale.domain()[1], scale)))

                    d3.select("#agentTargetDiagramY").selectAll(".tick text")
                        .attr("font-size", "20px")

                    d3.selectAll(".agentDiagram").remove()
                    d3.select("#agentTargetDiagram")
                        .selectAll(".line")
                        .data(this._scenario.getCurrentDiff())
                        .join(enter => {
                            enter.each(function (d, i) {
                                coordinate[i] = [i, d]
                            })
                            let lineGenerator = d3.line()
                                .x(d => this.aXScale(d[0]))
                                .y(d => this.aYScale(d[1]))

                            let g = enter.append("g").attr("class", "line")

                            g
                                .append("path")
                                .datum(coordinate)
                                .attr("d", lineGenerator)
                                .attr("transform", "translate(30, -50)")
                                .attr("fill", "none")
                                .attr("stroke", "red")

                            g.selectAll("circle")
                                .data(coordinate)
                                .join("circle")
                                .attr("cx", d => this.aXScale(d[0]))
                                .attr("cy", d => this.aYScale(d[1]))
                                .attr("transform", "translate(30, -50)")
                                .attr("r", 4)
                                .attr("fill", "black")
                        },
                            update => {
                                let lineGenerator = d3.line()
                                    .x(d => this.aXScale(d[0]))
                                    .y(d => this.aYScale(d[1]))
                                update.each(function (d, i) {
                                    coordinate[i] = [i, d]
                                })
                                update.select("path")
                                    .datum(coordinate)
                                    .transition()
                                    .duration(100)
                                    .attr("d", lineGenerator)

                                update.selectAll("circle")
                                    .data(coordinate)
                                    .join(enter =>
                                        enter.append("circle")
                                            .attr("r", 4)
                                            .attr("fill", "black"),
                                        update => update,
                                        exit => exit.remove()
                                    )
                                    .transition()
                                    .duration(100)
                                    .attr("cx", d => this.aXScale(d[0]))
                                    .attr("cy", d => this.aYScale(d[1]))

                                return update
                            },
                            exit => exit.remove())
                    break
                }
        }
    }

    changeToAgentInfoBar() {
        let that = this
        d3.select("#attackScenarioDesc").remove()
        d3.select("#infobox-ems").remove()
        d3.select("#infobox-d3").remove()
        //d3.select("#panelStatsClassic").remove()
        d3.selectAll(".panelContent").remove()
        d3.select(".headerRemove").remove()
        d3.select("#textInfoBox").remove()
        d3.select("#panelFooterText").remove()
        d3.select("#panelClassic").remove()
        d3.select("#agentViewPanelContent").classed("invisible", false)
        d3.select("#infobox-agent").classed("invisible", false)
        d3.select(".agentStats").classed("invisible", false)
        d3.select("#sideBarSVG").attr("transform", d => `translate(${globalThis.window.innerWidth - 420 - 30}, ${globalThis.window.innerHeight - 720 - 600}) scale(1)`)
        d3.select("#panelFooter").attr("transform", d => `translate(10, ${10 + 250 + 10 + 300 + 10 + 600})`)
        d3.select("#panelHeader").attr("height", 150)
        let panelHeaderContent = d3.select("#panelHeaderContent")
            .append("text")
            .append("tspan")
            .classed("text-lg fill-white", "true")
            .attr("x", 0)
            .attr("y", 20)
            .attr("dy", "1.2em")
            .attr('width', 220)
            .text("Bachelorabschlussarbeit")

        panelHeaderContent
            .append("tspan")
            .classed("text-lg fill-white", "true")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .attr('width', 220)
            .text("von Jan Heine")

        let agentStatistics = d3.select("#sideBar")
            .append("g")
            .attr("id", "agentStatistics")
            .attr("transform", d => 'translate(10, 170)')

        agentStatistics
            .append("rect")
            .attr("width", 420 - (4 * 10))
            .attr("height", 300)
            .classed('stroke-0 stroke-white fill-none opacity-100', true)

        let agentPanelContent = agentStatistics
            .append("g")
            .attr("transform", 'translate(10, 10)')

        let textForDiagram = agentPanelContent
            .append("text")
            .classed("text-lg font-bold fill-white", "true")
            .attr("id", "agentHeader")
            .text("")
            .attr("x", (420 - (7 * 10)) / 2)
            .attr("y", 10)
            .style("text-anchor", "middle")

        textForDiagram
            .append("tspan")
            .text("Differenzwert von Zielfunktion ")
            .attr("dy", "1.2em")
            .attr("x", 175)
            .attr("y", -20)

        textForDiagram
            .append("tspan")
            .text("und aktuellem Simulationswert")
            .attr("dy", "1.2em")
            .attr("x", 175)
        //.attr("y", -20)

        let currentAttackScenarioDescription = agentPanelContent
            .append("text")
            .classed("text-lg font-bold fill-white", "true")
            .attr("id", "attackScenarioDescription")
            .text("")

        let backToPrevDiagram = agentStatistics
            .append("g")
            .attr("id", "forwardDiagramArrow")
            .attr("transform", "translate(25,10)")
            .style("cursor", "pointer")
            .style("fill", "#3498db")
            .style("transition", "fill 0.2s ease-in-out")
            .on("click", function () {
                console.log(that.currentDiagram)
                if (that.currentDiagram > 0) {
                    that.currentDiagram -= 1
                    that.updateAgentDiagram()
                }
            })

        backToPrevDiagram
            .append("path")
            .attr("d", "M -20 0 L 0 -15 L 0 15 Z")
            .attr("transform", "scale(1)")

        let toNextDiagram = agentStatistics
            .append("g")
            .attr("id", "forwardArrow")
            .attr("transform", `translate(350, 10)`)
            .style("cursor", "pointer")
            .style("fill", "#3498db")
            .style("transition", "fill 0.2s ease-in-out")
            .on("click", function () {
                console.log(that.currentDiagram)
                if (that.currentDiagram < 2) {
                    console.log("click")
                    that.currentDiagram += 1
                    that.updateAgentDiagram()
                    console.log(that.currentDiagram)
                }
            })

        toNextDiagram
            .append("path")
            .attr("d", "M 20 0 L 0 -15 L 0 15 Z")
            .attr("transform", `scale(1)`)
    }

    showScenarioInfomation() {
        d3.select("#infobox-ems").remove()
        d3.select("#infobox-d3").remove()
        d3.selectAll(".panelContent").remove()
        d3.select("#textInfoBox").remove()
        console.log(typeof "Folgende Angriffsszenarien können gewählt werden")
        let text0 = ["Folgende Angriffsszenarien können", "gewählt werden:"]
        let text1 = ["1. Kein Angriffsszenario", "\u00A0","Kein Angriff, hier arbeitet die verteilte",  "Optimierung ohne eine manipulation",  "eines Angreifers nach dem vorgegebenen", "Muster (Combinatorial Optimization", "Heuristic for Distributed Agents COHDA).", "Weitere Informationen über diese", "Optimierung finden Sie hier: LINK"]
        let text2 = ["2. Agent manipuliert Fahrplan", "\u00A0", "Ein Angriffsszenario in dem versendete", "Fahrplänen von einem unterwanderten , ", "Agenten manipuliert werden."]
        let text3 = ["3. Zielfunktion manipuliert", "\u00A0", "Ein weiteres Angriffsszenario, in dem" , "der Angreifer die Zielfunktion, also", "die aktuelle angepeilte Gesamtkonfiguration", "der Agentenfahrpläne verändert. Somit", "Optimieren die Agenten ihre", "Fahrpläne auf ein falsches Ziel."]
        let text4 = ["4. Manipulation der Gesamtbewertung", "\u00A0", "TODO: Beschreibung ergänzen"]
        let fullText = [...text0, "\u00A0", ...text1, "\u00A0", ...text2, "\u00A0", ...text3, "\u00A0", ...text4]
        let attackScenarioDesc = d3.select("#panelStatsClassic")
            .append("text")
            .attr("id", "attackScenarioDesc")
            .classed('time fill-white text-xl font-bold', true)

        attackScenarioDesc
            .selectAll("tspan")
            .data(fullText)
            .enter()
            .append("tspan")
            .text(d => { return d })
            .classed('time fill-white text-xl font-bold', true)
            .attr("dy", (d, i) => i === 0 ? "0em" : "1.2em")
            .attr("x", 0)
    }

    async openAttackWindow() {
        return new Promise((resolve) => {
            let that = this
            let scenarioValue = 0
            d3.select("#infobox-begin").classed("invisible", true)
            let attackSelection = d3.select("#mainSVG")
                .append("g")
                .attr("id", "attackSelection")
                .attr("width", globalThis.window.innerWidth / 6)
                .attr("height", globalThis.window.innerHeight / 3)
                .attr("transform", `translate(${(globalThis.window.innerWidth / 2) - ((globalThis.window.innerWidth / 3) / 2)}, ${(globalThis.window.innerHeight / 2) - ((globalThis.window.innerHeight / 6) / 2)})`)
                .classed("attackWindowSelection", true)

            let rect = attackSelection
                .append("rect")
                .attr("width", globalThis.window.innerWidth / 3)
                .attr("height", globalThis.window.innerHeight / 6)
                .classed('stroke-0 fill-[#252e42] opacity-95 drop-shadow-lg', true)
                .classed("attackWindowSelection", true)
            //.attr("transform", `translate(${(globalThis.window.innerWidth / 2) - ((globalThis.window.innerWidth / 5) / 2)}, ${(globalThis.window.innerHeight / 2) - ((globalThis.window.innerHeight / 8) / 2)})`)

            let rectG = attackSelection
                .append("g")
                .attr("width", globalThis.window.innerWidth / 3)
                .attr("height", globalThis.window.innerHeight / 6)
                .classed("attackWindowSelection", true)
            //.attr("transform", `translate(${globalThis.window.innerWidth / 5}, ${globalThis.window.innerHeight / 8})`)

            let gText = rectG
                .append("text")
                .classed("attackWindowSelection", true)

            gText
                .append("tspan")
                .text("Bitte wählen Sie ihr gewünschtes Angriffsszenario.")
                .attr("x", 0)
                .attr("dy", "1.2em")
                .classed("attackWindowSelection", true)

            gText
                .append("tspan")
                .text("Für mehr informationen nutzen Sie die Informationsfläche rechts")
                .attr("x", 0)
                .attr("dy", "1.2em")
                .classed("attackWindowSelection", true)

            gText.selectAll("tspan")
                .attr("font-size", "20px")
                .classed("fill-white text-2xl font-bold", true)
                .classed("attackWindowSelection", true)


            let rectConfirm = attackSelection
                .append("rect")
                .attr("width", 100)
                .attr("height", 50)
                .attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 50}, ${globalThis.window.innerHeight / 6 - 60})`)
                .attr("fill", "grey")
                .style("cursor", "pointer")
                .on("click", () => {
                    resolve(scenarioValue)
                    d3.selectAll(".attackWindowSelection").remove()
                })
                .classed("attackWindowSelection", true)

            let confirmG = attackSelection
                .append("g")
                .attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 37}, ${globalThis.window.innerHeight / 6 - 30})`)
                .style("cursor", "pointer")
                .append("text")
                .text("Bestätigen")
                .style("cursor", "pointer")
                .on("click", () => {
                    resolve(scenarioValue)
                    d3.selectAll(".attackWindowSelection").remove()
                })
                .classed("attackWindowSelection", true)


            let backScenario = attackSelection
                .append("g")
                .attr("id", "forwardDiagramArrow")
                .attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 200},${(globalThis.window.innerHeight / 6) / 2})`)
                .style("cursor", "pointer")
                .style("fill", "#3498db")
                .style("transition", "fill 0.2s ease-in-out")
                .on("click", function () {
                    if (scenarioValue > 0) {
                        scenarioValue -= 1
                        that.changeScenarioTextSelection(scenarioValue)
                    }
                })
                .classed("attackWindowSelection", true)

            backScenario
                .append("path")
                .attr("d", "M -20 0 L 0 -15 L 0 15 Z")
                .attr("transform", "scale(1.5)")


            let forwardScenario = attackSelection
                .append("g")
                .attr("id", "forwardArrowAttackSelection")
                .attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 + 200}, ${(globalThis.window.innerHeight / 6) / 2})`)
                .style("cursor", "pointer")
                .style("fill", "#3498db")
                .style("transition", "fill 0.2s ease-in-out")
                .on("click", function () {
                    if (scenarioValue < 4) {
                        scenarioValue += 1
                        that.changeScenarioTextSelection(scenarioValue)
                    }
                })
                .classed("attackWindowSelection", true)

            forwardScenario
                .append("path")
                .attr("d", "M 20 0 L 0 -15 L 0 15 Z")
                .attr("transform", `scale(1.5)`)

            let currentScenario = attackSelection
                .append("g")
                .attr("width", 400)
                .attr("height", 50)
                .attr("id", "currentScenarioG")
                .attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 120}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                .classed("attackWindowSelection", true)


            let text = currentScenario
                .append("text")
                .attr("id", "scenarioTextSelection")
                .text("Kein Angriffsszenario")
                .attr("font-size", "13px")
                .classed("fill-white text-2xl font-bold", true)
                .classed("attackWindowSelection", true)
        })

    }

    async changeScenarioTextSelection(value) {
        let text
        switch (value) {
            case 0:
                text = "Kein Angriffsszenario"
                d3.select("#currentScenarioG").attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 120}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                break
            case 1:
                text = "chosen schedule attacked (agent manipulates chosen schedule for others)"
                text = "Agent manipuliert Fahrplan"
                d3.select("#currentScenarioG").attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 145}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                break
            case 2:
                text = "performance attack (changed target function)"
                text = "Zielfunktion manipuliert"
                d3.select("#currentScenarioG").attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 145}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                break
            case 3:
                text = "performance attack (iteratively increased performance)"
                text = "Iterativ die Performance erhöht"
                d3.select("#currentScenarioG").attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 170}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                break
            case 4:
                text = "network size attack (iteratively add agent to system state)"
                text = "Fügt dauerhaft neue Agenten hinzu"
                d3.select("#currentScenarioG").attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 200}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                break
        }

        d3.select("#scenarioTextSelection").text(text)
    }
}

