import React, { useRef, useCallback, useEffect, useState } from "react"
import * as d3 from "d3";

function ForceDirectedGraph ({ nodes, links, onClickNode, containerHeight }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const update = useCallback(({ nodes, links }) => {
    // Make a shallow copy to protect against mutation, while
    // recycling old nodes to preserve position and velocity.
    const old = new Map(node.data().map(d => [d.id, d]));
    nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
    links = links.map(d => Object.assign({}, d));

    node = node
      .data(nodes)
      .join(enter => {
        const circle = enter.append("circle")

        circle.append("title")
          .text(d => `Peer ID: ${d.id} (${d.pseudonym}) \n\nMultiaddr: ${d.multiaddr}`);

        return circle
      })
      .attr("r", d => d.size ?? 12)
      .attr("fill", d => color(d.colorIndex))
      .attr("stroke-width", d => d.selected ? 2 : 0)
      .attr("stroke", d => d.selected ? color(3) : '#FFF')
      .on('click', onClickNode)
      .call(drag(simulation));

    label = label
      .data(nodes)
      .join("text")
      .attr("dx", d => (d.size ?? 12) + 2)
      .attr("dy",".35em")
      .attr("font-size", 14)
      .text(d => d.label);

    link = link
      .data(links)
      .join("line")
      // .attr('marker-end','url(#arrowhead)');

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();

    const transform = d3.zoomTransform(svg.node())
    link.attr("transform", transform);
    node.attr("transform", transform);
    label.attr("transform", transform);
  }, [ onClickNode ])

  const measuredRef = useCallback(node => {
    if (node !== null) {
      setContainerWidth(node.getBoundingClientRect().width);
    }
  }, []);

  useEffect(() => containerRef.current.append(svg.node()), [])

  useEffect(() => {
    if (!containerWidth) {
      return
    }

    svg.attr("viewBox", [0, 0, containerWidth, containerHeight])
    simulation.force("center", d3.forceCenter(containerWidth / 2, containerHeight / 2));
    zoom.extent([[0, 0], [containerWidth, containerHeight]])
  }, [containerWidth, containerHeight])

  useEffect(() => {
    update({ nodes, links })
  }, [nodes, links, update])

  return (
    <div ref={measuredRef}>
      <div ref={containerRef} />
    </div>
  )
}

export default ForceDirectedGraph

const color = n => d3.schemeCategory10[n]

const simulation = d3.forceSimulation()
  .force(
    "link",
    d3.forceLink()
      .distance(150) // Minimum distance between nodes
      .id(d => d.id)
  )
  .force("charge", d3.forceManyBody().strength(-150))

const drag = simulation => {
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}

const svg = d3.create("svg")

const zoom = d3.zoom()
  .scaleExtent([1/8, 8])
  .on("zoom", zoomed);

svg.call(zoom);

// SVG for arrowheads
// svg.append('defs')
//   .append('marker')
//   .attr("id",'arrowhead')
//   .attr('viewBox','-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
//   .attr('refX',26.5) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
//   .attr('refY',0)
//   .attr('orient','auto')
//   .attr('markerWidth',5)
//   .attr('markerHeight',5)
//   .attr('xoverflow','visible')
//   .append('svg:path')
//   .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
//   .attr('fill', '#999')
//   .style('stroke','none');

// SVG for links
let link = svg.append("g")
  .attr("stroke", "grey")
  .attr("stroke-opacity", 0.6)
  .attr("stroke-WIDTH", 1)
  .selectAll("line");

// SVG for nodes
let node = svg.append("g")
  .selectAll("circle")

// SVG for labels
let label = svg.append("g")
  .selectAll("text")

simulation.on("tick", () => {
  link
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  label
    .attr("x", d => d.x)
    .attr("y", d => d.y);
});

function zoomed() {
  link.attr("transform", d3.event.transform);
  node.attr("transform", d3.event.transform);
  label.attr("transform", d3.event.transform);
}
