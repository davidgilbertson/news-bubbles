var circle1 = d3.select('#circle-1');
var circle2 = d3.select('#circle-2');
var circle3 = d3.select('#circle-3');

circle3.node(0).parentNode.insertBefore(circle3.node(0), circle3.node(0).parentNode.firstChild);
console.log('circle test loaded');