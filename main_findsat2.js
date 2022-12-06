    var g_pms = [],                   // Array to hold satellite objects
        g_TLE = [],
        g_numOfSats = 0,              // Number of satellites
        g_altitudeMode = false,        // altitude mode: true = absolute,  false = clampToGround
        g_extrudeMode = true,         // extrude:  true = on

        g_updatePeriod = 1000,        // Time between calls to fetchNewData function (in ms)  HBC originally 1000
        g_features,                  // performance hack. Variable to hold ge.getFeatures()
        g_speed = 1,                // set this to 1 to update the satellite in real time
 
        g_curTime,
        g_fetchNew = null,
        g_lastMillis,
        g_lastUpdate,
        position,
        slider,
        xmlHttp;
        resetinProgress = false;
        
        earthradius = 20925524.9    //earth radus in feet

       
     function getFile(url)
     {
       xmlHttp=GetXmlHttpObject();
       if (xmlHttp==null)
       {
         alert ("Your browser does not support AJAX!");
         return;
       }
       xmlHttp.onreadystatechange=stateChanged;
       xmlHttp.open("GET",url,true);
       xmlHttp.send(null);
     }
 
 
     function GetXmlHttpObject()
     {
       var xmlHttp=null;
       try
       {
         xmlHttp=new XMLHttpRequest();  // Firefox, Opera 8.0+, Safari
       }
       catch (e)
       {
 
         try  // Internet Explorer
         {
           xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
         }
         catch (e)
         {
           xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
         }
       }
       return xmlHttp;
     }
 
 

     function stateChanged()
     {
       if (xmlHttp.readyState==4)
       {
       g_TLE = xmlHttp.responseText.split('\n');
 
       g_features = ge.getFeatures();
       g_getview = ge.getView();
       createStyles();       
       ge.getWindow().setVisibility(true); 

       var g_totsatsinfile = 0;
       var g_iridium = 0;
       var g_cosmos = 0;

       while (g_TLE[g_totsatsinfile*3])
       {
         var name = trim(g_TLE[g_totsatsinfile*3]);
         if ((name.charAt(0) == "C") && (g_cosmos < 150))
         {
           g_pms[g_numOfSats] = new Satellite(g_numOfSats,name,g_TLE[1+g_totsatsinfile*3],g_TLE[2+g_totsatsinfile*3], 0);
           g_numOfSats++;
           g_cosmos++;
         }         
         else if ((name.charAt(0) == "I") && (g_iridium < 150))
         {
           g_pms[g_numOfSats] = new Satellite(g_numOfSats,name,g_TLE[1+g_totsatsinfile*3],g_TLE[2+g_totsatsinfile*3], 0);
           g_numOfSats++;
           g_iridium++;
         } 
         g_totsatsinfile++;
       }
       



       resetTime();

       ge.getNavigationControl().setVisibility(ge.VISIBILITY_SHOW);
       ge.getOptions().setStatusBarVisibility(true);
       updateOptions();

       var la = ge.createLookAt(''); 
       la.set(0, 0, 0, ge.ALTITUDE_RELATIVE_TO_GROUND, 0, 0, 20000000); 
       ge.getView().setAbstractView(la);     
      
       google.earth.addEventListener(ge.getGlobe(), "mousedown", function(event) { draw(event); }); 
       google.earth.addEventListener(ge.getGlobe(), "mousemove", function(event) { movePMLoc(event); }); 
       }
     }

function my_sat_test(){
    //sat_test_string = 'LO-19&1 20442U 90005G   11187.94329143 -.00000024  00000-0  64087-5 0 01550&2 20442 098.3466 141.1781 0012855 097.5464 262.7179 14.32152423120621';
	//g_TLE = xmlHttp.responseText.split('&');
    g_TLE = sat_test_string.split('&');
    
    g_features = ge.getFeatures();
    g_getview = ge.getView();
    createStyles();       
    ge.getWindow().setVisibility(true); 

    var g_totsatsinfile = 0;
    var g_iridium = 0;
    var g_cosmos = 0;

    while (g_TLE[g_totsatsinfile*3])
    {
      var name = trim(g_TLE[g_totsatsinfile*3]);
      //if ((name.charAt(0) == "C") && (g_cosmos < 150))
      //{
        g_pms[g_numOfSats] = new Satellite(g_numOfSats,name,g_TLE[1+g_totsatsinfile*3],g_TLE[2+g_totsatsinfile*3], 0);
        g_numOfSats++;
        g_cosmos++;
      //}         
      //else if ((name.charAt(0) == "I") && (g_iridium < 150))
      //{
      //  g_pms[g_numOfSats] = new Satellite(g_numOfSats,name,g_TLE[1+g_totsatsinfile*3],g_TLE[2+g_totsatsinfile*3]);
      //  g_numOfSats++;
      //  g_iridium++;
      //} 
      g_totsatsinfile++;
    }
    


    //g_numOfSats = 1;
    //resetTime();
    //new version to just get the 24 hour trajectory
    //only works for one satelite for now
    resetTime();

    ge.getNavigationControl().setVisibility(ge.VISIBILITY_SHOW);
    ge.getOptions().setStatusBarVisibility(true);
    updateOptions();

    var la = ge.createLookAt(''); 
    la.set(0, 0, 0, ge.ALTITUDE_RELATIVE_TO_GROUND, 0, 0, 20000000); 
    ge.getView().setAbstractView(la);     
   
    google.earth.addEventListener(ge.getGlobe(), "mousedown", function(event) { draw(event); }); 
    google.earth.addEventListener(ge.getGlobe(), "mousemove", function(event) { movePMLoc(event); }); 
	
}

function setup_marker_move(){
	  // Listen for mousedown on the window (look specifically for point placemarks).
	  google.earth.addEventListener(ge.getWindow(), 'mousedown', function(event) {
	    if (event.getTarget().getType() == 'KmlPlacemark' &&
	        event.getTarget().getGeometry().getType() == 'KmlPoint') {
	      var placemark = event.getTarget();
	      dragInfo = {
	        placemark: event.getTarget(),
	        dragged: false
	      };
	    }
	  });

	  // Listen for mousemove on the globe.
	  google.earth.addEventListener(ge.getGlobe(), 'mousemove', function(event) {
	    if (dragInfo) {
	      event.preventDefault();
	      var point = dragInfo.placemark.getGeometry();
	      point.setLatitude(event.getLatitude());
	      point.setLongitude(event.getLongitude());
	      my_lat = event.getLatitude();
	      my_lng = event.getLongitude();
	      dragInfo.dragged = true;
	    }
	  });

	  // Listen for mouseup on the window.
	  google.earth.addEventListener(ge.getWindow(), 'mouseup', function(event) {
	    if (dragInfo) {
	      if (dragInfo.dragged) {
	        // If the placemark was dragged, prevent balloons from popping up.
	        event.preventDefault();
	      }

	      dragInfo = null;
	    }
	  });

}

function my_sat_find(){
    //Setup a marker at the original location and start the event listeners
    ge.getNavigationControl().setVisibility(ge.VISIBILITY_SHOW);
    ge.getOptions().setStatusBarVisibility(true);
    updateOptions();

    placemark = ge.createPlacemark('');
	  var point = ge.createPoint('');
	  point.setLatitude(my_lat);
	  point.setLongitude(my_lng);
	  placemark.setGeometry(point);
	  placemark.setName('Set Location');
	  ge.getFeatures().appendChild(placemark);

	  // Look at the placemark we created.
	  var la = ge.createLookAt('');
	  la.set(my_lat, my_lng, 0, ge.ALTITUDE_RELATIVE_TO_GROUND, 0, 0, 10000000);
	  ge.getView().setAbstractView(la);
	  
	  
	  //Move the marker
	  setup_marker_move();
	
	
	//sat_test_string = 'LO-19&1 20442U 90005G   11187.94329143 -.00000024  00000-0  64087-5 0 01550&2 20442 098.3466 141.1781 0012855 097.5464 262.7179 14.32152423120621';
	//g_TLE = xmlHttp.responseText.split('&');
    g_TLE = sat_test_string.split('&');
    
    g_features = ge.getFeatures();
    g_getview = ge.getView();
    createStyles();       
    ge.getWindow().setVisibility(true); 

    var g_totsatsinfile = 0;
    var g_iridium = 0;
    var g_cosmos = 0;

    while (g_TLE[g_totsatsinfile*3])
    {
      var name = trim(g_TLE[g_totsatsinfile*3]);
      //if ((name.charAt(0) == "C") && (g_cosmos < 150))
      //{
      //Check that the satellite is in the allowed satellite list
      if(view_sats.length == 0){
        g_pms[g_numOfSats] = new Satellite(g_numOfSats,name,g_TLE[1+g_totsatsinfile*3],g_TLE[2+g_totsatsinfile*3], 0);
        g_numOfSats++;
        g_cosmos++;
      }else
      {
    	  //check that g_TLE[1+g_totsatsinfile*3].substring(2,7) is in the satellite list
    	  var new_sat = g_TLE[1+g_totsatsinfile*3].substring(2,7);
    	  var add_sat = false;
    	  for(var vsc = 0; vsc < view_sats.length; vsc += 1){
    		  if(new_sat == view_sats[vsc]){
    			  add_sat = true;
    		  }
    	  }
    	  if(add_sat){
    	        g_pms[g_numOfSats] = new Satellite(g_numOfSats,name,g_TLE[1+g_totsatsinfile*3],g_TLE[2+g_totsatsinfile*3], 0);
    	        g_numOfSats++;
    	        g_cosmos++;
    	  }
      }
      //}         
      //else if ((name.charAt(0) == "I") && (g_iridium < 150))
      //{
      //  g_pms[g_numOfSats] = new Satellite(g_numOfSats,name,g_TLE[1+g_totsatsinfile*3],g_TLE[2+g_totsatsinfile*3]);
      //  g_numOfSats++;
      //  g_iridium++;
      //} 
      g_totsatsinfile++;
    }
    


    //g_numOfSats = 1;
    //resetTime();
    //new version to just get the 24 hour trajectory
    //only works for one satelite for now
    resetTimena();


    //var la = ge.createLookAt(''); 
    //la.set(0, 0, 0, ge.ALTITUDE_RELATIVE_TO_GROUND, 0, 0, 20000000); 
    //ge.getView().setAbstractView(la);     
   
    google.earth.addEventListener(ge.getGlobe(), "mousedown", function(event) { draw(event); }); 
    google.earth.addEventListener(ge.getGlobe(), "mousemove", function(event) { movePMLoc(event); }); 
	
}


     
     function about() {
      if(ge){
        var balloon = ge.createHtmlStringBalloon('');
        balloon.setMaxWidth(350);
        balloon.setContentString('Real-time Amateur Satellite Tracker.<br /><br />' +
            'Currently tracking ' + g_numOfSats + ' objects.');
        ge.setBalloon(balloon);
      }
    }    
  
     function fetchNewData()
     {
       var next = g_curTime+g_updatePeriod*g_speed;
       var jdNext = JDate(next);
       var refresh;
       
       (next > g_lastUpdate) ? refresh = false: refresh = true;

       for (var i =0; i< g_numOfSats;i++)
       {
         g_pms[i].UpdatePositionData(next,jdNext,refresh);
       }
       
       g_lastUpdate = next;
       g_fetchNew = setTimeout("fetchNewData()", g_updatePeriod);
     }
 
     function fetchNewDatana()
     {
       var next = g_curTime+g_updatePeriod*g_speed;
       var jdNext = JDate(next);
       var refresh;
       
       (next > g_lastUpdate) ? refresh = false: refresh = true;

       for (var i =0; i< g_numOfSats;i++)
       {
         g_pms[i].UpdatePositionData(next,jdNext,refresh);
         g_pms[i].Move(next);
       }
       
       g_lastUpdate = next;
       //No delay, just loop through to calcuate the entire trajectory
       //g_fetchNew = setTimeout("fetchNewData()", g_updatePeriod);
     }
 
 
     function moveSatellites()
     {
       var temp = fetchCurTime();
         g_curTime += (temp-g_lastMillis)*g_speed;
         g_lastMillis = temp;
       

         for (var i =0; i< g_numOfSats;i++)
         {
             g_pms[i].Move(g_curTime);
         }
       
         var time = new Date(g_curTime);  var date = time.toUTCString();
         el('date').innerHTML = time.toLocaleString(); 
    }

     function moveSatellitesna()
     {
       //var temp = fetchCurTime();
    	 //always incrment time by one second
    	 var temp = g_lastMillis + 1000;
         g_curTime += (temp-g_lastMillis)*g_speed;
         g_lastMillis = temp;
       

         for (var i =0; i< g_numOfSats;i++)
         {
             g_pms[i].Move(g_curTime);
         }
       
         var time = new Date(g_curTime);  var date = time.toUTCString();
         el('date').innerHTML = time.toLocaleString(); 
    }

 
      function resetTime()
      {

          g_curTime = g_lastMillis = g_lastUpdate = fetchCurTime();
        
          var jd = JDate(g_curTime);
 
          for (var i =0; i< g_numOfSats;i++)
          {
            g_pms[i].UpdatePositionData(g_curTime,jd,true);

          } 
         
          fetchNewData();
                  
          google.earth.addEventListener(ge, "frameend", moveSatellites);
       
     }
      
    function drawOrbit24(){
    	//Draw the path for 24 hours
    	//Call movesats twice for every fetchNewDatana
    	for(i=0; i < 24*60*60; i++){
    		//if(i!= 0 & i%2 == 0){
    			fetchNewDatana();
    		//}
    		moveSatellitesna();
    	}
    }
      
    function resetTimena()
    {

        //set the number of satellites to just the first one
        //g_numOfSats = 61;

        g_curTime = g_lastMillis = g_lastUpdate = fetchCurTime();
      
        var jd = JDate(g_curTime);

        //for (var i =0; i< g_numOfSats;i++)
        //{
          //g_pms[i].UpdatePositionData(g_curTime,jd,true);

        //} 
       
        //fetchNewDatana();
                
        //in this version, there is no event listening
        //we just want to calculate the trajectory for 24 hours
        //google.earth.addEventListener(ge, "frameend", moveSatellites);
        
        //Call the function that will plot all the trajectories at once.
        //set the number of satellites to just the first one
        
        //drawOrbit24();
        
        //Now track all satellites
        for (var j =0; j< g_numOfSats;j++){
            g_curTime = g_lastMillis = g_lastUpdate = fetchCurTime();
        	if(isOperational(g_pms[j].satelliteNumber)){
              //for (var j =6; j< 7;j++){    
              //Calcultate the position every two minutes of the satellite for the next 24 hours
              //alert('Working on satellite ' + j);
              for(var i=0; i< 8*24; i++){
        	      g_curTime = g_curTime + (480*1000);
        	      jd = JDate(g_curTime);
        	      g_pms[j].UpdatePositionDatana(g_curTime,jd,true);
        	      //Update the status of the calculation
        	      //el('date').innerHTML = 'Working on minute ' + i;
              }
    	      el('date').innerHTML = 'Working on satellite ' + j;
        	}
        }
        
        //Now draw the entire satellite path to verify it
        //g_pms[0].
     
   }
    
function draw_traj(sat_index, start_time, end_time, time_step){
    for(var i=start_time; i< end_time; i += time_step){
  	  jd = JDate(i);
  	  g_pms[j].UpdatePositionDatanaPass(i,jd,true);
  	  //Update the status of the calculation
  	  //el('date').innerHTML = 'Working on minute ' + i;
    }
	
}
    
function clear_passes(){
	for (var j =0; j< g_numOfSats;j++){
		g_pms[j].ClearPasses();
	}
	//clear the pass catalog
	pass_catalog.length = 0;
}
 
    //holds all good catalog passes
    //[sindex, sname, pindex, startdate, enddate, elev, first_step, last_step]
    var pass_catalog = [];
    function find_passes(){
        //find the nearby passes for all satellites	
        clear_passes();
        //el('passes').innerHTML = '';
    	var found_passes = 0;
        found_pass = false;

        for (var j =0; j< g_numOfSats;j++){
    		//if(found_pass){found_html += '<br>'}
    		found_pass = false;
        	if(isOperational(g_pms[j].satelliteNumber)){
    	        passes = find_passes_sat(j);
    	        if(passes.length > 0){
    	        	//found_html += satName(g_pms[j].satelliteNumber) + '<br>';
    	        }
    	        for(var k=0; k<passes.length; k++){
    	            //[sindex, sname, pindex, startdate, enddate, elev, first_step, last_step, drawn, start_bearing, end_bearing]
        			pass_catalog[found_passes] = 
        				         ([j, satName(g_pms[j].satelliteNumber), k, passes[k][2][0], passes[k][2][1], passes[k][2][2], passes[k][2][3], passes[k][2][4], 0,
        				           passes[k][2][5], passes[k][2][6], passes[k][2][7]]);
    	        	found_pass = true;
    	        	var time = new Date(passes[k][1]);  var date = time.toLocaleString();
        	        found_passes += 1;
    	        }
        	}
        }
        write_pass_table();
        //alert('Found ' + found_passes + ' passes')
    }
    
    function sort_catalog_start(){
    	pass_catalog.sort(sort_start);
    	write_pass_table();
    }
    
    function sort_start(a,b){
        //[sindex, sname, pindex, startdate, enddate, elev, first_step, last_step]
    	return a[3] - b[3];
    }
    
    function sort_catalog_duration(){
    	pass_catalog.sort(sort_duration);
    	write_pass_table();
    }
    
    function sort_duration(a,b){
        //[sindex, sname, pindex, startdate, enddate, elev, first_step, last_step, checked]
    	return (b[4] - b[3]) - (a[4] - a[3]);
    }
    
    function sort_catalog_elev(){
    	pass_catalog.sort(sort_elev);
    	write_pass_table();
    }
    
    function sort_elev(a,b){
        //[sindex, sname, pindex, startdate, enddate, elev, first_step, last_step]
    	return b[5] - a[5];
    }
    
    function sort_catalog_name(){
    	pass_catalog.sort(sort_name);
    	write_pass_table();
    }
    
    function sort_name(a,b){
        //[sindex, sname, pindex, startdate, enddate, elev, first_step, last_step]
    	if(a[1] < b[1]){
    		return -1;
    	}
    	if(a[1] == b[1]){
    		if(a[3] < b[3]){
    			return -1;
    		}
    		if(a[3] > b[3]){
    			return 1;
    		}
    		if(a[3] == b[3]){
    			return 0;
    		}
    	}
    	if(a[1] > b[1]){
    		return 1;
    	}
    }
    
    function animate_passes(){
    	//sort passes according to start time
    	sort_catalog_start();
    	//draw all passes with animation times
    	for(var i=0; i<pass_catalog.length; i++){
    		animate_sat_pass(pass_catalog[i][0],pass_catalog[i][2], pass_catalog[i][6], pass_catalog[i][7], 
    		              pass_catalog[i][3], pass_catalog[i][4]);
    	}
    	  //record latest ending pass for end of time span
    	  //no need for this, the time slider watches the end automatically
    	//set time span and start the animation
    	//set the time rate to finish a day in one minute
    	ge.getTime().setRate(1/24);
    }

    function write_pass_table(){
        var found_html = '<table id="entries" rules="groups" frame="box" style="width:100%"><tbody>';
        found_html += '<tr><th><a href="javascript:void(0)" onClick="sort_catalog_name();">Sat</a></th>';
        found_html += '<th><a href="javascript:void(0)" onClick="sort_catalog_start();">Start</a></th>';
        found_html += '<th><a href="javascript:void(0)" onClick="sort_catalog_duration();">End</a></th>';
        found_html += '<th><a href="javascript:void(0)" onClick="sort_catalog_elev();">Elev</a></th>';
        found_html += '<th>Map!</th></tr>';
        //alternate table row color
        var alt = 0;

        for(var i=0; i<pass_catalog.length; i++){
            //[sindex, sname, pindex, startdate, enddate, elev, first_step, last_step]
        	found_html += '<tr class="' + rowcolor(alt) + '"><td>';
        	found_html += pass_catalog[i][1] + '</td>';
        	var fist_time = new Date(pass_catalog[i][3]);  var first_date = fist_time.toLocaleTimeString();
        	var end_time = new Date(pass_catalog[i][4]);  var end_date = end_time.toLocaleTimeString();
        	found_html += '<td>' + first_date + '<br>' + pass_catalog[i][9].toPrecision(4) + '&deg;</td>';
        	found_html += '<td>' + end_date + '<br>' + pass_catalog[i][10].toPrecision(4) + '&deg;</td>';
        	found_html += '<td>' + pass_catalog[i][5].toPrecision(4) + '&deg;<br>' + pass_catalog[i][11].toPrecision(4) + '&deg;</td>';
        	found_html += '<td><input type="checkbox" name="vehicle" onclick="draw_sat_pass(';
	        found_html += pass_catalog[i][0] + ',' + pass_catalog[i][2] + ',' + pass_catalog[i][6] + ',' + pass_catalog[i][7] + ', ';
	        found_html += pass_catalog[i][3] + ', ' + pass_catalog[i][4] + '); pass_catalog[' + i + '][8] += 1"';
	        found_html += get_check(pass_catalog[i][8]) + ' >';
        	found_html += '</td></tr>';
        	
        	alt = (alt + 1)%2;
        	
        }
    	found_html += '</tbody></table>';
       	el('passes').innerHTML = found_html;
    }
    
    function get_check(checker){
    	if(checker%2 == 1){
    		return 'checked="checked"';
    	}else{
    		return '';
    	}
    }
    
    function rowcolor(step){
    	if(step%2 == 0){
    		return 'alt';
    	}else{
    		return 'notalt';
    	}
    }
    
    function draw_sat_pass(sat_index, pass_index, first_step, last_step, start_time, end_time){
    	g_pms[sat_index].DrawPass(pass_index, first_step, last_step, start_time, end_time, false);
    }

    function animate_sat_pass(sat_index, pass_index, first_step, last_step, start_time, end_time){
    	g_pms[sat_index].DrawPass(pass_index, first_step, last_step, start_time, end_time, true);
    }
    
	var my_lat = 40.9583819592;
	var my_lng = -72.9725646973;

	function find_passes_sat(sat_index){
    	//var my_lat_lng = new GLatLng(0, 0);
    	//var sat_lat_lng = new GLatLng(0, 0);
    	//Walk the traj list and record when the satellite is in view
    	found = '';
    	found_cnt = 0;
    	//sat_index = 6;
    	found_pass = 0;
    	var ret_passes = [];
    	for(var i=0; i < g_pms[sat_index].traj.length; i++){
    		//If t
    		var sdist = edist(my_lat, my_lng, g_pms[sat_index].traj[i][1], g_pms[sat_index].traj[i][2]);
    		var shrz = sat_horizon(g_pms[sat_index].traj[i][3]);
    		//add the code to get rid of duplicates
    		
    		if((sdist < shrz) && (found_pass == 0)){
    			var found_time = g_pms[sat_index].traj[i][0];
    			var time = new Date(g_pms[sat_index].traj[i][0]);  var date = time.toUTCString();
    			found += 'found at ' + date + '\n';

    			var pass_info = g_pms[sat_index].BuildPass(found_cnt, found_time - 15*60*1000, found_time + 15*60*1000, 5*1000);
    			ret_passes[found_cnt] = [sat_index, found_time, pass_info];
    				
    			found_cnt += 1;
    			found_pass = 1;
    			//}
    			

    		}
    		else{
    			found_pass = 0;
    		}
    	}
    	//alert('found ' + found_cnt + ' passes');
    	return ret_passes;
    }
	
	
    
    function satName(satnum){
    	if(satnum == '37227'){return 'Fastrac 1';}
    	if(satnum == '37224'){return 'O/Oreos';}
    	if(satnum == '36122'){return 'Hope Oscar 68 (XW-1)';}
    	if(satnum == '35935'){return 'ITUpSAT1';}
    	if(satnum == '35934'){return 'UWE-2';}
    	if(satnum == '35933'){return 'BEESAT';}
    	if(satnum == '35932'){return 'SwissCube';}
    	if(satnum == '35870'){return 'Sumbandila Oscar 67';}
    	if(satnum == '32953'){return 'RS-30';}
    	if(satnum == '32791'){return 'Cubesat Oscar - 66 (SEEDS II)';}
    	if(satnum == '32789'){return 'Delfi OSCAR-64';}
    	if(satnum == '32787'){return 'COMPASS-1';}
    	if(satnum == '32785'){return 'Cubesat Oscar-65 (Cute-1.7 + APD II)';}
    	if(satnum == '29655'){return 'GeneSat-1';}
    	if(satnum == '28895'){return 'Cubesat XI-V';}
    	if(satnum == '28650'){return 'HAMSAT';}
    	if(satnum == '28375'){return 'AMSAT-OSCAR 51';}
    	if(satnum == '27939'){return 'RS-22';}
    	if(satnum == '27848'){return 'CubeSat XI-IV';}
    	if(satnum == '27844'){return 'Cute-1';}
    	if(satnum == '27607'){return 'Saudisat-1C';}
    	if(satnum == '26931'){return 'PCSat';}
    	if(satnum == '25544'){return 'ARISS';}
    	if(satnum == '25509'){return 'SEDSat';}
    	if(satnum == '25397'){return 'TechSat1b';}
    	if(satnum == '24278'){return 'JAS 2';}
    	if(satnum == '23439'){return 'RadioSkaf-15';}
    	if(satnum == '22826'){return 'ITAMSAT';}
    	if(satnum == '22825'){return 'EYESAT-1';}
    	if(satnum == '20439'){return 'PacSAT';}
    	if(satnum == '14781'){return 'UoSAT 2';}
    	if(satnum == '7530'){return 'OSCAR 7';}
    	if(satnum == '39161'){return 'ESTCUBE 1';}
    	return 'Unknown Sat';
    }
    function isOperational(satnum){
    	if(satnum == '37227'){return true;}
    	if(satnum == '37224'){return true;}
    	if(satnum == '36122'){return true;}
    	if(satnum == '35935'){return true;}
    	if(satnum == '35934'){return true;}
    	if(satnum == '35933'){return true;}
    	if(satnum == '35932'){return true;}
    	if(satnum == '35870'){return true;}
    	if(satnum == '32953'){return true;}
    	if(satnum == '32791'){return true;}
    	if(satnum == '32789'){return true;}
    	if(satnum == '32787'){return true;}
    	if(satnum == '32785'){return true;}
    	if(satnum == '29655'){return true;}
    	if(satnum == '28895'){return true;}
    	if(satnum == '28650'){return true;}
    	if(satnum == '28375'){return true;}
    	if(satnum == '27939'){return true;}
    	if(satnum == '27848'){return true;}
    	if(satnum == '27844'){return true;}
    	if(satnum == '27607'){return true;}
    	if(satnum == '26931'){return true;}
    	if(satnum == '25544'){return true;}
    	if(satnum == '25509'){return true;}
    	if(satnum == '25397'){return true;}
    	if(satnum == '24278'){return true;}
    	if(satnum == '23439'){return true;}
    	if(satnum == '22826'){return true;}
    	if(satnum == '22825'){return true;}
    	if(satnum == '20439'){return true;}
    	if(satnum == '14781'){return true;}
    	if(satnum == '7530'){return true;}
    	if(satnum == '39161'){return true;}
    	//else
    	return false;
    }
 
     function fetchCurTime()
     {
       var timex = new Date();
       return timex.getTime()
     }
 


     function updateOptions()
     {
       var options = ge.getOptions();
       var form = el("options");
       var mode;

       if (form.altitude.checked != g_altitudeMode)
       {
         g_altitudeMode = form.altitude.checked;
         for (var i =0; i< g_numOfSats;i++){g_pms[i].altMode(g_altitudeMode)}
       }
 
  
       ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, form.borders.checked);
       ge.getLayerRoot().enableLayerById(ge.LAYER_BUILDINGS, true);  
       //ge.getSun().setVisibility(true);
     }
 
     function el(e) { return document.getElementById(e); }




function draw(e) 
{
  if(e.getTarget().getType() == 'KmlPlacemark')
  {
      e.preventDefault(); 
  }
}
