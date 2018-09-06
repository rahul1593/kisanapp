var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
	console.log('Event registered');
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {console.log('Not yet called');
		pictureSource=navigator.camera.PictureSourceType;
		destinationType=navigator.camera.DestinationType;
		//lock app orientation
		//screen.orientation.lock('portrait');
		//initialise the ui and event handlers
		init_ui();
		//start the frontend services
		app.system.services.__data.timerObj = setInterval(app.system.services.__exec, app.system.services.__data.frequency);
		//if the key file 'local.key' exists in the file system with valid uid, Show home page
		//else show registration page
		if(!verify_registration())
			init_registration();
		document.addEventListener("backbutton", onBackKey, false);
		document.getElementById('report_div').src = app.session.data.report_url;
		//init weather grid
		document.getElementById('monthly_weather_report').innerHTML = get_weather_grid();
		//init user account details
		app.session.load_user_info();
		// init tools
		init_tools();
		//init chemicals
		init_chemicals();
    },
	
	device:{
		// get unique id of the device
		get_device_id: function(){
			return device.uuid;
			//return '12124e2r3ktf';
		},
		//get the network state of the device
		//is_network_connected: function(){
		//	var con = navigator.connection.type;
		//	if(con === Connection.UNKNOWN || con === Connection.NONE){
		//		return false;
		//	}
		//	return true;
		//},
		//set the location in session variable
		set_geolocation: function(){
			navigator.geolocation.getCurrentPosition(
				function(position){
					app.session.data.geo_location.lat = position.coords.latitude;
					app.session.data.geo_location.lon = position.coords.longitude;
				}, 
				function(error) {
					alert('code: '    + error.code    + '\n' +
						  'message: ' + error.message + '\n');
				});
		},
		capture_camera_image: function(){
			navigator.camera.getPicture(
				function(image_data){//store the image in session data
					app.session.data.image_tbp = image_data;
					app.device.set_geolocation();
					// get predictions
					app.session.data.predict_data.Image  = app.session.data.image_tbp;
					app.session.data.predict_data.Location = app.session.data.geo_location;
					var args = {target: app.session.data.target_url,
								data: app.session.data.predict_data};
					start_processing();
					setTimeout(function(){
						var dt = sendGet(app.session.data.target_url, app.session.data.predict_data);
						load_predictions(dt.Predictions[0]);
					}, 350);
					//startWorker('post', 'compute.js', args, load_predictions);
					document.getElementById('target_img').src = "data:image/jpeg;base64," + app.session.data.image_tbp;
					document.getElementById('target_img').style.display = 'block';
				}, 
				function(message){
					alert('Failed because: ' + message);
				}, 
				{ quality: 30, allowEdit: true, destinationType: destinationType.DATA_URL }
			);
		},
		get_gallery_image: function(source){
			navigator.camera.getPicture(
				function(image_data){//store the image in session data
					app.session.data.image_tbp = image_data;
				},
				function(message){
					alert('Failed because: ' + message);
				}, 
				{ quality: 50, destinationType: destinationType.FILE_URI, sourceType: source }
			);
		},
		create_dir: function(path, dir_name){// create a directory in file system
			//empty since not required at the moment
		},
		create_file: function(file_name){// create a file in persistent file system
			/*window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
				//console.log('file system open: ' + fs.name);
				fs.root.getFile(file_name, { create: true, exclusive: false }, function (file_entry) {
					console.log("file_entry is file?" + file_entry.isFile.toString());
					// file_entry.name == 'someFile.txt'
					// file_entry.fullPath == '/someFile.txt'
					writeFile(file_entry, null);
					app.session.data.last_created_file = file_entry;

				}, function(message){
					alert('Create File failed: ' + message);
					app.session.data.last_file_action_status = false;
				});
			}, function(message){alert('Load FS failed: ' + message);});*/
		},
		read_file: function(file_entry){
			/*file_entry.file(function(file){
				var reader = new FileReader();
				reader.onloadend = function(){
					//console.log("Successful file read: " + this.result);
					//displayFileData(file_entry.fullPath + ": " + this.result);
					app.session.data.file_last_read_data = this.result;
				};
				reader.readAsText(file);
				}, function(message){
					alert('Read failed: ' + message);
					app.session.data.last_file_action_status = false;
				}
			);*/
		},
		write_file: function(file_entry, dataObj){
			// Create a FileWriter object for our file_entry (log.txt).
			/*file_entry.createWriter(function (fileWriter) {
				fileWriter.onwriteend = function() {
					console.log("Successful file write...");
					readFile(file_entry);
				};
				fileWriter.onerror = function (e) {
					console.log("Failed file write: " + e.toString());
				};
				// If data object is not passed in,
				// create a new Blob instead.
				if (!dataObj) {
					dataObj = new Blob(['Empty object to write.'], { type: 'text/plain' });
				}
				fileWriter.write(dataObj);
			});*/
		}
	},
	
	session: {
		data:{
			farmer: null, //{name, device_id, mobile_no, crops: [],location: {state, city, area}}
			db: null,
			geo_location: {lat: null, lon: null},
			//network_present: false,
			//state management
			//states:reg_0, reg_1, home_2, camera_res_3, market_4, farming_tips_5, weather_6, diseases_7, chemicals_8, tools_9, reports_10, accounts_11, extra_12
			state_back_callback:[null,
								init_registration,
								exit,
								init_home,
								init_home,
								init_home,
								init_home,
								init_home,
								init_home,
								init_home,
								init_home,
								init_home,
								back_to_pre],
			extra_prev_state: -1,
			cstate: 0,
			//pages in app and their states
			pages: null,
			//while registration
			mob_no: null,
			state: null,
			city: null,
			area: null,
			name: null,
			devid: null,
			interest_crops: [],
			// state information when running
			image_tbp: null,
			file_last_read_data: null,
			last_created_file: null,
			last_file_action_status: false,
			// weather information
			weather: null,
			weather_service:{url:'http://api.openweathermap.org/data/2.5/weather',
					 APPID: '75f9d42cfd15597d5d0a166f26f90861'},
			//prediction
			target_url: 'http://kisanapplication.azurewebsites.net/api/CognitiveImage',
			predict_data: {"Image":null, "Location":null},
			//reports ba6d6929-ab86-11e8-a340-a98585cc2c27
			report_url:'http://104.43.218.22:5601/app/kibana#/dashboard/09f26670-ab7e-11e8-a340-a98585cc2c27?embed=true&_g=(refreshinterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow%2Fd%2Cnode%3Aquick%2Cto%3Anow%2Fd))'
		},
		get_location: function(){
			return this.data.farmer.location;
		},
		set_page_active: function(page){
			if( this.data.pages.active !== null){
				this.data.pages.active.style.display = 'none';
			}
			this.data.pages.active = page
			if(page !== null){
				page.style.display = 'block';
			}
		},
		load_user_info: function(){
			app.session.data.farmer = database.utils.get_farmer_by_id(1);
			init_user_account(app.session.data.farmer);
		}
	},
	system: {
		services:{
            __data:{
                frequency: 10,               //millisecond
                registered_services: [],     //list of services,
                crnt_srv_indx: 0,
                timerObj: null
            },
            __exec: function(){
                if(app.system.services.__data.registered_services.length < 1){
                    return;
                }
                var srv = app.system.services.__data.registered_services[app.system.services.__data.crnt_srv_indx];
                if(srv.state === 'running'){
                    setTimeout(srv.callback, 1);
                }
                app.system.services.__data.cnt_srv_indx++;
                if(app.system.services.__data.crnt_srv_indx >= app.system.services.__data.registered_services.length){
                    app.system.services.__data.cnt_srv_indx = 0;
                }
            },
            resetServices: function(){
                //this function removes all the services from the list of running services and resets the timer
                app.system.services__data = {
                    frequency:10,
                    registered_services:[],
                    crnt_srv_indx:0,
                    timerObj:null
                };
            },
            setServiceFrequency: function(delay_ms){
                clearInterval(app.system.services.__data.timerObj);
                app.system.services.__data.timerObj = setInterval(app.system.services.__exec, delay_ms);
                app.system.services.__data.frequency = delay_ms;
            },
            addService: function(service_name, callback, state){
				var service = {name: service_name, callback: callback, state: state};
				app.system.services.__data.registered_services[app.system.services.__data.registered_services.length] = service;
                if(service.state !== 'running' && service.state !== 'stopped'){
                    return false;
                }
                return true;
            },
            removeService: function(service_name){
                for(var i=0; i<app.system.services.__data.registered_services.length;i++){
                    if(app.system.services.__data.registered_services[i].name === service_name){
                        app.system.services.__data.registered_services.splice(i,1);  //remove the element at matched index
                        return true;
                    }
                }
                return false;
            },
            __srv_action: function(srv_name, state){
                for(var i=0; i<app.system.services.__data.registered_services.length;i++){
                    if(app.system.services.__data.registered_services[i].name === srv_name){
                        app.system.services.__data.registered_services[i].state = state;
                        return true;
                    }
                }return false;
            },
            startService: function(service_name){
                app.system.services.__srv_action(service_name, 'running');
            },
            stopService: function(service_name){
                app.system.services.__srv_action(service_name, 'stopped');
            },
            getServiceList: function(){
                var srv_list = [];
                for(var i=0; i<app.system.services.__data.registered_services.length;i++){
                    srv_list[srv_list.length] = app.system.services.__data.registered_services[i].name;
                }
                return srv_list;
            },
            getServicesInState: function(state){
                var srv_list = [];
                for(var i=0; i<app.system.services.__data.registered_services.length;i++){
                    if(app.system.services.__data.registered_services[i].state === state){
                        srv_list[srv_list.length] = app.system.services.__data.registered_services[i].name;
                    }
                }
                return srv_list;
            }
			
		},
		thread:{
			data:{//all the following lists must have same length and data at each index corresponds to each other
				thread_names: [],
				js_file_paths: [],
				handlers: []
			},
			create: function(thread_name, js_file_path, handler){
				//thread_name: name by which the thread will be registered,
				//js_file_path: js file to load as the thread code
				//handler: function in current context which will interact with this thread to get the task done
			},
			stop: function(thread_name){
				
			}
		}
	},
	online:{//temporary POST stub
		get_user_data: function(uid){
			return false;//to check registration page
		}
	}
};


function startWorker(cmd, js_file_path, data, callback){
    var myWorker = new Worker(js_file_path);
    myWorker.onmessage = function(e) {
        callback(e.data);
        myWorker.terminate();
    };
    myWorker.postMessage({cmd:cmd, data:data});
}


function toggle_fade(obj){
	if(! obj.getElementsByTagName('img')[0].selected){
		obj.style.opacity = 0.5;
		obj.getElementsByTagName('img')[0].selected = true;
	} else {
		obj.style.opacity = 1;
		obj.getElementsByTagName('img')[0].selected = false;
	}
}

function start_processing(){
	document.getElementById('loading').style.display = 'block';
}

function stop_processing(){
	document.getElementById('loading').style.display = 'none';
}



