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


function ParticleService() {
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
        }
        particleState = state;
        updateGroundParticleInteraction();
    };

    this.setParticleState(particleState);
}

function GroundService() {
    this.fillStyle = '';
    this.xWind = 0;
    this.vxWind = 0.01;

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
                ctx.strokeStyle = 'rgba(0, 210, 0, 0.9)';
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
        }
        groundState = state;
        updateGroundParticleInteraction();
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
}

function draw() {
    ctx.clearRect(0,0,w,h);

    particleService.draw();

    groundService.draw();
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