/*
 * Flot plugin for selecting a range in a graph by moving/resizing a selection area on a second graph
 * 
 * Version 1.4
 *
 * Released under the MIT license by Troels Bang Jensen, August 2012
 * 
 * Version history:
 * 
 * 1.0 Initial version
 * 
 * 1.1 Fixed some cursor issues on leaving the graph and selecting handles at the ends of the graph.
 * 
 * 1.2 Limit cursor style to canvas element to avoid hanging cursor style in the rest of the document.
 *
 * 1.3 Refractored code, callback is now called on every move.
 *
 * 1.4 Trigger event instead of callback, getters/setters added.
 * 
 */

(function ($) {
    function init(plot) {
        plot.hooks.processOptions.push(function (plot, o) {
            if (!o.rangeselection.enabled) return;

            //Internal variables
            var rangeselection = {
                start: null,
                end: null,
                active: false,
                moveStart: 0,
                handle: null,
                tolerance: 5,
                overdiv: null
            };
            
            function clamp(min, value, max) {
                return value < min ? min : (value > max ? max : value);
            }
            
            function calcPtr(e) {
                var offset = plot.getPlaceholder().offset();
                var plotOffset = plot.getPlotOffset();

                rangeselection.action = e.type;

                return {
                    x: e.pageX - offset.left - plotOffset.left,
                    y: e.pageY - offset.top - plotOffset.top,
                    type: e.type
                };
            }

            function updateCursor(p) {
                var f = rangeselection.start;
                var s = rangeselection.end;
                var t = rangeselection.tolerance;

                var newHandle = null;

                if (p.y > (0 - t) && p.y < (plot.height() + t)) {
                    if (Math.abs(f - p.x) < t) {
                        newHandle = "start";
                    } else if (Math.abs(s - p.x) < t) {
                        newHandle = "end";
                    } else if (p.x > f && p.x < s) {
                        rangeselection.moveStart = p.x;
                        newHandle = "body";
                    } else if (p.x > 0 && p.x < plot.width() && p.y > 0 && p.y < plot.height()) {
                        rangeselection.moveStart = s - (s - f) / 2;
                        newHandle = "grid";
                    }
                }

                if (newHandle != rangeselection.handle) {
                    rangeselection.handle = newHandle;

                    switch (rangeselection.handle) {
                        case "start":
                            plot.getPlaceholder().css('cursor', 'w-resize');
                            rangeselection.overdiv.css('cursor', 'w-resize');
                            break;
                        case "end":
                            plot.getPlaceholder().css('cursor', 'e-resize');
                            rangeselection.overdiv.css('cursor', 'e-resize');
                            break;
                        case "body":
                            plot.getPlaceholder().css('cursor', 'move');
                            rangeselection.overdiv.css('cursor', 'move');
                            break;
                        case "grid":
                            plot.getPlaceholder().css('cursor', 'auto');
                            rangeselection.overdiv.css('cursor', 'move');
                            break;
                        default:
                            plot.getPlaceholder().css('cursor', 'auto');
                            break;
                    }
                }
            }
            
            function updateSelection(p) {
                var x = clamp(0, p.x, plot.width());
                
                var sel = getSelection(true,p.type);
                var f = sel.start;
                var s = sel.end;
                
                var m = o.rangeselection.minWidth;

                switch (rangeselection.handle) {
                    case "start":
                        f = x;
                        if (x < 0) f = 0;
                        if (x > s - m) f = s - m; //Minimum size of selection
                        break;
                    case "end":
                        s = x;
                        if (x > plot.width()) s = plot.width();
                        if (x < f + m) s = f + m; //Minimum size of selection

                        break;
                    case "grid":
                    case "body":
                        var dx = x - rangeselection.moveStart;
                        if (f + dx < 0) {
                            s -= f;
                            f = 0;
                        } else if (s + dx > plot.width()) {
                            f = plot.width() - (s - f);
                            s = plot.width();
                        } else {
                            s += dx;
                            f += dx;
                        }
                        rangeselection.moveStart = x;
                        break;
                }

                setSelection(true,f,s,p.type);

                if (rangeselection.handle == "grid") rangeselection.handle = "body";
            }
            
            function getSelection(pxspace,a){
                var start = rangeselection.start;
                var end = rangeselection.end;
                
                if(!pxspace){
                    var xaxis = plot.getAxes().xaxis;
                    
                    start=xaxis.c2p(start);
                    end=xaxis.c2p(end);
                }                
                
                return {
                    handle: rangeselection.handle,
                    action: a,
                    start: start,
                    end: end
                }
            }


            function setSelection(pxspace,start,end,a){
                if(!pxspace){
                    var xaxis = plot.getAxes().xaxis;
                    
                    start=xaxis.p2c(start);
                    end=xaxis.p2c(end);
                }
                
                rangeselection.start = start;
                rangeselection.end = end;
                
                plot.getPlaceholder().trigger("selectionChanged",getSelection(false,a));
                plot.triggerRedrawOverlay();
            }
            

            function resetSelection(a) {
                var xaxis = plot.getAxes().xaxis;
                setSelection(
                    false,
                    o.rangeselection.start === null ? xaxis.datamin : o.rangeselection.start,
                    o.rangeselection.end === null ? xaxis.datamax : o.rangeselection.end,
                    a
                );
            }

            function drawSelection(plot, ctx, start, end) {
                function roundedRect(ctx, x, y, w, h, radius, fill, stroke) {
                    ctx.save(); // save the context so we don't mess up others
                    var r = x + w;
                    var b = y + h;
                    ctx.beginPath();
                    ctx.lineWidth = "4";
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(r - radius, y);
                    ctx.quadraticCurveTo(r, y, r, y + radius);
                    ctx.lineTo(r, y + h - radius);
                    ctx.quadraticCurveTo(r, b, r - radius, b);
                    ctx.lineTo(x + radius, b);
                    ctx.quadraticCurveTo(x, b, x, b - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.stroke();

                    if (fill) {
                        ctx.fill();
                    }
                    if (stroke) {
                        ctx.stroke();
                    }
                    ctx.restore(); // restore context to what it was on entry  
                }

                var plotOffset = plot.getPlotOffset();
                ctx.save();
                ctx.translate(plotOffset.left, plotOffset.top);
                var c = $.color.parse(o.rangeselection.color);
                ctx.strokeStyle = c.scale('a', 0.9).toString();
                ctx.lineWidth = 3;
                ctx.lineJoin = "round";
                ctx.fillStyle = c.scale('a', 0.4).toString();
                var xaxis = plot.getAxes().xaxis;
                var f = start;
                var s = end;
                var x = f,
                    y = 0,
                    w = s - f,
                    h = plot.height();
                roundedRect(ctx, x, y, w, h, 3, true, true);
                ctx.restore();
            }
            
            function onMouseDown(e) {
                if (rangeselection.handle === null) return true;

                if (e.which != 1) return true; // Only accept left-clicks

                rangeselection.active = true;

                rangeselection.overdiv.css('display', 'block');
                rangeselection.overdiv.focus(); //Cancel out any text selections

                updateSelection(calcPtr(e));

                return false;
            }

            function onMouseMove(e) {
                var p = calcPtr(e);

                if (rangeselection.active) {
                    updateSelection(p);
                    return false;
                } else {
                    updateCursor(p);
                    return true;
                }
            }

            function onMouseUp(e) {
                if (!rangeselection.active) return true;

                rangeselection.active = false;

                rangeselection.overdiv.css('display', 'none');

                var p = calcPtr(e);
                updateSelection(p);
                updateCursor(p);

                return false;
            }

            function onDblclick(e) {
                if (rangeselection.handle === null) return true;

                resetSelection(e.type);

                return false;
            }
            
            plot.setSelection = function(start,end){
                setSelection(false,start,end,"fct");
            }
            
            plot.resetSelection = function(){
                resetSelection("fct");
            }

            plot.getSelection = function(){
                return getSelection(false,"get");
            }

            plot.hooks.draw.push(function (plot, ctx) {
                plot.triggerRedrawOverlay();
            });

            plot.hooks.drawOverlay.push(function (plot, ctx) {
                ctx.clearRect(0, 0, plot.width(), plot.height());
                drawSelection(plot, ctx, rangeselection.start, rangeselection.end);
            });

            plot.hooks.bindEvents.push(function (plot, eventHolder) {
                var splot = o.rangeselection.controlsplot;
                
                if(splot !== null){
                    splot.getPlaceholder().bind("plotpan plotzoom",function(){
                        var xaxis = splot.getAxes().xaxis;
                        setSelection(false,xaxis.options.min,xaxis.options.max,"sync");
                    });
                    plot.getPlaceholder().bind("selectionChanged",function(e,coord){
                        if((coord.handle === null) && (coord.action != "init")) return;
        
                        var xaxis = splot.getAxes().xaxis;
                        xaxis.options.min = coord.start;
                        xaxis.options.max = coord.end;
        
                        splot.setupGrid();
                        splot.draw(); 
                    });
                }
                
                $(document).bind("mousedown", onMouseDown);
                $(document).bind("mousemove", onMouseMove);
                $(document).bind("mouseup", onMouseUp);
                $(document).bind("dblclick", onDblclick);

                rangeselection.overdiv = $(document.createElement("div")).css({
                    position: "fixed",
                    "z-index": 999,
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: 0,
                    display: "none"
                });

                $("body").append(rangeselection.overdiv);

                resetSelection("init");
            });

            plot.hooks.shutdown.push(function (plot, eventHolder) {
                $(document).unbind("mousedown", onMouseDown);
                $(document).unbind("mousemove", onMouseMove);
                $(document).unbind("mouseup", onMouseUp);
                $(document).unbind("dblclick", onDblclick);
                rangeselection.overdiv.remove();
            });
        });
    }

    $.plot.plugins.push({
        init: init,
        options: {
            rangeselection: {
                color: "#f88",
                start: null,
                enabled: false,
                end: null,
                minWidth: 10,
                controlsplot: null,
            }
        },
        name: 'rangeselector',
        version: '1.4'
    });
})(jQuery);
