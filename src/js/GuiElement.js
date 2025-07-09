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
    constructor(idClass) {
        super(null)
        this.idClass = idClass
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
            .attr("transform", d => `translate(${this.x}, ${this.y})`)
            .classed(`${this.idClass}`, true)

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
        this.attackScenario = -1
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
            .range([0, 500])
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
            .attr("transform", d => `translate(${padding + 10}, ${padding})`)

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
            .attr("id", "loadSim")
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
                    that.attackScenario = attack
                    toMultilineText(d3.select("#attackScenarioDescription"), this.getCurrentAttackSceanrioText(false), 10)
                    d3.select("#loadSim").remove()
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
                    d3.select("#agentStatistics").classed("invisible", true)
                } else {
                    d3.select("#panelHeaderREF").classed("invisible", false)
                    d3.select("#panelStatsClassic").classed("invisible", false)
                    d3.select("#parentSvgEntry").attr("height", panelHeight)
                    d3.select("#parentSvgEntry").attr("y", 0)
                    d3.select("#panelFooterText").classed("invisible", false)
                    d3.select("#agentStatistics").classed("invisible", false)
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
            agentStats.width = 500
            agentStats.height = panelD3Height - 130
            agentStats.x = 3 * padding + 20
            agentStats.y = -70
            agentStats.rectCss = "stroke-0 stroke-black fill-[#364d6f]"
            //agentStats.textHead = "Hinweis"
            agentStats.textHeadCss = "fill-white text-xl font-bold"
            //agentStats.textContent = "Noch keine Agenten initialisiert"
            agentStats.textContentCss = "fill-white font-normal"
            agentStats.draw()

            const agentStats2 = new InfoBox("infobox-agent2")
            agentStats2.width = 500
            agentStats2.height = panelD3Height - 130
            agentStats2.x = 3 * padding + 20
            agentStats2.y = -60 + 475
            agentStats2.rectCss = "stroke-0 stroke-black fill-[#364d6f]"
            //agentStats.textHead = "Hinweis"
            agentStats2.textHeadCss = "fill-white text-xl font-bold"
            //agentStats.textContent = "Noch keine Agenten initialisiert"
            agentStats2.textContentCss = "fill-white font-normal"
            agentStats2.draw()

            ref
                .append(function () { return agentStats.element.node() })

            ref
                .append(function () { return agentStats2.element.node() })

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
                .attr("transform", d => `translate(${3 * padding}, 50)`)
                .classed("invisible", true)

            let commText = dailyStats
                .append("text")
                .attr("id", "communicationInformationText")

            commText
                .append("tspan")
                .text("Informationen über den Nachrichtenaustausch des")
                .attr("x", 10)
                .attr("font-size", "20px")
                .attr("fill", "white")

            commText
                .append("tspan")
                .text("aktuellen Simulationsschritts von ")
                .attr("x", 10)
                .attr("dy", "1.2em")
                .attr("font-size", "20px")
                .attr("fill", "white")

            commText
                .append("tspan")
                .attr("id", "tspanSender")
                .text("")
                .attr("font-size", "20px")
                .attr("fill", "red")

            commText
                .append("tspan")
                .text("zu den Agenten: ")
                .attr("font-size", "20px")
                .attr("x", 10)
                .attr("dy", "1.2em")
                .attr("fill", "white")

            commText
                .append("tspan")
                .attr("id", "tspanReceivers")
                .text("")
                .attr("x", 10)
                .attr("dy", "1.2em")
                .attr("font-size", "20px")
                .attr("fill", "red")

            commText
                .append("tspan")
                .text("Verhandlungs-ID: ")
                .attr("x", 10)
                .attr("dy", "2em")
                .attr("font-size", "20px")
                .attr("fill", "white")
            commText
                .append("tspan")
                .attr("id", "tspanNegoID")
                .text("")
                .attr("font-size", "20px")
                .attr("fill", "red")
            commText
                .append("tspan")
                .text("Performance dieser Verhandlung: ")
                .attr("x", 10)
                .attr("dy", "2em")
                .attr("font-size", "20px")
                .attr("fill", "white")
            commText
                .append("tspan")
                .attr("id", "tspanPerformance")
                .text("")
                .attr("font-size", "20px")
                .attr("fill", "red")

            let infoText = dailyStats
                .append("text")
                .attr("id", "infoTextSecondPage")
                .attr("transform", `translate(${3 * padding}, 550)`)

        }

        function drawAgentStatsDiagram(ref, domainX, domainY) {

            let scalarY = (Math.abs(domainY[0]) + Math.abs(domainY[1])) / 12.5

            let agentTargetDiagram1 = ref
                .append("g")
                .attr("id", "agentTargetDiagram")

            agentTargetDiagram1
                .append("g")
                .attr("id", "agentTargetDiagramY")
                .classed("yAxis text-white stroke-1 border-1", true)
                .attr("transform", "translate(50, -60)")
                .call(d3.axisLeft(that.aYScale)
                    .ticks(10)
                    .tickFormat(d3.format("d"))
                    .tickValues(d3.range(domainY[0], domainY[1], scalarY)))

            agentTargetDiagram1
                .append("g")
                .attr("id", "agentTargetX")
                .classed("xAxis text-white stroke-1 border-1", true)
                .attr("transform", `translate(50, ${340})`)
                .call(d3.axisBottom(that.aXScale)
                    .ticks(24)
                    .tickFormat(d3.format("d"))
                    .tickValues(d3.range(0, 25, 4)))

            agentTargetDiagram1
                .append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(20, ${-75})`)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .classed("fill-white font-bold", true)
                .text("Wert")

            agentTargetDiagram1
                .append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(50, ${345})`)
                .attr("x", 250)
                .attr("y", 40)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .classed("fill-white font-bold", true)
                .text("Zeitschritt")

            agentTargetDiagram1.selectAll(".tick text")
                .attr("font-size", "20px")

            let agentDiagram2 = ref
                .append("g")
                .attr("id", "agentTargetDiagram2")

            agentDiagram2
                .append("g")
                .attr("id", "agentTargetDiagramY2")
                .classed("yAxis text-white stroke-1 border-1", true)
                .attr("transform", "translate(50, 420)")
                .call(d3.axisLeft(that.aYScale)
                    .ticks(10)
                    .tickFormat(d3.format("d"))
                    .tickValues(d3.range(0, 5000, 400)))

            agentDiagram2
                .append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(11, ${407})`)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .classed("fill-white font-bold", true)
                .text("Performance")

            agentDiagram2
                .append("g")
                .attr("id", "agentTargetX2")
                .classed("xAxis text-white stroke-1 border-1", true)
                .attr("transform", `translate(50, ${825})`)
                .call(d3.axisBottom(that.aXScale)
                    .ticks(24)
                    .tickFormat(d3.format("d"))
                    .tickValues(d3.range(0, 25, 4)))

            agentDiagram2.selectAll(".tick text")
                .attr("font-size", "20px")

            agentDiagram2
                .append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(50, ${835})`)
                .attr("x", 250)
                .attr("y", 40)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .classed("fill-white font-bold", true)
                .text("Simulationsschritt")

            let text2ndDiagram = ref
                .append("text")
                .attr("id", "secondDiagram")
                .attr("transform", `translate(125, 410)`)
                .attr("fill", "orange")
                .classed("text-lg font-bold", "true")
                .classed("invisible", false)
                .text("Verlauf der Simulationsperformance")

            let textInf = ref
                .append("text")
                .attr("id", "infiniteText")
                .attr("transform", "translate(225, 750)")
                .classed("infiniteValue", true)
                .classed("invisible", true)
                .classed("fill-white text-2xl font-bold", true)
                .text("Der Wert befindet sich")

            textInf
                .append("tspan")
                .text("außerhalb der Skalar:")
                .attr("dy", "1.2em")
                .attr("x", 0)

            textInf
                .append("tspan")
                .attr("id", "infiniteValue")
                .attr("transform", "translate(0, 0)")
                .attr("fill", "red")
                .attr("dy", "1.2em")
                .attr("x", 0)
                .classed("invisible", true)
                .classed("infiniteValue", true)
                .classed("text-2xl font-bold", true)
                .text("")


            let performanceLight = ref
                .append("g")
                .attr("id", "performanceIndicator")
                .attr("transform", "translate(-20, 930)")
                .classed("invisible", false)

            let performanceLightText = performanceLight
                .append("text")
                .classed("fill-white text-2xl font-bold", true)

            performanceLightText
                .append("tspan")
                .text("Bewertung der")

            performanceLightText
                .append("tspan")
                .text("Performance: ")
                .attr("dy", "1.2em")
                .attr("x", 0)

            performanceLight
                .append("circle")
                .attr("r", 25)
                .attr("id", "performanceLightCircle1")
                .attr("transform", "translate(235, 5)")
                .attr("fill", "white")
                .classed("performanceLightCircle", true)

            performanceLight
                .append("circle")
                .attr("r", 25)
                .attr("id", "performanceLightCircle2")
                .attr("transform", "translate(315, 5)")
                .attr("fill", "white")
                .classed("performanceLightCircle", true)

            performanceLight
                .append("circle")
                .attr("r", 25)
                .attr("id", "performanceLightCircle3")
                .attr("transform", "translate(395, 5)")
                .attr("fill", "white")
                .classed("performanceLightCircle", true)

            performanceLight
                .append("circle")
                .attr("r", 25)
                .attr("id", "performanceLightCircle4")
                .attr("transform", "translate(475, 5)")
                .attr("fill", "white")
                .classed("performanceLightCircle", true)

            performanceLight
                .append("circle")
                .attr("r", 25)
                .attr("id", "performanceLightCircle5")
                .attr("transform", "translate(555, 5)")
                .attr("fill", "white")
                .classed("performanceLightCircle", true)

            let secondPageText = ref
                .append("text")
                .attr("id", "secondPageText")
                .attr("transform", `translate(125, 450)`)
                .classed("text-lg font-bold", "true")
                .classed("invisible", true)
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
        let container = d3.select("#agentTargetDiagram")
        switch (this.currentDiagram) {
            case 0: {
                d3.select("#tspanDiagram1").text("Zielfunktion")
                d3.select("#tspanDiagram12").text("Aktueller Simulationswert")
                toMultilineText(d3.select("#attackScenarioDescription"), this.getCurrentAttackSceanrioText(), 10)
                d3.select("#secondDiagram").text("Verlauf der Simulationsperformance")
                d3.select("#tspanDiagram1").classed("invisible", false)
                d3.select("#tspanDiagram12").classed("invisible", false)
                d3.select("#infobox-agent").classed("invisible", false)
                d3.select("#infobox-agent2").classed("invisible", false)
                d3.select("#agentTargetDiagram").classed("invisible", false)
                d3.select("#agentTargetDiagram2").classed("invisible", false)
                d3.select("#secondDiagram").classed("invisible", false)
                d3.select("#communicationInformationText").classed("invisible", true)
                d3.select("#panelAgentStatistics").classed("invisible", true)
                d3.select("#infobox-agent").attr("transform", "translate(50, -70)")
                d3.select("#infobox-agent2").attr("transform", "translate(50, 415)")
                d3.select("#performanceIndicator").classed("invisible", false)


                let currentValue = this._scenario.getCurrentSimulationState()
                let targetValue = this._scenario.getTargetValueDiagramData()

                let minCurrent = Math.floor((Math.min(...currentValue) / 100)) * 100
                let maxCurrent = Math.floor((Math.max(...currentValue) / 100) * 1.1) * 100
                let minTarget = Math.floor((Math.min(...targetValue) / 100)) * 100
                let maxTarget = Math.floor((Math.max(...targetValue) / 100) * 1.1) * 100
                let min = Math.min(minCurrent, minTarget)
                let max = Math.max(maxCurrent, maxTarget)
                if (min < this.aYScale.domain()[0]) {
                    this.aYScale = d3.scaleLinear()
                        .range([400, 0])
                        .domain([min, this.aYScale.domain()[1]])
                } else if (min - 1000 > this.aYScale.domain()[0]) {
                    this.aYScale = d3.scaleLinear()
                        .range([400, 0])
                        .domain([min, this.aYScale.domain()[1]])
                }

                if (max > this.aYScale.domain()[1]) {
                    this.aYScale = d3.scaleLinear()
                        .range([400, 0])
                        .domain([this.aYScale.domain()[0], max])
                } else if (max + 1000 < this.aYScale.domain()[1]) {
                    this.aYScale = d3.scaleLinear()
                        .range([400, 0])
                        .domain([this.aYScale.domain()[0], max])
                }

                this.aXScale = d3.scaleLinear()
                    .range([0, 500])
                    .domain([-1, 25])

                let targetCoordinate = []
                let currentCoordinate = []

                let lineGenerator = d3.line()
                    .x(d => this.aXScale(d[0]))
                    .y(d => this.aYScale(d[1]))

                container
                    .selectAll(".line.target")
                    .data([this._scenario.getTargetValueDiagramData()])
                    .join(
                        enter => {
                            enter.each(function (d) {
                                d.forEach((val, i) => targetCoordinate[i] = [i, val])
                            });

                            const g = enter.append("g").attr("class", "line target")

                            g.append("path")
                                .datum(targetCoordinate)
                                .attr("d", lineGenerator)
                                .attr("transform", "translate(50, -60)")
                                .attr("fill", "none")
                                .attr("stroke", "red")

                            g.selectAll("circle")
                                .data(targetCoordinate)
                                .join("circle")
                                .attr("cx", d => this.aXScale(d[0]))
                                .attr("cy", d => this.aYScale(d[1]))
                                .attr("transform", "translate(50, -60)")
                                .attr("r", 4)
                                .attr("fill", "red")
                        },
                        update => {
                            update.each(function (d) {
                                d.forEach((val, i) => targetCoordinate[i] = [i, val])
                            });

                            update.select("path")
                                .datum(targetCoordinate)
                                .transition()
                                .duration(100)
                                .attr("d", lineGenerator)

                            update.selectAll("circle")
                                .data(targetCoordinate)
                                .join(
                                    enter => enter.append("circle")
                                        .attr("r", 4)
                                        .attr("fill", "red"),
                                    update => update,
                                    exit => exit.remove()
                                )
                                .transition()
                                .duration(100)
                                .attr("cx", d => this.aXScale(d[0]))
                                .attr("cy", d => this.aYScale(d[1]))
                        },
                        exit => exit.remove()
                    )

                container
                    .selectAll(".line.current")
                    .data([this._scenario.getCurrentSimulationState()])
                    .join(
                        enter => {
                            enter.each(function (d) {
                                d.forEach((val, i) => currentCoordinate[i] = [i, val]);
                            });

                            const g = enter.append("g").attr("class", "line current");

                            g.append("path")
                                .datum(currentCoordinate)
                                .attr("d", lineGenerator)
                                .attr("transform", "translate(50, -60)")
                                .attr("fill", "none")
                                .attr("stroke", "yellow");

                            g.selectAll("circle")
                                .data(currentCoordinate)
                                .join("circle")
                                .attr("cx", d => this.aXScale(d[0]))
                                .attr("cy", d => this.aYScale(d[1]))
                                .attr("transform", "translate(50, -60)")
                                .attr("r", 4)
                                .attr("fill", "yellow")
                        },
                        update => {
                            update.each(function (d) {
                                d.forEach((val, i) => currentCoordinate[i] = [i, val])
                            });

                            update.select("path")
                                .datum(currentCoordinate)
                                .transition()
                                .duration(100)
                                .attr("d", lineGenerator)

                            update.selectAll("circle")
                                .data(currentCoordinate)
                                .join(
                                    enter => enter.append("circle")
                                        .attr("r", 4)
                                        .attr("fill", "yellow"),
                                    update => update,
                                    exit => exit.remove()
                                )
                                .transition()
                                .duration(100)
                                .attr("cx", d => this.aXScale(d[0]))
                                .attr("cy", d => this.aYScale(d[1]))
                        },
                        exit => exit.remove()
                    );
                let scale = (max - min) / 10

                d3.select("#agentTargetDiagramY")
                    .call(d3.axisLeft(this.aYScale)
                        .ticks(10)
                        .tickFormat(d3.format("d")))
                //.tickValues(d3.range(min, max, scale)))

                d3.select("#agentTargetDiagramY").selectAll(".tick text")
                    .attr("font-size", "20px")

                //d3.selectAll(".agentDiagram").remove()

                let allPerf = this._scenario.getAllPerformance(1)[this._scenario.getAllSteps() - 1]
                let minPerf = Math.floor((Math.min(...allPerf) / 100)) * 100
                let maxPerf = Math.floor((Math.max(...allPerf) / 100) * 1.05) * 100

                if (minPerf < -1e10) {
                    minPerf = -1e10
                }

                if (maxPerf > 1e10) {
                    maxPerf = 1e10
                }
                if (maxPerf < 0) {
                    maxPerf = Math.max(maxPerf, 0)
                }

                this.aXScale = d3.scaleLinear()
                    .range([0, 500])
                    .domain([0, this._scenario.getAllSteps()])

                this.aYScale = d3.scaleLinear()
                    .range([400, 0])
                    .domain([minPerf, maxPerf])
                    .clamp(true)

                d3.select("#agentTargetDiagramY2")
                    .call(d3.axisLeft(this.aYScale)
                        .ticks(10)
                        .tickFormat(d3.format("d")))

                d3.select("#agentTargetX2")
                    .call(d3.axisBottom(this.aXScale)
                        .ticks(30)
                        .tickFormat(d3.format("d"))
                        .tickValues(d3.range(0, this._scenario.getAllSteps(), Math.ceil(this._scenario.getAllSteps() / 10))))

                d3.select("#agentTargetX2").selectAll(".tick text").attr("font-size", "20px")


                d3.select("#agentTargetDiagram2")
                    .append("line")
                    .attr("x1", 0)
                    .attr("x2", 500)
                    .attr("y1", this.aYScale(0))
                    .attr("y2", this.aYScale(0))
                    .attr("transform", "translate(50, 420)")
                    .attr("stroke", "white")
                    .attr("stroke-width", 1)


                if (maxPerf == 10000000000) {
                    d3.select("#agentTargetDiagramY2").selectAll(".tick text")
                        .attr("font-size", "2px")
                } else {
                    d3.select("#agentTargetDiagramY2").selectAll(".tick text")
                        .attr("font-size", "18px")
                }

                if (minPerf == -10000000000) {
                    d3.select("#agentTargetDiagramY2").selectAll(".tick text")
                        .attr("font-size", "2px")
                } else {
                    d3.select("#agentTargetDiagramY2").selectAll(".tick text")
                        .attr("font-size", "18px")
                }


                let self = this

                let performanceData = this._scenario.getAllPerformance(0)
                let performanceCoordinate = performanceData.map((val, i) => [i, val])

                d3.select("#agentTargetDiagram2")
                    .selectAll(".line.perfDia")
                    .data([performanceCoordinate])
                    .join(
                        enter => {
                            const g = enter.append("g")
                                .attr("class", "line perfDia")

                            g.append("path")
                                .attr("d", d3.line()
                                    .x(d => self.aXScale(d[0]))
                                    .y(d => self.aYScale(d[1]))
                                    (performanceCoordinate))
                                .attr("transform", "translate(50, 420)")
                                .attr("fill", "none")
                                .attr("stroke", "orange")

                            g.selectAll("circle")
                                .data(performanceCoordinate)
                                .join("circle")
                                .attr("cx", d => self.aXScale(d[0]))
                                .attr("cy", d => self.aYScale(d[1]))
                                .attr("transform", "translate(50, 420)")
                                .attr("r", 1)
                                .attr("fill", "orange")
                        },

                        update => {
                            update.select("path")
                                .datum(performanceCoordinate)
                                .transition()
                                .duration(100)
                                .attr("d", d3.line()
                                    .x(d => self.aXScale(d[0]))
                                    .y(d => self.aYScale(d[1]))
                                )

                            update.selectAll("circle")
                                .data(performanceCoordinate)
                                .join(
                                    enter => enter.append("circle")
                                        .attr("r", 1)
                                        .attr("fill", "orange")
                                        .attr("transform", "translate(50, 420)"),
                                    update => update,
                                    exit => exit.remove()
                                )
                                .transition()
                                .duration(100)
                                .attr("cx", d => self.aXScale(d[0]))
                                .attr("cy", d => self.aYScale(d[1]))
                        },

                        exit => exit.remove()
                    )

                if (this._scenario.getAllPerformance(0)[this._scenario.getCurrentStep()] >= 1e10 || this._scenario.getAllPerformance(0)[this._scenario.getCurrentStep()] <= -1e10) {
                    d3.selectAll(".infiniteValue").classed("invisible", false)
                    d3.select("#infiniteValue").text(this._scenario.getAllPerformance(0)[this._scenario.getCurrentStep()])
                } else {
                    d3.selectAll(".infiniteValue").classed("invisible", true)
                }

                let lightIndicatorPerformace = this._scenario.getAllPerformance(0)[this._scenario.getCurrentStep()]
                if (lightIndicatorPerformace >= 80000 || lightIndicatorPerformace <= -80000) {
                    d3.selectAll(".performanceLightCircle").attr("fill", "white")
                    d3.select("#performanceLightCircle1").attr("fill", "red")
                } else if (lightIndicatorPerformace < 80000 && lightIndicatorPerformace >= 60000 || lightIndicatorPerformace > -80000 && lightIndicatorPerformace <= -60000) {
                    d3.selectAll(".performanceLightCircle").attr("fill", "white")
                    d3.select("#performanceLightCircle2").attr("fill", "orange")
                } else if (lightIndicatorPerformace < 60000 && lightIndicatorPerformace >= 35000 || lightIndicatorPerformace > -60000 && lightIndicatorPerformace <= -35000) {
                    d3.selectAll(".performanceLightCircle").attr("fill", "white")
                    d3.select("#performanceLightCircle3").attr("fill", "yellow")
                } else if (lightIndicatorPerformace < 35000 && lightIndicatorPerformace >= 10000 || lightIndicatorPerformace > -35000 && lightIndicatorPerformace <= -10000) {
                    d3.selectAll(".performanceLightCircle").attr("fill", "white")
                    d3.select("#performanceLightCircle4").attr("fill", "lightgreen")
                } else if (lightIndicatorPerformace < 10000 && lightIndicatorPerformace >= 0 || lightIndicatorPerformace > -10000 && lightIndicatorPerformace <= -0) {
                    d3.selectAll(".performanceLightCircle").attr("fill", "white")
                    d3.select("#performanceLightCircle5").attr("fill", "green")
                }

                break
            }
            case 1: {
                d3.select("#tspanDiagram1").classed("invisible", true)
                d3.select("#tspanDiagram12").classed("invisible", true)
                //d3.select("#infobox-agent").classed("invisible", true)
                //d3.select("#infobox-agent2").classed("invisible", true)
                d3.select("#agentTargetDiagram").classed("invisible", true)
                d3.select("#agentTargetDiagram2").classed("invisible", true)
                d3.select("#secondDiagram").classed("invisible", true)
                d3.select("#communicationInformationText").classed("invisible", false)
                d3.select("#panelAgentStatistics").classed("invisible", false)
                d3.select("#infobox-agent").attr("transform", "translate(25, -70)")
                d3.select("#infobox-agent2").attr("transform", "translate(25, 500)")
                d3.select("#performanceIndicator").classed("invisible", true)


                let comm = this._scenario.getCurrentCommunicationLinks()
                let performance = comm[0].performance
                let sender = comm[0].source
                let negoID = comm[0].negotiationID
                let receivers = []
                comm.forEach((target) => {
                    receivers.push(target.target)
                })
                if (!(receivers.length > 4)) {
                    d3.select("#tspanReceivers").text(receivers)
                }
                d3.select("#tspanSender").text(sender)
                d3.select("#tspanNegoID").text(negoID)
                d3.select("#tspanPerformance").text(performance)

                let fullText = this.getCurrentAttackSceanrioText(true)

                d3.select("#infoTextSecondPage")
                    .selectAll("tspan")
                    .data(fullText)
                    .enter()
                    .append("tspan")
                    .text(d => { return d })
                    .classed('time fill-white text-xl font-bold', true)
                    .attr("dy", (d, i) => i === 0 ? "0em" : "1.2em")
                    .attr("x", 0)

                if (this.attackScenario == 0) {
                    d3.select("#panelAgentStatistics")
                        .append("a")
                        .attr("xlink:href", "https://uol.de/f/2/dept/informatik/ag/ui/publications/HLS14b.pdf")
                        .attr("target", "_blank")
                        .attr("transform", "translate(30, 775)")
                        .append("text")
                        .text("PDF-Link")
                        .attr("font-size", "18px")
                        .attr("fill", "red")
                        .style("cursor", "pointer")
                }
                break
            }
        }
    }

    changeToAgentInfoBar() {
        let that = this
        d3.select("#attackScenarioDesc").remove()
        d3.select("#linkCOHDA").remove()
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
        d3.select("#sideBarSVG").attr("transform", d => `translate(${globalThis.window.innerWidth - 600 - 10}, ${globalThis.window.innerHeight - 720 - 600}) scale(1)`)
        d3.select("#panelFooter").attr("transform", d => `translate(125, ${10 + 250 + 10 + 300 + 10 + 600})`)
        d3.select("#panelHeader").attr("width", 580)
        d3.select("#panelHeader").attr("height", 200)
        d3.select("#parentSvgEntry").attr("width", 650)
        d3.select("#panelHeaderContent").attr("transform", "translate(-10, 0)")
        let panelHeaderContent = d3.select("#panelHeaderContent")
            .append("text")
            .append("tspan")
            .classed("text-lg fill-white", "true")
            .attr("x", 0)
            .attr("y", 20)
            .attr("dy", "1.2em")
            .attr('width', 220)
            .text("Bachelorabschluss-")

        panelHeaderContent
            .append("tspan")
            .classed("text-lg fill-white", "true")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .attr('width', 220)
            .text("arbeit von Jan Heine")

        let agentStatistics = d3.select("#sideBar")
            .append("g")
            .attr("id", "agentStatistics")
            .attr("transform", d => 'translate(10, 170)')

        agentStatistics
            .append("rect")
            .attr("width", 600 - (4 * 10))
            .attr("height", 300)
            .classed('stroke-0 stroke-white fill-none opacity-100', true)

        let agentPanelContent = agentStatistics
            .append("g")
            .attr("transform", 'translate(10, 0)')

        let textForDiagram = agentPanelContent
            .append("text")
            .classed("text-lg font-bold fill-white", "true")
            .attr("id", "agentHeader")
            .text("")
            .attr("x", (600 - (7 * 10)) / 2)
            .attr("y", 10)
            .style("text-anchor", "middle")

        textForDiagram
            .append("tspan")
            .attr("id", "tspanDiagram1")
            .text("Zielfunktion")
            .attr("fill", "red")
            .attr("dy", "1.2em")
            .attr("x", 275)
            .attr("y", -20)

        textForDiagram
            .append("tspan")
            .attr("id", "tspanDiagram12")
            .text("Aktueller Simulationswert")
            .attr("fill", "yellow")
            .attr("dy", "1.2em")
            .attr("x", 275)
        //.attr("y", -20)

        let currentAttackScenarioDescription = agentPanelContent
            .append("text")
            .attr("id", "attackScenarioDescription")
            .attr("transform", `translate(400, -140)`)
            .attr("width", 150)
            .classed('time fill-white text-xl font-bold', true)


        let backToPrevDiagram = agentStatistics
            .append("g")
            .attr("id", "forwardDiagramArrow")
            .attr("transform", "translate(50,0)")
            .style("cursor", "pointer")
            .style("fill", "#3498db")
            .style("transition", "fill 0.2s ease-in-out")
            .on("click", function () {
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
            .attr("transform", `translate(500, 0)`)
            .style("cursor", "pointer")
            .style("fill", "#3498db")
            .style("transition", "fill 0.2s ease-in-out")
            .on("click", function () {
                if (that.currentDiagram < 1) {
                    that.currentDiagram += 1
                    that.updateAgentDiagram()
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
        let text0 = ["Die Basis dieser Optimierung", "bildet die Heuristik COHDA,", "eine verteilte Optimierung", "die durch bestimmte Mechanismen", "schnell zu einer guten Lösung", "kommt. Für weitere Informationen", "über diese Optimierung klicke", "\u00A0", "Folgende Angriffsszenarien können", "gewählt werden:"]
        let text1 = ["1. Kein Angriffsszenario", "\u00A0", "Kein Angriff, hier arbeitet die verteilte", "Optimierung ohne eine manipulation", "eines Angreifers nach dem vorgegebenen", "Muster (Combinatorial Optimization", "Heuristic for Distributed Agents COHDA)."]
        let text2 = ["2. Agent manipuliert Fahrplan", "\u00A0", "Ein Angriffsszenario in dem versendete", "Fahrplänen von einem unterwanderten", "Agenten manipuliert werden."]
        let text3 = ["3. Zielfunktion manipuliert", "\u00A0", "Ein weiteres Angriffsszenario, in dem", "der Angreifer die Zielfunktion, also", "die aktuelle angepeilte Gesamtkonfiguration", "der Agentenfahrpläne verändert. Somit", "Optimieren die Agenten ihre", "Fahrpläne auf ein falsches Ziel."]
        let text4 = ["4. Iterative Erhöhung der", "Performancefunktion", "\u00A0", "Innerhalb dieses Szenario´s werden", "die für jeden Simulationsschritt ermittelte", "Performance durch einen Agenten", "manipuliert und iterativ erhöht."]
        let fullText = [...text0, "\u00A0", ...text1, "\u00A0", ...text2, "\u00A0", ...text3, "\u00A0", ...text4]
        let attackScenarioDesc = d3.select("#panelStatsClassic")
            .append("text")
            .attr("id", "attackScenarioDesc")
            .classed('time fill-white text-xl font-bold', true)

        d3.select("#panelStatsClassic")
            .append("a")
            .attr("id", "linkCOHDA")
            .attr("xlink:href", "https://uol.de/f/2/dept/informatik/ag/ui/publications/HLS14b.pdf")
            .attr("target", "_blank")
            .attr("transform", "translate(288, 145)")
            .append("text")
            .text("hier")
            .classed("font-bold", true)
            .attr("font-size", "20px")
            .attr("fill", "red")
            .style("cursor", "pointer")

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
                .attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 350},${(globalThis.window.innerHeight / 6) / 2})`)
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
                .attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 + 350}, ${(globalThis.window.innerHeight / 6) / 2})`)
                .style("cursor", "pointer")
                .style("fill", "#3498db")
                .style("transition", "fill 0.2s ease-in-out")
                .on("click", function () {
                    if (scenarioValue < 3) {
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
                text = "Veränderte Berechnung der Abweichung zur Zielfunktion"
                d3.select("#currentScenarioG").attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 325}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                break
            case 3:
                text = "performance attack (iteratively increased performance)"
                text = "Iterativ die Performance erhöht"
                d3.select("#currentScenarioG").attr("transform", `translate(${(globalThis.window.innerWidth / 3) / 2 - 170}, ${(globalThis.window.innerHeight / 6) / 2 + 5})`)
                break
        }

        d3.select("#scenarioTextSelection").text(text)
    }

    getCurrentAttackSceanrioText(extended) {
        if (!extended) {
            switch (this.attackScenario) {
                case 0:
                    return String("Kein Angriffsszenario")
                //, "\u00A0", "Kein Angriff, hier arbeitet die verteilte", "Optimierung ohne eine manipulation", "eines Angreifers nach dem vorgegebenen", "Muster (Combinatorial Optimization", "Heuristic for Distributed Agents COHDA).", "Weitere Informationen über diese", "Optimierung finden Sie hier: LINK"]
                case 1:
                    return String("Agent manipuliert Fahrplan")
                //, "\u00A0", "Ein Angriffsszenario in dem versendete", "Fahrplänen von einem unterwanderten", "Agenten manipuliert werden."]
                case 2:
                    d3.select("#attackScenarioDescription").style("font-size", "15px")
                    return String("Veränderte Berechnung der Abweichung zur Zielfunktion")
                //, "\u00A0", "Ein weiteres Angriffsszenario, in dem", "der Angreifer die Zielfunktion, also", "die aktuelle angepeilte Gesamtkonfiguration", "der Agentenfahrpläne verändert. Somit", "Optimieren die Agenten ihre", "Fahrpläne auf ein falsches Ziel."]
                case 3:
                    return String("Manipulation der Performance- funktion")
                //, "\u00A0", "TODO: Beschreibung ergänzen"]
            }
        } else {
            switch (this.attackScenario) {
                case 0:
                    return ["1. Kein Angriffsszenario", "\u00A0", "Kein Angriff, hier arbeitet die verteilte", "Optimierung ohne eine manipulation", "eines Angreifers nach dem vorgegebenen", "Muster (Combinatorial Optimization", "Heuristic for Distributed Agents COHDA).", "Weitere Informationen über diese", "Optimierung finden Sie hier: "]
                case 1:
                    return ["2. Agent manipuliert Fahrplan", "\u00A0", "Ein Angriffsszenario in dem versendete", "Fahrplänen von einem unterwanderten", "Agenten (Agent 15) manipuliert werden.", "Die in rot dargestellten Agenten", "arbeiten mit manipulierten Daten"]
                case 2:
                    d3.select("#infoTextSecondPage").attr("transform", "translate(20,510)")
                    return ["3. Veränderte Berechnung der Abweichung zur", "Zielfunktion", "\u00A0", "Ein weiteres Angriffsszenario, in dem", "der Angreifer die Berechnung der", "Differenz zwischen aktuellem Wert zum", "Zielfunktionswert verändert. Hier wird", "das Vorzeichen bei der Performanceberechnung", "manipuliert, wodurch es zu einer positiven", "Performance kommen kann. Dadurch wird", "der angepeilte Zielfahrplan überstiegen und", "es wird mehr Energie freigegeben als", "durch Verbraucher benötigt werden(Zielfunktion)"]
                case 3:
                    return ["4. Iterative Erhöhung der Performancefunktion", "\u00A0", "Innerhalb dieses Szenario´s werden", "die für jeden Simulationsschritt ermittelte", "Performance durch einen Agenten manipuliert", "und iterativ erhöht."]
            }
        }

    }
}

