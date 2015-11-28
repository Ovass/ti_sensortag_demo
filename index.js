var SensorTag = require('sensortag');
var mqtt = require('mqtt');
var canCall = true;

var client  = mqtt.connect('mqtt://');
var deviceID = [
    {"uuid":"b0b448c04303", "ovassid":"12015112820", "secret":"************"},
    {"uuid":"b0b448bc4d00", "ovassid":"12015112818", "secret":"************"},
    {"uuid":"b0b448c04305", "ovassid":"12015112865", "secret":"************"},
    {"uuid":"b0b448c08c02", "ovassid":"12015112892", "secret":"************"},
    {"uuid":"b0b448bcd003", "ovassid":"12015112885", "secret":"************"},
];

client.on('connect', function(){
    for (i in deviceID){
        client.subscribe('devices/' + deviceID[i].ovassid + '/down');
    }
});

client.on('message', function(topic, message){
    console.log(message.toString());
});

function publish(device, data){
    if(canCall){
        canCall = false;
        setTimeout(function(){
            canCall = true;
        }, 50);
        for (i in deviceID){
            if (deviceID[i].uuid = device.uuid){
                client.publish('devices/' + deviceID[i].ovassid + '/up', JSON.stringify(data));
            }
        }
    }
}

function onDiscover(device) {
    console.log('Discovered device with UUID: ' + device['uuid']);

    device.connect(function(){
        connected = true;
        console.log('Connected To Sensor Tag');
        device.discoverServicesAndCharacteristics(function(callback){
            initAirSensors();
            initAccelAndGyro();
        });
    });

    device.on('disconnect', function(onDisconnect) {
        connected = false;
        client.end();
        console.log('Device disconnected.');
    });

    function initAccelAndGyro() {
        device.enableAccelerometer();
        device.notifyAccelerometer(function(){});
        device.enableGyroscope();
        device.notifyGyroscope(function(){});
        device.enableMagnetometer();
        device.notifyMagnetometer(function(){});
    };

    device.on('gyroscopeChange', function(x, y, z) {
        var data = {
            "sensor": "gyroscope",
            "gyroX" : x,
            "gyroY" : y,
            "gyroZ" : z
        };
        publish(device, data);
    });

    device.on('accelerometerChange', function(x, y, z) {
        var data = {
            "sensor": "accelerometer",
            "accelX" : x,
            "accelY" : y,
            "accelZ" : z
        };
        publish(device, data);
    });

    device.on('magnetometerChange', function(x, y, z) {
        var data = {
            "sensor": "magnetometer",
            "magX" : x,
            "magY" : y,
            "magZ" : z
        };
        publish(device, data);
    });

    function initAirSensors() {
        device.enableIrTemperature();
        device.enableHumidity();
        device.enableBarometricPressure();
        var intervalId = setInterval(function() {
            if(!connected) {
                clearInterval(intervalId);
                return;
            }
            device.readBarometricPressure(function(pressure) {
                device.readHumidity(function(temperature, humidity) {
                    device.readIrTemperature(function(objectTemperature, ambientTemperature) {
                        var data = {
                            "sensor": "air",
                            "pressure" : pressure,
                            "humidity" : humidity,
                            "objTemp" : objectTemperature,
                            "ambientTemp" : ambientTemperature,
                            "temp" : temperature
                        };
                        publish(device, data);
                    });
                });
            });
        }, 5000);
    }
}

console.log('Make sure the Sensor Tag is on!');

SensorTag.discoverAll(onDiscover);