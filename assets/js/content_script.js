

var port = chrome.runtime.connect({'name': 'formfiller'})
port.postMessage({'type': 'get-form-data'});


chrome.runtime.sendMessage({setFbIdForAll: "setFbIdForAll"});

var processing = false;
var currentLoggedInFBId = '';

var friendRequestHistory = [];

///////////bulk code/////////
var bulkProcessing = true;

var bulkTaggedUserArray = [];
var bulkMessageTimeout = [];
var selectedBulkTagIds
var bulkUserDelay = 0;
var	bulkSendMessageLimit = null;

var bulkMessageTextArray = null;
var sendRandomMessage = null;
var useRandomDelay = null;

var addUserBulkSendLimit = true;

var fbNameForNotes = '';

var isFBNewLayout = false;
var isIframeLoaded = false;

var bulkMessagePopUp = `
					<div class="text"><h3>Message sent</h3>
					</div>
					<div class="text">
					    <h2><span id="processed-members">0</span> <i>of</i> <span class="total-friends" id="limit">0</span></h2>
					</div>
					<div class="block" id="chatsilo-msgs">
						Processing
					</div>`;

$("body").append('<div id="overlay"><div id="chatsilo_model"><div id="chatsilo_model_content">'+bulkMessagePopUp+'</div></div></div>');
$("body").append('<div id="overlay-two"><div id="chatsilo_model_two"><div id="chatsilo_model_content_two" class="custom-row"></div></div></div>');
$("body").append('<div id="overlay-three"><div id="chatsilo_model_three" class ="fb_user_id_to_add_note"><div id="chatsilo_model_content_three" class="custom-row"></div></div></div>');

//var searchHtml = '<div class="row custom-row"> <input placeholder="Search tag" type="text" id="search-tag-by-name" > </div> ';
var searchHtml = `<div class="row custom-row"> 

					<div class= "row-levels">
						<div class="chatsilo-cols chatsilo-col-md-9"> 
							<input placeholder="Search tag" type="text" id="search-tag-by-name" > 
						</div> 

						<div class="chatsilo-cols chatsilo-col-md-3" > 
							<button class="add-tag-from-content bg-purple chatsilo-btn">Add Tag</button>
						</div>
					</div>

					<div class= "row-levels save-tag-div">
						<div class="left-col-item chatsilo-cols chatsilo-col-md-12"> 
							<input placeholder="Enter Tag Name" type="text" id="tag-name-from-content" > 
						</div> 

						<div class="right-col-item chatsilo-cols chatsilo-col-md-12 text-center pt-2" > 
							<button class="save-tag-from-content bg-purple chatsilo-btn">Save Tag</button>
							<button class="search-form-content bg-gray chatsilo-btn">Back to Search</button>
						</div>
					</div>
					<div class="row-levels chatsilo-cols chatsilo-col-md-12 text-center error-mgs error p-2 pl-0 pr-0">
					</div>
				</div>`;

var tagColors = ['warning','primary','danger','success','dark','info'];

////////// bulk code /////////

var conversionListText = "Conversation list";

var fb_ul_selector = "ul[aria-label='"+conversionListText+"']";
var fb_ul_li_selector = "ul[aria-label='"+conversionListText+"'] li";
var fb_list_selectors = "ul[aria-label='"+conversionListText+"'] li:not([fb_user_id]";

// Add native 'click' and 'change' events to be triggered using jQuery
	jQuery.fn.extend({
		'mclick': function () {
			var click_event = document.createEvent('MouseEvents')
			click_event.initMouseEvent("click", true, true, window,
            0, 0, 0, 0, 0,
            false, false, false, false,
            0, null);
			return $(this).each(function () {
				$(this)[0].dispatchEvent(click_event)
			})
		},	
		'vchange': function () {
			var change_event = document.createEvent('HTMLEvents')
			change_event.initEvent('change', false, true)
			return $(this).each(function () {
				$(this)[0].dispatchEvent(change_event)
			})
		},
		'vclick': function () {
			var click_event = document.createEvent('HTMLEvents')
			click_event.initEvent('click', false, true)
			return $(this).each(function () {
				$(this)[0].dispatchEvent(click_event)
			})
		},
		'vblur': function () {
			var click_event = document.createEvent('HTMLEvents')
			click_event.initEvent('blur', false, true)
			return $(this).each(function () {
				$(this)[0].dispatchEvent(click_event)
			})
		},
		'vkeyup': function () {
			var keyup_event = document.createEvent('HTMLEvents')
			keyup_event.initEvent('keyup', false, true)
			return $(this).each(function () {
				$(this)[0].dispatchEvent(keyup_event)
			})
		},
		'vkeyupWithChar': function (key) {
			var specific_keyup_event = document.createEvent('HTMLEvents')
			specific_keyup_event.initEvent('keyup', false, true)
			specific_keyup_event.which = key;
			specific_keyup_event.keyCode = key;
			return $(this).each(function () {
				$(this)[0].dispatchEvent(specific_keyup_event)
			})
		}
	})

	
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {	
	
	if(message.from === 'popup' && message.subject === 'sendTemplateMessage') {	
	var pathname = window.location.pathname.toString();
		if (pathname.indexOf('/inbox') > -1) {
			var sendPageMessage = message.templateMessage;
			selector = '._1p7p._5id1._4dv_._58al.uiTextareaAutogrow';
			if($(selector).length > 0){
				var evt = new Event('input', {
							bubbles: true  
						});
				var input = document.querySelector(selector);
				input.innerHTML = message.templateMessage;
				input.dispatchEvent(evt);
			}
			$('._4jy0._4jy3._4jy1._51sy.selected').mclick();
		} else {
			selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
			if($(selector).length > 0){
				var evt = new Event('input', {
							bubbles: true  
						});
				var input = document.querySelector(selector);
				input.innerHTML = message.templateMessage;
				input.dispatchEvent(evt);
				$(selector).after('<span data-text="true">'+message.templateMessage+'</span>');
				var loc = window.location.href;
				loc = loc.split("/t/");
				$(fb_ul_selector+" li[fb_user_id]:first-child").find('a').mclick();
				chrome.runtime.sendMessage({triggerChatMessage: "triggerChatMessage"});
				location.replace(loc[0]+'/t/'+loc[1]);				
			}
		}		
	} else if(message.from === 'popup' && message.subject === 'openChatThread') {
		if($(fb_ul_selector+" li[fb_user_id='"+message.fb_id+"']").length > 0){
			$(fb_ul_selector+" li[fb_user_id='"+message.fb_id+"']").find('a').mclick();
		} else {
			var loc = window.location.href;
			loc = loc.split("/t/");
			window.location.replace(loc[0]+'/t/'+message.fb_id);
		}
		
	} else if(message.from === 'popup' && message.subject === 'refresh'){
			createTagDropDownContainer();
		// chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
	 //      if(tabs[0].url.indexOf('/inbox/') > -1){
	 //      	createTagDropDownContainer();
	 //      }else{
	 //      	createTagDropDownContainer();
	 //      }
	 //  	});  

	}else if(message.from === 'background' && message.subject === 'triggerClickToSendChat'){
		findBTN = setInterval(function () {
			if ($('a[aria-label="Send"]').length > 0 ) {
				clearInterval(findBTN);
				$('a[aria-label="Send"]').mclick();
			}
		},200)
	} else if(message.from === 'popup') {
		verifyUserLogin();
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
 	if(request.from === 'popup' && request.subject === 'openChatThreadBulkMessage') {
		
		$('#overlay').show();
		if (window.location.href.indexOf('filter=') > -1) {
			$('a[aria-label="Settings, help and more"]').mclick();
			setTimeout(()=>{
				$('div.uiContextualLayer li span:contains(All Chats)').mclick();
			},300);

			setTimeout(()=>{
				bulkProcessing = true;
				bulkDelay = 0;
				totalSend = 0;
				totalSendLimit = 0;
				addUserBulkSendLimit = true;
				$('#chatsilo-msgs').text('Running');
				chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'running'});
				sendBulkMessage(request);
			},500)

		}else{
			bulkProcessing = true;
			bulkDelay = 0;
			totalSend = 0;
			totalSendLimit = 0;
			addUserBulkSendLimit = true;
			$('#chatsilo-msgs').text('Running');
			chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'running'});
			sendBulkMessage(request);
		}
		
	}else if(request.from === 'popup' && request.subject === 'pause'){
		$('#overlay').show();
		bulkProcessing = false;
		addUserBulkSendLimit = false;
		$('#chatsilo-msgs').text('Paused');
		chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'paused'});
	}else if(request.from === 'popup' && request.subject === 'resume'){
		$('#overlay').show();
		bulkProcessing = true;
		$('#chatsilo-msgs').text('Running');
		chrome.storage.local.get(["bulkTaggedUserArray","bulkMessageSettings"], function(result) {
			bulkUserDelay = result.bulkMessageSettings.bulkDelay;
			bulkMessageTextArray = result.bulkMessageSettings.messageTextArray;
			sendRandomMessage = result.bulkMessageSettings.sendRandomMessage;
			useRandomDelay = result.bulkMessageSettings.useRandomDelay; //true|false
			selectedBulkTagIds = result.bulkMessageSettings.selectedBulkTagIds;
			
			if (result.bulkMessageSettings.useSendLimit && addUserBulkSendLimit) {
				bulkSendMessageLimit = parseInt(result.bulkMessageSettings.sendLimit) + findLastProcessedIndex;
			}else{
				bulkSendMessageLimit = parseInt(result.bulkMessageSettings.sendLimit);
			}
		});
		readLastStateOfTaggedUserArray();
		chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'running'});
	} else if(request.from === 'popup' && request.subject === 'stop'){
		$('#overlay').show();
		bulkProcessing = false;
		$('#chatsilo-msgs').text('Stopped');
		chrome.storage.local.set({'bulkTaggedUserArray':[]});
		chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'stop'});
		hide_loader();
	} else if(request.from === 'background' && request.subject === 'tagadded'){
		var newTagLi = '<li class="bg-info tag-text-color bg-'+request.newTagData.class+'" color-code="0" li-class="info" tag-id="'+request.newTagData.value+'"><input class="multi-tag-checkbox" type="checkbox"> '+request.newTagData.text+'</li>';
		$('ul.model-tag-list').prepend(newTagLi);
		$('#tag-name-from-content').val('');
		$('.save-tag-from-content').prop('disabled', false).text('Save Tag');
		verifyUserLogin();
	}else if(request.from === 'background' && request.subject === 'displayNotes'){
		displayNotes(request.notes);
	}else if(request.from === 'background' && request.subject === 'noteUpdated'){
		$('.msg-for-notes').addClass('success').text('Your note has been updated successfully.').show();
		hideNoteMessagesAlerts();
	}else if(request.from === 'background' && request.subject === 'noteSaved'){
		$('.msg-for-notes').addClass('success').text('Your note has been added successfully.').show();
		$('.add-new-note').attr('note-id',request.noteId).removeClass('add-new-note');
		hideNoteMessagesAlerts();
	}else if(request.from === 'background' && request.subject === 'noteDelete'){
		$('.msg-for-notes').addClass('success').text('Your note has been deleted successfully.').show();
		hideNoteMessagesAlerts();
	}else if(request.from === 'background' && request.subject === 'checkFriendRequestForPostMessage'){
		 friendRequestHistory = request.friendRequestHistory;
		setTimeout(()=>{
			if ($('#bluebarRoot').length > 0) {
				checkFriendRequestForPostMessage();
			} else if($('#bluebarRoot').length == 0){
				checkFriendRequestForPostMessageNew();
			}
		},1000)
	}else if(request.from === 'background' && request.subject === 'triggerRequestMessage'){
		triggerRequestSendMessage(request.welcomeMessageText);
	}else if(request.from === 'background' && request.subject === 'readFriendRequestsConfirmPage'){
		
		friendRequestHistory = request.friendRequestHistory;
		if ($('#friends_center_main header').text().replace(/[^0-9]/g, "") != '') {
		 totalComingRequests = $('#friends_center_main header').text().replace(/[^0-9]/g, "");
		}
		loadComingRequests();

	}else if(request.from === 'background' && request.subject === 'facebookLoggedInUser'){
		currentLoggedInFBId = request.currentLoggedInFBId;
		///////////////////////
		chrome.storage.local.get(["numeric_fb_id"], function(result) {
			if(result.numeric_fb_id!=getCookieValue("c_user")){
				

				$('a[aria-label="Settings, help and more"]').mclick();
				setTimeout(()=>{
					$('div.uiContextualLayer li span:contains(Log Out)').mclick();
				},300);				
			}
		});


		//////////////////////////
		var findULText = setInterval(function(){
			if($("div[aria-label='Conversations']").length > 0){
				clearInterval(findULText);			
				conversionListText = $("div[aria-label='Conversations']").find('ul').attr('aria-label');
				fb_ul_selector = "ul[aria-label='"+conversionListText+"']";
				fb_ul_li_selector = "ul[aria-label='"+conversionListText+"'] li";
				fb_list_selectors = "ul[aria-label='"+conversionListText+"'] li:not([fb_user_id]";
				if (isFBNewLayout && !isIframeLoaded) {
					integrateChatsiloFeature();
				}else{
					integrateChatsiloFeature();
				}
			}
		}, 1000);
	}else if(request.from === 'popup' && request.subject === 'profile_Pic'){
		
		profilePic=$('._94wq').find('._87v3').attr('src');
		chrome.runtime.sendMessage({action: "content_script", profilePic: profilePic});
	}
});


function hideNoteMessagesAlerts() {
	setTimeout(()=>{
		$('.msg-for-notes').hide();
	}, 3000)
}


function sendBulkMessage(message) {
	bulkTaggedUserArray = [];
	bulkUserDelay = message.bulkDelay;
	bulkMessageTextArray = message.bulkMessageTextArray;
	sendRandomMessage = message.sendRandomMessage;
	useRandomDelay = message.useRandomDelay; //true|false
	selectedBulkTagIds = message.selectedBulkTagIds;
	bulkSendMessageLimit = parseInt(message.sendLimit);
	chrome.storage.local.get(["taggedUsers"], function(result) {
		result.taggedUsers.forEach(function (item,index) {
			if (!message.sendAll) {
				foundTaggedUser = selectedBulkTagIds.filter((list) => ( (item.tag_id.indexOf('#'+list.tagid+'#') > -1) && item.fb_user_id != null) )
			} 
			
			if( (message.sendAll || foundTaggedUser.length > 0 ) && item.fb_user_id != null ){
				item.sendBulk = false;	
				bulkTaggedUserArray.push(item);
			}			
		});

		chrome.storage.local.set({'bulkTaggedUserArray':bulkTaggedUserArray});
		$('.total-friends').text(bulkTaggedUserArray.length);
		readLastStateOfTaggedUserArray();
	})
}

function readLastStateOfTaggedUserArray() {
	bulkTaggedUserArray = [];
	chrome.storage.local.get(["bulkTaggedUserArray"], function(result) {
		bulkTaggedUserArray = result.bulkTaggedUserArray;
		$('.total-friends').text(bulkTaggedUserArray.length);
		findLastProcessedIndex = result.bulkTaggedUserArray.findIndex((item) => (item.sendBulk == false));
		if (findLastProcessedIndex != -1) {		
		    $('#processed-members').text(findLastProcessedIndex);	
			findUserInMessageList(result.bulkTaggedUserArray[findLastProcessedIndex],findLastProcessedIndex);
		}else{
			$('#chatsilo-msgs').text('Completed');
			chrome.storage.local.set({'bulkTaggedUserArray':[]});
			chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'completed'});
			hide_loader();
			$('#limit').text(bulkTaggedUserArray.length);
		}
	});
}

var bulkRandomDelayArray = [10000,15000,20000,25000,30000,35000,40000,45000];
var sendRandomMessageDealy = 0;
var loadedMessageListLi = $(fb_ul_selector+" li[fb_user_id]").length;
var historyIteration = 0;
function findUserInMessageList(receiver,currentIndex) {
	if (bulkProcessing){
		if((currentIndex+1) <= bulkSendMessageLimit ) {
			var loadedThreadsHistory = loadedMessageListLi;
			if($(fb_ul_selector+" li[fb_user_id='"+receiver.fb_user_id+"']").length > 0){
				$(fb_ul_selector+" li[fb_user_id='"+receiver.fb_user_id+"']").find('a').mclick();
				if(parseBulkTaggedUserArray(receiver,currentIndex) > -1){
					$('#processed-members').text(currentIndex+1);
					chrome.runtime.sendMessage({action: "bulkMessageCounter", counter: currentIndex+1, totalContacts:bulkTaggedUserArray.length});
					if(useRandomDelay){
						sendRandomMessageDealy =  bulkRandomDelayArray[Math.floor(Math.random()*bulkRandomDelayArray.length)];
						bulkUserDelay = 0;
					} else {
						sendRandomMessageDealy = 0;
					}					
					
					/******* Iterate Next Thread *******/
					if((currentIndex+1) < bulkSendMessageLimit ) {						
						setTimeout(()=>{	
							readLastStateOfTaggedUserArray();	
						},parseInt(bulkUserDelay) + sendRandomMessageDealy);
					} else {
						bulkProcessing = false;
						if ((currentIndex+1) == bulkTaggedUserArray.length) {
							$('#chatsilo-msgs').text('Completed');
							hide_loader();
						 	chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'completed'});
						}else{
							$('#chatsilo-msgs').text('Limit exceeded');
							chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'paused'});
						}
					}
				}
			} else {
				$('._2xhi .uiScrollableAreaWrap.scrollable').addClass('chatsilo-scroll').animate({ scrollTop: $('._2xhi .uiScrollableAreaWrap.scrollable').prop("scrollHeight")}, 1000);
				setTimeout(()=>{
					loadedMessageListLi = $(fb_ul_selector+" li[fb_user_id]").length;//40
					if (loadedThreadsHistory == loadedMessageListLi) {
						if(historyIteration < 2){
							historyIteration++;
							findUserInMessageList(receiver,currentIndex);
						} else {
							historyIteration = 0;
							bulkTaggedUserArray[currentIndex].sendBulk = true;
							chrome.storage.local.set({'bulkTaggedUserArray':bulkTaggedUserArray});
							readLastStateOfTaggedUserArray();
						}
					}else{				
						findUserInMessageList(receiver,currentIndex);
					}	
				},3000)
			}
		}else{
			bulkProcessing = false;
			$('#chatsilo-msgs').text('Limit exceeded');
			chrome.runtime.sendMessage({saveBlukMessageState: "saveBlukMessageState", status: 'paused'});
		}
	}
}

function parseBulkTaggedUserArray(receiver,currentIndex) {
	$(fb_ul_selector+" li[fb_user_id='"+receiver.fb_user_id+"']").find('a').mclick();
	bulkTaggedUserArray[currentIndex].sendBulk = true;
	chrome.storage.local.set({'bulkTaggedUserArray':bulkTaggedUserArray});
	var bulkMessageText = '';
	
	if(sendRandomMessage){
		bulkMessageText = bulkMessageTextArray[Math.floor(Math.random()*bulkMessageTextArray.length)];
	}else{
		bulkMessageText = bulkMessageTextArray[0];
	}

	full_Name = $('#js_5 span').text();

	var isMarket = false;

	if(full_Name.indexOf(' · ') > -1){
		isMarket = true;
	}

	if (bulkMessageText.indexOf('[full_name]') > -1) {
		bulkMessageText = bulkMessageText.replace(/\[full_name]/g,full_Name);
	}

	if (bulkMessageText.indexOf('[first_name]') > -1) {
		first_name = full_Name.split(' ')[0];
		bulkMessageText = bulkMessageText.replace(/\[first_name]/g,first_name);
	}

	if (bulkMessageText.indexOf('[last_name]') > -1) {
		nameArray = full_Name.split(' ');
		if(nameArray.length > 1){
			last_name = nameArray[nameArray.length-1];
			bulkMessageText = bulkMessageText.replace(/\[last_name]/g,last_name);
		}else{
			bulkMessageText = bulkMessageText.replace(/\[last_name]/g,'');
		}
	}

	if (custom_data.sendBulkMessageEnable && !isMarket) {
		triggerBulkSendMessage(bulkMessageText);
	}
	return currentIndex;
}

function triggerBulkSendMessage(bulkMsgText) {
	selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
	if($(selector).length > 0){
		var evt = new Event('input', {
					bubbles: true  
				});
		var input = document.querySelector(selector);
		input.innerHTML = bulkMsgText;
		input.dispatchEvent(evt);
		$(selector).after('<span data-text="true">'+bulkMsgText+'</span>');
		var loc = window.location.href;
		loc = loc.split("/t/");
		$(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
		setTimeout(function(){
			var loc1 = window.location.href;
			loc1 = loc1.split("/t/");
			$(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
			setTimeout(function(){
				$('div[aria-label="New message"]').find('a[role="button"]').mclick();
				/*******************/
				var loc = window.location.href;
				loc = loc.split("/t/");
				$(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
				setTimeout(function(){
					var loc1 = window.location.href;
					loc1 = loc1.split("/t/");
					$(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
				},200);
				/*******************/
			},200);
		},200);
	} else {
		$('div[aria-label="New message"] div[contenteditable="true"] span span').text(bulkMsgText);
		$('div[aria-label="New message"]').find('a[role="button"]').mclick();
		/*******************/
		var loc = window.location.href;
		loc = loc.split("/t/");
		$(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
		setTimeout(function(){
			var loc1 = window.location.href;
			loc1 = loc1.split("/t/");
			$(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
		},200);
		/*******************/
	}
}

$(function(){

	if ($('#bluebarRoot').length == 0) {
		isFBNewLayout = true;
		$("body").addClass('cts-new-layout');

		if ($("div[data-testid='Keycommand_wrapper']")) {
			isIframeLoaded = true; 
		}
	}

	$(document).on('keyup','#tag-name-from-content', function() {
		var newTagName =  $.trim($('#tag-name-from-content').val());

		if (newTagName != '') {
			var alreadyExistTag = false;
			$('.model-tag-list li').each(function(index){
				if( !alreadyExistTag && $.trim($(this).text().toLowerCase()) == newTagName.toLowerCase() ){
					alreadyExistTag = true;
				}
			});

			if (alreadyExistTag) {
				$('.error-mgs').text('Tag name already exists').show();
			}else{
				$('.error-mgs').hide();
			}
		} else {
			return false;
		}
	});

	$(document).on('click','.add-tag-from-content', function() {
		$(this).closest('.row-levels').hide().next().show();
	});

	$(document).on('click','.search-form-content', function() {
		$(this).closest('.row-levels').hide().prev().show();
		$('.error-mgs').hide();
	});

	$(document).on('click','.save-tag-from-content', function() {
		var newTagName =  $.trim($('#tag-name-from-content').val());

		if (newTagName != '') {
			var alreadyExistTag = false;
			$('.model-tag-list li').each(function(index){
				if( !alreadyExistTag && $.trim($(this).text().toLowerCase()) == newTagName.toLowerCase() ){
					alreadyExistTag = true;
				}
			});

			if (alreadyExistTag) {
				$('.error-mgs').text('Tag name already exists').show();
			}else{
				$(this).prop('disabled', true).text('Saving');
				addUserTagFromContent(newTagName);
			}

		} else {
			return false;
		}

	});

	//////// user notes////
	$(document).on('click','.get-gl-notes', function() {
		var cliked_Fb_Id = $(this).closest('li[fb_user_id]').attr('fb_user_id');
		fbNameForNotes = $(this).closest('li[fb_user_id]').find('._1ht6._7st9').text();
		
		$('#chatsilo_model_two').addClass('notes-modal');
		$('#overlay-two #chatsilo_model_content_two').text('loading notes for '+fbNameForNotes).show();
		chrome.runtime.sendMessage({getUserNotes: "getUserNotes", fb_user_id: cliked_Fb_Id});
		return false;
	});

	$(document).on('click','.add-notes-from-content', function() {
		notesHtml = `<div class="chatsilo-cols chatsilo-col-md-12 notes add-new-note" note-id="0"><textarea rows="2" placeholder="Please Enter Note" class="notes-description chatsilo-teaxtarea"></textarea><div class="right-col-item chatsilo-cols chatsilo-col-md-8" > <button class="note-edit bg-purple chatsilo-btn title="Save"">Save</button><button class="note-delete bg-gray chatsilo-btn" title="Delete">Delete</button></div><div class="chatsilo-cols chatsilo-col-md-4 note-timing text-right" ></div></div>`;
		if ($('.add-new-note').length == 0) {
			$('.content-user-notes-container .row-container').prepend(notesHtml);
		}
		return false;
	});

	
	$(document).on('keyup','.content-user-notes-container .notes-description', function() {
		$('.msg-for-notes').hide();
	})
	$(document).on('click','.content-user-notes-container .note-edit', function() {
		var description = $(this).closest('.notes').find('textarea').val();
		var noteId = $(this).closest('.notes').attr('note-id');
		var temp = {};
		if (description == '') {
			$('.msg-for-notes').removeClass('success').addClass('error').text('Message can not be blank.').show();
			hideNoteMessagesAlerts();
			return false;
		}else{
			temp.noteId = noteId;
			temp.description = description;
			var fb_user_id_to_add_note = window.location.pathname.split('/t/'); //$('#chatsilo_model_three').attr('fb_user_id_to_add_note')
			temp.fb_user_id_to_add_note = fb_user_id_to_add_note[fb_user_id_to_add_note.length-1];
			chrome.runtime.sendMessage({saveNoteFromContent: "saveNoteFromContent", data: temp});
			return false;
		}
	});

	$(document).on('click','.note-delete', function() {
		var noteId = $(this).closest('.notes').attr('note-id');
		$(this).closest('.notes').remove();
		if (noteId == 0) {
			return false;
		}else{
			chrome.runtime.sendMessage({deleteNoteFromContent: "deleteNoteFromContent", noteId: noteId});
		}
		return false;
	});

	$(document).on('click','.close', function() {
		$('#overlay-three').hide();
		return false;
	});


	$(document).on('click','.close-model', function() {
		$('#overlay-two').hide();
		$('#chatsilo_model_two').removeClass('notes-modal')

	});

	$(document).on('click','.chatsilo-tags-container span', function() {
		var pathname = window.location.href.toString();	
	 	if(pathname.indexOf("/messages") > -1 ||  pathname.indexOf("messenger") > -1 ){
			var clikedFBUserId = $(this).closest('li').attr('fb_user_id');
			var clickedNumericFbId=$(this).closest('li').attr('numeric_fb_id');
			var profilePic = '';
			page = 0;
			if($('._3xb9').find('a').find('i').length>0){
				page = 1;
			}

			if($(this).closest('li').find('img').length > 0){
				profilePic = $(this).closest('li').find('img').attr('src');
			} else {
				profilePic = $(this).closest('li').find('div[data-tooltip-content] div').css('background-image').replace('url(','').replace(')','').replace(/\"/gi, "");
			}
			var fbName = $(this).parent().prev().text();
			
			chrome.storage.local.get(["tags", "taggedUsers"], function(result) {

				var options = '<div class="row custom-row modal-heading"><div class="leve-1 tagged-name">'+fbName+'</div><div class="leve-1 close-model">X</div></div> '+searchHtml+'<div class="row custom-row"> <div class="tags-container chatsilo-tags-container cts-messenger"><ul class="model-tag-list custom-scroll">';
				if (typeof result.tags != "undefined" && result.tags != "") { 
					temp = result.tags;
					for(i=0;i<result.tags.length;i++){
						var style ='';
						if (result.tags[i].color !== null ) {
							style = 'style = "background:'+result.tags[i].color+' !important"';
							options += "<li "+style+" color-code= '"+result.tags[i].color+"' class='tag-text-color'  tag-id='"+result.tags[i].value+"'";
							options += "><input class = 'multi-tag-checkbox' type='checkbox'>"+result.  tags[i].text+"</li>";
						}else{
							options += "<li class='bg-"+result.tags[i].class+" tag-text-color' color-code= '0' li-class='"+result.tags[i].class+"' tag-id='"+result.tags[i].value+"'";
							options += "><input class = 'multi-tag-checkbox' type='checkbox'>"+result. tags[i].text+"</li>";
						}
					}					
				}
				options += '</ul><button style="display:none;" profilePic = "'+profilePic+'" fbName = "'+fbName+'" clikedFBUserId ="'+clikedFBUserId+'" page="'+page+'" clickedNumericFbId = "'+clickedNumericFbId+'" type="button" class="update-multi-tag">Update Tag</button></div>';
				$('#chatsilo_model_content_two').html(options);
				$('#overlay-two').show();

				var temp = result.taggedUsers.filter(function (item) { return (item.fb_user_id == clikedFBUserId  || item.numeric_fb_id == clikedFBUserId)});
				
				if( temp.length > 0 ){
					var $tagIds = temp[0].tag_id.split(',');
					$tagIds.forEach(function(tagid){
						eachTagIdOne = tagid.replace(/\#/g,'');
						$('.model-tag-list li[tag-id="'+eachTagIdOne+'"] .multi-tag-checkbox').prop('checked',true);
					});	
				}

			});
		} else if(pathname.indexOf("/inbox") > -1){

			var fbImageId = $(this).closest('div.page-chat-thread-gr').attr('fb_image_id');
			var userDiv = $(this).closest('div.page-chat-thread-gr');
			var profilePic = $(userDiv).find('img').attr('src');
			var fbName = $(userDiv).find('._4k8x span:first').text();
			var fbPageId = pathname.split('/inbox')[0].replace("/", "");
			chrome.storage.local.get(["tags", "taggedUsers"], function(result) {
				var options = '<div class="row custom-row"><div class="leve-1 tagged-name">'+fbName+'</div><div class="leve-1 close-model">X</div></div>'+searchHtml+'<div class="row custom-row"><div class="tags-container chatsilo-tags-container cts-messenger"><ul class="model-tag-list custom-scroll">';
				if (typeof result.tags != "undefined" && result.tags != "") { 
					temp = result.tags;
					for(i=0;i<result.tags.length;i++){
						var style ='';
						if (result.tags[i].color !== null ) {
							style = 'style = "background:'+result.tags[i].color+' !important"';
							options += "<li "+style+" color-code= '"+result.tags[i].color+"' class='tag-text-color'  tag-id='"+result.tags[i].value+"'";
							options += "><input class = 'multi-tag-checkbox' type='checkbox'>"+result.  tags[i].text+"</li>";
						}else{
							options += "<li class='bg-"+result.tags[i].class+" tag-text-color' color-code= '0' li-class='"+result.tags[i].class+"' tag-id='"+result.tags[i].value+"'";
							options += "><input class = 'multi-tag-checkbox' type='checkbox'>"+result. tags[i].text+"</li>";
						}
					}					
				}
				options += '</ul><button style="display:none;" fbPageId="'+fbPageId+'" clickedFbImageId = "'+fbImageId+'" profilePic = "'+profilePic+'" fbName = "'+fbName+'"  type="button" class="update-multi-tag">Update Tag</button></div>';
				$('#chatsilo_model_content_two').html(options);
				$('#overlay-two').show();

				var temp = result.taggedUsers.filter(function (item) { return item.fb_image_id == fbImageId});
				
				if( temp.length > 0 ){
					var $tagIds = temp[0].tag_id.split(',');
					$tagIds.forEach(function(tagid){
						eachTagIdOne = tagid.replace(/\#/g,'');
						$('.model-tag-list li[tag-id="'+eachTagIdOne+'"] .multi-tag-checkbox').prop('checked',true);
					});	
				}

			});


		}

	});

	$(document).on('keyup','#search-tag-by-name', function() {
		 var typpedTagName = $(this).val();
		
		 if (typpedTagName != '') {
		 	$('.model-tag-list li').hide();
		 	$('.model-tag-list li').each(function (oneTag) {
		 		
		 		nnnnn =$(this).text();
		 		
     	 		if ($(this).text().toLowerCase().indexOf(typpedTagName.toLowerCase()) > -1) {
		 			$(this).show()
		 		}
		 	})
		 }else{
		 	$('.model-tag-list li').show();
		 }
	});


	$(document).on('click','.multi-tag-checkbox', function() {
	 	var pathname = window.location.href.toString();	

	 	if(pathname.indexOf("/messages") > -1 || pathname.indexOf("messenger") > -1){	
		 	$checkedTags = [];
			$('.model-tag-list li').each(function(index){
				if ($(this).find('.multi-tag-checkbox').is(':checked')) {
					$checkedTags.push($(this).attr('tag-id'));
				}
			});
			clikedFBUserId = $('.update-multi-tag').attr('clikedFBUserId');
			clikedNumericFbId = $('.update-multi-tag').attr('clickednumericfbid');
			page=$('.update-multi-tag').attr('page');
			profilePic = $('.update-multi-tag').attr('profilePic');
			fbName = $('.update-multi-tag').attr('fbName');
			fromPage='messanger';
			updateFBUsertag(JSON.stringify($checkedTags),clikedFBUserId,clikedNumericFbId,profilePic, fbName,fromPage,page);
		}

		if(pathname.indexOf("/inbox") > -1){	
		
		 	$checkedTags = [];
			$('.model-tag-list li').each(function(index){
				if ($(this).find('.multi-tag-checkbox').is(':checked')) {
					$checkedTags.push($(this).attr('tag-id'));
				}
			});
			clickedFbImageId = $('.update-multi-tag').attr('clickedFbImageId');
			profilePic = $('.update-multi-tag').attr('profilePic');
			fbName = $('.update-multi-tag').attr('fbName');
			fbPageId =  $('.update-multi-tag').attr('fbPageId'); 
			
			updateFBPageUsertag(JSON.stringify($checkedTags),clickedFbImageId,profilePic, fbName, fbPageId);
		}
	});

})

function integrateChatsiloFeature(){
	setInterval(function(){
		if(conversionListText != '' && $(fb_list_selectors).length > 0 &&  !processing ){			
			chrome.storage.local.get(["chatsilo_user","tags", "taggedUsers","isCurrentFBLinked"], function(result) {
				if (typeof result.chatsilo_user != "undefined" && result.chatsilo_user != "" && result.chatsilo_user.id > 0) { 
					processing = true;
					var spanTagPerChat = '<div class="tags-container chatsilo-tags-container cts-messenger"><span class="bg-muted chatsilo-selected-tag">+</span>';
				
					spanTagPerChat += '<div class="get-gl-notes">View Notes</div></div>';
					
					
					/********** Create Tags Drop Down for each chat thread ********/
					$(fb_list_selectors).each(function(index) {
						var fbUser =  ''; 
						currentWindowUrl = window.location.origin;
						if (currentWindowUrl.indexOf('messenger') > -1) {
							fbUser = $(this).find('a:eq(0)').attr('data-href').split('/t/')[1];

							if (fbUser.indexOf('?') > -1) {
								fbUser = fbUser.split('?')[0];
							}
						}else if (isFBNewLayout) {
							 fbUser = $(this).find('a').attr('data-href').split('/messages/t/')[1].split('?')[0];
						} else {
							 fbUser = $(this).find('a').attr('data-href').split('/t/')[1];
						}
						if($(this).find('div.tags-container').length > 0 ){
							$(this).find('div.tags-container').remove();
											
							$(this).attr('fb_user_id',fbUser);
							$(this).attr('numeric_fb_id','0');
							$(this).find('span._1ht6').after(spanTagPerChat);
						} else {
							$(this).attr('numeric_fb_id','0');
							$(this).attr('fb_user_id',fbUser);
							$(this).find('span._1ht6').after(spanTagPerChat);
						}
					});
															
					if(result.isCurrentFBLinked){
						$(".tags-container").show();
					} else {
						$(".tags-container").hide();
					}

					/********** Tag Users ********/
					if (typeof result.taggedUsers != "undefined" && result.taggedUsers != "") { 
						tagUsers(result.taggedUsers,result.tags);
					}
				}
			});
		}
	},1000);
}

function tagUsers(taggedUsers,tags){
	
	$(fb_ul_li_selector).each(function() {
		var li_fb_user_id = $(this).attr('fb_user_id');
		var temp = taggedUsers.filter(function (item) { return (item.fb_user_id == li_fb_user_id || item.numeric_fb_id == li_fb_user_id)});
		
		if( temp.length > 0 ){
			$liClass = '';
			$colorCode = '';
			var $tagIds = temp[0].tag_id.split(',');
			var title = '';
			var spanText = '';
			var numeric= temp[0].numeric_fb_id;
			$tagIds.forEach(function(eachTagId){

				eachTagIdOne = eachTagId.replace(/\#/g,'');
				var foundTag = tags.filter(function (item) { return item.value == eachTagIdOne});
				if (foundTag.length > 0) {
					title += foundTag[0].text+', ';
					$liClass = foundTag[0].class;
					$colorCode = foundTag[0].color;
					spanText = foundTag[0].text;
				}
			})

			if (title != '') {
				$(this).find('.tags-container span').text(spanText);
				$(this).find('.tags-container span').prop('title',title.slice(0, -1));
				$(this).find('.tags-container span').removeClass('bg-primary bg-danger bg-success bg-warning bg-dark bg-info');
				if(numeric == null){
					$(this).attr('numeric_fb_id','0');
				}else{
					$(this).attr('numeric_fb_id',numeric);
				}

				if ($colorCode == null) {
					$(this).find('.tags-container span').addClass('bg-'+$liClass);
				}else{
					$(this).find('.tags-container span').removeClass('bg-muted');
					$(this).find('.tags-container span').css('background',$colorCode);
					$(this).find('.tags-container span').addClass('tag-text-color');
				}
			}else{
				var options = '<div class="tags-container chatsilo-tags-container cts-messenger"><span class="bg-muted chatsilo-selected-tag">+</span>';
				options += '<div class="get-gl-notes">Notes</div> </div>';
				if($(this).find('div.tags-container').length > 0 ){
					$(this).find('div.tags-container').remove();
					$(this).find('span._1ht6').after(options);
				} else {
					$(this).find('span._1ht6').after(options);
				}
			}
		}else{
			var options = '<div class="tags-container chatsilo-tags-container cts-messenger"><span class="bg-muted chatsilo-selected-tag">+</span>';
				options += '<div class="get-gl-notes">Notes</div> </div> ';

				if($(this).find('div.tags-container').length > 0 ){
					$(this).find('div.tags-container').remove();
					$(this).find('span._1ht6').after(options);
					
				} else {
					$(this).find('span._1ht6').after(options);
					
				}
		}		
	});

	chrome.storage.local.get(["isCurrentFBLinked"], function(result) {
			if(result.isCurrentFBLinked){
				$(".tags-container").show();
			} else {
				$(".tags-container").hide();
			}
	})
	processing = false;
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
	if( typeof changes.taggedUsers != 'undefined' && typeof changes.taggedUsers.newValue != 'undefined'){
		chrome.storage.local.get(["chatsilo_user","tags"], function(result) {
			if (typeof result.chatsilo_user != "undefined" && result.chatsilo_user != "" && result.chatsilo_user.id > 0) { 
				 
				var pathname = window.location.pathname.toString();	
			 	if(pathname.indexOf("/messages") > -1 || window.location.origin.indexOf('messenger.com')>-1){	
			 		tagUsers(changes.taggedUsers.newValue,result.tags);
			 	}else if(pathname.indexOf("/inbox") > -1){
			 		tagPageUsers(changes.taggedUsers.newValue,result.tags);
			 	}else if(pathname.indexOf("/friends") > -1){
			 		tagUsersForProfileFriends(changes.taggedUsers.newValue,result.tags);
			 	}else if(pathname.indexOf("/groups") > -1 && pathname.indexOf("/members")){
			 		tagUsersForGroupMembers(changes.taggedUsers.newValue,result.tags);
			 	}
			}
		});
	}
});
	
function verifyConversationList(){
	var conversationListFound = setInterval(function(){
		
		if($(fb_ul_selector).length > 0){
			clearInterval(conversationListFound);				
			createTagDropDownContainer();
		}
	},1000);
}
			
function updateFBUsertag(tagId, fbUserId,numericFbId, profilePic, fbName='',fromPage,page){
	
	chrome.storage.local.get(["chatsilo_user"], function(result) {
		if (typeof result.chatsilo_user != "undefined" && result.chatsilo_user.id != "" && currentLoggedInFBId != '') {
			port.postMessage({'type': 'updateFBUsertag','fromPage':fromPage,'data': {tagId:tagId, userId:result.chatsilo_user.id, loggedInFBId: currentLoggedInFBId, fbUserId: fbUserId, numericFbId:numericFbId,profilePic:profilePic, fbName: fbName,isPage:page}});		
		}
	});
}

function createTagDropDownContainer(){		
	chrome.storage.local.get(["tags", "taggedUsers","isCurrentFBLinked"], function(result) {
		/********** Tag Users ********/
		if (typeof result.taggedUsers != "undefined" && result.taggedUsers != "") { 
			var pathname = window.location.pathname.toString();	
		 	if(pathname.indexOf("/inbox") > -1){
		 		tagPageUsers(result.taggedUsers,result.tags);
		 	}else if(window.location.origin.indexOf('messenger.com') > -1){
		 		tagUsers(result.taggedUsers,result.tags);
		 	}
		}

		if(result.isCurrentFBLinked){
			$(".tags-container").show();
		} else {
			$(".tags-container").hide();
		}
		
	});
}

displaySelectedTagRightSide();
function displaySelectedTagRightSide(){
	setInterval(()=>{
		chrome.storage.local.get(["chatsilo_user","tags","taggedUsers"], function(result) {
			if (typeof result.chatsilo_user != "undefined" && result.chatsilo_user != "" && result.chatsilo_user.id > 0) { 
				var loc1 = window.location.href;
				loc1 = loc1.split("/t/");
				if (typeof result.taggedUsers != "undefined" && result.taggedUsers != "" && typeof result.tags != "undefined" && result.tags != "") { 

					var taggedUsers = result.taggedUsers;
					var li_fb_user_id = loc1[1];
					var temp = taggedUsers.filter(function (item) { return (item.fb_user_id == li_fb_user_id || item.numeric_fb_id == li_fb_user_id) });
				
					if( temp.length > 0 ){
						var $tagIds = temp[0].tag_id.split(',');
						var totalTagLi = '<ul class="right-side-tag-list">';
						$tagIds.forEach(function(eachTagId){
							liclass = '';
							liStyle = '';
							eachTagIdOne = eachTagId.replace(/\#/g,'');
							var foundTag = result.tags.filter(function (item) { return item.value == eachTagIdOne});
							if (foundTag.length > 0) {
								$liClass = foundTag[0].class;
								$colorCode = foundTag[0].color;
								liText = foundTag[0].text;

								if ($colorCode== null) {
									liclass = 'bg-'+$liClass;
								}else{
									liStyle = 'style = "background-color:'+$colorCode +'";'
								}
					
								totalTagLi += '<li '+liStyle+' class="'+liclass+'">'+liText+'</li>';
							}

						})

						totalTagLi += '</ul>';
						
						if(window.location.origin.indexOf('messenger.com') > -1){
							// _3tkv
							if ($('._3tkv .right-side-tag-list').length > 0) {
								$('._3tkv .right-side-tag-list').remove();
							}

	 						$('._3tkv').find('a[target="_blank"]').after(totalTagLi);
						}else{

							if ($('._4_j5 .right-side-tag-list').length > 0) {
								$('._4_j5 .right-side-tag-list').remove();
							}

	 						$('._4_j5').find('a[uid]').after(totalTagLi);
 						}
					}
				}	

			}
		});
	}, 2000);
}

function verifyUserLogin(){
	chrome.storage.local.get(["chatsilo_user","fb_id"], function(result) {
		if( typeof result.fb_id != "undefined" && result.fb_id != "" ){
			 port.postMessage({'type': 'verifyUserLogin','data': {fb_id: result.fb_id}});
			//chrome.runtime.sendMessage({'verifyUserLogin': 'verifyUserLogin','data': {fb_id: result.fb_id}});
		} else {
			//alert('Error: Enable to get your fb account id');
		}
	});	
}

function hide_loader() {
	setTimeout(()=>{
		$('#overlay').hide();
	},2000);
}

function clearTimeOutIntervals(){
  bulkMessageTimeout.forEach(function(item){
    clearTimeout(item);
  });
  bulkMessageTimeout = [];
}

function addUserTagFromContent(tagName) {
	chrome.storage.local.get(["chatsilo_user"], function(result) {
		if( typeof result.chatsilo_user != "undefined" && result.chatsilo_user != "" ){
			var temp = {};
			temp.tag = tagName;
			temp.userId = result.chatsilo_user.id;
			temp.class = tagColors[Math.floor(Math.random()*tagColors.length)]
			chrome.runtime.sendMessage({saveTagFromContent: "saveTagFromContent", data: temp});
		} 
	});		
}

function displayNotes(notesArray) {
	//if (notesArray.length > 0) {
		var notes = `<div class="row custom-row">
						<div class="leve-1 tagged-name">`+fbNameForNotes+`</div>
						<div class="leve-1 close-model">X</div>
					</div>
					<div class="msg-for-notes chatsilo-cols chatsilo-col-md-12 text-center"></div> 
					<div  class ="content-user-notes-container"> 						
						<div class="chatsilo-cols chatsilo-col-md-12 text-center" > 
							<button class="add-notes-from-content bg-purple chatsilo-btn chatsilo-col-md-12	">Add Note</button>
						</div>
						<div class="chatsilo-cols chatsilo-col-md-12" >
							<hr>
						</div>
						<div class="row-container custom-scroll chatsilo-cols chatsilo-col-md-12">`; 
		notesArray = notesArray.reverse();
		notesArray.forEach(function (eachNote, index) {
			notes += '<div class="chatsilo-cols chatsilo-col-md-12 notes" note-id="'+eachNote.id+'"><textarea rows="2" class="notes-description chatsilo-teaxtarea">'+eachNote.description+'</textarea><div class="right-col-item chatsilo-cols chatsilo-col-md-8" > <button class="note-edit bg-purple chatsilo-btn title="Save"">Save</button><button class="note-delete bg-gray chatsilo-btn" title="Delete">Delete</button></div><div class="chatsilo-cols chatsilo-col-md-4 note-timing text-right" >'+eachNote.updatedDate+'</div></div>';
		});
		notes +='</div></div>';
		$('#chatsilo_model_content_two').html(notes);
		$('#overlay-two').show();
	//}
}

function triggerRequestSendMessage(bulkMsgText) {

	$('textarea').val(bulkMsgText);
	setTimeout(()=>{
		if ($('button[name="Send"]').length > 0) {
			$('button[name="Send"]').mclick();
		}else if($('input[name="Send"]').length > 0){
			$('input[name="Send"]').mclick();
		}
	},500);

	setTimeout(()=>{
		chrome.runtime.sendMessage({closeRequestMessageTab: "closeRequestMessageTab"});	
	},1500);
}


function  checkFriendRequestForPostMessageNew(){
	 $('div.kd0sc8dh.sl8jk4me.ie5zihkj.i09qtzwb.rm3jng1j.hzruof5a.pmk7jnqg.kr520xx4.c0wkt4kp').prev().animate({ scrollTop:  5000 }, 1000);
	setTimeout(function(){
		if (/[0-9]/.test($('div[aria-label="List of Activity Log Items"] .kvgmc6g5 h2').text())) { 
				 sendLoadedRequestNew();
			}else{
				checkFriendRequestForPostMessageNew();
			}
	},1000);		
}


function sendLoadedRequestNew() {
	var newRequestids = [];
	$todaysDivElement = $('div[aria-label="List of Activity Log Items"] .kvgmc6g5 h2:contains(Today)').closest('div.kvgmc6g5');
	$todaysDivElement.find('.l9j0dhe7').each(function (index) {
		$(this).find('div:contains(became friends with)').closest('.l9j0dhe7').find('a:eq(0)').addClass('cts-open');
	});

	dealyToLoad = 0;
	totalTodaysFriend = 0;
	$('.cts-open').each(function (index) {
		setTimeout(()=>{
			$(this).mclick();

			setTimeout(()=>{
				profileUrlTemp = $('div[aria-label="Activity Log Item"]').find('.qzhwtbm6.knvmm38d h3 a:eq(1)').attr('href');
			
				var tempFriendData = {};
				profileUrlTemp = new URL(profileUrlTemp);
				var requestProfileId = profileUrlTemp.pathname.replace('/','');
			 	tempFriendData.requestProfileId = requestProfileId;
			 	tempFriendData.fullName = $('div[aria-label="Activity Log Item"]').find('.qzhwtbm6.knvmm38d h3 a:eq(1)').text();
	
			 	if (friendRequestHistory.length > 0) {
			 		found = friendRequestHistory.filter((his)=>{return his.request_fb_id == requestProfileId })
			 			if(found.length == 0){
						
						}else{
							if (found[0].is_message_send == 1) {
								newRequestids.push(tempFriendData)
							}
						}
			 	}
			 	
				if($('.cts-open').length == 0){
					chrome.runtime.sendMessage({friendRequestsFromContent: "friendRequestsFromContent", data: newRequestids});
				}

			},7000)
		}, dealyToLoad);
		dealyToLoad = dealyToLoad + 10000;
	});
}

function  checkFriendRequestForPostMessage(){
	$("html, body").animate({ scrollTop: $(document).height() }, 1000);
	setTimeout(function(){
		if (/[0-9]/.test($('#fbTimelineLogBody div.pam._5ep8.uiBoxWhite.bottomborder').text())) { 
				 sendLoadedRequest();
			}else{
				checkFriendRequestForPostMessage();
			}
	},1000);		
}


function sendLoadedRequest() {
	var newRequestids = [];
	$('.uiList li div.clearfix div._42ef div:contains(became friends with)').each(function (index) {
		var tempFriendData = {};
		profileUrlTemp = $(this).find('a:eq(1)').attr('href');
		profileUrlTemp = new URL(profileUrlTemp);
		var requestProfileId = profileUrlTemp.pathname.replace('/','');
	 	tempFriendData.requestProfileId = requestProfileId;
	 	tempFriendData.fullName = $.trim($(this).find('a:eq(1)').text());

	
	 	if (friendRequestHistory.length > 0) {
	 		found = friendRequestHistory.filter((his)=>{return his.request_fb_id == requestProfileId })
	 			if(found.length == 0){
				
				}else{
					if (found[0].is_message_send == 1) {
						newRequestids.push(tempFriendData)
					}
				}
	 	}
	});
	chrome.runtime.sendMessage({friendRequestsFromContent: "friendRequestsFromContent", data: newRequestids});
}

var totalComingRequests = 0;
function loadComingRequests(loadedRequestHistory = 0){
	$("html, body").animate({ scrollTop: $(document).height() }, 1000);
	setTimeout(()=>{
		if (loadedRequestHistory != 0 && loadedRequestHistory == $('button[value="Confirm"]').length) {
			readFriendRequests();
		}else{
			if ($('button[value="Confirm"]').length <= 100 &&  $('button[value="Confirm"]').length < totalComingRequests) {
				loadComingRequests($('button[value="Confirm"]').length);
			}else{
				readFriendRequests();
			}
		}
	}, 2000);
	

}

function readFriendRequests(){
	var newRequestids = [];
	$('#friends_center_main ._5vbx[data-store]').each(function (index) {
		timeStamp = $(this).find('abbr[data-sigil="timestamp"]').text();
		if (timeStamp.indexOf('hr') > -1 || timeStamp.indexOf('hrs') > -1 || timeStamp.indexOf('Just now') > -1) {
			fullName = $(this).find('a:eq(1)').text();
		
			var tempData = {};
			tempData.fullName = fullName;
		
			var requestProfileId = '';
			requestProfileUrl = 'https://facebook.com'+$(this).find('a:eq(1)').attr('href');
			profileUrlTemp = new URL(requestProfileUrl);
			if (requestProfileUrl.indexOf('.php') > -1) {
				requestProfileId =   profileUrlTemp.searchParams.get('id');
			}else{
				requestProfileId = profileUrlTemp.pathname.replace('/','');
			}

			if (friendRequestHistory.length > 0) {
		 		found = friendRequestHistory.filter((his)=>{return his.request_fb_id == requestProfileId  })
		 			if(found.length == 0){
		 				tempData.requestProfileId = requestProfileId;
						newRequestids.push(tempData)
					}
		 	}else{
		 		tempData.requestProfileId = requestProfileId;
				newRequestids.push(tempData)
		 	}
	 	}	
	})
	chrome.runtime.sendMessage({confimFriendRequestsFromContent: "confimFriendRequestsFromContent", data: newRequestids});
}


function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}