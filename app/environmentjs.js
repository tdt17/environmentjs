/**
 * Created by Torsten Hain on 04.02.2016.
 */

var c = document.createElement( 'canvas' ),
    ctx = c.getContext( '2d' ),
    w = c.width = window.innerWidth,
    h = c.height = window.innerHeight,
    StateEnum = {OFF: 0, SNOW: 1, WATER: 2, GRASS: 3},
    particles = [],
    particleCount = ~~(w / 8),
    particlePath = 2,
    particleSpawn = 0.3,
    particleWidth = 2,
    particleGravity = 0.01,
    particleState = StateEnum.WATER,
    particleService,
    groundCol = ~~(w / 20),
    groundColW = w/groundCol,
    groundColWHalf = groundColW/ 2,
    ground = new Array(groundCol),
    groundState = StateEnum.GRASS,
    groundGrowSpeed = 2,
    groundStrength = 0.2,
    groundBalanceSpeed = 0.1,
    groundMax = h * 2 / 3,
    groundService,
    effectService,

    lineCap = 'round';

function rand( min, max ) {
    return Math.random() * ( max - min ) + min;
}

function updateGroundParticleInteraction() {
    switch(groundState) {
        case StateEnum.SNOW:
            switch (particleState) {
                case StateEnum.WATER:
                    groundGrowSpeed = -1;
                    break;
                case StateEnum.SNOW:
                    groundGrowSpeed = 3;
                    break;
            }
            break;
        case StateEnum.WATER:
            groundGrowSpeed = 2;
            break;
        case StateEnum.GRASS:
            switch (particleState) {
                case StateEnum.WATER:
                    groundGrowSpeed = 2;
                    break;
                case StateEnum.SNOW:
                    groundGrowSpeed = -2;
                    break;
            }
            break;
    }
}

function EffectService() {
    this.effects = [];

    this.startTractor = function() {
        var tractor = new Image();
        tractor.src = "data:image/png;base64,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";
        tractor.onload = function() {
            effectService.effects.push(new TractorEffect(tractor));
        };
    };

    this.draw = function() {
        var i = this.effects.length;
        while( i-- ) {
            this.effects[ i ].draw();
        }
    };

    this.step = function() {
        var i = this.effects.length;
        while( i-- ) {
            this.effects[ i ].step();
        }
    };

    this.stop = function(effect) {
        this.effects.splice(this.effects.indexOf(this), 1);
    }
}

function TractorEffect(img) {
    this.h = 100;
    this.w = this.h * img.width / img.height;
    this.x = -this.w;
    this.vx = rand(1,3);
    this.y = h - this.h + 5;
    this.tractor = img;
    this.lastI = -1;

    this.draw = function() {
        ctx.drawImage(this.tractor, this.x, this.y, this.w, this.h);
    };
    this.step = function() {
        this.x += this.vx;
        var i = ~~(((this.x + this.w) / w) * groundCol);
        var groundI = ground[ i >= groundCol ? 0 : i ];
        groundI.y = h;
        if(this.x > w) {
            effectService.stop(this);
        }
    };
}

function ParticleService() {
    this.availableStates = [StateEnum.OFF, StateEnum.SNOW, StateEnum.WATER];
    this.strokeStyle = '';

    this.draw = function() {
        ctx.lineWidth = particleWidth;
        ctx.strokeStyle = this.strokeStyle;
        var i = particles.length;
        while( i-- ) {
            particles[ i ].draw();
        }
    };

    this.step = function() {
        if( particles.length < particleCount && Math.random() < particleSpawn && particleState != StateEnum.OFF) {
            particles.push( new Particle() );
        } else if( particles.length > particleCount ) {
            particles.pop();
        }

        var i = particles.length;
        while( i-- ) {
            particles[ i ].step();
        }
    };

    this.setParticleState = function(state) {
        switch(state){
            case StateEnum.OFF:
                break;
            case StateEnum.SNOW:
                particlePath = 2;
                particleGravity = 0.01;
                particleWidth = 6;
                this.strokeStyle = 'rgba(255 ,255 ,255 , 0.8)';
                break;
            case StateEnum.WATER:
                particlePath = 3;
                particleGravity = 0.05;
                particleWidth = 2;
                this.strokeStyle = 'rgba(80 ,80 ,200 , 0.6)';
                break;
            default:
                return;
        }
        particleState = state;
        updateGroundParticleInteraction();
    };

    this.setRandomParticleState = function(states) {
      if(states && states.length > 0) {
          this.setParticleState(states[Math.floor(Math.random()*states.length)]);
      } else {
          this.setParticleState(this.availableStates[Math.floor(Math.random()*this.availableStates.length)]);
      }
    };

    this.setParticleState(particleState);
}

function GroundService() {
    this.availableStates = [StateEnum.OFF, StateEnum.SNOW, StateEnum.WATER, StateEnum.GRASS];
    this.fillStyle = '';
    this.xWind = 0;
    this.vxWind = 0.01;
    this.grassR = 0;
    this.grassDrySpeed = 0.2;

    this.draw = function() {
        ctx.globalCompositeOperation = 'source-over';
        switch(groundState) {
            case StateEnum.SNOW:
            case StateEnum.WATER:

                ctx.fillStyle = this.fillStyle;
                ctx.beginPath();
                ctx.moveTo(0,h+1);
                ctx.lineTo(0,ground[0].y);
                i = 0;
                while( i < groundCol) {
                    ground[ i++ ].drawCurve();
                }
                ctx.lineTo(w, h+1);
                ctx.fill();
                break;

            case StateEnum.GRASS:

                ctx.lineWidth = 5;
                ctx.strokeStyle = 'rgba(' + ~~this.grassR + ', 210, 0, 0.9)';
                var wind = Math.sin(this.xWind) * 10;
                i = 0;
                while( i < groundCol) {
                    ground[ i++ ].drawPlant(wind);
                }
                break;
        }

    };

    this.step = function() {
        if(ground.some(function(ground) { return ground.y < groundMax})){
            ground.forEach(function(ground) { ground.y = h; });
        }

        if(groundState == StateEnum.GRASS) {
            this.xWind += this.vxWind;
            if(this.xWind > 2*Math.PI){
                this.xWind = 0;
            }
            if(particleState == StateEnum.OFF) {
                if(this.grassR < 240) this.grassR += this.grassDrySpeed;
            } else if(particleState == StateEnum.WATER) {
                if(this.grassR >= this.grassDrySpeed) this.grassR -= this.grassDrySpeed;
            }
            return;
        }
        i = groundCol;
        while( i-- ) {
            ground[ i ].step();
        }
    };

    this.setGroundState = function(state) {
        switch(state){
            case StateEnum.OFF:
                ground.forEach(function(ground) { ground.y = h; });
                groundGrowSpeed = 0;
                break;
            case StateEnum.SNOW:
                groundStrength = 8;
                groundBalanceSpeed = 1;
                groundMax = h * 2 / 3;
                this.fillStyle = 'rgba(210, 210, 210, 0.9)';
                break;
            case StateEnum.WATER:
                groundStrength = 0.2;
                groundBalanceSpeed = 0.1;
                groundMax = h * 2 / 3;
                this.fillStyle = 'rgba(80 ,80 ,200 , 0.6)';
                break;
            case StateEnum.GRASS:
                groundStrength = 1000;
                groundBalanceSpeed = 0.1;
                groundMax = h * 2 / 3;
                break;
            default:
                return;
        }
        groundState = state;
        updateGroundParticleInteraction();
    };

    this.setRandomGroundState = function(states) {
        if(states && states.length > 0) {
            this.setGroundState(states[Math.floor(Math.random()*states.length)]);
        } else {
            this.setGroundState(this.availableStates[Math.floor(Math.random()*this.availableStates.length)]);
        }
    };

    //init
    this.setGroundState(groundState);
    var i = groundCol;
    while( i-- ) {
        ground[i] = new Ground(i);
    }
    i = groundCol;
    while( i-- ) {
        ground[i].init();
    }
}

function Particle() {
    this.path = [];
    this.reset();
}

Particle.prototype.reset = function() {
    this.x = rand( 0, w );
    this.y = 0;
    this.vx = 0;
    this.vy = rand(2,3);
    this.path.length = 0;
};

Particle.prototype.step = function() {

    this.path.unshift( [ this.x, this.y ] );
    if( this.path.length > particlePath ) {
        this.path.pop();
    }

    this.vy += particleGravity;

    this.x += this.vx;
    this.y += this.vy;

    if( this.x > w ) {
        this.path.length = 0;
        this.x = 0;
    }
    if( this.x < 0 ) {
        this.path.length = 0;
        this.x = w;
    }

    var i = ~~(((this.x + groundColWHalf) / w) * groundCol);
    var groundI = ground[ i >= groundCol ? 0 : i ];
    if( this.y > groundI.y + 1 ) {
        groundI.grow();
        if(particleState != StateEnum.OFF) {
            this.reset();
        }else{
            particles.splice(particles.indexOf(this),1);
        }
    }
};

Particle.prototype.draw = function() {
    ctx.beginPath();
    ctx.moveTo( this.x, ~~this.y );
    for( var i = 0, length = this.path.length; i < length; i++ ) {
        var point = this.path[ i ];
        ctx.lineTo( point[ 0 ], ~~point[ 1 ] );
    }
    ctx.stroke();
};

function Ground(i) {
    this.reset(i);
}

Ground.prototype.reset = function(i){
    this.i = i;
    this.x = ~~(i * (w / groundCol));
    this.y = h;
    this.grasX1rand = rand(-10,10);
    this.grasX2rand = rand(-10,10);
    this.grasYrand = rand(0,10);
};

Ground.prototype.init = function(){
    this.left = ground[this.i > 0 ? this.i - 1 : groundCol - 1];
    this.right = ground[this.i + 1 < groundCol ? this.i + 1 : 0];
};

Ground.prototype.step = function() {
    if(Math.random()>0.5){
        if(this.left.y > this.y + groundStrength){
            this.left.y -= groundBalanceSpeed;
            this.y += groundBalanceSpeed;
        }else if(this.right.y > this.y + groundStrength){
            this.right.y -= groundBalanceSpeed;
            this.y += groundBalanceSpeed;
        }
    }else{
        if(this.right.y > this.y + groundStrength){
            this.right.y -= groundBalanceSpeed;
            this.y += groundBalanceSpeed;
        }else if(this.left.y > this.y + groundStrength){
            this.left.y -= groundBalanceSpeed;
            this.y += groundBalanceSpeed;
        }
    }
};

Ground.prototype.grow = function() {
    this.y -= groundGrowSpeed;
};

Ground.prototype.drawPlant = function(x) {
    ctx.beginPath();
    ctx.moveTo(this.x, h);
    ctx.bezierCurveTo(this.x, h, this.x, this.y + (h-this.y)*2/3, this.x + this.grasX1rand + x*((h-this.y)/50), this.y);
    ctx.moveTo(this.x + groundColWHalf, h+1);
    ctx.bezierCurveTo(this.x + groundColWHalf, h, this.x + groundColWHalf, this.y + (h-this.y)*2/3, this.x + groundColWHalf + this.grasX2rand + x*((h-this.y)/50), this.y + this.grasYrand);
    ctx.stroke();
};

Ground.prototype.drawCurve = function() {
    if(this.right.i == 0) {
        ctx.bezierCurveTo(
            this.x + groundColWHalf, this.y,
            this.x + groundColWHalf, ground[0].y,
            this.x + groundColW + 1, ground[0].y);
        return;
    }

    ctx.bezierCurveTo(
        this.x + groundColWHalf, this.y,
        this.x + groundColWHalf, this.right.y,
        this.right.x, this.right.y);
};


function step() {
    particleService.step();
    groundService.step();
    effectService.step();
}

function draw() {
    ctx.clearRect(0,0,w,h);

    particleService.draw();
    groundService.draw();
    effectService.draw();
}

function loop() {
    requestAnimationFrame( loop );
    step();
    draw();
}

function init() {
    ctx.lineCap = lineCap;
    particleService = new ParticleService();
    groundService = new GroundService();
    effectService = new EffectService();

    c.style.position = 'fixed';
    c.style.top = '0';
    c.style.left = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.zIndex = '1000';
    c.style.pointerEvents = 'none';
    document.body.appendChild( c );
    loop();
}

init();