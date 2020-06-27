//TF4061 INDUSTRIAL INTERNET OF THINGS
//KELOMPOK 14
//  Vieri Kristianto W  13315501
//  Adrian Thomas       13316020
//  M Akhsanul Amal     13317023
//
//EEPROM mapping -> DVR, DVG, DVB, CC, YS
//DVR DVG DVB 2 byte, CC 2 byte, YS 1 byte
//YS 0
//CC 1-2
//DVR 3-4
//DVG 5-6
//DVB 7-8

//deklarasi library
#include <ESP8266WiFi.h>
#include <MQTT.h>
#include <EEPROM.h>

//deklarasi variabel
//  LDR
int sensorValue; //nilai analog
int lux; //nilai lux

//  LED RGB
int LEDR, LEDG, LEDB = 0; //nilai LED dalam analog
int br, bg, bb, sb; //nilai buffer
float statR, statG, statB; //nilai LED dalam skala 0-100

//  mode
bool state = true; //true = auto, false = manual

//  setpoint
int setpoint2; //buffer
int setpoint = 5000;

//  debug string
String dbstring;

//SSID dan password
const char ssid[] = "TF-IIOT";
const char pass[] = "industri40";

//IP ADDRESS
IPAddress IP(192,168,1,114);
IPAddress NETMASK(255,255,255,0);
IPAddress NETWORK(192,168,1,1);
IPAddress DNS(192,168,1,1);

WiFiClient net;
MQTTClient client;

//counter
unsigned long lastMillis = 0;

void connect() { //fungsi menghubungkan ke wifi dan broker
  //menghubungkan ke wifi
  Serial.print("checking wifi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  //menghubungkan ke broker
  Serial.print("\nconnecting...");
  while (!client.connect("arduino")) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println("\nconnected!");

  //subscribe topik
  client.subscribe("TF-IIOT/NODE14/DVR/141");
  client.subscribe("TF-IIOT/NODE14/DVG/141");
  client.subscribe("TF-IIOT/NODE14/DVB/141");
  client.subscribe("TF-IIOT/NODE14/YS/141");
  client.subscribe("TF-IIOT/NODE14/CC/141");

}

void messageReceived(String &topic, String &payload) { //fungsi menerima pesan
  Serial.println("incoming: " + topic + " - " + payload);
  
  if(topic == "TF-IIOT/NODE14/DVR/141"){
    br = payload.toInt();
    if(LEDR != (br * 1023) / 255){ //menulis ke EEPROM, baru benar-benar menulis jika nilai memang berbeda untuk menghemat write cycle EEPROM
      EEPROM.write(3, (br * 1023 / 255)/256);
      EEPROM.write(4, (br * 1023 / 255)%256);
      EEPROM.commit();
    }
    LEDR = (br * 1023) / 255;
  }
  
  else if(topic == "TF-IIOT/NODE14/DVG/141"){
    bg = payload.toInt();
    if(LEDG != (bg * 1023) / 255){
      EEPROM.write(5, (bg * 1023 / 255)/256);
      EEPROM.write(6, (bg * 1023 / 255)%256);
      EEPROM.commit();
    }
    LEDG = (bg * 1023) / 255;
  }
  
  else if(topic == "TF-IIOT/NODE14/DVB/141"){
    bb = payload.toInt();
    if(LEDB != (bb * 1023) / 255){
      EEPROM.write(7, (bb * 1023 / 255)/256);
      EEPROM.write(8, (bb * 1023 / 255)%256);
      EEPROM.commit();
    }
    LEDB = (bb * 1023) / 255;
  }
  
  else if(topic == "TF-IIOT/NODE14/YS/141"){
    if(int(state) != payload.toInt()){
      EEPROM.write(0, payload.toInt());
      EEPROM.commit();
    }
    state = payload.toInt();
  }
  
  else if(topic == "TF-IIOT/NODE14/CC/141"){
    setpoint2 = payload.toInt();
    if(setpoint2 != setpoint){
      EEPROM.write(1, setpoint2 / 256);
      EEPROM.write(2, setpoint2 % 256);
      EEPROM.commit();
    }
    setpoint = payload.toInt();
  }
  
}

void setup() {
  //inisiasi
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  EEPROM.begin(512);
  WiFi.config(IP, NETWORK, NETMASK, DNS);
  
  //membaca dari EEPROM
  state = bool(EEPROM.read(0));
  setpoint = int(EEPROM.read(1)) * 256 + int(EEPROM.read(2));
  LEDR = int(EEPROM.read(3)) * 256 + int(EEPROM.read(4));
  LEDG = int(EEPROM.read(5)) * 256 + int(EEPROM.read(6));
  LEDB = int(EEPROM.read(7)) * 256 + int(EEPROM.read(8));

  //inisiasi pin
  pinMode(5, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(0, OUTPUT);
  pinMode(2, OUTPUT);
  
  //inisiasi koneksi ke broker
  client.begin("192.168.1.100", net);
  client.onMessage(messageReceived);

  //koneksi
  connect();
  
}

void loop() {
  client.loop();
  delay(10);  // untuk kestabilan

  //apabila putus koneksi
  if (!client.connected()) {
    connect();
  }
  
  //membaca nilai LDR
  sensorValue = analogRead(A0);
  lux = map(sensorValue, 1024, 350, 0, 10000);

  //menghitung nilai LED dalam skala 0-100
  statR = (LEDR * 255.0) /1023.0;
  statG = (LEDG * 255.0) /1023.0;
  statB = (LEDB * 255.0) /1023.0;

  //string untuk debug
  dbstring = "lux = " + String(lux) + " lx, R = " + String(statR) + ", G = " + String(statG) + ", B = " + String(statB) + ", State = " + String(state) + ", Set point = " + String(setpoint);

  //mode manual
  if(!state){
    analogWrite(5, 1023-LEDR);
    analogWrite(4, 1023-LEDG);
    analogWrite(0, 1023-LEDB);
  }

  //mode auto
  else if (state){
    if(lux >= setpoint){
      digitalWrite(5, HIGH);
      digitalWrite(4, HIGH);
      digitalWrite(0, HIGH);
    }
    else if(lux < setpoint){
      analogWrite(5, 1023-LEDR);
      analogWrite(4, 1023-LEDG);
      analogWrite(0, 1023-LEDB);
    }
  }
  
  // publish pesan per detik
  if (millis() - lastMillis > 1000) {
    lastMillis = millis();
    client.publish("TF-IIOT/NODE14/CT/141", String(lux));
    client.publish("TF-IIOT/NODE14/DIR/141", String(statR));
    client.publish("TF-IIOT/NODE14/DIG/141", String(statG));
    client.publish("TF-IIOT/NODE14/DIB/141", String(statB));
    client.publish("TF-IIOT/NODE14/YI/141", String(state));
    client.publish("debug", dbstring);
  }
  
}
