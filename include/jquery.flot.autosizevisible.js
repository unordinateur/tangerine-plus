/*
 * Flot plugin for autoresizing the y axis according to visible data only
 * 
 * Released under the MIT license by Vincent Aymong, May 2014
 *
 * 1.0 Initial version (May 2014)
 * 2.0 Added normalization to initial value (April 2017)
 *
 */
 
(function ($) {
    function init(plot) {
        plot.hooks.processOptions.push(function (plot, o) {
          function linearInterpolation(x0,y0,x1,y1,x) {
            return (x - x0) * (y1 - y0) / (x1 - x0) + y0;
          }
          
          var originalData;
          var originalDataSaved = false; 
          
          plot.hooks.drawBackground.push(function (plot, ctx) {
            var data = plot.getData();
            var axes = plot.getAxes();
            
            if(!originalDataSaved){
              oData = jQuery.extend(true, {}, data);
              originalDataSaved = true;
            }

            var startx = axes.xaxis.min;

            for (var i = 0; i < data.length; i++) {
              var oSeries = oData[i];  
              var curSeries = data[i];
              
              var curPoints = curSeries.datapoints.points;
              var oPoints = oSeries.datapoints.points;
              
              var ds = curSeries.datapoints.pointsize;

              var refVal = 1;
              
              if(o.yaxis.normalize){
                var j = 0;
                
                if(startx <= oPoints[j+0]){
                  refVal = 10;
                }else{
                  do{
                    j+=ds;
                  }while(startx > oPoints[j+0]);
                  
                  refVal = linearInterpolation(oPoints[j-ds+0],oPoints[j-ds+1],oPoints[j+0],oPoints[j+1],startx);
                }
              }
              
              for (var j = 0; j < curPoints.length; j += ds) {
                curPoints[j+1] = oPoints[j+1]/refVal;
              }
            }
          });


          plot.hooks.drawBackground.push(function (plot, ctx) {
            if(!o.yaxis.autoresizevisible) return;
          
            var data = plot.getData();
            var axes = plot.getAxes();

            var startx = axes.xaxis.min;
            var endx = axes.xaxis.max;

            var miny = +Infinity;
            var maxy = -Infinity;

            for (var i = 0; i < data.length; i++) {
              var curSeries = data[i];
              
              if(curSeries.lines.show || curSeries.points.show){
                  function considery(y) {
                      if (y < miny) miny = y;
                      if (y > maxy) maxy = y;
                  }
                  
                  function isbetween(x1, x2, x) {
                    return ((x >= x1 && x <= x2) || (x <= x1 && x >= x2));
                  }
                  
                  var curData = curSeries.datapoints.points;
                  var ds = curSeries.datapoints.pointsize;
                  
                  var j = 0;

                  if (isbetween(startx, endx, curData[j+0])) considery(curData[j+1]);
                  
                  var prevj = 0;

                  for (j = ds; j < curData.length; j += ds) {
                      if (isbetween(startx, endx, curData[j+0])) considery(curData[j+1]);
                      if (isbetween(curData[prevj+0], curData[j+0], startx)) considery(linearInterpolation(curData[prevj+0],curData[prevj+1],curData[j+0],curData[j+1],startx));
                      if (isbetween(curData[prevj+0], curData[j+0], endx)) considery(linearInterpolation(curData[prevj+0],curData[prevj+1],curData[j+0],curData[j+1],endx));
                      
                      prevj = j;
                  }
              }
            }
            
            tmin = axes.yaxis.options.transform(miny);
            tmax = axes.yaxis.options.transform(maxy);
            tw = (tmax-tmin)*axes.yaxis.options.autoscaleMargin;
            
            axes.yaxis.options.min = axes.yaxis.options.inverseTransform(tmin-tw);
            axes.yaxis.options.max = axes.yaxis.options.inverseTransform(tmax+tw);

            plot.setupGrid();
          });
        });
    }

    $.plot.plugins.push({
        init: init,
        options: {
            yaxis: {
                autoresizevisible: false,
                normalize: false,
            }
        },
        name: 'autoresizevisible',
        version: '1.0'
    });
})(jQuery);
