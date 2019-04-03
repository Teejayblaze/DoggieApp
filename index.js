let express = require('express');
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let bodyParser = require('body-parser');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect(
    'mongodb+srv://test-user:demo-user@cluster0-zgjgy.mongodb.net/test?retryWrites=true',
    {useNewUrlParser: true},
    (err) => console.log("mongodb connected", err)
);


let DoggieSchema = new Schema({
    pet_name: String, 
    weight: String, 
    sex: String,
    pic_url: String,
    desc: String,
    super_powers: {type: Schema.Types.ObjectId, ref: 'DoggiePetSuperPower'}
});

let DoggieModel = mongoose.model('DoggiePets', DoggieSchema);


let SuperPowerSchema = new Schema({
    is_trainable: Boolean,
    milage: String,
    is_combactant: Boolean,
    petId: { type: Schema.Types.ObjectId, ref: 'DoggiePets' } 
});

let SuperPowerModel = mongoose.model('DoggiePetSuperPower', SuperPowerSchema);
let socid = 0;

io.of('/doggie').on('connection', (socket) => { 
    
    socid = socket.id;
    console.log('a user is connected.');

    socket.on('create', (params) => {
        console.log('user socket payload: ', params);
    });


    DoggieModel.find((err, result) => {
        if (err){
            socket.emit('pets', JSON.stringify({'status': false, 'result': null}));
            return ;
        } 
        socket.emit('pets', JSON.stringify({'status': true, 'result': result}));
    });
    // socket.emit('pets', JSON.stringify({'status': true, 'result': "wow...."}));

    socket.on('pets', () => {
    });
});


app.get('/pets', (req, res) => {
    DoggieModel.find((err, result) => {
        if (err) res.status(200).json({'status': true, 'msg': []});
        res.status(200).json({'status': true, 'msg': result});
    });
});

app.get('/top/10/pets', (req, res) => {
    DoggieModel.find((err, result) => {
        if (err) res.status(200).json({'status': true, 'msg': []});
        let dogs = []
        for(let i = 0; i < 10; i++) {
           dogs.push(result[Math.floor(Math.random() * result.length)]);
        }
        res.status(200).json({'status': true, 'msg': dogs});
    });
})


app.get('/doggie', (req, res) => {
    res.send("Howdy visitor, welcome");
    console.log('we have a visitor');
});

app.post('/create/pet', (req, res) => {
    let doggie = new DoggieModel(req.body);
    doggie.save((err) => {
        if (err) {
            res.status(500).json('An error occur');
            console.log('doggie err = ', err);
            return;
        }
        res.status(200).json({'status': true, 'msg': 'successfully created pet '+ req.body.pet_name});
        console.log('doggie = ', doggie);
    });
    io.sockets.emit('pets', JSON.stringify({'status': true, 'result': "Hello"}));
});


http.listen(2000, () => console.log("server started..."));
