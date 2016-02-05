/**
 * Created by Torsten on 04.02.2016.
 */
var columns = 150,
    snowHeightPerDrop = 8,
    snowArray = [],
    StateEnum = {SNOW: 1, WATER: 2},
    state = StateEnum.SNOW,
    intervalTimer,
    flowSpeed = 0.5;
for(var i=0; i<columns; i++){ snowArray[i] = 0; }
var snowCanvas = document.getElementById('snow'),
    snowContext = snowCanvas.getContext("2d");

snowCanvas.width  = window.innerWidth;
snowCanvas.height = window.innerHeight;

var columnWidth = snowCanvas.width/columns;
var columnWidthHalf = (snowCanvas.width/columns)/2;

function checkCollision(x,y) {
    var i = Math.floor((x/snowCanvas.width)*columns);
    var snowH = snowCanvas.height - Math.round(snowArray[i] * snowHeightPerDrop);
    return snowH < y;
}

function myStickySnow(x, type) {
    var i = Math.floor((x/snowCanvas.width)*columns);

    var add = ([0.3,0.6,0.9,1.1,1.3])[type] || 1;
    updateSnow(i, add);
}

function updateSnow(i, add){
    if(i < 0 || i >= columns){return;}
    if(snowArray[i-1>=0?i-1:columns-1] + 1.0 < snowArray[i]) {
        return updateSnow(i-1>=0?i-1:columns-1, add);
    }
    if(snowArray[(i+1)%columns] + 1.0 < snowArray[i]) {
        return updateSnow((i+1)%columns, add);
    }
    snowArray[i] += add;

    //drawLineSnow(i);
    drawCurveSnow(i);

    if(snowArray[i] >= 25 && state == StateEnum.SNOW) {
        state = StateEnum.WATER;

        intervalTimer = setInterval(function() {
            if(snowArray.every(function(y) {return y<1;})) {
                state = StateEnum.SNOW;
                clearInterval(intervalTimer);
                snowArray = snowArray.map(function(y) { return y>0? y : 0 });
            }else{
                snowArray = snowArray.map(function(y,i,arr){
                    // No Calc for < 0.1
                    if(y < 0.1) { return 0; }

                    var ydiff1 = i > 0 ? y - arr[i-1] : 1.0,
                        ydiff2 = i < columns-1 ? y - arr[i+1] : 1.0;

                    return y - 0.07 - (Math.sin(ydiff1) * Math.min(flowSpeed, Math.abs(ydiff1)) + Math.sin(ydiff2) * Math.min(flowSpeed, Math.abs(ydiff2)));
                });
            }
            snowContext.clearRect(0,0,snowCanvas.width,snowCanvas.height);
            drawAll();
        },300);
        /*
         for(var i=0; i<columns; i++){ snowArray[i] = 0; }
         snowContext.clearRect(0,0,snowCanvas.width,snowCanvas.height);
         */
    }
}

function drawAll() {
    for(var i=0; i<columns; i++){ drawCurveSnow(i); }
}

function drawLineSnow(i) {
    snowContext.beginPath();
    snowContext.moveTo((i-1) * (snowCanvas.width/columns), snowCanvas.height+1);
    for (var x=i-1;x<=i+1;x++) {
        if(x <= 0 || x >= columns){
            snowContext.lineTo(x * (snowCanvas.width/columns), snowCanvas.height - Math.round(snowArray[x<=0? 0: columns-1] * snowHeightPerDrop));
        }else{
            snowContext.lineTo(x * (snowCanvas.width/columns), snowCanvas.height - Math.round(snowArray[x] * snowHeightPerDrop));
        }
    }
    snowContext.lineTo((i+1) * (snowCanvas.width/columns), snowCanvas.height+1);
    snowContext.moveTo((i-1) * (snowCanvas.width/columns), snowCanvas.height+1);
    snowContext.closePath();
    switch(state) {
        case StateEnum.WATER:
            snowContext.fillStyle = '#0f94c2';
            break;
        case StateEnum.SNOW:
        default:
            snowContext.fillStyle = '#ffffff';
    }
    snowContext.fill();
}

function drawCurveSnow(i) {
    snowContext.beginPath();
    snowContext.moveTo((i-2) * columnWidth - columnWidthHalf, snowCanvas.height+1);

    for (var ic = i-3; ic <= i+2; ic ++)
    {
        var xc = (ic + 0.5) * columnWidth;
        var ic1 = (ic < 0) ? 0 : (ic >= columns ? columns-1 : ic);
        var ic2 = (ic+1 < 0) ? 0 : (ic+1 >= columns ? columns-1 : ic+1);
        var yc = snowCanvas.height - Math.round(((snowArray[ic1] + snowArray[ic2]) / 2) * snowHeightPerDrop);

        if(ic == i-3) {
            snowContext.lineTo(xc, yc);
        }else{
            snowContext.quadraticCurveTo(ic * columnWidth, snowCanvas.height - Math.round(snowArray[ic1] * snowHeightPerDrop), xc, yc);
        }
    }

    snowContext.lineTo((i+2) * columnWidth + columnWidthHalf, snowCanvas.height+1);
    snowContext.closePath();
    switch(state) {
        case StateEnum.WATER:
            snowContext.fillStyle = '#0f94c2';
            break;
        case StateEnum.SNOW:
        default:
            snowContext.fillStyle = '#ffffff';
    }
    snowContext.fill();
}