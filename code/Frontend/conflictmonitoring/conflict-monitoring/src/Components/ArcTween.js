import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function ArcTween({ confidence}) {
  const ref = useRef();
  const lastEndAngleRef = useRef(0);  // To keep track of the last end angle

  const width = 350;  // Set the width as per layout requirements
  const height = Math.min(500, width / 2) + 80; // Added extra height for labels
  const outerRadius = (height - 40) / 2 - 10; // Adjust radius to fit new height
  const innerRadius = outerRadius * 0.75;
  const tau = 2 * Math.PI;

  useEffect(() => {
    const svg = d3.select(ref.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("class", "arc-tween-svg");

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${(height - 40) / 2})`);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0);

    const background = g.append("path")
        .datum({endAngle: tau})
        .style("fill", "#ddd")
        .attr("d", arc);

    const foreground = g.append("path")
        .datum({endAngle: lastEndAngleRef.current})
        .style("fill", "turquoise")
        .attr("d", arc);

    const confidenceText = g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.7em");

    updateArc(confidence * tau);

    function updateArc(newAngle) {
      foreground.transition()
        .duration(750)
        .attrTween("d", arcTween(newAngle));

      confidenceText.text(`${(confidence * 100).toFixed(2)}%`);  // Display only the confidence percentage inside the arc
    }

    function arcTween(newAngle) {
      return function(d) {
        const interpolate = d3.interpolate(d.endAngle, newAngle);
        return function(t) {
          d.endAngle = interpolate(t);
          lastEndAngleRef.current = d.endAngle;  // Update the last end angle reference
          return arc(d);
        };
      };
    }

    return () => {
      svg.selectAll("*").remove();  // Cleanup SVG elements on unmount
    };
  }, [confidence]);  // React to changes in confidence, label, or type
// \[confidence, label, type]
  return <svg ref={ref} width={width} height={height} />;
}

export default ArcTween;
