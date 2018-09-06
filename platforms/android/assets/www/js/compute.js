
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


importScripts('jquery-2.2.4.js');

var ajax = function(url, data, callback, type) {
  var data_array, data_string, idx, req, value;
  if (data == null) {
    data = {};
  }
  if (callback == null) {
    callback = function() {};
  }
  if (type == null) {
    //default to a GET request
    type = 'GET';
  }
  data_array = [];
  for (idx in data) {
    value = data[idx];
    data_array.push("" + idx + "=" + value);
  }
  data_string = data_array.join("&");
  req = new XMLHttpRequest();
  req.open(type, url, false);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onreadystatechange = function() {
    if (req.readyState === 4 && req.status === 200) {
      return callback(req.responseText);
    }
  };
  req.send(data_string);
  return req;
};

function sendGet(url, data){
    var op;
    if(data === null){
        data = {};
    }
    $.ajax({
        type: "post",
        url: url,
		data: data,
        success: function(msg_obj){
			postMessage(msg_obj);
        },
        crossDomain:true,
        async: false
    });
    return op;
};

function ajaxTask(target, data){
    if(data === null){
        data = {};
    }
    ajax(target, data, function(op) {
        postMessage(op);
    }, 'POST');
};

this.onmessage = function(e){
    var args = e.data;
	alert('here');
    switch(args.cmd){
        case 'ajax': ajaxTask(args.target, args.data);
            break;
		case 'post': sendGet(args.target, args.data);
			break;
        default: postMessage('false');
            break;
    }
};

