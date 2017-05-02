var strings = stringsAll.performance;

var fundsToLoad =[
  {
    id: "INI210",
    label: strings.revenuLabel
  },{
    id: "INI220",
    label: strings.equilibreLabel
  },{
    id: "INI230",
    label: strings.croissanceLabel
  },{
    id: "INI235",
    label: strings.dividendesLabel
  },{
    id: "INI240",
    label: strings.actionsLabel
  }
];

//http://yourjavascript.com/5022388132/jquery-flot-dashes.js

$("#nav-history").before(
"<div id='plotdiv' style='width: 100%'>" +
  "<div id='optdiv'><input type='checkbox' id='checkRelValue' style='margin: 0;'> <label for='checkRelValue' style='display: inline-block; margin: 0;'>Valeur relative</label></div>" +
  "<div id='biggraph' style='height: 500px'></div>" +
  "<div id='smallgraph' style='height: 100px'></div>" + 
"</div>"
);

var series = new Array(fundsToLoad.length);
var fundsLoaded = 0;

$.each(fundsToLoad,function(i,val){
  $.getJSON("//api.morningstar.com/service/mf/Price/fundserv/"+val.id+"?format=json&username=morningstar&password=ForDebug&startdate=2008-01-01&enddate=2099-01-01", function(indata){
    var prices = indata.data.Prices;
    
    var curSeries = {
        label: val.label,
        data: new Array(),
    };
    
    for(var j = 0; j < prices.length; j++){
        var curitem = prices[j];
        curSeries.data.push([Date.parse(curitem.d),parseFloat(curitem.v)]);
    }
    
    series[i] = curSeries;
    
    fundsLoaded++;
    
    if(fundsLoaded >= fundsToLoad.length) plotData();
  });
});

var checkRelValueDOM = $("#checkRelValue");
var splot; 
var bplot;

checkRelValueDOM.change(function(){
  bplot.getOptions().yaxis.normalize = checkRelValueDOM.prop("checked");
  bplot.setupGrid();
  bplot.draw();
});

function plotData(){
    bplot = $.plot($("#biggraph"),series, {
        legend: {
            position: "nw",
            hideable: true,
        	  showHighlights: true,
        },
        xaxis: {
            mode: "time",
            interactive: true,
            panRange: [series[0].data[0][0],Date.now()],
            zoomRange: [1000*60*60*24*7,null],
        },
        yaxis: {
            transform: Math.log,
            inverseTransform: Math.exp,
            tickDecimals:2,
            zoomRange: false,
            panRange: false,
            autoresizevisible: true,
            normalize: checkRelValueDOM.prop("checked"),
        },
        zoom: {
            interactive: true,
            trigger: "dblclick",
        },
        pan: {
            interactive: true,
            cursor: "move",
            frameRate: 60,
        },
        tooltip: true,
        crosshair:{
            locked: false,
            mode:"xy",
            snapping:"x",
            highlight: [1000*60*60*12,null],
        },
    });
    splot = $.plot($("#smallgraph"),series, {
        legend: {
            show: false,
        },
        xaxis: {
            mode: "time",
        },
        yaxis: {
            transform: Math.log,
            inverseTransform: Math.exp,
            show: false,
        },
        rangeselection:{
            start: Date.now()-31556736000,
            end: Date.now(),
            enabled: true,
            controlsplot: bplot,
        },
    });
}