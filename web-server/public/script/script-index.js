const BROKER_ADDR = '192.168.1.100';
//const BROKER_ADDR = '127.0.0.1';

const BROKER_PORT = '3000';

const SYS_TOPIC = 'TF-IIOT/';
const TAG_TOPIC = 'CT';       // tag yang akan masuk chart

// nama eleman HTML
const E_NODES = 'e-nodes';
const E_TAGS = 'e-tags';
const E_CHART = 'e-chart';


// Nilai boolean
const OFF = 0;
const ON = 1;
const INVALID=2;

// warna LED untuk status
const led_colors = [
  "rgb(46, 204, 113)",   // 0: off
  "rgb(231, 76, 60)",    // 1: on
  "darkgrey"];           // invalid

var thergb, r=128, g=128, b=128, hexrgb

// obyek-obyek yang sedang di supervisory
var nodes;
var active_node="";
var active_node_id=0;
var active_tag="";
var active_tag_id=0;


// MQTT Setup
var broker_url = 'ws://'+BROKER_ADDR+":"+BROKER_PORT;
var client = mqtt.connect(broker_url);

// Run when connected (continuous)
client.on('connect', function() {
    console.log('MQTT client connected to '+broker_url);
})

// Run when message received
client.on('message', function(topic, message) {   
    // decode topic
    // SYS/NODE/TAG/NUM

    fields = topic.split("/");
    tag = fields[2] + fields[3];
    value = parseInt(message.toString('utf-8'),10);
    //console.log(topic);
    console.log('Received %s = %d', tag, value);
    if(fields[2]=="CT"){
      document.getElementById("CT").innerHTML=value;
    }
    if(fields[2]=="DIR"){
      r=value;
    }
    if(fields[2]=="DIG"){
      g=value;
    }
    if(fields[2]=="DIB"){
      b=value;
    }
    thergb = "rgb(" + r + "," + g + "," + b + ")"; 
    //console.log(r,g,b,thergb);
    document.getElementById("led").style.background=thergb;
    hexrgb = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    document.getElementById("DI").innerHTML=hexrgb;
    //console.log("Update "+tag+"="+value.toString());
  }
)

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

// Fungsi-fungsi REST
async function getTags(node_id) {
  url = '/api/tags/'+node_id;
  //console.log('Get :', url);
  response = await fetch(url);
  myJson = await response.json();
  console.log(JSON.stringify(myJson));
  return myJson;
}

// mengisi data awal, memakai web Service
async function getData(tag_id, len) {
  url = '/api/data/'+tag_id+'/'+len.toString();
  console.log('Get :', url);
  response = await fetch(url);
  rjson = await response.json();
  console.log("FETCH ="+JSON.stringify(rjson));
  return rjson;
}

// ------------------------------------------------------------
// Fungsi-fungsi untuk update UI

// fungsi ganti active_node 
// value berisi "node/node_id"
async function onChangeNode(value) {
  // berhenti subscribe node lama
  if (active_node != "") {
    client.unsubscribe(SYS_TOPIC+active_node+'/#');
  }

  // decode node baru
  fields = value.split('/');
  active_node = fields[0];
  active_node_id = parseInt(fields[1],10);

  // pisahkan nomor node
  node_num = active_node.substr(4);
  active_tag = TAG_TOPIC + node_num + '1';

  // tampilkan tags node baru
  await viewTags();

  // subscribe node baru
  client.subscribe(SYS_TOPIC+active_node+'/#');

}

async function viewNodes() {
  nodes = await getNodes();
  if (nodes) {
    // build menu sesuai hak
    shtml=`<select class="form-control" name="IOT-NODES" onchange="onChangeNode(this.value)">`;
    for (node of nodes) {
      shtml += `<option value="${node.NODE}/${node.ID}">${node.NODE}</option>`;
    }
    shtml+=`</select>`;
    onChangeNode(nodes[0].NODE+'/'+nodes[0].ID);
  }
  else {
    shtml="Cannot get the nodes";
  }
  //console.log(shtml);
  // ganti element
  document.getElementById(E_NODES).innerHTML = shtml;
}

async function viewTags() {
  tags = await getTags(active_node_id);
  console.log("TAG="+active_tag);
  if (tags) {
    // build table sesuai tags
    shtml=`<table class="table">`;
    for (tag of tags) {
      shtml += `<tr><td>${tag.TAG}</td><td id="${tag.TAG}">0</td></tr>`;
      // simpan tag_id agar nanti lebih cepat ambil data
      if (tag.TAG == active_tag) {
        active_tag_id = tag.ID;
        console.log("TAG_ID="+active_tag_id);
      }
    }
    shtml+=`</table>`;
  }
  else {
    shtml="Cannot fetch the node's tags";
  }
  //console.log(shtml);
  // ganti element
  document.getElementById(E_TAGS).innerHTML = shtml;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

viewNodes();
