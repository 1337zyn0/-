// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { toMultilineText } from "./helper.js"
import { ScenarioSimulator, ScenarioState } from "./ScenarioSimulator.js"
import { Tuio11Object } from "../libs/tuio11/Tuio11Object.js";


class GuiElement {
    constructor(guiRef) {
        this.guiRef = guiRef
        // this.dataRef = dataRef
        this._x = 0
        this._y = 0
        this.parentSvgEntry = null
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
    }

    draw(cbUpdate) {
        let that = this

        const clock = this.guiRef
            .append("g")
            .attr("id", "clock")
            .attr("transform", d => `translate(${globalThis.innerWidth / 2}, ${globalThis.innerHeight})`)

        clock
            .append("ellipse")
            .attr("cx", 0)
            // .attr("cy", 200)
            .attr("rx", 200)
            .attr("ry", 80)
            .classed('stroke-0 fill-[#252e42] opacity-95 drop-shadow-lg', true)

        clock
            .append("text")
            .attr("dx", 10)
            .attr("dy", -40)
            .classed('fill-white text-xl font-normal opacity-75', true)
            .text(`Aktuelle Zeit`)
            .style("text-anchor", "middle")

        clock
            .append("path")
            .attr('y', -200)
            .attr('x', -80)
            .attr("transform", d => `translate(-75, -60) scale(1)`)
            .classed("stroke-white fill-none stroke-[1.5px]", true)
            .attr("d", globalThis.config.ui.icons['clock'])

        clock
            .append("text")
            // .attr("dx", -30)
            .attr("dy", -10)
            .classed('time fill-white text-2xl font-bold', true)
            .text(`0 Uhr`)
            .style("text-anchor", "middle")

        clock
            .append("circle")
            .attr("cx", "-110")
            .attr("cy", "-20")
            .attr("r", 40)
            .classed("opacity-[0]", true)
            .on("click", function (d, i) {
                console.log("Clock: Step back");
                that._scenario.stepBack()
                cbUpdate()
            })

        clock
            .append("circle")
            .attr("cx", "110")
            .attr("cy", "-20")
            .attr("r", 40)
            .classed("opacity-[0]", true)
            .on("click", function (d, i) {
                console.log("Clock: Step forward");
                that._scenario.stepForward()
                cbUpdate()
            })
    }

    update() {
        d3.select(".time")
            .text(`${this._scenario.getCurrentTime()} Uhr`)
    }
}

export class SideBarSmall extends GuiElement {
    constructor(guiRef, nodeManager, tuioListener, scenario) {
        super(guiRef)
        this.nodeManager = nodeManager
        this._scenario = scenario
        this.tuioListener = tuioListener
    }

    draw() {
        const panelWidth = 420

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
            .attr("transform", d => `translate(${padding}, ${padding})`)

        panelContent
            .append("text")
            .classed("text-lg font-bold fill-white", "true")
            .text("Szenarioübersicht")
            .attr("x", (panelWidth - (7 * padding)) / 2)
            .attr("y", padding)
            .style("text-anchor", "middle")

        drawPanelContentClassic(panelContent)

        const panelD3 = panelContent
            .append("g")
            .attr("transform", d => `translate(${padding}, ${panelClassicHeight + padding})`)

        drawPanelD3Content(panelD3)

        drawPanelD3Diagram(panelD3)

        const panelEMS = panelContent
            .append("g")
            .attr("transform", d => `translate(${padding}, ${panelClassicHeight + padding + panelD3Height + padding})`)

        drawPanelEmsContent(panelEMS)

        drawPanelEmsDiagram(panelEMS)


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
            .on("click", (d) => {
                this.nodeManager.initiateSimulation()
                this._scenario.initiateSimulation()
                this.tuioListener.initiateSimulation(globalThis)
                this.changeToAgentInfoBar()
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
                .attr("transform", d => `translate(${padding}, ${padding})`)
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
                .attr('x', (panelWidth - (7 * padding)) / 2 + padding + 20)
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

            const panelClassicColor = panelClassic
                .append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .classed(`fill-[${globalThis.config.ui.colors.classic_bg}]`, true)

            const panelClassicContent = panelClassic
                .append("text")
                .attr("transform", d => `translate(${3 * padding}, 0)`)
                .classed("statistic-panel-text font-bold", true)
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

            ref
                .selectAll("path")
                .data(classicFeatrues)
                .join("path")
                .attr("transform", (d, i) => `translate(35, ${i * 21 + 55}) scale(0.9)`)
                .classed("stroke-[#f03a17] fill-none stroke-[4px]", true)
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
                .text("Smart Monitoring")
                .attr("dy", "1.3em")

            panelD3Content
                .selectAll("tspan")
                .data(d3Features)
                .join("tspan")
                .text(d => d).attr("x", 20).attr("dy", "1.3em").classed("d3-dependant-view font-normal", true)

            ref
                .selectAll("path")
                .data(d3Features)
                .join("path")
                .attr("transform", (d, i) => `translate(28, ${i * 21 + 25}) scale(0.7)`)
                .classed(`stroke-[${globalThis.config.ui.colors.d3_bg}] fill-none stroke-[4px] d3-dependant-view`, true)
                .attr("d", globalThis.config.ui.icons.check)

            const dailyStats = ref
                .append("g")
                .attr("id", "panelD3Statistics")
                .classed("d3-dependant-view", true)
                .attr("transform", d => `translate(${3 * padding}, 150)`)

            dailyStats
                .append("text")
                .text("Tagesstatistik")
                .attr("y", -10)
                .classed("statistic-panel-text font-bold", true)
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
    }

    updateD3Statistics() {
        const ref = d3.select("#panelD3Statistics")
        // console.log("updateD3Statistics")

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

    changeToAgentInfoBar() {
        d3.select("#panelStatsClassic").remove()
        d3.select(".headerRemove").remove()
        d3.select("#textInfoBox").remove()
        d3.select("#sideBarSVG").attr("transform", d => `translate(${globalThis.window.innerWidth - 420 - 30}, ${globalThis.window.innerHeight - 720 - 30}) scale(1)`)
        d3.select("#panelFooter").attr("transform", d => `translate(10, ${10 + 250 + 10 + 300 + 10})`)
        d3.select("#panelFooterText").remove()
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

        agentPanelContent
            .append("text")
            .classed("text-lg font-bold fill-white", "true")
            .attr("id", "panelStatsClassic")
            .text("Übersicht der Zielfunktion")
            .attr("x", (420 - (7 * 10)) / 2)
            .attr("y", 10)
            .style("text-anchor", "middle")

        //TODO: draw AgentTargetFunction 

    }
}

