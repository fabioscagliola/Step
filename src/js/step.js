var step = {

    view: {
        SPAN: 10,
        beginIndex: function () {
            if (step.joshua.location.position > step.earths[step.joshua.location.earthIndex].data.length - step.view.SPAN) {
                return step.earths[step.joshua.location.earthIndex].data.length - step.view.SPAN;
            } else {
                return step.joshua.location.position;
            }
        },
        endIndex: function () {
            if (step.joshua.location.position > step.earths[step.joshua.location.earthIndex].data.length - step.view.SPAN) {
                return step.earths[step.joshua.location.earthIndex].data.length - 1;
            } else {
                return step.joshua.location.position + step.view.SPAN - 1;
            }
        },
        blockWidth: function () {
            return step.graphics._stage.canvas.width / step.view.SPAN;
        }
    },

    // INTERNAL STUFF

    /// The thicking interval (milliseconds)
    __INTERVAL: 500,

    /// The ID of the thicking interval
    __intervalId: null,

    /// The ID of the animation frame 
    __animationFrameId: null,

    ///
    __redraw: function () {
        step.__animationFrameId = requestAnimationFrame(step.__redraw);
        step.__render();
    },

    /// 
    __previousRenderTime: 0,

    /// Renders an animation frame
    __render: function () {
        var renderTime = new Date().getTime();
        var difference = step.__previousRenderTime == 0 ? 0 : (renderTime - step.__previousRenderTime) / step.__INTERVAL;
        step.__previousRenderTime = renderTime;

        for (var i = 0; i < step.graphics.background.length; i++) {
            // =A2-$A$1*FLOOR.MATH(A2/$A$1) 
            var factor = i - step.earths.length * Math.floor(i / step.earths.length) * .8;
            step.graphics.background[i].x = (step.graphics.background[i].x - step.view.blockWidth() * difference * factor) % step.graphics.background[i].tileW;
        }

        for (var i = 0; i < step.graphics.foreground.length; i++) {
            var factor = i - step.earths.length * Math.floor(i / step.earths.length) * .8;
            step.graphics.foreground[i].x = (step.graphics.foreground[i].x - step.view.blockWidth() * difference * factor) % step.graphics.foreground[i].tileW;
        }

        for (var i = 0; i < step.graphics.obstacle.length; i++) {
            step.graphics.obstacle[i].x -= step.view.blockWidth() * difference;
        }

        if (step.joshua.isSteppingEast || step.joshua.isSteppingWest) {
            step.graphics._stage.y += (step.joshua.isSteppingEast ? 1 : -1) * step.graphics._stage.canvas.height * difference;
            step.graphics.joshua.y += (step.joshua.isSteppingWest ? 1 : -1) * step.graphics._stage.canvas.height * difference;
        }

        //if (step.joshua.location.position > step.earths[step.joshua.location.earthIndex].data - step.view.SPAN) {
        //    step.graphics.joshua.x += step.view.blockWidth() * difference;
        //} else {
        //    step.graphics.joshua.x = 0;
        //}

        step.graphics._stage.update();

        // Text render 

        var buffer = '';

        for (var x = step.view.beginIndex(); x <= step.view.endIndex(); x++) {
            if (x == step.joshua.location.position) {
                switch (step.earths[step.joshua.location.earthIndex].data[x]) {
                    case 0:
                        buffer += 'j';
                        break;
                    case 1:
                        buffer += 'X';
                        break;
                }
            } else {
                switch (step.earths[step.joshua.location.earthIndex].data[x]) {
                    case 0:
                        buffer += '_';
                        break;
                    case 1:
                        buffer += '|';
                        break;
                }
            }
        }

        $('#temp').html(buffer);
    },

    __startTicking: function () {
        if (step.__intervalId == null) {
            step.__previousRenderTime = 0;
            step.__intervalId = setInterval(function () {
                step.__tick();
            }, step.__INTERVAL);
        }
    },

    __tick: function () {
        step.joshua.move();
    },

    earths: [
        {
            earthIndex: 1,
            name: 'West0001',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        },
        {
            earthIndex: 0,
            name: 'Datum000',
            data: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,],
        },
        {
            earthIndex: -1,
            name: 'East0001',
            data: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,],
        },
    ],

    /// 
    graphics: {
        _loadQueue: null,
        _stage: null,

        background: [],
        foreground: [],
        joshua: null,
        obstacle: [],

        __addShape: function (id, earthIndex, x = 0) {
            var shape = new createjs.Shape();
            var imageElement = step.graphics._loadQueue.getResult(id);
            shape.graphics.beginBitmapFill(imageElement);
            shape.graphics.drawRect(0, 0, step.graphics._stage.canvas.width + imageElement.width, imageElement.height);
            shape.tileW = imageElement.width;
            shape.x = x;
            shape.y = step.graphics._stage.canvas.height * (earthIndex + 1) - imageElement.height;
            step.graphics._stage.addChild(shape);
            return shape;
        },

        init: function (canvas, whenDone) {
            step.graphics._loadQueue = new createjs.LoadQueue(false);
            step.graphics._stage = new createjs.Stage(canvas);

            step.graphics._loadQueue.addEventListener('complete', function () {

                for (var i = 0; i < step.earths.length; i++) {
                    step.graphics.background.push(step.graphics.__addShape(step.earths[i].name + '-Backdrop00', step.earths[i].earthIndex));
                    step.graphics.background.push(step.graphics.__addShape(step.earths[i].name + '-Backdrop01', step.earths[i].earthIndex));
                    step.graphics.background.push(step.graphics.__addShape(step.earths[i].name + '-Backdrop02', step.earths[i].earthIndex));
                    step.graphics.foreground.push(step.graphics.__addShape(step.earths[i].name + '-Ground', step.earths[i].earthIndex));
                }

                step.graphics.joshua = new createjs.Sprite(new createjs.SpriteSheet({
                    framerate: 30,
                    'images': [step.graphics._loadQueue.getResult('Joshua')],
                    'frames': {'regX': 82, 'height': 292, 'count': 64, 'regY': 0, 'width': 165,},
                    'animations': {
                        'walk': [0, 25, 'walk', .5],
                        'jump': [26, 63, 'walk'],
                    },
                }), 'walk');
                step.graphics.joshua.x = 10;
                step.graphics.joshua.y = 20;
                step.graphics._stage.addChild(step.graphics.joshua);

                for (var i = 0; i < step.earths.length; i++) {
                    step.graphics.foreground.push(step.graphics.__addShape(step.earths[i].name + '-Foreground', step.earths[i].earthIndex));
                }

                for (var i = 0; i < step.earths.length; i++) {
                    for (var j = 0; j < step.earths[i].data.length; j++) {
                        switch (step.earths[i].data[j]) {
                            case 0:
                                break;
                            case 1:
                                var id = step.earths[i].name + '-Obstacle01';
                                var earthIndex = step.earths[i].earthIndex;
                                var x = step.view.blockWidth() * j;

                                var shape = new createjs.Shape();
                                var imageElement = step.graphics._loadQueue.getResult(id);
                                shape.graphics.beginBitmapFill(imageElement);
                                shape.graphics.drawRect(0, 0, imageElement.width, imageElement.height);
                                shape.x = x;
                                shape.y = step.graphics._stage.canvas.height * (earthIndex + 1) - imageElement.height;
                                step.graphics._stage.addChild(shape);
                                step.graphics.obstacle.push(shape);
                                break;
                        }
                    }
                }

                whenDone();
            });

            step.graphics._loadQueue.loadManifest([
                {id: 'Datum000-Backdrop00', src: 'Datum000/Backdrop00.png',},
                {id: 'Datum000-Backdrop01', src: 'Datum000/Backdrop01.png',},
                {id: 'Datum000-Backdrop02', src: 'Datum000/Backdrop02.png',},
                {id: 'Datum000-Ground', src: 'Datum000/Ground.png',},
                {id: 'Datum000-Foreground', src: 'Datum000/Foreground.png',},
                {id: 'Datum000-Obstacle01', src: 'Datum000/Obstacle01.png',},
                {id: 'East0001-Backdrop00', src: 'East0001/Backdrop00.png',},
                {id: 'East0001-Backdrop01', src: 'East0001/Backdrop01.png',},
                {id: 'East0001-Backdrop02', src: 'East0001/Backdrop02.png',},
                {id: 'East0001-Ground', src: 'East0001/Ground.png',},
                {id: 'East0001-Foreground', src: 'East0001/Foreground.png',},
                {id: 'East0001-Obstacle01', src: 'East0001/Obstacle01.png',},
                {id: 'West0001-Backdrop00', src: 'West0001/Backdrop00.png',},
                {id: 'West0001-Backdrop01', src: 'West0001/Backdrop01.png',},
                {id: 'West0001-Backdrop02', src: 'West0001/Backdrop02.png',},
                {id: 'West0001-Ground', src: 'West0001/Ground.png',},
                {id: 'West0001-Foreground', src: 'West0001/Foreground.png',},
                {id: 'West0001-Obstacle01', src: 'West0001/Obstacle01.png',},
                {id: 'Joshua', src: 'Joshua.png',},
            ], true, 'images/');
        },
    },

    joshua: {
        __step: function (eastOrWest) {
            if (step.status == step.STATUSINPLAY) {
                if (step.joshua.isSteppingEast || step.joshua.isSteppingWest) {
                    // Do nothing 
                } else {
                    var earthIndex = step.joshua.location.earthIndex + eastOrWest;
                    if (earthIndex < 0 || earthIndex > step.earths.length - 1) {
                        consoleLog('Joshua cannot step: he\'s at long earth\'s end');
                        if (step.onCannotStep != null) {
                            step.onCannotStep();
                        }
                    } else {
                        step.joshua.isSteppingEast = eastOrWest == 1;
                        step.joshua.isSteppingWest = eastOrWest == -1;
                        setTimeout(function () {
                            step.joshua.isSteppingEast = false;
                            step.joshua.isSteppingWest = false;
                            step.joshua.location.earthIndex = earthIndex;
                            consoleLog('Joshua stepped ' + (eastOrWest == 1 ? "east" : "west") + ' to ' + step.earths[step.joshua.location.earthIndex].name);
                        }, step.__INTERVAL);
                    }
                }
            }
        },

        init: function (whenDone) {
            step.graphics.init('canvas', function () {
                step.joshua.location.earthIndex = Math.floor(step.earths.length / 2);
                step.joshua.location.position = 0;
                whenDone();
            });
        },

        isSteppingEast: false,
        isSteppingWest: false,

        location: {
            earthIndex: 0,
            position: 0,
        },

        move: function () {
            var position = step.joshua.location.position + 1;
            if (position > step.earths[step.joshua.location.earthIndex].data.length - 1) {
                if (step.onGameOver != null) {
                    step.onGameOver();
                }
                step.stop();
            } else {
                step.joshua.location.position = position;
                if (step.earths[step.joshua.location.earthIndex].data[step.joshua.location.position] == 1) {
                    if (step.onGameOver != null) {
                        step.onGameOver(1);
                    }
                    step.stop();
                }
            }
        },

        stepEast: function () {
            step.joshua.__step(1);
        },

        stepWest: function () {
            step.joshua.__step(-1);
        },
    },

    onGameOver: null,
    onLongEarthEnd: null,
    onStatusChange: null,

    play: function () {
        step.joshua.init(function () {
            step.__startTicking();
            step.__redraw();
            step.status = step.STATUSINPLAY;
            step.toggleHold();
        });
    },

    STATUSUNUSED: 0,
    STATUSINPLAY: 1,
    STATUSONHOLD: 2,

    status: this.STATUSUNUSED,

    stop: function () {
        clearInterval(step.__intervalId);
        step.__intervalId = null;
        cancelAnimationFrame(step.__animationFrameId);
        step.__animationFrameId = null;
        step.status = step.STATUSUNUSED;
    },

    toggleHold: function () {
        switch (step.status) {
            case step.STATUSUNUSED:
                // Don't do anything 
                break;
            case step.STATUSINPLAY:
                step.stop();
                step.status = step.STATUSONHOLD;
                if (step.onStatusChange != null) {
                    step.onStatusChange();
                }
                break;
            case step.STATUSONHOLD:
                if (step.__intervalId == null) {  // Redundant check? 
                    step.__startTicking();
                    step.__redraw();
                    step.status = step.STATUSINPLAY;
                    if (step.onStatusChange != null) {
                        step.onStatusChange();
                    }
                }
                break;
        }
    },
};

step.onGameOver = function (result) {
    if (result == 1) {
        $('.alert-danger').removeClass('hidden');
    } else {
        $('.alert-success').removeClass('hidden');
    }
};

step.onCannotStep = function () {
    $('.alert-warning').removeClass('hidden');
    setTimeout(function () {
        $('.alert-warning').addClass('hidden');
    }, 2000);
};

step.onStatusChange = function () {
    switch (step.status) {
        case step.STATUSUNUSED:
            // Don't do anything 
            break;
        case step.STATUSINPLAY:
            $('.alert-info').addClass('hidden');
            break;
        case step.STATUSONHOLD:
            $('.alert-info').removeClass('hidden');
            break;
    }
};

$(document).keydown(function (eventObject) {
    switch (eventObject.which) {
        case 87:  // W 
            step.joshua.stepWest();
            break;
        case 69:  // E 
            step.joshua.stepEast();
            break;
        case 80:  // P 
            step.toggleHold();
            break;
    }
});

