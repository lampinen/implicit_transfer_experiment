// plugin for dragging images onto locations on another image 

jsPsych.plugins['drag-drop-on-image'] = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {
    // Python-like range runction
    function range(n) {
        var result = [];
        for (i = 0; i < n; i++) {
            result.push(i);
        }
        return result;
    }


    // expected parameters:
    //trial.background_image = background image
    //trial.dragging_images = assignment of fractals to elements
    //trial.target_locations = locations of drop zones (rel. to background image) as {x: x, y: y, width: width, height: height} objects
    trial.location_labels = (typeof trial.location_labels === 'undefined') ? range(trial.locations.length()) : trial.location_labels; 
    trial.canvas_height = trial.canvas_height || 400;
    trial.canvas_width = trial.canvas_width || 600;
    trial.bg_image_height = trial.bg_image_height || 400;
    trial.bg_image_width = trial.bg_image_width || 400;
    trial.dragging_image_height = trial.dragging_image_height || 80;
    trial.dragging_image_width = trial.dragging_image_width || 80;

    var frame_freq = 50; // ms between frames

    display_element.append($('<canvas>', {
        "id": "dragging-canvas",
        "class": "dragging-canvas",
        "style": "border:1px solid #000000;",
        "css": {
            "position": "relative",
            "width": trial.canvas_width,
            "height": trial.canvas_height
        }
    }).width(trial.canvas_width).height(trial.canvas_height));
    $('#dragging-canvas')[0].width = trial.canvas_width;
    $('#dragging-canvas')[0].height = trial.canvas_height;

    var bg_image_object = new Image(trial.bg_image_width, trial.bg_image_height);
    bg_image_object.src = trial.background_image;
    var dragging_image_objects = trial.dragging_images.map(function(x) {
        var this_image = new Image(trial.dragging_image_width, trial.dragging_image_height);
        this_image.src = x;
        return this_image;
        });

    var canvas = $('#dragging-canvas')[0];
    var draw = canvas.getContext("2d");

    display_element.append('<div id="instruction-div">The fractal relationships in your experiment obeyed the structure above (black squares = fractals, colored arrows = gamma ray and acid). Drag the fractals onto the black squares that you think they map onto (one has been placed to get you started).</div>');

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    var action_history = [];

    var action_rts = [];

    var start_time = (new Date()).getTime();

    if (trial.dragging_images.length > 10) {
        alert("Not enough initial locations, truncating to 10 images...")
        dragging_image_objects = dragging_image_objects.slice(10);
    }

    var initial_locations = [{"x": 0, "y": 0, "width": 80, "height": 80}, {"x": 80, "y": 0, "width": 80, "height": 80},
                             {"x": 0, "y": 80, "width": 80, "height": 80}, {"x": 80, "y": 80, "width": 80, "height": 80},
                             {"x": 0, "y": 160, "width": 80, "height": 80}, {"x": 80, "y": 160, "width": 80, "height": 80},
                             {"x": 0, "y": 240, "width": 80, "height": 80}, {"x": 80, "y": 240, "width": 80, "height": 80},
                             {"x": 0, "y": 320, "width": 80, "height": 80}, {"x": 80, "y": 320, "width": 80, "height": 80}] //remember, you can't trust Marissa 

    /////// the annoying part ////////////////////////////////////////////////////

    // "constructor" for the places the objects snap to 
    function snap_location(this_location) {
        this.x = this_location.x;
        this.y = this_location.y;
        this.width = this_location.width || trial.dragging_image_width;
        this.height = this_location.height || trial.dragging_image_height;
        this.occupied = false;
        this.draggable = null;

        this.contains = function(mouse) {
            var x = mouse.x;
            var y = mouse.y;
            return (x >= this.x) && (x <= this.x + this.width) && (y >= this.y) && (y <= this.y + this.width)
        }

        this.free = function() {
            this.occupied = false;
        };

        this.assign_draggable = function(draggable) {
            this.occupied = true;
            this.draggable = draggable;
            this.draggable.curr_location = this;
            this.draggable.position_x = this.x;
            this.draggable.position_y = this.y;
        }
    }

    // creating objects for all the necessary locations
    initial_locations = initial_locations.map(function(x) {var loc = new snap_location(x); return loc;});
    var target_locations = trial.target_locations.map(function(x) {var loc = new snap_location(x); return loc;});
    var all_locations = initial_locations.concat(target_locations);

    // "constructor" for draggable image object
    function Draggable(image, initial_location, width, height) {
        this.drawer = draw; // it would be so nice if I named things intelligently
        this.curr_location = initial_location;
        this.position_x = initial_location.x; //not strictly necessary given below
        this.position_y = initial_location.y;
        this.curr_location.assign_draggable(this);

        this.image = image;
        this.width = width || trial.dragging_image_width;
        this.height = height || trial.dragging_image_height;
        this.dragging = false;
        this.drag_init_x = 0; //while dragging
        this.drag_init_y = 0;
        this.mouse_init_x = 0; //while dragging
        this.mouse_init_y = 0;
        this.draw = function() {
            this.drawer.drawImage(this.image,
                           this.position_x,
                           this.position_y,
                           this.width,
                           this.height);
        };

        this.contains = function(mouse) {
            var x = mouse.x;
            var y = mouse.y;
            return (x >= this.position_x) && (x <= this.position_x + this.width) && (y >= this.position_y) && (y <= this.position_y + this.width)
        }
        
        this.mousedown_handler = function(e, mouse) {
            // presupposes containment
            this.dragging = true; 
            this.drag_init_x = this.position_x;
            this.drag_init_y = this.position_y;
            this.mouse_init_x = mouse.x; 
            this.mouse_init_y = mouse.y;
        }

        this.mousemove_handler = function(e, mouse) {
            this.position_x = this.drag_init_x + mouse.x - this.mouse_init_x;
            this.position_y = this.drag_init_y + mouse.y - this.mouse_init_y;
        }

        this.mouseup_handler = function(e, mouse) {
            this.dragging = false; 
            for (var i = 0; i < all_locations.length; i++ ) {
                if (all_locations[i].contains(mouse)) {
                    if (all_locations[i].occupied) {
                        this.curr_location.assign_draggable(all_locations[i].draggable);
                    } else {
                        this.curr_location.free();
                    }
                    all_locations[i].assign_draggable(this);
                    return;
                }
            }
            // otherwise, back to where we started... ugggh
            this.curr_location.assign_draggable(this);
        }
    }

    var draggables_array = []; 
    for (var i = 0; i < trial.dragging_images.length; i++) {
        var this_draggable = new Draggable(dragging_image_objects[i], initial_locations[i]);
        draggables_array.push(this_draggable);
    }

    function redraw() {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        draw.drawImage(bg_image_object,
                       trial.canvas_width - (trial.bg_image_width + 20),
                       0,
                       trial.bg_image_width,
                       trial.bg_image_height);

        for (var i = 0; i < draggables_array.length; i++) {
            draggables_array[i].draw();
        }
    }
    ////// event stuff /////////////////////////////

    var getMouse = function(e,canvas) { //Gets mouse location relative to canvas, code stolen from https://github.com/simonsarris/Canvas-tutorials/blob/master/shapes.js 
	    var element = canvas;
	    var offsetX = 0;
	    var offsetY = 0;
	    var html = document.body.parentNode;
	    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
	    if (element.offsetParent !== undefined) {
		    do {
			    offsetX += element.offsetLeft;
			    offsetY += element.offsetTop;
		    } while ((element = element.offsetParent));
	    }

	    if (document.defaultView && document.defaultView.getComputedStyle) {
		    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
		    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
		    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
		    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
	    }
	    htmlTop = html.offsetTop;
	    htmlLeft = html.offsetLeft;
	    offsetX += stylePaddingLeft + styleBorderLeft + htmlLeft;
	    offsetY += stylePaddingTop + styleBorderTop + htmlTop;

	    mx = e.pageX - offsetX;
	    my = e.pageY - offsetY;
	    return {x: mx, y: my};
    };

    canvas.addEventListener('mousedown', function(e) {
        var mouse = getMouse(e, canvas);
        //alert([mouse.x, mouse.y]) //Useful for finding locations...
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].contains(mouse)) {
                return draggables_array[i].mousedown_handler(e, mouse);
            }
        }
    });

    // Erin, if you're reading this, it's not too late... yet
    canvas.addEventListener('mousemove', function(e) {
        var mouse = getMouse(e, canvas);
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].dragging) {
                return draggables_array[i].mousemove_handler(e, mouse);
            }
        }
    });

    canvas.addEventListener('mouseup', function(e) {
        var mouse = getMouse(e, canvas);
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].dragging) {
                return draggables_array[i].mouseup_handler(e, mouse);
            }
        }
    });

    ////// Ending/starting /////////////////////////////////////////////////////////
    
    function end_function() {

      jsPsych.pluginAPI.cancelAllKeyboardResponses();
      display_element.html('');

      var trial_data = {
      };

      jsPsych.finishTrial(trial_data);
    }

    // start trial once images are loaded
    jsPsych.pluginAPI.preloadImages(trial.dragging_images.concat([trial.background_image]), function() {
        setInterval(redraw, frame_freq);
    });
  };

  return plugin;
})();
