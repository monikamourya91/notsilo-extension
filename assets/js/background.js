 
var id = randomId(8);
var opt = {
  type: "image",
  title: "",
  message: "",
  imageUrl: "assets/images/reminder.jpg",
  iconUrl: "128.png"
}

var baseUrl = custom_data.baseUrl;

////// friend request messages////////
var friendRequestSettings = false;
var friendRequestHistory = [];
var friendRequestTabIds = [];
var friendRequestMessageIntervalTime = 10;
var friendRequestsInterval = true;

///////friend request messages ////

var bulkMessageTabId = 0;
var bulkMessageStatus = true;
var uniqueHash = null;

var chatsiloPopupStates = {selected_tag :'' ,selected_template:'',last_screen:''};

//These make sure that our function is run every time the browser is opened.
chrome.storage.local.get(["chatsiloPopupStates"], function(result) {
	
	if(typeof result.chatsiloPopupStates == "undefined"&& result.chatsiloPopupStates != ""){
		chrome.storage.local.set({chatsiloPopupStates:chatsiloPopupStates});
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (typeof changeInfo.url != "undefined" && changeInfo.url.indexOf('facebook.com/messages/t/') > -1) {
		chrome.tabs.update(tabId, {url: 'https://www.messenger.com'});
	}
});

// Oninstall though window.open can be blocked by popup blockers
/*chrome.runtime.onInstalled.addListener(function() {
	window.open(custom_data.prodBaseUrl+'/installed.html', '_blank');
	initialize();
});*/

chrome.runtime.onStartup.addListener(function() {
	initialize();
});


function initialize(){
	chrome.cookies.get({url: baseUrl,name: "cts_unique_hash"}, function(result) {
		if(result != null){
		   uniqueHash = result.value;
		}
	});

	chrome.cookies.get({url: custom_data.baseUrl,name: "chatsilo_user"}, function(result) {
		if(result != null){
			get_subscriber_data(result.value);
		}
	});
}

chrome.storage.local.get(["chatsilo_user","tags","fb_id","taggedUsers"], function(result) {
	if (typeof result.chatsilo_user == "undefined"){
		chrome.storage.local.set({'chatsilo_user':''});
	}

	if (typeof result.tags == "undefined"){
		chrome.storage.local.set({'tags':''});
	}

	if (typeof result.fb_id == "undefined"){
		chrome.storage.local.set({'fb_id':''});
	}

	if (typeof result.taggedUsers == "undefined"){
		chrome.storage.local.set({'taggedUsers':''});
	}

	if (typeof result.ADF_groupSettings == "undefined"){
		chrome.storage.local.set({'ADF_groupSettings':''});
	}

	if (typeof result.ADF_state == "undefined"){
		chrome.storage.local.set({'ADF_state':''});
	}


	

});


// Uninstall
chrome.runtime.setUninstallURL('https://forms.gle/mpdx8YZH8vKHsjSz6');


chrome.webRequest.onBeforeRequest.addListener(
	requestHandler,
	{
		urls: ["*://*.facebook.com/*"],
		types: ["main_frame"]
	},
	["blocking"]
);

function getRedirectUrl(currentUrl){
	if (currentUrl.indexOf('facebook.com/messages/t/') >= 0) {
		return 'https://www.messenger.com';		 
	} else {
		return currentUrl.replace("?_rdc=1&_rdr","");
	}
}

function requestHandler(details){
	return {
		redirectUrl: getRedirectUrl(details.url)
	};		
}

// Listen for message to reload current page
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.reloadFbPage == 'yes') {
        custom_data = message;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    }else if(message.saveBlukMessageState == 'saveBlukMessageState'){
 		if (message.status == 'running') {
 			bulkMessageTabId = sender.tab.id;
    		bulkMessageStatus = message.status;
 		}else if(message.status == 'paused'){
 			bulkMessageTabId = sender.tab.id;
    		bulkMessageStatus = message.status;
 		}else if(message.status == 'stop' || message.status == 'completed'){
 			bulkMessageTabId = 0;
    		bulkMessageStatus = true;
    		if (message.status == 'completed') {
   				chrome.runtime.sendMessage({ action: 'bulkMessageComplete'});
    		}
 		}
    }else if(message.getBlukMessageState == 'getBlukMessageState'){
		if (bulkMessageTabId > 0) {
			chrome.tabs.get(bulkMessageTabId, function(tab) {
				if (tab == undefined) {
					bulkMessageTabId = 0;
					bulkMessageStatus = true;
    				chrome.runtime.sendMessage({ action: 'bulkmsgstate', bulkMessageTabId: bulkMessageTabId, bulkMessageStatus: bulkMessageStatus});
				}else{
    				chrome.runtime.sendMessage({ action: 'bulkmsgstate', bulkMessageTabId: bulkMessageTabId, bulkMessageStatus: bulkMessageStatus});
				}
			});
		}else{
	    	chrome.runtime.sendMessage({ action: 'bulkmsgstate',bulkMessageTabId: bulkMessageTabId, bulkMessageStatus: true});
		} 
    } else if(message.triggerChatMessage == 'triggerChatMessage'){
    	   setTimeout(()=>{ 
	   			chrome.tabs.sendMessage(sender.tab.id,{from: 'background', subject: 'triggerClickToSendChat'});
    	   }, 5000);
    }else if (message.randomHashForBackgroundCTS == 'randomHashForBackgroundCTS') {
            uniqueHash = message.uniqueHash;  
    }else if (message.saveTagFromContent == 'saveTagFromContent') {
            saveTagFromContent(message.data, sender.tab.id);  
    }else if (message.getUserNotes == 'getUserNotes') {
            getUserNotes(message.fb_user_id, sender.tab.id);  
    }else if (message.saveNoteFromContent == 'saveNoteFromContent') {
            saveNoteFromContent(message.data, sender.tab.id);  
    }else if (message.deleteNoteFromContent == 'deleteNoteFromContent') {
            deleteNoteFromContent(message.noteId, sender.tab.id);  
    }else if (message.friendRequestsFromContent == 'friendRequestsFromContent') {
		sendPostMessage(message.data);
		chrome.tabs.remove(sender.tab.id);
	}else if (message.closeRequestMessageTab == 'closeRequestMessageTab') {
		foundMessageSendTab = friendRequestTabIds.filter((list)=>{ return list.tabId == sender.tab.id});
		if (foundMessageSendTab.length > 0) {
			addFriendRequestHistory(foundMessageSendTab[0].currentRequestId);
			chrome.tabs.remove(sender.tab.id);
		}
	}else if (message.confimFriendRequestsFromContent == 'confimFriendRequestsFromContent') {
		saveSendFriendRequests(message.data);
		chrome.tabs.remove(sender.tab.id);
	}else if (message.requestRequestMessageSettingUpdated == 'requestRequestMessageSettingUpdated') {
		
		clearInterval(friendRequestsInterval);
		//friendRequestMessageIntervalTime = parseInt(message.request_message_interval);
		startPostMessageInterval();	
	
	}if(message.setFbIdForAll =='setFbIdForAll'){ //setFbIdForMessenger
			currentFBLogin(sender.tab.id);		
	}else if(message.action == 'content_script'){
        profile_pic=message.profilePic;
        updateAccountImage(profile_pic);

    }else if(message.action == 'taggedUserfromGroupleads'){
    	getAllTagsFromGropuleads(message.taggedUserfromGroupleads);
    }
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tabId === bulkMessageTabId && changeInfo.status ==='loading') {        
  }
});

// Listen for port messages
chrome.runtime.onConnect.addListener(function(port) {
    var sender = port.sender
    port.onMessage.addListener(function(message) {
    	
        // get-form-data --- To send form data to script
        if (message.type == 'get-form-data') {
            port.postMessage({'data': custom_data})
        } 
		if (message.type == 'verifyUserLogin') {
			//verifyUserLogin();
			chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
				if( typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user != "undefined" && result.chatsilo_user != ""  ){
					$.ajax({
						type: "POST",
						url: apiBaseUrl + "?action=get_updated_user_data_multitag_ver",
						data: {userId:result.chatsilo_user.id,fb_id:result.fb_id},
						dataType: 'json',
		                beforeSend: function (xhr) {
		                    xhr.setRequestHeader('unique-hash', uniqueHash);
		                }
					}).done(function(response) {
						if(response.status == 401){
				    		chrome.storage.local.set({'chatsilo_user':''});	
						}else if (response.status == 404) {
							//port.postMessage({'false': true});
						} else {
							isCurrentFBLinked = response.linkedFbAccounts.filter((item) => item.fb_account_id == result.fb_id);	
							isCurrentFBLinked = (isCurrentFBLinked.length > 0)?true:false;
							
							chrome.storage.local.set({'chatsilo_user': response.data, 'tags': response.tags, 'taggedUsers':response.taggedUsers, 'isCurrentFBLinked':isCurrentFBLinked});
							
							getAllTagsFromGropuleads(response.taggedUserfromGroupleads);

							port.postMessage({'login': true});
						}
					});	
				} 
			});	
        } 
		if (message.type == 'updateFBUsertag') {
			
			var	numericFBid = message.data.fbUserId;
			var numericUserFbId = message.data.numericFbId;
			isPage = message.data.isPage;

			if (numericUserFbId == '0' && isPage == 0) {
				GetBothAphaAndNumericId(numericFBid).then(function(fbIDsObject){
					message.data.numericFbId = fbIDsObject.numeric_fb_id;
					message.data.fbUserId = fbIDsObject.fb_user_id;
					$.ajax({
						type: "POST",
						url: apiBaseUrl + "?action=updateFBUsertag_fromMessanger_v2",
						data: message.data,
						dataType: 'json',
				        beforeSend: function (xhr) {
				            xhr.setRequestHeader('unique-hash', uniqueHash);
				        }
					}).done(function(response) {
						
						if(response.status == 401){
				    		chrome.storage.local.set({'chatsilo_user':''});	
						}else if (response.status == 200) {
							chrome.storage.local.set({'taggedUsers':response.taggedUsers});
						}
					});

				});
			} else  {

				$.ajax({
					type: "POST",
					url: apiBaseUrl + "?action=updateFBUsertag_fromMessanger_v2",
					data: message.data,
					dataType: 'json',
			        beforeSend: function (xhr) {
			            xhr.setRequestHeader('unique-hash', uniqueHash);
			        }
				}).done(function(response) {
					if(response.status == 401){
			    		chrome.storage.local.set({'chatsilo_user':''});	
					}else if (response.status == 200) {
						chrome.storage.local.set({'taggedUsers':response.taggedUsers});
					}
				});
			}
		}

		if (message.type == 'updateFBUsertagForMultiUser') {

			$.ajax({
				type: "POST",
				url: apiBaseUrl + "?action=updateFBUsertagForMultiUser_v2",
				data: message.data,
				dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('unique-hash', uniqueHash);
                }
			}).done(function(response) {
				if(response.status == 401){
		    		chrome.storage.local.set({'chatsilo_user':''});	
				}else if (response.status == 200) {
					chrome.storage.local.set({'taggedUsers':response.taggedUsers});
				}
			});
		}

		if (message.type == 'updateFBPageUsertag') {
			$.ajax({
				type: "POST",
				url: apiBaseUrl + "?action=updateFBUsertag_v2",
				data: message.data,
				dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('unique-hash', uniqueHash);
                }
			}).done(function(response) {
				if(response.status == 401){
    				chrome.storage.local.set({'chatsilo_user':''});	
				}else if (response.status == 200) {
					chrome.storage.local.set({'taggedUsers':response.taggedUsers});
				}
			});
		}
		if (message.type == 'deleteFBUsertag') {
			$.ajax({
				type: "POST",
				url: apiBaseUrl + "?action=deleteFBUsertag_v2",
				data: message.data,
				dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('unique-hash', uniqueHash);
                }
			}).done(function(response) {
				
			});
		}

		
		
	})
});

setInterval(function () {
	chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
		if (typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user.id != "undefined" && result.chatsilo_user.id != "") {
			$.ajax({
				type: "POST",
				url: apiBaseUrl + "?action=get_reminder_notification",
				data: {systemTime: moment(new Date($.now()), "MMMM Do YYYY, h:mm:ss a").format(), fb_account_id:result.fb_id, user_id: result.chatsilo_user.id},
				dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('unique-hash', uniqueHash);
                }
			}).done(function(response) {
				if(response.status == 401){
		    		chrome.storage.local.set({'chatsilo_user':''});	
				}else if (response.status == 200) {
					if(response.data != 'noreminders'){
						var userNotifications = response.data;
						userNotifications.forEach(function (item, i) {
							changeStatusReminder(item.id);	
							chrome.runtime.sendMessage({'action':'refresh_reminders'});				
						 	notifyClient(item);
						});
					}
				} 
			});
		}
	});  	
}, 90000);




function changeStatusReminder(reminderId){
	$.ajax({
			type: "POST",
			url: apiBaseUrl + "?action=change_reminder_status",
			data: {reminderId:reminderId},
			dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('unique-hash', uniqueHash);
                }
		}).done(function(response) {
			if(response.status == 401){
    			chrome.storage.local.set({'chatsilo_user':''});	
			}
		});
}

function notifyClient(message){
	opt.title = message.title;
	opt.message = message.description;
	chrome.notifications.create("Chatsilo12"+id, opt, function(result){
		id++
	});
}

function get_subscriber_data(userId){
	$.ajax({
        type: "POST",
       	url: apiBaseUrl + "?action=get_subscriber_data_v2",
        data: {id:userId},
        dataType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('unique-hash', uniqueHash);
        }
    }).done(function(response) {
    	if(response.status == 401){
    		chrome.storage.local.set({'chatsilo_user':''});	
		}else if (response.status == 200) {			
			chrome.storage.local.set({'chatsilo_user': response.data});	
		}
    });
}

function randomId(length) {
   var result           = '';
   var characters       = '0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}


function saveTagFromContent(newTagData, contentModelTabId) {
	$.ajax({
		type: "POST",
		url: apiBaseUrl + "?action=addUserTag",
		data: newTagData,
		dataType: 'json',
		beforeSend: function (xhr) {
      	  xhr.setRequestHeader('unique-hash', uniqueHash);
		}
	}).done(function(response) {
		if(response.status == 401){
			//triggerLogout();
			return false;
		}else if (response.status == 404) {
		} else if(response.status == 200){
			var tag = response.data;
			chrome.storage.local.get(["tags"], function(result) {
				var temp = [];
				if (typeof result.tags != "undefined" && result.tags != "") { 
					temp = result.tags;
					temp.push(tag);
				} else {
					temp.push(tag);
				}
				chrome.storage.local.set({"tags":temp});	
				chrome.tabs.sendMessage(contentModelTabId,{from: 'background', subject: 'tagadded', newTagData:response.data});
			});
		}
	});
}

function getUserNotes(userThreadId, contentModelTabId) {
	chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
		if( typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user != "undefined" && result.chatsilo_user != ""  ){
			$.ajax({
				type: "POST",
				url: apiBaseUrl + "?action=getAllUserNotes",
				data: {fb_user_id:userThreadId, user_id:result.chatsilo_user.id},
				dataType: 'json',
				beforeSend: function (xhr) {
		      	  xhr.setRequestHeader('unique-hash', uniqueHash);
				}
			}).done(function(response) {
				if(response.status == 401){
					
				}else if (response.status == 404) {
					message_animation('alert-danger');
					$('.msg').text(response.msg);
				} else {	
					chrome.tabs.sendMessage(contentModelTabId,{from: 'background', subject: 'displayNotes', notes:response.data});
				}
			});
		}
	})
}

//saveNoteFromContent

function saveNoteFromContent(noteData, contentModelTabId) {
 	var noteId = noteData.noteId;
 	var description = noteData.description;
 	var fb_user_id_to_add_note = noteData.fb_user_id_to_add_note;
 	
	if (noteId > 0) {
		$.ajax({
			type: "POST",
			url: apiBaseUrl + "?action=editUserNote",
			data: {noteId:noteId, description: description},
			dataType: 'json',
			beforeSend: function (xhr) {
	      	  xhr.setRequestHeader('unique-hash', uniqueHash);
			}
		}).done(function(response) {
			
			if(response.status == 200) {
				chrome.tabs.sendMessage(contentModelTabId,{from: 'background', subject: 'noteUpdated'});
			}
		});

	}else{
		chrome.storage.local.get(["chatsilo_user", "fb_id"], function(result) {
			if( typeof result.chatsilo_user != "undefined" && result.chatsilo_user != "" && typeof result.fb_id != "undefined" && result.fb_id != "" ){
				$.ajax({
					type: "POST",
					url: apiBaseUrl + "?action=addUserNote",
					data: {user_id:result.chatsilo_user.id, fb_user_id:fb_user_id_to_add_note,  description: description},
					dataType: 'json',
					beforeSend: function (xhr) {
			      	  xhr.setRequestHeader('unique-hash', uniqueHash);
					}
				}).done(function(response) {
					
					if(response.status == 200) {
						chrome.tabs.sendMessage(contentModelTabId,{from: 'background', subject: 'noteSaved', noteId:response.data.id});
					}
				});
			} 
		});	
	}
}

function deleteNoteFromContent(noteId, contentModelTabId) {
	$.ajax({
		type: "POST",
		url: apiBaseUrl + "?action=deleteNote",
		data: {noteId:noteId},
		dataType: 'json',
		beforeSend: function (xhr) {
      	  xhr.setRequestHeader('unique-hash', uniqueHash);
		}
	}).done(function(response) {
		if(response.status == 200){
			chrome.tabs.sendMessage(contentModelTabId,{from: 'background', subject: 'noteDelete'});
		}
	});
}

/////////////////////////// for pre messages /////////////////////////////
var isPreMessagingProcessing = true; 
setInterval(()=>{
	if (isPreMessagingProcessing) {
		startFriendRequestMessage();  /// confirm page
	}
},30000);



function startFriendRequestMessage() { ///use
	chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
		if (typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user.id != "undefined" && result.chatsilo_user.id != "") {
			$.ajax({
				type: "POST",
				url: apiBaseUrl + "?action=get_friend_request_history_and_settings",
				data: {fb_id:result.fb_id, userId: result.chatsilo_user.id},
				dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('unique-hash', uniqueHash);
                }
			}).done(function(response) {
				
				if (response.status == 200) {
					friendRequestSettings = response.data;
					//friendRequestMessageIntervalTime = parseInt(response.data.request_message_interval);
					friendRequestHistory = response.history;
					readFriendRequestsConfirmPage();
				} 
			});
		}
	}); 
}


var readFriendRequestsConfirmPageTabId = 0; 
function readFriendRequestsConfirmPage() { ////use
	chrome.windows.create({ 
		url: "https://m.facebook.com/friends/center/requests/all",
		focused:false, 
		type:"popup",
		top:Math.floor(window.screen.availHeight/4*3),
		left:Math.floor(window.screen.availWidth/4*3), 
		height:Math.floor(window.screen.availHeight/4), 
		width:Math.floor(window.screen.availWidth/4) 
	},function (tabs) {
		readFriendRequestsConfirmPageTabId = tabs.tabs[0].id;
		chrome.tabs.onUpdated.addListener(readFriendRequestsConfirmPageTabListener);
	});	
}

function readFriendRequestsConfirmPageTabListener(tabId, changeInfo, tab){
	if (changeInfo.status === "complete" && tabId === readFriendRequestsConfirmPageTabId) {
		chrome.tabs.sendMessage(readFriendRequestsConfirmPageTabId,{from: 'background', subject: 'readFriendRequestsConfirmPage',friendRequestHistory:friendRequestHistory});
		chrome.tabs.onUpdated.removeListener(readFriendRequestsConfirmPageTabListener);		

		// lastFocusedWindow

		 chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) { //0309          
            chrome.tabs.update(tabs[0].id, {active: true});
        });
	}
}

function saveSendFriendRequests(sendRequestArray) { /////// confirm page requests
	var tempIdsArray = [];
	if (sendRequestArray.length > 0) {
		sendRequestArray.forEach(function (item) {
			tempIdsArray.push(item.requestProfileId);
		});

		$.ajax({
			type: "POST",
			url: apiBaseUrl + "?action=add_send_friend_request_history",
			data: {fri_request_set_id: friendRequestSettings.id, data:tempIdsArray},
			dataType: 'json',
			beforeSend: function (xhr) {
	      	  xhr.setRequestHeader('unique-hash', uniqueHash);
			}
		}).done(function(response) {
			if (response.status == 200) {
				friendRequestHistory = response.history;
				if(response.data.outgoing_message_status == 1){
					friendRequestsFromContent(sendRequestArray); ////// case1
				}
			}
		});
	}
}

function friendRequestsFromContent(friendRequests) {   /////// for premessages 
	if(friendRequests.length > 0){
		var friendRequestsDelay = 0;
		friendRequests.forEach(function (item, index) {
			setTimeout(()=>{
				sendRequestWelcomeMessage(item.requestProfileId, item.fullName, 1); /// for pre
			},friendRequestsDelay);
			friendRequestsDelay = friendRequestsDelay + 5000;
		})
	}
}

var requestMessageTabId = 0;
function sendRequestWelcomeMessage(threadId, fullName, isPre) {	/// 1 for pre // 2for post message
	threadId = threadId.replace('/','');
	if (/[a-zA-Z]/.test(threadId)) {   /// having alphabets id
			$.ajax({
		    type: "GET",
		    url: 'https://m.facebook.com/'+threadId,
		    success: function(data, txtStatus, request) {
		  			var str = $(data).text()
		  			var mySubString = str.substring(
					    str.lastIndexOf('&quot;profile_id&quot;:') + 1, 
					    str.lastIndexOf('&quot;profile_id&quot;:') + 50
					);
		  			tmp = mySubString.split(',');
					var tmpUserId = tmp[0].split(':')[1];
					var sendWelcomeMeesageUrl = 'https://m.facebook.com/messages/compose/?ids='+tmpUserId;
					chrome.windows.create({ 
						url: sendWelcomeMeesageUrl,
						focused:false, 
						type:"popup",
						top:Math.floor(window.screen.availHeight/4*3),
						left:Math.floor(window.screen.availWidth/4*3), 
						height:Math.floor(window.screen.availHeight/4), 
						width:Math.floor(window.screen.availWidth/4) 
					},function (tabs) {
						requestMessageTabId = tabs.tabs[0].id;
						var temp = {};
						temp.currentRequestId = threadId;
						temp.fullName = fullName;
						temp.tabId = requestMessageTabId;
						temp.isPre = isPre;
						friendRequestTabIds.push(temp);
						chrome.tabs.onUpdated.addListener(requestTabListener);
					});	      		
		   		 }
			});		
	}else{
		var sendWelcomeMeesageUrl = 'https://m.facebook.com/messages/compose/?ids='+threadId;
		chrome.windows.create({ 
			url: sendWelcomeMeesageUrl,
			focused:false, 
			type:"popup",
			top:Math.floor(window.screen.availHeight/4*3),
			left:Math.floor(window.screen.availWidth/4*3), 
			height:Math.floor(window.screen.availHeight/4), 
			width:Math.floor(window.screen.availWidth/4) 
		},function (tabs) {
			requestMessageTabId = tabs.tabs[0].id;
				var temp = {};
				temp.currentRequestId = threadId;
				temp.fullName = fullName;
				temp.tabId = requestMessageTabId;
				temp.isPre = isPre;
				friendRequestTabIds.push(temp);
			chrome.tabs.onUpdated.addListener(requestTabListener);
		});	
	}
}

function requestTabListener(tabId, changeInfo, tab){
	if (changeInfo.status === "complete" && tabId === requestMessageTabId) {

		var foundTabRecord = friendRequestTabIds.filter((list)=>{ return list.tabId == requestMessageTabId}); 
		var welcomeMessageText = '';

		if (foundTabRecord.length > 0) {
				welcomeMessageText = getFriendRequestMessage(foundTabRecord[0].currentRequestId, foundTabRecord[0].fullName, foundTabRecord[0].isPre);
		}
		chrome.tabs.sendMessage(requestMessageTabId,{from: 'background', subject: 'triggerRequestMessage', welcomeMessageText:welcomeMessageText});
		chrome.tabs.onUpdated.removeListener(requestTabListener);		
	}
}

setTimeout(()=>{
	startPostMessageInterval()
},60000*3);

function startPostMessageInterval() {
	friendRequestsInterval = setInterval(()=>{
		startPostMessage();
	},60000*friendRequestMessageIntervalTime);
}


function startPostMessage() {
	chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
		if (typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user.id != "undefined" && result.chatsilo_user.id != "") {
			$.ajax({
				type: "POST",
				url: apiBaseUrl + "?action=get_friend_request_history_and_settings",
				data: {fb_id:result.fb_id, userId: result.chatsilo_user.id},
				dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('unique-hash', uniqueHash);
                }
			}).done(function(response) {
			
				if (response.status == 200) {
					friendRequestSettings = response.data;
					//friendRequestMessageIntervalTime = response.data.request_message_interval;
					clearInterval(friendRequestsInterval);
					setTimeout(()=>{
						startPostMessageInterval();
					},friendRequestMessageIntervalTime )
				
					friendRequestHistory = response.history;
				
					isPreMessagingProcessing = false;
					if(friendRequestSettings.comming_message_status== 1)  
					{
						checkForNewFriendRequestsOnActivityPage();
					}
				} 
			});
		}
	}); 
}

var activityTabId = 0;

function checkForNewFriendRequestsOnActivityPage(){
	isPreMessagingProcessing = false;
	var activityUrl  = "https://www.facebook.com/"+friendRequestSettings.fb_account_id+"/allactivity";

	chrome.windows.create({ 
			url: activityUrl,
			focused:false, 
			type:"popup",
			top:Math.floor(window.screen.availHeight/4*3),
			left:Math.floor(window.screen.availWidth/4*3), 
			height:Math.floor(window.screen.availHeight/4), 
			width:Math.floor(window.screen.availWidth/4) 
		},function (tabs) {
			activityTabId = tabs.tabs[0].id;
		    chrome.tabs.onUpdated.addListener(activityTabListener);
		});	
}

function activityTabListener(tabId, changeInfo, tab){
	if (changeInfo.status === "complete" && tabId === activityTabId) {
		chrome.tabs.sendMessage(activityTabId,{from: 'background', subject: 'checkFriendRequestForPostMessage',friendRequestHistory:friendRequestHistory});
		chrome.tabs.onUpdated.removeListener(activityTabListener);		
	}
}

function addFriendRequestHistory(currentRequestId) {
	
	$.ajax({
		type: "POST",
		url: apiBaseUrl + "?action=add_friend_request_history",
		data: {currentRequestId:currentRequestId, fri_request_set_id: friendRequestSettings.id},
		dataType: 'json',
		beforeSend: function (xhr) {
      	  xhr.setRequestHeader('unique-hash', uniqueHash);
		}
	}).done(function(response) {
		
	});
}

function sendPostMessage(friendRequests) {
	if(friendRequests.length > 0){
		var friendRequestsDelay = 0;
		friendRequests.forEach(function (item, index) {
			setTimeout(()=>{
				sendRequestWelcomeMessage(item.requestProfileId, item.fullName, 2);
				setTimeout(()=>{
					if (index == friendRequests.length-1) {
						isPreMessagingProcessing = true;
					}
				},200)
			},friendRequestsDelay);
			friendRequestsDelay = friendRequestsDelay + 5000;
		})
	}
}


function getFriendRequestMessage(currentRequestId, fullName ,isPre) {
	var friendRequestSettingsTemp = friendRequestSettings; 
	var welcomeMessageText ='';
	var randomMessageTextArray = [];

	//var found = friendRequestHistory.filter((his)=>{return his.request_fb_id == currentRequestId &&  his.is_outgoing == 1  })
	if(isPre == 2){
		if (friendRequestSettingsTemp.message_four !=null && friendRequestSettingsTemp.message_four.length > 0) {
			randomMessageTextArray.push(friendRequestSettingsTemp.message_four);
		}
		if (friendRequestSettingsTemp.message_five !=null && friendRequestSettingsTemp.message_five.length > 0) {
				randomMessageTextArray.push(friendRequestSettingsTemp.message_five);
		}
		if (friendRequestSettingsTemp.message_six !=null && friendRequestSettingsTemp.message_six.length > 0) {
				randomMessageTextArray.push(friendRequestSettingsTemp.message_six);
		}

		if (friendRequestSettingsTemp.comming_random_status == 1) {
			welcomeMessageText =  randomMessageTextArray[Math.floor(Math.random()*randomMessageTextArray.length)];
		} else {
			if (friendRequestSettingsTemp.message_four !=null && friendRequestSettingsTemp.message_four.length > 0) {
				welcomeMessageText = friendRequestSettingsTemp.message_four;
			}
		}
	}else{ ///////////// request outgoing case /////////
		if (friendRequestSettingsTemp.message_one !=null && friendRequestSettingsTemp.message_one.length > 0) {
			randomMessageTextArray.push(friendRequestSettingsTemp.message_one);
		}
		if (friendRequestSettingsTemp.message_two !=null && friendRequestSettingsTemp.message_two.length > 0) {
				randomMessageTextArray.push(friendRequestSettingsTemp.message_two);
		}
		if (friendRequestSettingsTemp.message_three !=null && friendRequestSettingsTemp.message_three.length > 0) {
				randomMessageTextArray.push(friendRequestSettingsTemp.message_three);
		}

		if (friendRequestSettingsTemp.outgoing_random_status == 1) {
			welcomeMessageText =  randomMessageTextArray[Math.floor(Math.random()*randomMessageTextArray.length)];
		} else {
			if (friendRequestSettingsTemp.message_one !=null && friendRequestSettingsTemp.message_one.length > 0) {
				welcomeMessageText = friendRequestSettingsTemp.message_one;
			}
		}
	}

	if (welcomeMessageText.indexOf('[full_name]') > -1) {
		welcomeMessageText = welcomeMessageText.replace(/\[full_name]/g,fullName);
	}

	if (welcomeMessageText.indexOf('[first_name]') > -1) {
		first_name = fullName.split(' ')[0];
		welcomeMessageText = welcomeMessageText.replace(/\[first_name]/g,first_name);
	}

	if (welcomeMessageText.indexOf('[last_name]') > -1) {
		nameArray = fullName.split(' ');
		if(nameArray.length > 1){
			last_name = nameArray[nameArray.length-1];
			welcomeMessageText = welcomeMessageText.replace(/\[last_name]/g,last_name);
		}else{
			welcomeMessageText = welcomeMessageText.replace(/\[last_name]/g,'');
		}
	}
	return welcomeMessageText;
}

function currentFBLogin(activeTabId) {
	$.ajax({
		type: "GET",
		url: 'https://m.facebook.com/me/about',
		success: function(data, txtStatus, request) {
			
		    if ($(data).find("#contact-info").length > 0) {
		        var profileLink = "https://facebook.com/"+$.trim($(data).find("#contact-info span:contains(acebook)").parent().prev().text());		       	
		        profileLink =  new URL(profileLink);
		        profileLink = profileLink.pathname.replace(/\//g,'');
		    	profileLink = profileLink.split('/');
				currentLoggedInFBId = profileLink[profileLink.length - 1 ]; 
				var userNumericFBid = $(data).find("header div[role='heading']:contains('Friends')").parent().next().next().find('a:eq(0)').attr('href');
				var userNumericFBidSplit = userNumericFBid.split('lst=');
				var userNumericFBidArray = userNumericFBidSplit[userNumericFBidSplit.length - 1];
				userNumericFBid = userNumericFBidArray.split('%');
				userNumericFBid = userNumericFBid[0];

				chrome.storage.local.get(["fb_id"], function(result) {
					if(result.fb_id!=currentLoggedInFBId){
					
						reloadAllTabsOfMessanger();
					}
					
				});

				chrome.storage.local.set({fb_id:currentLoggedInFBId,numeric_fb_id:userNumericFBid});
					chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
						
						if( typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user != "undefined" && result.chatsilo_user != ""  ){
							$.ajax({
								type: "POST",
								url: apiBaseUrl + "?action=get_updated_user_data_multitag_ver",
								data: {userId:result.chatsilo_user.id,fb_id:result.fb_id},
								dataType: 'json',
				                beforeSend: function (xhr) {
				                    xhr.setRequestHeader('unique-hash', uniqueHash);
				                }
							}).done(function(response) {
								
								if (response.status == 404) {
									//port.postMessage({'false': true});
								} else {
									isCurrentFBLinked = response.linkedFbAccounts.filter((item) => item.fb_account_id == result.fb_id);	
									isCurrentFBLinked = (isCurrentFBLinked.length > 0)?true:false;
									
									chrome.storage.local.set({'chatsilo_user': response.data, 'tags': response.tags, 'taggedUsers':response.taggedUsers, 'isCurrentFBLinked':isCurrentFBLinked});
									//port.postMessage({'login': true});
									getAllTagsFromGropuleads(response.taggedUserfromGroupleads);
									chrome.tabs.sendMessage(activeTabId,{from: 'background', subject: 'facebookLoggedInUser',currentLoggedInFBId:currentLoggedInFBId });
								}
							});	
						} 
					});
		   		}else{
					chrome.storage.local.set({fb_id:''});
		   		}
			}
		});	
}


function updateAccountImage(profile_pic){
	chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
		if( typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user != "undefined" && result.chatsilo_user != ""  ){
					$.ajax({
						type: "POST",
						url: apiBaseUrl + "?action=update_account_image_url",
						data: {userId:result.chatsilo_user.id,fb_id:result.fb_id,account_image_url:profile_pic},
						dataType: 'json',
		                beforeSend: function (xhr) {
		                    xhr.setRequestHeader('unique-hash', uniqueHash);
		                }
					}).done(function(response) {
						
						if(response.status == 200){
				    		chrome.runtime.sendMessage({action: "accountProfileImage",account_image_url: response.account_image_url});
						}
					});	
		}

	});
}

function reloadAllTabsOfMessanger() {
 	chrome.windows.getAll(function(windows) {
		windows.forEach(function (eachWindow) {
			if (eachWindow.type == "normal") {
				chrome.tabs.getAllInWindow(eachWindow.id, function(tabs) {
						for (var i = 0, tab; tab = tabs[i]; i++) {
						if (tab.url && (tab.url.indexOf('messenger.com') != -1) ) {
							chrome.tabs.reload(tab.id);
						}
					}
				});
			}
		});
	});
}

async function GetBothAphaAndNumericId(numericFBid) {

	if (/[a-zA-Z]/.test(numericFBid)) {   /////// send alpha get numeric////
			return new Promise(function(resolve, reject) {
			$.ajax({
			type: "GET",
			url: 'https://m.facebook.com/'+numericFBid,
			success: function(data, txtStatus, request) {
						var str = $(data).text()
						var mySubString = str.substring(
					    str.lastIndexOf('&quot;profile_id&quot;:') + 1, 
					    str.lastIndexOf('&quot;profile_id&quot;:') + 50
					);
					
					tmp = mySubString.split(',');
					var tmpUserId = tmp[0].split(':')[1];

					var tempFBIDs = {};
					tempFBIDs.fb_user_id = numericFBid;
					tempFBIDs.numeric_fb_id = tmpUserId;
					resolve(tempFBIDs);
					
				}
			});
		});
	}else{
		var url='';
	return new Promise(function(resolve, reject) {
		var xmlHttp = new XMLHttpRequest();
	    xmlHttp.onreadystatechange = function() { 
	        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
				var alphaNumericId = '';
				var alphaNumeric=xmlHttp.responseURL;
				if (alphaNumeric.indexOf('profile.php') > -1) {
					 alphaNumericArray= alphaNumeric.split('profile.php?id=');
					 alphaNumericId= alphaNumericArray[alphaNumericArray.length-1];
					 if(alphaNumericId.indexOf('&')){
					 	 alphaNumericId=alphaNumericId.split('&')[0];
					 }
				} else {

					alphaNumericArray= alphaNumeric.split('/');
					alphaNumericId= alphaNumericArray[alphaNumericArray.length-1];
					if(alphaNumericId.indexOf('?')){
						 alphaNumericId=alphaNumericId.split('?')[0];
					}
				}
				if (alphaNumericId.length > 0) {
					var tempFBIDs = {};
					tempFBIDs.fb_user_id = alphaNumericId;
					tempFBIDs.numeric_fb_id = numericFBid;
					resolve(tempFBIDs);
				} else {
					reject(false);
				}
	        }
	    }
	    xmlHttp.open("GET","https://m.facebook.com/"+numericFBid, true); // true for asynchronous 
	    xmlHttp.send(null);
	});

	}	
}


var isUpdateNumricIdsRunning = true; 

var updateCallIntervaIdsArray = []; 

function getAllTagsFromGropuleads(groupleadsTaggedProfiles=[]){//response.taggedUsers
	if(isUpdateNumricIdsRunning && groupleadsTaggedProfiles.length > 0){
		var processDelay = 0;
		groupleadsTaggedProfiles.forEach(function(item, index){
		
			isUpdateNumricIdsRunning = false; 
			var updateCallIntervaIds =	setTimeout(()=>{
					getUpdateTagsFromGropuleads(item);
					if (index == response.taggedUsers.length-1) {
						isUpdateNumricIdsRunning = true; 
					}
				},processDelay);
			processDelay = processDelay + 10000; 

			updateCallIntervaIdsArray.push(updateCallIntervaIds);
		})
	}
}

function clearUpdateFbIdsIntervals() {
	updateCallIntervaIdsArray.forEach(function (item) {
		clearInterval(item);
	});
	updateCallIntervaIdsArray = [];
	isUpdateNumricIdsRunning = true; 
}


function getUpdateTagsFromGropuleads(item){

	chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
		if( typeof result.fb_id != "undefined" && result.fb_id != "" && typeof result.chatsilo_user != "undefined" && result.chatsilo_user != ""  ){
			
			var fbUserId = item.fb_user_id; 
			var taggedUsersId = item.id; 

			GetBothAphaAndNumericId(fbUserId).then(function(fbIDsObject){
				numericFbId = fbIDsObject.numeric_fb_id;
				fbUserId = fbIDsObject.fb_user_id;
				$.ajax({
					type: "POST",
					url: apiBaseUrl + "?action=getUpdateTagsOfGropuleads",
					data: {userId:result.chatsilo_user.id,fb_id:result.fb_id,fbUserId:fbUserId,numericFbId:numericFbId,taggedUsersId:taggedUsersId},
					dataType: 'json',
			        beforeSend: function (xhr) {
			            xhr.setRequestHeader('unique-hash', uniqueHash);
			        }
				}).done(function(response) {
					
					if(response.status == 401){
			    		chrome.storage.local.set({'chatsilo_user':''});	
					}else if (response.status == 200) {
						chrome.storage.local.set({'taggedUsers':response.taggedUsers});
					}
				});

			});
		}else{
			clearUpdateFbIdsIntervals();
		}
	});

}

