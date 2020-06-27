# brightness-iiot
My College project building IIOT from back to front using ESP8266 + MQTT broker and HTML web server

## Requirements: 
    0. ESP8266 and PC
    1. LAMPP/ XAMPP
    2. node.js
    3. Router

## Preparations:
    1. Install the `IOTnode Sourcecode` file to your ESP8266; change the {SSID, username, password, and publish & subscribe topics} in the ino file
    2. Connect them to the same router
    3. Connect your client device to the router to open the webserver later

## How to use:
    1. Open XAMPP/LAMPP and activate the services
    2. Make new database structure named iiot03 in phpmyadmin
    3. Import SQL file: broker-logger/iiot03.sql
    4. Add new user in phpmyadmin
        a. Get in to iiot03 database
        b. Open user priviledge
        c. Add user
        d. Configure the user: name= “iiot”; password= “industri40”
    5. Change broker and host IP in some folders: broker-logger folder= {index.js, iot_logger.js, iot_simulator.js}; web-server folder= {index.js}; web-server/public/script folder= {script.js, script-group.js, script-index.js, script-sup.js}
        a. To test, change to "127.0.0.1"
        b. To run the real simulation, change the broker and host IP to  the server IP / your PC that acts as the broker and logger.
    6. Run iot_logger.js and index.js in broker-logger folder and index.js in web-server folder using node.js
        a. To test, run iot_simulator.js in broker-logger folder using node.js
    7. Open http://127.0.0.1:8080 in your client browser and see the condition of the brightness
