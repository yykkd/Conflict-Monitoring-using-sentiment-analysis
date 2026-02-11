// import React, { useEffect, useRef } from 'react';
// import * as d3 from 'd3';
// import cloud from 'd3-cloud';

// function WordCloud({ keywords }) {
//     const ref = useRef();

//     useEffect(() => {
//         const svgElement = d3.select(ref.current)
//             .attr("viewBox", `0 0 700 500`) // Updated viewBox width to 700
//             .attr("preserveAspectRatio", "xMidYMid meet")
//             .attr("class", "word-cloud");

//         if (keywords.length > 0) {
//             const wordsData = processWords(keywords);
//             drawWordCloud(svgElement, wordsData);
//         }
//     }, [keywords]);

//     const processWords = (words) => {
//         return words.map(({ text, value }) => ({
//             text,
//             size: value * 2 // Adjust size factor to scale appropriately
//         }));
//     };

//     const drawWordCloud = (svgElement, words) => {
//         const width = 700;  // Updated SVG width to 700
//         const height = 500; // SVG height remains the same

//         const layout = cloud()
//             .size([width, height])
//             .words(words)
//             .padding(3)
//             .rotate(() => 0)
//             .font("Impact")
//             .fontSize(d => Math.max(20, Math.min(d.size, 50)))
//             .on("end", renderedWords => {
//                 render(svgElement, renderedWords);
//             });

//         layout.start();
//     };

//     const render = (svgElement, words) => {
//         const text = svgElement.selectAll("text")
//             .data(words, d => d.text);

//         text.enter()
//             .append("text")
//             .merge(text)
//             .attr("text-anchor", "middle")
//             .style("font-family", "serif")
//             .style("font-size", d => `${d.size}px`)
//             .attr("transform", d => `translate(${d.x + 350}, ${d.y + 250})`) // Updated to center in the new width
//             .text(d => d.text);

//         text.exit().remove();
//     };

//     return (
//         <div style={{ display: 'flex', justifyContent: 'center', height: '400px', width: '100%' }} className='border-2 border-cyan-200 rounded pt-6 mt-2'>
//             <svg ref={ref} width="100%" height="80%"></svg>
//         </div>
//     );
// }

// export default WordCloud;


import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

function WordCloud({ keywords }) {
    const ref = useRef();

    useEffect(() => {
        const svgElement = d3.select(ref.current)
            .attr("viewBox", `0 0 700 500`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("class", "word-cloud");

        if (keywords.length > 0) {
            const wordsData = processWords(keywords);
            drawWordCloud(svgElement, wordsData);
        }
    }, [keywords]);

    const processWords = (words) => {
        return words.map(({ text, value }) => ({
            text,
            size: value * 2
        }));
    };

    const drawWordCloud = (svgElement, words) => {
        const width = 700;
        const height = 500;

        // Create a color scale
        const colorScale = d3.scaleLinear()
            .domain([d3.min(words, d => d.size), 150])
            .range(["gray", "red"]); // Colors from less to more important

        const layout = cloud()
            .size([width, height])
            .words(words)
            .padding(3)
            .rotate(() => 0)
            .font("Impact")
            .fontSize(d => Math.max(20, Math.min(d.size, 50)))
            .on("end", renderedWords => {
                render(svgElement, renderedWords, colorScale);
            });

        layout.start();
    };

    const render = (svgElement, words, colorScale) => {
        const text = svgElement.selectAll("text")
            .data(words, d => d.text);

        text.enter()
            .append("text")
            .merge(text)
            .attr("text-anchor", "middle")
            .style("font-family", "serif")
            .style("font-size", d => `${d.size}px`)
            .style("fill", d => colorScale(d.size))  // Apply the color scale based on size
            .attr("transform", d => `translate(${d.x + 350}, ${d.y + 250})`)
            .text(d => d.text);

        text.exit().remove();
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', height: '400px', width: '100%' }} className='border-2 border-cyan-200 rounded pt-6 mt-2'>
            <svg ref={ref} width="100%" height="80%"></svg>
        </div>
    );
}

export default WordCloud;
