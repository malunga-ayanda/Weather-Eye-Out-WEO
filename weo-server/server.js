import express from 'express';
import os from 'os';
import { OSUtils } from 'node-os-utils';

//Create an app and listening port
const app=express();
app.listen(5000, () => {console.log('Server started on port 5000')});
//app.use(express.static('static'));

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

//Create osutils object
const osutils = new OSUtils();

//Create constant variables that dont need to be updated as the app runs
const total_ram = (os.totalmem()/1073741824);
const diskInfo = await osutils.disk.info();




//Convert time from seconds to Days Hours Minutes Seconds Format
function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? "d, " : "d, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? "h, " : "h, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m, " : "m, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

//Async function to load the data allowing for 'wait' while data loads
async function metrics() {
    const cpuUsage = await osutils.cpu.usage();
    const free_ram = (os.freemem() / 1073741824);
    const time_awake = secondsToDhms(os.uptime());
    const ops = os.version();
    const date = new Date();

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
        time_zone: date.getTimezoneOffset()/60*-1,
        date : formatter.format(date),
        operating_system: ops,
        cpu_usage: cpuUsage.data,
        disk_total: disk.total.toGB(),
        used_disk: disk.used.toGB(),
        free_memory: free_ram,
        total_memory: total_ram,
        memory_usage: (total_ram-free_ram)/total_ram*100,
        up_time: time_awake
    };
}