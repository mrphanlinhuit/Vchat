(function() {
    var App;
    var SERVER = window.location.origin + '/' + roomName;
    App = {};
    /*
     Init
     */
    App.init = function() {
        App.canvas = document.createElement('canvas');
        App.canvas.height = 746;
        App.canvas.width = 1348;
        App.btClear = document.createElement('button');
        App.btClear.innerText = "Clear";
        App.btClear.id = "btClear";
        App.changeColor =document.createElement("input");
        App.changeColor.id = 'changeColor';
        App.changeColor.type= 'color';

        App.changeBG =document.createElement("input");
        App.changeBG.id = 'changeBG';
        App.changeBG.type= 'color';

        App.changeWidth =document.createElement("input");
        App.changeWidth.id = 'changeWidth';
        App.changeWidth.type= 'range';
        App.changeWidth.min=1;
        App.changeWidth.max=50;

        document.getElementsByTagName('article')[0].appendChild(App.canvas);
        document.getElementsByTagName('article')[0].appendChild(App.btClear);
        document.getElementsByTagName('article')[0].appendChild(App.changeColor);
        document.getElementsByTagName('article')[0].appendChild(App.changeBG);
        document.getElementsByTagName('article')[0].appendChild(App.changeWidth);
        App.ctx = App.canvas.getContext("2d");
        App.ctx.fillStyle = "solid";
        App.ctx.strokeStyle = "#ECD018";
        App.ctx.lineWidth = 5;
        App.ctx.lineCap = "round";
        App.socket = io.connect(SERVER);
        App.socket.on('draw', function(data) {
            return App.draw(data.x, data.y, data.type);
        });

        App.socket.on('allClear', function() {
            App.ctx.clearRect(0,0,1348,746);
        });

        App.socket.on('changeColor',function(data){
            return App.ctx.strokeStyle =data.color;
        });

        App.socket.on('changeBG',function(data){
            $('canvas').css('background-color',data.color);
        });

        App.socket.on('changeWidth',function(data){
            App.ctx.lineWidth =data.wid;
        });

        App.draw = function(x, y, type) {
            if (type === "dragstart") {
                App.ctx.beginPath();
                return App.ctx.moveTo(x, y);
            } else if (type === "drag") {
                App.ctx.lineTo(x, y);
                return App.ctx.stroke();
            } else {
                return App.ctx.closePath();
            }
        };
    };
    /*
     Draw Events
     */
    $('canvas').live('drag dragstart dragend', function(e) {
        var  type, x, y;
        type = e.handleObj.type;
        e.offsetX = e.layerX;
        e.offsetY = e.layerY;
        x = e.offsetX;
        y = e.offsetY;
        App.draw(x, y, type);
        App.socket.emit('drawClick', {
            x: x,
            y: y,
            type: type
        });

        //event clear
        $('#btClear').click(function(){
            App.ctx.clearRect(0,0,1348,746);
            App.socket.emit('clear');
        });

        $('#changeColor').change(function(){
            App.ctx.strokeStyle =this.value;
            App.socket.emit('changeColor',{
              'color': this.value
            })
        });

        $('#changeBG').change(function(){
            $('canvas').css('background',this.value);
            App.socket.emit('changeBG',{
                'color': this.value
            })
        });

        $('#changeWidth').change(function(){
            App.ctx.lineWidth=this.value;
            App.socket.emit('changeWidth',{
                'wid': this.value
            })
        });

    });
    $(function() {
        return App.init();
    });


}).call(this);