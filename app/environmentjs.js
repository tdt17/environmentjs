/**
 * Created by Torsten Hain on 04.02.2016.
 */

var c = document.createElement( 'canvas' ),
    ctx = c.getContext( '2d' ),
    w = c.width = window.innerWidth,
    h = c.height = window.innerHeight,
    particles = [],
    particleCount = ~~(w / 16),
    particlePath = 2,
    particleSpawn = 0.3,
    groundCol = ~~(w / 20),
    groundColW = w/groundCol,
    groundColWHalf = groundColW/ 2,
    ground = new Array(groundCol),

    gravity = 0.01,
    lineWidth = 4,
    lineCap = 'round';

function rand( min, max ) {
    return Math.random() * ( max - min ) + min;
}

function distance( a, b ) {
    var dx = a.x - b.x,
        dy = a.y - b.y;
    return Math.sqrt( dx * dx + dy * dy );
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

    this.vy += gravity;

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
        this.reset();
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

function Ground(i, next) {
    this.reset(i, next);
}

Ground.prototype.reset = function(i, next){
    this.i = i;
    this.next = next;
    this.x = ~~(i * (w / groundCol));
    this.y = h;
};

Ground.prototype.step = function() {

};

Ground.prototype.grow = function() {
    var left = ground[this.i > 0 ? this.i - 1 : groundCol - 1];
    var right = ground[this.i + 1 < groundCol ? this.i + 1 : 0];
    if(Math.random()>0.5){
        if(left.y > this.y + 8){ return left.grow() }
        if(right.y > this.y + 8){ return right.grow() }
    }else{
        if(right.y > this.y + 8){ return right.grow() }
        if(left.y > this.y + 8){ return left.grow() }
    }

    this.y -= 1;
};

Ground.prototype.drawCurve = function() {
    if(this.next.i == 0) {
        ctx.bezierCurveTo(
            this.x + groundColWHalf, this.y,
            this.x + groundColWHalf, ground[0].y,
            this.x + groundColW + 1, ground[0].y);
        return;
    }

    ctx.bezierCurveTo(
        this.x + groundColWHalf, this.y,
        this.x + groundColWHalf, this.next.y,
        this.next.x, this.next.y);
};


function step() {
    if( particles.length < particleCount && Math.random() < particleSpawn ) {
        particles.push( new Particle() );
    }

    var i = particles.length;
    while( i-- ) {
        particles[ i ].step();
    }

    i = groundCol;
    while( i-- ) {
        ground[ i ].step();
    }
}

function draw() {
    ctx.clearRect(0,0,w,h);
    //ctx.fillRect( 0, 0, w, h );

    ctx.globalCompositeOperation = 'lighter';
    var i = particles.length;
    //ctx.strokeStyle = 'rgba(80 ,80 ,200 , 0.6)';
    ctx.strokeStyle = 'rgba(255 ,255 ,255 , 0.8)';
    while( i-- ) {
        particles[ i ].draw();
    }

    ctx.globalCompositeOperation = 'source-over';
    i = 0;
    ctx.fillStyle = 'rgba(210, 210, 210, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0,h+1);
    ctx.lineTo(0,ground[0].y);
    while( i < groundCol) {
        ground[ i++ ].drawCurve();
    }
    ctx.lineTo(w,h+1);
    ctx.fill();
}

function loop() {
    requestAnimationFrame( loop );
    step();
    draw();
}

function init() {
    ctx.lineWidth = lineWidth;
    ctx.lineCap = lineCap;

    var i = groundCol;
    while( i-- ) {
        ground[i] = new Ground(i, ground[i + 1]);
    }
    ground[groundCol - 1].next = ground[0];

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