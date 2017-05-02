/* Flot plugin for showing crosshairs when the mouse hovers over the plot.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The plugin supports these options:

	crosshair: {
		mode: null or "x" or "y" or "xy"
		color: color
		lineWidth: number
	}

Set the mode to one of "x", "y" or "xy". The "x" mode enables a vertical
crosshair that lets you trace the values on the x axis, "y" enables a
horizontal crosshair and "xy" enables them both. "color" is the color of the
crosshair (default is "rgba(170, 0, 0, 0.80)"), "lineWidth" is the width of
the drawn lines (default is 1).

The plugin also adds four public methods:

  - setCrosshair( pos )

    Set the position of the crosshair. Note that this is cleared if the user
    moves the mouse. "pos" is in coordinates of the plot and should be on the
    form { x: xpos, y: ypos } (you can use x2/x3/... if you're using multiple
    axes), which is coincidentally the same format as what you get from a
    "plothover" event. If "pos" is null, the crosshair is cleared.

  - clearCrosshair()

    Clear the crosshair.

  - lockCrosshair(pos)

    Cause the crosshair to lock to the current location, no longer updating if
    the user moves the mouse. Optionally supply a position (passed on to
    setCrosshair()) to move it to.

    Example usage:

	var myFlot = $.plot( $("#graph"), ..., { crosshair: { mode: "x" } } };
	$("#graph").bind( "plothover", function ( evt, position, item ) {
		if ( item ) {
			// Lock the crosshair to the data point being hovered
			myFlot.lockCrosshair({
				x: item.datapoint[ 0 ],
				y: item.datapoint[ 1 ]
			});
		} else {
			// Return normal crosshair operation
			myFlot.unlockCrosshair();
		}
	});

  - unlockCrosshair()

    Free the crosshair to move again after locking it.
*/

(function ($) {
    var options = {
        crosshair: {
        	locked: true,
        	pos: null,
            mode: "xy",
            color: "rgba(170, 0, 0, 0.80)",
            lineWidth: 1,
            snapping:null,
            snappingseries: null,
            rounding:null,
            highlight: null,
            highlightseries: null,
        }
    };
    
    function init(plot) {
        var crosshair = { x: 0, y: 0, locked: false, visible: false};

        plot.setCrosshair = function(pos) {
        	if(pos === null){
        		crosshair.visible = false;
        	} else {
        		crosshair.visible = true;
	            crosshair.x = pos.x;
	            crosshair.y = pos.y;
        	}
      
      		doHighlight();
            plot.triggerRedrawOverlay();
        };
        
        plot.lockCrosshair = function() {
            crosshair.locked = true;
        };

        plot.unlockCrosshair = function() {
            crosshair.locked = false;
        };

        function onMouseMove(e) {
            if (crosshair.locked) return;
            
            var offset = plot.offset();
            var pos = {left: e.pageX - offset.left, top: e.pageY - offset.top};

            if((plot.getSelection && plot.getSelection()) || (pos.left<0) || (pos.left>plot.width()) || (pos.top<0) || (pos.top>plot.height())){
                plot.setCrosshair(null) // hide the crosshair if outside canvas, or selecting
                return;            	
            }
            
            plot.setCrosshair(roundPos(plot.c2p(pos)));
        }
        
        function roundPos(o){
            var opts = plot.getOptions().crosshair;
            
			var s = opts.snapping;
            
			if(s!==null){
				var sd = false;
            	var sx = false;
            	var sy = false;
				
				switch(s){
            		case "both":
            			sd=true;
            			break;
	            	case "x":
    	        		sx=true;
        	    		break;
            		case "y":
            			sy=true;
            			break;
	            	case "xy":
    	        	case "yx":
        	    		sx=true;
            			sy=true;
	            		break;
	            }
				
        		var series = plot.getData();
        	    var sseries = opts.snappingseries;
        	    	
    	        var dx = +Infinity;
	            var dy = +Infinity;
	            var dd = +Infinity;
	            
	            var oo = plot.p2c(o);
	            
	            var no = {left: oo.left, top: oo.top};
        	    	
    	        for (var i = 0; i < series.length; i++) {
					if((sseries !== null) && !sseries[i]) continue;
    	        		
	            	var curSeriesData = series[i].data;
            		
            		for (var j = 0; j < curSeriesData.length; j++) {
            			curPoint = curSeriesData[j];
            			
            			var po = plot.p2c({x:curPoint[0], y:curPoint[1]});
            				
            			if(sd){
            				var ndd = Math.pow(po.left-oo.left,2) + Math.pow(po.top-oo.top,2);
            						
            				if(ndd<dd){
								dd = ndd;
								no = po;
        	    			}            					
            			}else{
            				if(sx){
            					var ndx = Math.abs(po.left-oo.left);
            						
            					if(ndx<dx){
									dx = ndx;
									no.left = po.left;
        	    				}
            				}
            				if(sy){
			            		var ndy = Math.abs(po.top-oo.top);
            			
    			        	    if(ndy<dy){
		            		    	dy = ndy;
    	        	    			no.top = po.top;
            	    			}            						
            				}
            			}
            		}            	    	
            	}
        	    o = plot.c2p(no);
	        }            
            
            var r = opts.rounding;
            
            if(r !== null){
            	var no = {x: o.x, y: o.y};
            	
        	    if(r.x !== null){
            		no.x = (Math.round((o.x-r.x[0])/r.x[1])+r.x[0])*r.x[1];
            	}
	            if(r.y !== null){
            	    no.y = (Math.round((o.y-r.y[0])/r.y[1])+r.y[0])*r.y[1];
                }
                
                o = no;
            }
            
            return o;
        }
        
        function doHighlight(){
        	var opts = plot.getOptions().crosshair;
        	
        	var hl = opts.highlight;
        		
	        if(hl !== null){
	        	plot.unhighlight();
	        	
	        	if(crosshair.visible){
    	        	var hseries = opts.highlightseries;
    	        	
        		    var hx = hl[0];
        	    	var hy = hl[1];
            
    		        var series = plot.getData();
            	
	        	    for (var i = 0; i < series.length; i++) {
            			if((hseries !== null) && !hseries[i]) continue;
            	
        	    		var curSeriesData = series[i].data;
            		
    	        		for (var j = 0; j < curSeriesData.length; j++) {
	            			curPoint = curSeriesData[j];
            			
	        	    		if((hx !== null) && (Math.abs(curPoint[0]-crosshair.x)<=hx)) plot.highlight(i, j);
    		        	    if((hy !== null) && (Math.abs(curPoint[1]-crosshair.y)<=hy)) plot.highlight(i, j);
    	    	    	}            	    	
	            	}
	        	}
        	}
        }
        
        function drawCrosshair(plot, ctx){
        	var opts = plot.getOptions().crosshair;
            var m = opts.mode;
            
            if (m !== null){
	            var plotOffset = plot.getPlotOffset();
            
    	        ctx.save();
        	    ctx.translate(plotOffset.left, plotOffset.top);

	            if (crosshair.visible) {
	            	c = plot.p2c({x:crosshair.x, y:crosshair.y});
	            	
    	            var adj = plot.getOptions().crosshair.lineWidth % 2 ? 0.5 : 0;

        	        ctx.strokeStyle = opts.color;
            	    ctx.lineWidth = opts.lineWidth;
                	ctx.lineJoin = "round";

	                ctx.beginPath();
    	            if ((m.indexOf("x") != -1) && (c.left>=0) && (c.left<=plot.width())) {
        	            var drawX = Math.round(c.left) + adj;
            	        ctx.moveTo(drawX, 0);
                	    ctx.lineTo(drawX, plot.height());
	                }
    	            if ((m.indexOf("y") != -1) && (c.top>=0) && (c.top<=plot.height())) {
        	            var drawY = Math.round(c.top) + adj;
            	        ctx.moveTo(0, drawY);
                	    ctx.lineTo(plot.width(), drawY);
	                }
    	            ctx.stroke();
        	    }
            	ctx.restore();
            }
        }
        
        plot.hooks.bindEvents.push(function (plot, eventHolder) {
        	var opts = plot.getOptions().crosshair;
        	
        	plot.setCrosshair(opts.pos);
            crosshair.locked = opts.locked;
        	
            eventHolder.mouseout(onMouseMove);
            eventHolder.mousemove(onMouseMove);
        });

        plot.hooks.drawOverlay.push(drawCrosshair);

        plot.hooks.shutdown.push(function (plot, eventHolder) {
            eventHolder.unbind("mouseout", onMouseMove);
            eventHolder.unbind("mousemove", onMouseMove);
        });
    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'crosshair',
        version: '2.0'
    });
})(jQuery);
