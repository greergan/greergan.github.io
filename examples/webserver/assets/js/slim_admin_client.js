"use strict";
class WorkSpaceData {

}
class WorkSpaces {

}
class DashBoard {

}
class ControlPanel {
  
}

const timeString = (time_stamp) => {
  const date = new Date(time_stamp);
  return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
}

document.getElementById("current_time").innerHTML = timeString(new Date());
setInterval(() => { document.getElementById("current_time").innerHTML = timeString(new Date())}, 5000);
const view_visibility = new Set();
view_visibility.add('projects-page');
const showProjects = () => {
  //document.getElementById('projects-page').style.display = 'inline-block';
  console.log(document.getElementById('projects-page').classList)
}
const showSource = (view_id_to_show) => {
    //document.getElementById('source').innerHTML = `<textarea autofocus readonly>${document.getElementById(view_id_to_show).innerHTML}</textarea>`;
};
const showView = (view_id_to_show) => {
};

function connectToWebSocketServer() {
  let socket = new WebSocket(window.location.toString().startsWith('https')
    ? window.location.toString().replace("https", "wss")
    : window.location.toString().replace("http", "wss")
  );
  socket.onopen = function(e) {
    document.getElementById("connected_since").innerHTML = timeString(new Date());
  };
  socket.onmessage = function(event) {
    const status = JSON.parse(event.data);
    if('refresh' in status) {
      if(status.refresh) {
        location.reload();
      }
    }
    else if(event.data) {
      if('namespace' in status) {
        document.getElementById("namespace").innerHTML = status.namespace;
      }
      if('reverse_path_mappings' in status) {
        let html_update_string = "";
        status.reverse_path_mappings.forEach((element, index) => {
          const shortened_file_name = element.file.substring(status.namespace.endsWith('/') ? status.namespace.length + 2 : status.namespace.length +1);
          element.url = element.url.replace('http:', 'https:');
          html_update_string += `<tr><td><a href="${element.url}" target="${shortened_file_name}">${element.url}</a></td><td>${shortened_file_name}</td></tr>`;
        });
        document.getElementById("reverse_path_mappings").innerHTML = html_update_string;
      }
      document.getElementById("views").innerHTML = "";
      if('raw_views' in status) {
        let html_update_string = "";
        status.raw_views.forEach((element, index) => {
          const shortened_name = element.url.substring(status.namespace.length + 1);
          const div_id_to_show = `raw_views_${shortened_name}_${index}`;
          view_visibility.add(div_id_to_show);
          html_update_string += `<tr><td>${shortened_name}</td><td class="time">${timeString(element.time)}</td>
                          <td><button type="button" onclick="showView('${div_id_to_show}')">Show view</button></td>
                          <td><button type="button" onclick="showSource('${div_id_to_show}')">Show Source</button></td></tr>`;
          //document.getElementById("views").insertAdjacentHTML('beforeend', `<div id="${div_id_to_show}" class="view-output">${element.view}</div>`);
        });
        document.getElementById("raw_views").innerHTML = html_update_string;
      }
      if('compiled_views' in status) {
        let html_update_string = "";
        status.compiled_views.forEach((element,index) => {
          const shortened_name = element.url.substring(status.namespace.length + 1);
          const div_id_to_show = `compiled_views_${shortened_name}_${index}`;
          view_visibility.add(div_id_to_show);
          html_update_string += `<tr><td>${shortened_name}</td><td class="time">${timeString(element.time)}</td>
                          <td><button type="button" onclick="showView('${div_id_to_show}')">Show view</button></td>
                          <td><button type="button" onclick="showSource('${div_id_to_show}')">Show Source</button></td></tr>`;
          //document.getElementById("views").insertAdjacentHTML('beforeend', `<div id="${div_id_to_show}" class="view-output">${element.view}</div>`);
        });
        document.getElementById("compiled_views").innerHTML = html_update_string;
      }
      if('dependent_views' in status) {
        document.getElementById("dependent_views").innerHTML = "";
        status.dependent_views.forEach((element, index) => {
          document.getElementById("dependent_views").insertAdjacentHTML('beforeend', `<div id="dependency_${index}" class="slim-generator-console-view">${element.name.substring(status.namespace.length + 1)}</div>`);
          element.value.forEach((dependent_view, i) => document.getElementById(`dependency_${index}`).insertAdjacentHTML('beforeend',
                  `<div id="${element.name}_dependant_${i}" class="slim-generator-console-view-dependency">${dependent_view.substring(status.namespace.length + 1)}</div>`));
        });
      }
      if('running_since' in status) {
        document.getElementById("running_since").innerHTML =  timeString(status.running_since);
      }
      document.getElementById("last_updated").innerHTML =  timeString(new Date());
      view_visibility.add('source');
      document.getElementById("views").insertAdjacentHTML('beforeend', `<div id="source" class="source-output"></div>`);
    }
  };
  socket.onerror = function(error) {
    document.getElementById("connected_since").innerHTML = "error";
  };
  socket.onclose = function(event) {
    if(event.wasClean) {
      console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
      console.log('[close] Connection died', event);
    }
    //setTimeout(() => { location.reload();}, 1500);
    //setInterval(function() { if(socket.CLOSED) location.reload(); }, 1500);
  };
  return socket;
}
let socket = connectToWebSocketServer();
/* setInterval(() => {
    if(socket.readyState != 1) {
      document.getElementById("connected_since").innerHTML = `<button onclick="${connectToWebSocketServer()}">Reconnect</button>`;
    }
}, 5000);
 */