/*
Tampilan banyak none memakai heatmap
https://www.patrick-wied.at/static/heatmapjs/
*/

const BROKER_ADDR = '192.168.1.100';
//const BROKER_ADDR = '127.0.0.1';

const BROKER_PORT = '3000';

const SYS_TOPIC = 'TF-IIOT/';
const TAG_TOPIC = 'CT';       // tag yang akan masuk chart

const TAG_TOPICR = 'DIR';
const TAG_TOPICG = 'DIG';
const TAG_TOPICB = 'DIB';

// nama eleman HTML
const E_HEATMAP = 'e-heatmap';

// interval heatmap akan diupdate 
const UPDATE_INTERVAL = 1000;
const CT_MAX = 7000;
const CT_MIN = 0;

const HEATMAP_SCALE = 300 / 5;

// hitung berapa data yang sudah diterima
var received_count = 0;
var value_max = 0;
var value_min = 1000;


//led color
var r = {};
var g = {};
var b = {};

list = ["NODE01", "NODE02", "NODE03", "NODE04", "NODE05", "NODE06", "NODE07", "NODE08", "NODE09", "NODE10", "NODE11", "NODE12", "NODE13", "NODE14", "NODE15", "NODE16"]

var d = new Date();
var t = d.getSeconds();

var force_off=1


// heatmap 
// create configuration object
var config = {
  container: document.getElementById(E_HEATMAP),
  radius: 100,
  backgroundColor: "#0c1145"
};

// data-data heatmap
var heatmap = h337.create(config);
var heatmap_data = {
  max: CT_MAX,
  min: CT_MIN,
  data: []
}
// KALAU DI SET DI SINI, KELUAR
// KALAU DARI viewHeatmap(), tak mau
//heatmap.setData(heatmap_data);

// map untuk mempercepat akses ke heatmap_data
var mapCT = new Map();

// MQTT Setup
var broker_url = 'ws://' + BROKER_ADDR + ":" + BROKER_PORT;
var client = mqtt.connect(broker_url);

// Run when connected (continuous)
client.on('connect', async function () {
  console.log('MQTT client connected to ' + broker_url);

  // siap terima semua data CT
  topic = SYS_TOPIC + '+/' + TAG_TOPIC + '/#';
  client.subscribe(topic);
  topicr = SYS_TOPIC + '+/' + TAG_TOPICR + '/#';
  client.subscribe(topicr);
  topicg = SYS_TOPIC + '+/' + TAG_TOPICG + '/#';
  client.subscribe(topicg);
  topicb = SYS_TOPIC + '+/' + TAG_TOPICB + '/#';
  client.subscribe(topicb);
  //console.log("Subscribe for "+topic);
  timer = setInterval(viewUpdateHeatmap, UPDATE_INTERVAL);
})

// Run when message received
client.on('message', function (topic, message) {
  // decode topic
  // SYS/NODE/TAG/NUM
  fields = topic.split("/");
  node = fields[1];
  tag = fields[2];
  if (fields[2] == "CT") {
    value = parseInt(message.toString('utf-8'), 10);
    //console.log(topic);
    //console.log('Received %s %s= %d', node,tag, value);
    onReceiveCT(node, value);
  }
  else if (fields[2] == "DIR") {
    value = parseInt(message.toString('utf-8'), 10);
    //console.log(topic);
    //console.log('Received %s %s= %d', node,tag, value);
    r[node] = value;
  }
  else if (fields[2] == "DIG") {
    value = parseInt(message.toString('utf-8'), 10);
    //console.log(topic);
    //console.log('Received %s %s= %d', node,tag, value);
    g[node] = value;
  }
  else if (fields[2] == "DIB") {
    value = parseInt(message.toString('utf-8'), 10);
    //console.log(topic);
    //console.log('Received %s %s = %d', node,tag, value);
    b[node] = value;
  }
  if (r[node] > 0 && g[node] > 0 && b[node] > 0) {
    thergb = "rgb(" + r[node] + "," + g[node] + "," + b[node] + ")";
    //console.log(thergb);  
    document.getElementById(node + "bg").style.background = thergb;
  }
})


//----------------------------------------------------
// Fungsi-fungsi REST
async function getNodes() {
  url = '/api/nodes';
  //console.log('Get :', url);
  response = await fetch(url);
  rjson = await response.json();
  //console.log(JSON.stringify(rjson));
  return rjson;
}

// ------------------------------------------------------------
// Fungsi-fungsi untuk update UI

// memasukkan data CT ke heatmap
async function onReceiveCT(node, value) {
  point = mapCT.get(node);
  if (point != null) {
    point.value = value;
    received_count += 1;
    //console.log("Update "+node+"="+JSON.stringify(point));
  }
}

// mengambil data posisi (X,Y) semua node
// lalu menginisiasi tampilan heat map
async function viewHeatmap() {
  nodes = await getNodes();
  if (nodes) {
    // build heat map
    heatmap_data.data = []; /// kosongkan dulu
    for (node of nodes) {
      var point = new Object();
      point.x = node.PX * HEATMAP_SCALE;
      point.y = node.PY * HEATMAP_SCALE;
      point.value = node.PX * node.PY * 300;
      heatmap_data.data.push(point);
      mapCT.set(node.NODE, point);
    }
    heatmap.setData(heatmap_data);
    console.log('heatmap_data = ' + JSON.stringify(heatmap_data));
    return true;
  }
  else {
    shtml = "Cannot get the nodes";
    document.getElementById(E_HEATMAP).innerHTML = shtml;
    return false;
  }
}

// menampilkan heatmap kalau ada data yang sudah berubah 
function viewUpdateHeatmap() {
  if (received_count > 0) {
    heatmap.setData(heatmap_data);
    received_count = 0;
    console.log('Heatmap repainted');
  }
}

viewHeatmap();

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

//auto-manual mode
function switch_auto(checkbox) {
  checkBox = document.getElementById("oto");
  for (x of list) {
    if (document.getElementById(x).checked == 1) {
      node_num = x.slice(4, 6)
      if (checkBox.checked == true) {
        client.publish("TF-IIOT/NODE" + node_num + "/YS/" + node_num + "1", "1")
        console.log("YS is: 1")
      } else {
        client.publish("TF-IIOT/NODE" + node_num + "/YS/" + node_num + "1", "0")
        console.log("YS is: 0")
      }
    }
  }
}
//led on-off
function switch_on_off(checkbox) {
  checkBox = document.getElementById("on_off_switch");
  for (x of list) {
    if (document.getElementById(x).checked == 1) {
      node_num = x.slice(4, 6)
      if (checkBox.checked == true) {
        force_off = 0
      } else {
        force_off = 1
        client.publish("TF-IIOT/NODE" + node_num + "/DVR/" + node_num + "1", "0")
        client.publish("TF-IIOT/NODE" + node_num + "/DVG/" + node_num + "1", "0")
        client.publish("TF-IIOT/NODE" + node_num + "/DVB/" + node_num + "1", "0")
        document.getElementById("led_slider_r").value = 0
        document.getElementById("led_slider_g").value = 0
        document.getElementById("led_slider_b").value = 0
      }
      //console.log(node_num,x,"TF-IIOT/NODE"+node_num+"/DVR/"+node_num+"1", "0")
    }
  }
}

//ganti led rgb analog
function change_analog_led_r(newVal) {
  for (x of list) {
    if (document.getElementById(x).checked == 1) {
      node_num = x.slice(4, 6)
      if (force_off == 0) {
        client.publish("TF-IIOT/NODE" + node_num + "/DVR/" + node_num + "1", newVal.toString())
        console.log("analog manual r led to", newVal)
      }
    }
  }
}
function change_analog_led_g(newVal) {
  for (x of list) {
    if (document.getElementById(x).checked == 1) {
      node_num = x.slice(4, 6)
      if (force_off == 0) {
        client.publish("TF-IIOT/NODE" + node_num + "/DVG/" + node_num + "1", newVal.toString())
        console.log("analog manual g led to", newVal)
      }
    }
  }
}
function change_analog_led_b(newVal) {
  for (x of list) {
    if (document.getElementById(x).checked == 1) {
      node_num = x.slice(4, 6)
      if (force_off == 0) {
        client.publish("TF-IIOT/NODE" + node_num + "/DVB/" + node_num + "1", newVal.toString())
        console.log("analog manual b led to", newVal)
      }
    }
  }
}

function change_analog_led_r(newVal) {
  for (x of list) {
    if (document.getElementById(x).checked == 1) {
      node_num = x.slice(4, 6)
      if (force_off == 0) {
        client.publish("TF-IIOT/NODE" + node_num + "/DVR/" + node_num + "1", newVal.toString())
        console.log("analog manual r led to", newVal)
      }
    }
  }
}

//ganti batas kontroler/threshold
function change_threshold(newVal) {
  for (x of list) {
    if (document.getElementById(x).checked == 1) {
      node_num = x.slice(4, 6)
      client.publish("TF-IIOT/NODE" + node_num + "/CC/" + node_num + "1", newVal.toString())
      threshold = newVal
    }
  }
}

//pilih semua node
function select_all() {
  for (x of list) {
    document.getElementById(x).checked = 1
  }
}

function switch_kelip() {
  for (x of list) {
    node_num = x.slice(4, 6)
    client.publish("TF-IIOT/NODE" + node_num + "/DVR/" + node_num + "1", "0".toString())
    client.publish("TF-IIOT/NODE" + node_num + "/DVG/" + node_num + "1", "0".toString())
    client.publish("TF-IIOT/NODE" + node_num + "/DVB/" + node_num + "1", "0".toString())
  }

  for (x of list) {
    node_num = x.slice(4, 6)
    client.publish("TF-IIOT/NODE" + node_num + "/DVR/" + node_num + "1", "255".toString())
  }
  setTimeout(function () {
    for (x of list) {
      node_num = x.slice(4, 6)
      client.publish("TF-IIOT/NODE" + node_num + "/DVG/" + node_num + "1", "255".toString())
    }
  }, 3000);
  setTimeout(function () {
    for (x of list) {
      node_num = x.slice(4, 6)
      client.publish("TF-IIOT/NODE" + node_num + "/DVB/" + node_num + "1", "255".toString())
    }
  }, 6000);
  setTimeout(function () {
    for (x of list) {
      node_num = x.slice(4, 6)
      client.publish("TF-IIOT/NODE" + node_num + "/DVR/" + node_num + "1", "0".toString())
      client.publish("TF-IIOT/NODE" + node_num + "/DVG/" + node_num + "1", "0".toString())
      client.publish("TF-IIOT/NODE" + node_num + "/DVB/" + node_num + "1", "0".toString())
    }
  }, 9000);
}