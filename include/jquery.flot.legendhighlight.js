/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Plugin to show the currently highlighted points in the legend
 */
 
(function ($) {
    var options = {
        legend:{
            showHighlights: false,
        }
    };

    function init(plot) {
        plot.hooks.processOptions.push(function(plot, o) {
            if(!o.legend.showHighlights) return;
            
            var drawnLegend = false;
            var highlights = [];
            
            
            var oldHighlightFunct = plot.highlight;
            var oldUnhighlightFunct = plot.unhighlight;
            
            function indexOfHighlight(s,p){
                for(var i;i<highlights.length;i++) if((highlights[i][0] == s) && (highlights[i][1] == p)) return i;
                return -1;
            }
            
            plot.highlight = function(s, p, a){
                oldHighlightFunct(s, p, a);
                
                if(indexOfHighlight(s,p)==-1) highlights.push([s,p]);
            }
            
            plot.unhighlight = function(s, p){
                oldUnhighlightFunct(s, p);
             
                if(s===undefined){
                    highlights = [];
                }else{
                    var i = indexOfHighlight(s,p);
                    if(i!=-1) highlights.splice(0,i);
                }
            }
            
            function findPlotSeriesIdx(label) {
                var plotdata = plot.getData();
                for (var i = 0; i < plotdata.length; i++) if (plotdata[i].label == label) return i;
                return -1;
            }
            
            plot.hooks.processOffset.push(function(plot,offsets){
                drawnLegend = false;
            });
            
            plot.hooks.draw.push(function(plot,ctx){
                if(drawnLegend) return;
                
                plot.getPlaceholder().find(".legendLabel").parent().append("<td class='legendDataBox'></td>");
                
                drawnLegend = true;
            });
            

            
            plot.hooks.drawOverlay.push(function(plot,ctx){
                var plotSeries = plot.getData();
                
                plot.getPlaceholder().find(".legendLabel").each(function(){
                    var elem = $(this);
                    
                    var idx = findPlotSeriesIdx(elem.text());
                    
                    if(idx==-1) return;
                    
                    var dataText = "";
                    
                    var first = true;
                    
                    for(var j=0;j<highlights.length;j++){
                        var curHighlight = highlights[j];
                        if(curHighlight[0]==idx){
                            if(!first) dataText += ", ";
                            first = false;
                            dataText+=plotSeries[idx].data[curHighlight[1]][1];
                        }
                    }
                    
                    elem.parent().find(".legendDataBox").text(dataText);
                });
            });
        });
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'legendhighlight',
        version: '1.0'
    });

})(jQuery);
