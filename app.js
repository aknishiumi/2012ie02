
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var mongoose = require('mongoose');

(function(){
  mongoose.connect("mongodb://localhost:27017/mydb6");
  
  var Schema = mongoose.Schema;
  
  var fusenSchema = new Schema({
    id: String,
    value: String,
    x: String,
    y: String,
    updateDate : Date
  });
  
  mongoose.model('Fusen', fusenSchema);
}());

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

/*
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
*/

var server = http.createServer(app).listen(app.get('port'), function(){
console.log("Express server listening on port " + app.get('port'));
});
var socket = require('socket.io').listen(server);
socket.on('connection', function(client) {
 var Fusen = mongoose.model('Fusen');
 Fusen.find({}, function(err, fusenList){
 	 if(!err){
 	 	for(var i=0;i<fusenList.length;i++){
 	 		client.emit('message', {
 	 			action: 'update',
 	 			x: fusenList[i].x,
 	 			y: fusenList[i].y,
 	 			value: fusenList[i].value,
 	 			id: fusenList[i].id
 	 		});
 	 	}
 	 }
 })
 
 client.on('message', function(event){
   // 送信元以外の全てのクライアントへメッセージ送信
   client.broadcast.emit('message', event);
  });
 
 client.on('save', function(event){
 	// データをmongoに保存
    var Fusen = mongoose.model('Fusen');
    console.log(event);
    
    Fusen.findOne({id: event.id}, function(err, fusen){
    	if(!fusen)
    		var fusen = new Fusen();
    	
	    fusen.id = event.id;
    	fusen.x = event.x;
    	fusen.y = event.y;
    	fusen.value = event.value;
	    fusen.save(function(err) {
	      if(!err) console.log('saved!')
	    });
    });
 	
 });
 
});
