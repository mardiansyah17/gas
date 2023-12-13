const http = require('http')
const express = require('express')
const {Server} = require("socket.io");
const {SerialPort, ReadlineParser} = require("serialport");

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'SYkh$xuh',
    database: 'sandra'
});

connection.connect()

const app = express()
const server = http.createServer(app)
const port = 4000

const socket = new Server(server, {
    cors: {
        origin: '*',
    },
});

const serialPort = new SerialPort({
    path: 'COM3',
    baudRate: 9600,
})

const parser = serialPort.pipe(new ReadlineParser({delimiter: '\n'}));
let setup = false;
serialPort.on('open', () => {

    parser.on('data', async data => {

        if (setup) {
            const {lpg, co, smoke} = JSON.parse(data)

            await connection.query(`INSERT INTO gas (lpg, co, smoke) VALUES (${lpg}, ${co}, ${smoke})`, function (error, results, fields) {
                if (error) throw error;
            });

            const datas = await connection.query(`SELECT * FROM gas order by created_at desc limit 10`, function (error, results, fields) {
                if (error) throw error;
                socket.emit('data', {datas: JSON.stringify(results), data})

                // return results
            });
            // return console.log('data', datas)
        } else {
            setup = true;
        }
    })
    // socket.on('connection', async io => {
    //
    //
    //
    //     console.log(`client ${io.id} sudah tersambung`)
    //
    //
    //     serialPort.on('close', () => {
    //         console.log("Terputus")
    //     })
    //
    //     serialPort.on('close', () => {
    //         console.log("Terputus")
    //
    //     })
    //
    //     io.on('disconnect', () => console.log(`${io.id} sudah terputus`))
    // })


})


server.listen(port, async () => {
    console.log(`http://localhost:${port}`)
})