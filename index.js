var SensorTag = require('sensortag');
var mqtt = require('mqtt');

var client  = mqtt.connect('mqtt://data.io.ovass.com');
var deviceID = "testDevice1";
var deviceSecret = "testSecret1";
var publishChannel = "devices/" + deviceID + "/up";

client.on('connect', function(){
    client.subscribe('devices/' + deviceID + '/down');
});

client.on('message', function(topic, message){
    // message is Buffer 
    console.log(message.toString());
});

monitorSensorTag(client);

function monitorSensorTag(client) {
    console.log('Make sure the Sensor Tag is on!');

    SensorTag.discover(function(device){
        console.log('Discovered device with UUID: ' + device['uuid']);

        device.connect(function(){
            connected = true;
            console.log('Connected To Sensor Tag');
            device.discoverServicesAndCharacteristics(function(callback){
                initAirSensors();
                initAccelAndGyro();
                initKeys();
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
            client.publish(publishChannel, JSON.stringify(data), function() {
            });
        });

        device.on('accelerometerChange', function(x, y, z) {
            var data = {
                "sensor": "accelerometer",
                "accelX" : x,
                "accelY" : y,
                "accelZ" : z
            };
            client.publish(publishChannel, JSON.stringify(data), function() {
            });
        });

        device.on('magnetometerChange', function(x, y, z) {
            var data = {
                "sensor": "magnetometer",
                "magX" : x,
                "magY" : y,
                "magZ" : z
            };
            client.publish(publishChannel, JSON.stringify(data), function() {
            });
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
                            client.publish(publishChannel, JSON.stringify(data), function() {
                            });
                        });
                    });
                });
            }, 5000);
        }
    });
};