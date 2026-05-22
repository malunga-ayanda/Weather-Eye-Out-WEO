import express from 'express';
import os from 'os';
import { OSUtils } from 'node-os-utils';
import Dockerode from 'dockerode';
import { get } from 'http';
import bcrypt, { genSalt } from 'bcrypt';
import * as fs from 'fs';

//Create an app and listening port
const app = express();
app.listen(5000, () => { console.log('Server started on port 5000') });
app.use(express.json())
//app.use(express.static('static'));

//login route
app.post('/login', async (req, res) => {
    try {
        const userData = fs.readFileSync('user_data.json');
        const jsonData = JSON.parse(userData);
        const attempted_username = req.body.username;
        const attempted_password = req.body.password;
        var usersList = jsonData.users;
        var user;

        for (let x = 0; x < usersList.length; x++) {
            user = usersList[x]
            if (user.username == attempted_username) {
                if (await bcrypt.compare(attempted_password, user.password)) {
                    res.status(200).send('authentication successful')
                    console.log(attempted_username + 'has logged in')
                    break;
                }
            }
        }
        res.status(401).send('incorrect username or password ');

    } catch (err) {
        res.status(500).send('error')
        console.log('couldnt run login:' + err);
    }
}
);

app.post('/createUser', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        const userData = fs.readFileSync('user_data.json');
        const jsonData = JSON.parse(userData);
        jsonData.users.push({
            username: req.body.username,
            role: req.body.role,
            password: hashedPassword
        });
        fs.writeFileSync('user_data.json', JSON.stringify(jsonData));
        res.status(201).send('done')
    } catch (err) {
        res.status(500).send('error')
        console.log('Couldnt create user Error: ' + err
        )
    }
}
);

//routes for the client api(s)
app.get('/api', async (req, res) => {
    try {
        const data = await metrics();
        res.json(data);
    } catch (err) {
        console.error("Hardware fetch failed:", err);
        res.status(500).json({ error: "Could not retrieve system stats" });
    }
});

//docker container api using dockerode
app.post('/api/containers', async (req, res) => {
    const containerId = req.query.containerId;
    const action = req.query.action;

    if (!containerId || !action) {
        return res.status(400).json({
            error: 'Missing containerId or action parameter'
        });
    }

    try {
        const container = dockerode.getContainer(containerId);

        console.log(`Executing ${action} on ${containerId}`);

        switch (action) {
            case 'start':
                await container.start();
                break;

            case 'stop':
                await container.stop();
                break;

            case 'restart':
                await container.restart();
                break;

            default:
                return res.status(400).json({
                    error: 'Invalid action'
                });
        }

        return res.status(200).json({
            success: true,
            message: `Successfully executed ${action}`
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

//Create osutils object
const osutils = new OSUtils();

//Create dockerode object
const dockerode = new Dockerode();

//Create constant variables that dont need to be updated as the app runs
const total_ram = (os.totalmem() / 1073741824);
const diskInfo = await osutils.disk.info();


//Convert time from seconds to Days Hours Minutes Seconds Format
function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? "d, " : "d, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? "h, " : "h, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m, " : "m, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

var containers_list = [];

//getting docker containers function, method is below
function getContainers() {
    dockerode.listContainers({ all: true }, function (err, containers) {
        if (err) {
            console.error(err);
            return;
        }
        containers_list = containers;
    });
};

//Async function to load the data allowing for 'wait' while data loads
async function metrics() {
    const cpuUsage = await osutils.cpu.usage();
    const free_ram = (os.freemem() / 1073741824);
    const time_awake = secondsToDhms(os.uptime());
    const ops = os.version();
    const date = new Date();

    //Get docker containers
    await getContainers();

    //format date
    const formatter = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour12: false // Set to true for AM/PM
    });

    //format time
    const timeformatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Set to true for AM/PM
    });

    var form_date = formatter.format(date);
    var form_time = timeformatter.format(date);

    if (!diskInfo.success) {
        throw new Error("Disk info unavailable");
    }

    // Take first disk
    const disk = diskInfo.data[0];

    return {
        time_stamp: timeformatter.format(date),
        time_zone: date.getTimezoneOffset() / 60 * -1,
        date: formatter.format(date),
        operating_system: ops,
        cpu_usage: cpuUsage.data,
        disk_total: disk.total.toGB(),
        used_disk: disk.used.toGB(),
        free_memory: free_ram,
        total_memory: total_ram,
        memory_usage: (total_ram - free_ram) / total_ram * 100,
        up_time: time_awake,
        containers: containers_list
    };
}