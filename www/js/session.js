
function with_delay(callback, delay){
	return function(){
		setTimeout(callback, delay);
	};
}

/*
	Initialise the User interface and enable responses
*/
function init_ui(){
	window.addEventListener('click', function(e){
		e.preventDefault();
		$('.collapse').collapse("hide");
		}, false);
	app.session.data.pages = {mkt: document.getElementById('market_info_page'),
			fmg: document.getElementById('farming_tips_page'),
			wtr: document.getElementById('weather_page'),
			dis: document.getElementById('plant_diseases_page'),
			chm: document.getElementById('plant_chemicals_page'),
			tls: document.getElementById('plant_tools_page'),
			rpt: document.getElementById('report_page'),
			acc: document.getElementById('account_page'),
			active: null};
	//prepare elements for events
	document.getElementById('market_btn').parentElement.addEventListener('click', with_delay(set_mkt_active, 200), false );
	document.getElementById('agri_tips_btn').parentElement.addEventListener('click',  with_delay(set_fmg_active, 200), false );
	document.getElementById('weather_short_button').addEventListener('click', with_delay(set_wtr_active, 200), false );
	document.getElementById('scan_cam_button').addEventListener('click', with_delay(set_cam_active, 200), false);
}

function set_cam_active(){
	app.device.capture_camera_image();
}
function set_mkt_active(){
	app.session.set_page_active(app.session.data.pages.mkt);
	app.session.data.cstate=4;
}
function set_fmg_active(){
	app.session.set_page_active(app.session.data.pages.fmg);
	app.session.data.cstate=5;
}
function set_wtr_active(){
	app.session.set_page_active(app.session.data.pages.wtr);
	app.session.data.cstate=6;
}
function set_dis_active(){
	app.session.set_page_active(app.session.data.pages.dis);
	app.session.data.cstate=7;
}
function set_chm_active(){
	app.session.set_page_active(app.session.data.pages.chm);
	app.session.data.cstate=8;
}
function set_tls_active(){
	app.session.set_page_active(app.session.data.pages.tls);
	app.session.data.cstate=9;
}
function set_rpt_active(){
	app.session.set_page_active(app.session.data.pages.rpt);
	app.session.data.cstate=10;
}
function set_acc_active(){
	app.session.set_page_active(app.session.data.pages.acc);
	app.session.data.cstate=11;
}

/*
	Verify if the user is registered
	If not then initiate registration
*/
function verify_registration(){
	//alert(app.device.get_device_id());
	return false;
}

/*
	Initialize the UI for registration of the user
	Load page from __html.registration_0 in db.js
*/
function init_registration(){
	document.getElementById('home_icon').style.display = 'none';
	document.getElementById('menu_sidebar_btn').style.display = 'none';
	document.getElementById('menu_sidebar_btn').style.display = 'none';
	document.getElementById('home_page').style.display = 'none';
	document.getElementById('registration_page_1').style.display = 'block';
	document.getElementById('reg_1_proceed').addEventListener('click', with_delay(function(){
		app.session.data.mob_no = document.getElementById('reg_mob_no').value;
		app.session.data.state = document.getElementById('reg_state').value;
		app.session.data.city = document.getElementById('reg_city').value;
		if(app.session.data.mob_no.toString().length == 10){
			document.getElementById('registration_page_1').style.display = 'none';
			rp2 = document.getElementById('registration_page_2');
			obj = rp2.getElementsByClassName('crop_select')[0];
			obj.innerHTML = obj.innerHTML + get_crop_grid();
			rp2.style.display = 'block';
			app.session.data.cstate = 1;
		}
	}, 200), false);
	app.session.data.cstate = 0;
}

/*
	Register the user
*/
function register(){
	app.session.data.name = document.getElementById('reg_first_name').value + ' '+ document.getElementById('reg_last_name').value;
	var sel_l = document.getElementById('registration_page_2').getElementsByTagName('img');
	for(i=0;i<sel_l.length;i++){
		if(sel_l[i].selected)
			app.session.data.interest_crops[app.session.data.interest_crops.length] = sel_l[i].id.split('_')[1];
	}
	if(app.session.data.name.length > 3){
		database.tbl_user[database.tbl_user.length] = {
				id: database.tbl_user.length+1,
				device_id: app.device.get_device_id(),
				name: app.session.data.name,
				mobile_number: app.session.data.mob_no,
				location_id: 1,
				interest_crops: app.session.data.interest_crops};
		init_home();
	}
}

function init_home(){
	hide_all_pages();
	document.getElementById('registration_page_2').style.display = 'none';
	document.getElementById('home_icon').style.display = 'block';
	document.getElementById('menu_sidebar_btn').style.display = 'block';
	document.getElementById('menu_sidebar_btn').style.display = 'block';
	document.getElementById('home_page').style.display = 'block';
	app.session.data.cstate = 2;
}

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
			op = msg_obj;
        },
        crossDomain:true,
        async: false
    });
    return op;
};

function load_predictions(data){
	if(!data){
		document.getElementById('rs_disease').innerHTML = "Unable to identify the plant";
		document.getElementById('rs_probability').innerHTML = "Unknown";
		document.getElementById('rs_remedy').innerHTML = "Unknown";
	}else{
		document.getElementById('rs_disease').innerHTML = data.TagName;
		document.getElementById('rs_probability').innerHTML = (data.Probability * 100).toFixed(2).toString()+"%";
		document.getElementById('extra_info').innerHTML = '<h5>Remedy for '+data.TagName+'</h5><p class="medium-text">'+database.utils.get_remedy_by_disease_name(data.TagName)+'</p>';
		document.getElementById('rs_remedy').innerHTML = '<button type="button" onclick="show_extra_info();">Click to Read</button>';
	}
	stop_processing();
	document.getElementById('result_data_div').style.display = 'block';
	app.session.data.cstate = 3;
}
//exit from the app
function exit(){
	navigator.app.exitApp();
}
// hide all the major pages
function hide_all_pages(){
	pages_to_hide = document.getElementsByClassName('page');
	for(i=0;i<pages_to_hide.length;i++)
		pages_to_hide[i].style.display = 'none';
}
// action handler for back key
function onBackKey(){
	if(app.session.data.extra_prev_state > 0){
		back_to_pre();
	}else{
		hide_all_pages();
		if(app.session.data.cstate > 0){
			var callback = app.session.data.state_back_callback[app.session.data.cstate];
			if(callback !== null)
				callback();
		}
		stop_processing();
	}
}

function home_not_back(){
	if( app.session.data.cstate != 2 )
		onBackKey();
}

function show_extra_info(){//alert(document.getElementById('extra_info_page').innerHTML);
	document.getElementById('extra_info_page').style.display = 'block';
	app.session.data.extra_prev_state = app.session.data.cstate;
}

function back_to_pre(){/*
	switch(app.session.data.extra_prev_state){
		case 4: set_fmg_active();
			break;
		case 5: set_fmg_active();
			break;
		case 6: set_wtr_active();
			break;
		case 7: set_dis_active();
			break;
		case 8: set_chm_active();
			break;
		case 9: set_tls_active();
			break;
		case 10: set_rpt_active();
			break;
		case 11: set_acc_active();
			break;
		default:
			break;
	};*/
	document.getElementById('extra_info_page').style.display = 'none';
	app.session.data.extra_prev_state = -1;
}


