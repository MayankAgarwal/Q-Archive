/* SCRIPT CALLED ON index.html AND HANDLES ALL THE MENU RELATED ACTIONS ON THE PAGE */

var storage = chrome.storage.local;
var user, profile_link;

loggedUser();


// PURPOSE: opens the logged-in user's Quora profile page
$('#user-information').bind('click', function() {
	var win = window.open(profile_link, '_blank');
	win.focus();
})



// Clears the archive of the current user.

$('#clearArchive').bind("click", function() {
	
	if (confirm("This will clear all your archived answers. Press Ok to continue.")) {
		
		// remove the link storage
		storage.remove (user, function() {
				location.reload();
		})
	}

	return false;
	
});


// Removes the selected answers fromt the archive of the current user

$('#removeSelected').bind("click", function(){
	
	if (confirm("Remove the selected content from archive?")) {
		
		links = selectedLinks();
			
		if (links.length!=0) {		// if the user indeed selected answers to remove, then pass the array to removeLinks function.
			removeLink(links);
		}
		else {

			$('#error-alert-div').html('Please select the content you want to remove.').slideDown(300).delay(2000).slideUp(300);
		}
		
	}

	return false;
	
})

/* 
 * PURPOSE - Gets the links of the selected checkboxes
 * INPUT - None
 * OUTPUT - an array of links.
 */

function selectedLinks() {
	
	// checkboxes are id'ed as chkbox<n>. Hence initializing the counter to 1 and incrementing to check all the checkboxes
		var chkboxID = 1;
		
		// holds the links to remove from the archive.
		var links = [];
		
		// starts with the first checkbox
		var chkbox = $('body').find('#chkbox'+chkboxID);
		chkboxID += 1;
		
		while (chkbox.length != 0) {	// while there are no checkboxes left
			
			if (chkbox[0].checked) {
				links.push(chkbox[0].value);
			}
			chkbox = $('body').find('#chkbox'+chkboxID);
			chkboxID += 1;
		}
	return links;
}


/* 
 * PURPOSE - Removes the links from the archive of the logged-in user
 * INPUT - an array of links
 * OUTPUT - reloads the page on successful action.
 */

function removeLink(links) {
	
	storage.get(user, function(items) {
		var userLinks = items[user];
		
		for (var i=0; i<links.length; i++) {
			delete userLinks[links[i]];
		}
		
		var userDict = {}		// var created to be able to push the new archive into chrome storage.
		userDict[user] = userLinks;
	
		storage.set(userDict, function() {
			location.reload();
		});
	});
}


/* PURPOSE - GET THE NAME OF THE LOGGED IN PERSON FROM QUORA API
 * INPUT - none
 * OUTPUT - name of the logged in person
 */

function loggedUser()
{
	url = "http://api.quora.com/api/logged_in_user";
	
	$.ajax({
	  url: url,
	  cache: false,
	  dataType: "text",
	  success: function(html)
		  {
	   		try
			{
				var result = JSON.parse(html.match(/{.*}/));

				if (result == null) {
					$('#content').html('<h4 style="text-align:center">Quora login is required to access the archive.</h4><h6 style="text-align:center">Cannot read property \'name\' of null</h6>');
					throw 'API returns null exception';
				}

				user = result.name

				// set the current user in sessionStorage. Used by manage buckets js file.
				sessionStorage['loggedUser'] = user;

				profile_link = result.link;
				return user;
			}catch(ex)
			{
				clearInterval(intervalID);
				console.log(ex);
			}
			},
	 error: function(jqXHR, textStatus, errorThrown)
	 	{
	 		clearInterval(intervalID);
	 		console.log(jqXHR.error, textStatus, errorThrown)
	 		$('#content').html('<h4 style="text-align:center">Error '+jqXHR.status+' ('+jqXHR.statusText+'). Please reload.</h4>')
	 	},
	 timeout: 15000
	});
}


// searches through the content div on the page
// executes on 2 events: input -> when manually typing in the search box, and keyup -> when a displayed suggestion is selected.

$('#search').on('input keyup', function() {
	
	var searchKey = $('#search').val();			// search key in the text box
	
	if (searchKey == "") {		// when search box has been cleared
		$('#content div').each(function() {
			
			// show each div under content div.
			$(this).show();
		})
	}
	else {

		searchKey = searchKey.split(',')		// gets multiple search terms in an array

		var existsFlag;		// flag =1 if any of the searchKey found in div contents

		$('#content div').each(function() {
			
			// get text content of each div under content div
			var topicContent = this.textContent;
			existsFlag = 0;

			for (i=0; i<searchKey.length; i++) {		// go over all the search terms. If even one searchKey matches, display the div. Else hide it

				var query = searchKey[i].trim().toLowerCase();

				// if the text content does not contain the search string, then hide the current div otherwise show it.
				if (topicContent.toLowerCase().indexOf(query) != -1) {
					existsFlag=1;
					break;
				}

			}

			if (existsFlag == 1)
				$(this).show();
			else
				$(this).hide();

		})
	}
})


// on clicking Export Archive button, displays a modal box with a stringified version of the archive contents

$('#exportArchive').bind("click", function() {
	
	$('#export_import_archive_header').html('<h4>Export Archive</h4>')		// add appropriate header to the modal box.
	
	storage.get(user, function(items){
		var userLinks = items[user];
		var strUserLinks = JSON.stringify(userLinks);
		
		// fill the div with the user links
		$('#export_import_archive_contents').html('<div style="max-height: 250px; overflow: scroll; padding:5px; font-size:11px;" id="userLinks">'+strUserLinks+'</div>');
		
		// body a 'copy to clipboard' and 'download archive' feature.
		$('#body-text').html('<span class="modal-body-header">Copy contents: </span><span class="clippy" style="margin-left:15px;">'+strUserLinks+'</span><span class="modal-body-header">Download backup: </span><i id="download-archive-backup" class="icon-download-alt" style="cursor: pointer"></i>')
		
		// display Clippy icon linked to the app. item.
		$('.clippy').clippy({width: "120"});

	});
	
	$('#archive_export_import_modal').modal();		// show the modal box

	return false;
})


// PURPOSE: download the archive backup as a text file on clicking the download archive link on Export Archive modal box
$("body").on("click", "#download-archive-backup", function downloadArchiveTextFile() {

	var strUserLinks = $("#userLinks").text();

	var filename = user + "-Quora Archive Backup [" + new Date().toLocaleDateString() + "].txt"

	var blob = new Blob([strUserLinks], {type:"text/plain;charset=utf-8"});
	saveAs(blob, filename);

});



// shows the import archive modal box on clicking the Import Archive button.
$('#importArchive').bind("click", function() {
	
	$('#export_import_archive_header').html('<h4>Import Archive</h4>')			// add appropriate header to the modal box.
	
	$('#body-text').text('Paste the previously exported archive contents:')
	
	// add the Import button to the span with the id button-container.
	$('#button-container').html('<a href="#" class="btn btn-primary" id="import_archive_action">Import</a>');
	
	// add a textarea to the modal body
	$('#export_import_archive_contents').html('<textarea rows="10" id="import_archive_content" style="height: 250px; width: 95%; max-height: 250px; overflow-y: scroll; font-size: 11px;">');
	
	// show the modal box.
	$('#archive_export_import_modal').modal();

	return false;
})



/* Triggers when clicked on the import button in the modal box
 * 
 * PURPOSE  - Reads the textarea value for links -> verifies each link to conform to standards -> checks if link is not present in the archive -> adds the link to the archive.
 * Reloads on successful operation.
 */

$('#button-container').on("click", "a#import_archive_action", function() {
	var input = $('#import_archive_content').val();
	var imported_count = 0;		// keeps a count of the total number of answers imported
	var existing_count = 0;		// keeps a count of answers that exist in the archive
	
	storage.get(user, function(items) {
		var userLinks = items[user];
		
		// if no links present in the archive, then start new.
		if (typeof userLinks == 'undefined')
			userLinks = {};

		try {

			var import_links = JSON.parse(input);
		
			for (var i in import_links) {
				
				// check if each link is valid and is not already present in the archive
				if (isValidLink(i)) {

					if (i in userLinks == false) {
						userLinks[i] = import_links[i];
						imported_count++;
					}

					else {
						existing_count++;
					}

				}
				
			}
			
			var userDict = {};		// variable used to be able to use the chrome storage API
			userDict[user] = userLinks;
			
			storage.set(userDict, function() {
				alert(imported_count+' answer(s) imported.\n'+existing_count+" answer(s) already exist.");
				location.reload();
			})
		}
		catch (err) {
			console.log("Error encountered while importing archives. \n Error: "+err.message);
			alert("Import function failed. Check console for a detailed output (Press Ctrl+Shift+J)")
		}
		
	})
});



/*  Binded to a click event on the surprise me link
*
* Purpose: Choose a random link from the archive and open it in a new tab
*
* Input: none
* Output: opens a new tab with a randomly chosen link
*/


$('#surpriseMe').bind("click", function() {

	storage.get(user, function (items) {
		var userLinks = items[user];

		// number of archived answers in the archive
		var length = Object.keys(userLinks).length;

		var randPos = Math.floor((Math.random()*length)+1);
		var chosenURL = Object.keys(userLinks)[randPos];

		if (isValidLink(chosenURL)) {

			// if the chosen URL is that of an answer (answer URLs start with '/'), then append http://www.quora.com to it.

			if (chosenURL.charAt(0) == '/') {
				chosenURL = "http://www.quora.com"+chosenURL;
				
			}

			var win = window.open(chosenURL, "_blank")
			win.focus();

		}

	})

	return false;
})



/*  Binded to a click event on the top arrow link
*
* Purpose: Scroll to the top of the document
*
*/

$('#top-arrow').bind('click', function () {

	var percentageToScroll = 100;
	var percentage = percentageToScroll/100;
	var height = $(document).scrollTop();
	var scrollAmount = height * (1-percentage);

	$('html body').animate({
		scrollTop: scrollAmount
	}, 'slow');

})


/*  Binded to a click event on the Download Answers offline link
*
* Purpose: Downloads the selected answers as an mhtml file
*
*/

$("#download_answers_offline").bind('click', function() {
		
		var links = selectedLinks();

		if (links.length == 0) {
			$('#error-alert-div').html('Select answers to download offline.').slideDown(300).delay(2000).slideUp(300);
			return false;
		}

		// A limit of 15 links that can be downloaded at a time is set. This is based on intuition rather than solid technical know-how. 
		if (links.length > 15) {
			var msg = 'Only 15 answers at a time supported. Currently ' + links.length + ' answers selected.';
			$('#error-alert-div').html(msg).slideDown(300).delay(2500).slideUp(300);
			return false;
		}

		for (var i=0; i<links.length; i++) {

			var URL = links[i];

			if (links[i].charAt(0) == '/')
				URL = "http://www.quora.com" + links[i];
			
			var url = chrome.extension.getURL("download.html") + "?url=" + encodeURIComponent(URL);

			// if the link is that of a blog, pass an extra parameter indicating that the link is a blog
			if (links[i].charAt(0) != '/' || links[i].toLowerCase().indexOf("answer") == -1)
				url = url + "&isBlog=true";
			else
				url = url + "&isBlog=false";

			var win = window.open(url, "_blank");

		}

		return false;

})


/*  
*
* Purpose: Deselects all checkboxes on the page.
*
*/

$('#deselect_checkboxes').bind('click', function() {
	$('input:checkbox').prop('checked', false);
	return false;
})



/*  
*
* Purpose: Refresh the suggestions box to load new suggestions.
*
*/

$('#recommendedContentRefresh').bind('click', function() {
	populateSuggestionBoard();
	return false;
})



/*
* PURPOSE: Filter and display content belonging to the clicked bucket
*
* INPUT: None. Triggers on clicking a .tag li element
* OUTPUT: None. Calls contentPopulate function with suitable parameter
*
*/

$('body').on('click', 'li.tag', function() {
	var bucket = $(this).text();

	if (bucket.toLowerCase() === 'show all') 
		bucket = 'all';

	if (bucket.toLowerCase() === 'unclassified')
		bucket = '';

	$('div#content').html('<div style="text-align:center; margin-top:40px;"><div><img src="images/loader.GIF" /></div><br><div>Loading</div></div>')

	contentPopulate(bucket);

})



// displays the classify answer option dropdown
$('#reassignAnswer').bind('click', function() {
	$('#classifyAnswerOptions').slideDown(300);
	return false;
})

// closes the classify answer dropdown
$('#closeClassifyDD').bind('click', function() {
	$('#classifyAnswerOptions').slideUp(300);
	return false;
})


/*
*
* PURPOSE: Classifies answers based on the bucket selected in the dropdown
*
*/

$('#classifyAnswers').bind('click', function() {

	var links = selectedLinks();

	// bucket selected in the dropdown
	var bucket = $('#answerBucketDD').val();

	storage.get(user, function(items) {
		var userLinks = items[user];

		// update bucket entry for the selected links
		for (var i in links) {
			userLinks[links[i]]["bucket"] = bucket;
		}

		var userDict = {};
		userDict[user] = userLinks;

		storage.set(userDict, function() {

			$('#search').val('');

			$('#classifyAnswerOptions').slideUp(300);

			$('#success-alert-div').html('Answers successfully classified');

			$('#success-alert-div').slideDown(300).delay(1500).slideUp(300);

			contentPopulate(bucket);

		})


	})

})