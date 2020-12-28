class Container {
  constructor(parentNode, layoutOpts) {
    this.layout = {
      width: layoutOpts.width || 1226,
      height: layoutOpts.height || 717,
      margin: layoutOpts.margin || { t: 25, r: 25, b: 60, l: 60 },
      font: {
        family: layoutOpts.font.family || "Times New Roman",
        size: layoutOpts.font.size || 16
      },
      yaxis: {
        title: layoutOpts.yaxis.title || "",
        zerolinecolor: layoutOpts.yaxis.zerolinecolor || "rgba(174,174,174,0.45)",
        zeroline: layoutOpts.yaxis.zeroline || true,
        scale: layoutOpts.yaxis.scale || "linear",
        grid: layoutOpts.yaxis.grid || false
      },
      xaxis: {
        title: layoutOpts.xaxis.title || "",
        zerolinecolor: layoutOpts.xaxis.zerolinecolor || "rgba(174,174,174,0.45)",
        zeroline: layoutOpts.xaxis.zeroline || true,
        scale: layoutOpts.xaxis.scale || "linear",
        grid: layoutOpts.xaxis.grid || false
      }
    };
    this.layout.extents = {
      width: this.layout.width - this.layout.margin.l - this.layout.margin.r,
      height: this.layout.height - this.layout.margin.t - this.layout.margin.b
    };
    this.stylesElem = document.createElement("style");
    this.stylesElem.type = "text/css";
    this.stylesElem.innerHTML = this.styles;
    //bind styles to dom
    document.getElementsByTagName("head")[0].appendChild(this.stylesElem);

    // Set the parent and build the plot
    // For some reason, needed to set attr and style dimensions... browser compat??
    this.parent = d3.select(parentNode)
      .attr("width", `${this.layout.width}px`)
      .attr("height", `${this.layout.height}px`)
      .attr("class", "container")
      .style("display", "block")
      .style("margin", "auto")
      .style("width", `${this.layout.width}px`)
      .style("height", `${this.layout.height}px`);
    // SVG
    this.svg = this.parent.append("svg")
      .attr("width", `${this.layout.width}px`)
      .attr("height", `${this.layout.height}px`)
      .attr("class", "svg-container")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .append("g")
      .attr("transform", `translate(${this.layout.margin.l},${this.layout.margin.t})`);
    this.svgX = this.svg.append("g")
      .attr("transform", `translate(0,${this.layout.extents.height})`)
      .attr("class", "axes x-axis");
    this.svgY = this.svg.append("g")
      .attr("class", "axes y-axis");
    this.xLabel = this.svg.append("g")
      .attr("class", "x-label");
    this.yLabel = this.svg.append("g")
      .attr("class", "y-label");
    // CANVAS
    this.linemap = this.parent.append("canvas")
      .attr("width", this.layout.width)
      .attr("height", this.layout.height - 2)
      .style("margin", `${this.layout.margin.t + 1}px ${this.layout.margin.r}px ${this.layout.margin.b}px ${this.layout.margin.l}px`)
      .attr("class", "canvas-container");
    // Map
    this.pointmap = this.parent.append("canvas")
      .attr("width", this.layout.width)
      .attr("height", this.layout.height - 2)
      .style("margin", `${this.layout.margin.t + 1}px ${this.layout.margin.r}px ${this.layout.margin.b}px ${this.layout.margin.l}px`)
      .attr("class", "pointmap-container")
      .attr("tabindex", "0");

    // Canvas Context
    this.linectx = this.linemap.node().getContext("2d");
    //clip the context
    this.linectx.rect(1, 1, this.layout.extents.width - 7, this.layout.extents.height - 1);
    this.linectx.clip();

    this.pointctx = this.pointmap.node().getContext("2d");
    //clip the context
    this.pointctx.rect(1, 1, this.layout.extents.width - 7, this.layout.extents.height - 1);
    this.pointctx.clip();

    //this.databin = d3.select(document.createElement("custom"));
    //this.pointbin = d3.select(document.createElement("custom"));

    // Data
    this.data = [];
    this.dataBound = false;
  }// end Constructor
  // SET GET
  get styles() {
    return `
        .container {
          width: ${this.layout.width}px !important;
          height:${this.layout.height}px !important;
        }
        .axes text {
          font-family: ${this.layout.font.family} !important;
          font-size: ${this.layout.font.size * 0.9}pt !important;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        .axes line {
          stroke-opacity: 0.6 !important;
          stroke: rgb(60,60,60) !important;
          stroke-width: 2px !important;
          shape-rendering: crispEdges !important;
        }
        .canvas-container, .svg-container, .pointmap-container {
          position: absolute !important;
          background-color: transparent !important;
        }
        .canvas-container {
          z-index: 100 !important;
        }
        .pointmap-container {
          z-index: 101 !important;
          cursor: move !important; /* fallback if grab cursor is unsupported */
          cursor: grab !important;
          cursor: -moz-grab !important;
          cursor: -webkit-grab !important;
        }
        .pointmap-container:active {
          cursor: grabbing !important;
          cursor: -moz-grabbing !important;
          cursor: -webkit-grabbing !important;
          outline: none !important;
  
        }
        .pointmap-container:focus {
          outline: none !important;
        }
        .x-label, .y-label {
          font-family: ${this.layout.font.family} !important;
          font-size: ${this.layout.font.size}pt !important;
        }
      `;
  }
  // Methods
  update(layout) {
    for (let prop in layout) {
      if (!layout.hasOwnProperty(prop)) continue;
      this.layout[prop] = layout[prop];
    }
    // update styles
    this.stylesElem.innerHTML = this.styles;

  }
  drawLabel(obj, g) {
    const axClass = g.attr("class");
    let whichAx = axClass === "y-label" ? "y-axis" : "x-axis";
    let gLab = g.selectAll("text")
      .data([{ label: obj.layout[whichAx.replace(/[^0-9a-z]/gi, "")].title }]);
    if (whichAx === "y-axis") {
      gLab.enter()
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -obj.layout.extents.height * 12 / 13)
        .attr("dy", -40)
        .attr("fill", "rgba(30,30,30,0.6)")
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "baseline")
        .merge(gLab)
        .text(d => d.label);
    } else {
      gLab.enter()
        .append("text")
        .attr("y", obj.layout.extents.height + 40)
        .attr("x", obj.layout.extents.height / 13)
        .attr("fill", "rgba(30,30,30,0.6)")
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "baseline")
        .merge(gLab)
        .text(d => d.label);
    }
    gLab.exit().remove();
  }
  // bind data
  bindData(inputData) {
    var that = this;
    return new Promise(
      (rv, rj) => {
        try {
          that.data = inputData;
        } catch (ee) {
          rj(ee);
        }
        rv(true);
      }

    );
  }

}

export { Container };