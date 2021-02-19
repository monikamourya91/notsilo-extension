 //var apiBaseUrl = 'http://127.0.0.1:8000/api/';
 var apiBaseUrl = 'http://localhost/notesilo/public/api/';
 var baseUrl = 'http://localhost/notesilo/public/';

 $(document).ready(function(){

	//$('#login_screen').show();
		dashboard();

	/*$('#login_btn').on('click',function(){
		$('.tab').hide();
		$('#signin_screen').show();
		return false;
	});*/
	/*$('#signin').on('click',function(){
		$('.tab').hide();
		$('#logout_screen').show();
		return false;
	});*/

	dashboard();

	$('#forgot_license_Key').on('click',function(){
		$('.tab').hide();
		$('#forgot_license_screen').show();
	});

	$('.login').on('click',function(){
		$('.tab').hide();
		$('#login_screen').show();
	});

	$("#login_form").validate({
        rules: {
            license_Key: {
                required: true
            }
        },
        messages: {
            license_Key: {
                required: "License key can not be empty"
            }
        },
        submitHandler: function() {
            $("#login_form button[type='submit']").attr('disabled',true).text('Processing');
            login();
            return false;
        }
    });

    
    $("#forgot_license_form").validate({
        rules: {
            email: {
                required: true
            }
        },
        messages: {
            email: {
                required: "Email can not be empty"
            }
        },
        submitHandler: function() {
            $("#forgot_license_form button[type='submit']").attr('disabled',true).text('Processing');
            fogotLicense();
            return false;
        }
    });



    $(document).on('click','#logout',function(){
    	console.log('logout');
    	triggerLogout();
    })



}); 


function login(){
 	$.ajax({
        type: "POST",
        url: apiBaseUrl + "login",
        data: $("#login_form").serialize(),
        dataType: 'json'
    }).done(function(response) {       
        $("#login_form button[type='submit']").removeAttr('disabled').text('Login');
        if(response.status == 200){
            messageToast('success',response.message);
            jwtToken = response.token;
            console.log((new Date().getTime()/1000) + (3600 * 1000*87660));
            chrome.cookies.set({ url: baseUrl, name: "jwt_token", value:  response.token, expirationDate: (new Date().getTime()/1000) + (3600 * 1000*87660)  });
            chrome.storage.local.set({'user': response.user});
            dashboard();
        }else{
            messageToast('error',response.message);
        }
    }); 

 }


function triggerLogout() {
    chrome.storage.local.set({'user': ''});
    $('.tab').hide();
   messageToast('success','Logout successfully');
    chrome.cookies.set({ url: baseUrl, name: "jwt_token", value:  '', expirationDate: (new Date().getTime()/1000) + (3600 * 1000*87660)  });
    $('#login_screen').show();
}

function dashboard(){
 	chrome.storage.local.get(["user"], function(result) {
 	 	if(result.user != undefined && result.user != ''){
 	 		$('.tab').hide();
			$('#dashbord_screen').show();
 	 	}else{
 	 		$('.tab').hide();
 	 		$('#login_screen').show();
 	 	}
 	});
}

function fogotLicense(){
	$.ajax({
        type: "POST",
        url: apiBaseUrl + "forgot-password",
        data: $("#forgot_license_form").serialize(),
        dataType: 'json'
    }).done(function(response) {       
        $("#forgot_license_form button[type='submit']").removeAttr('disabled').text('Login');
        if(response.status == 200){
        	messageToast('success',response.message)
        	$('.tab').hide();
        	$('#login_screen').show();
        }else{
        	messageToast('error',response.message);
            //$('.msg').text(response.message);
        }
    }); 

	
}

function messageToast(type,message){
  toastr.options = {
    "closeButton": true
  }
  if(type == 'success'){
    toastr.success(message)
  }else if(type == 'error'){
    toastr.error(message)
  }else if(type == 'info'){
    toastr.info(message)
  }else if(type == 'warning'){
    toastr.warning(message)
  }
}