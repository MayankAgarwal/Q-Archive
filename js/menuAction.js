/* SCRIPT CALLED ON index.html AND HANDLES ALL THE MENU RELATED ACTIONS ON THE PAGE */

var storage = chrome.storage.local;
var user = loggedUser();


$('#show-hide-tags').bind("click", function() {
	$('#tags').toggle();
	return false;
})


// Clears the archive of the current user.

$('#clearArchive').bind("click", function() {
	
	if (confirm("This will clear all your archived answers. Press Ok to continue.")) {
		
		storage.remove (user, function() {
			location.reload();
		})
	}
	
});


// Removes the selected answers fromt the archive of the current user

$('#removeSelected').bind("click", function(){
	
	if (confirm("Remove the selected content from archive?")) {
		
		links = selectedLinks();
			
		if (links.length!=0) {		// if the user indeed selected answers to remove, then pass the array to removeLinks function.
			removeLink(links);
		}
		else {
			alert('Please select the content you want to remove.')
		}
		
	}
	
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
			userLinks = userLinks.replace(links[i], '');		//	removes the link from the archive
			userLinks = userLinks.replace(/;;/g, ';');			//	replaces ;; created because of removal of links to ;
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
				user = result.name
				return user;
			}catch(ex)
			{
				console.log(ex);
			}
			},
	 error: function(jqXHR, textStatus, errorThrown)
	 	{
	 		clearInterval(intervalID);
	 		console.log(jqXHR.error, textStatus, errorThrown)
	 		$('#content').html('<h4>Error '+jqXHR.status+' ('+jqXHR.statusText+'). Please reload.</h4>')
	 	},
	 timeout: 15000
	});
}


// searches through the content div on the page

$('#search').bind("input", function() {
	
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



$('#exportArchive').bind("click", function() {
	
	$('#export_import_archive_header').html('<h4>Export Archive</h4>')		// add appropriate header to the modal box.
	
	storage.get(user, function(items){
		var userLinks = items[user];
		
		// fill the div with the user links
		$('#export_import_archive_contents').html('<div style="max-height: 250px; overflow: scroll; padding:5px; font-size:11px;" id="userLinks">'+userLinks+'</div>');
		
		// body text with a link to the clippy module to enable 'Copy to Clipboard' feature.
		$('#body-text').html('Copy and paste the following into a text file: <span class="clippy" style="margin-left:15px;">'+userLinks+'</span>')
		
		// display Clippy icon linked to the app. item.
		$('.clippy').clippy({width: "120"});
	});
	
	$('#archive_export_import_modal').modal();		// show the modal box
})


$('#importArchive').bind("click", function() {
	
	$('#export_import_archive_header').html('<h4>Import Archive</h4>')			// add appropriate header to the modal box.
	
	$('#body-text').text('Paste the previously exported archive contents:')
	
	// add the Import button to the span with the id button-container.
	$('#button-container').html('<a href="#" class="btn btn-primary" id="import_archive_action">Import</a>');
	
	// add a textarea to the modal body
	$('#export_import_archive_contents').html('<textarea rows="10" id="import_archive_content" style="height: 250px; width: 95%; max-height: 250px; overflow-y: scroll; font-size: 11px;">');
	
	// show the modal box.
	$('#archive_export_import_modal').modal();
})


/* Triggers when clicked on the import button in the modal box
 * 
 * PURPOSE  - Reads the textarea value for links -> verifies each link to conform to standards -> checks if link is not present in the archive -> adds the link to the archive.
 * Reloads on successful operation.
 */

$('#button-container').on("click", "a#import_archive_action", function() {
	var input = $('#import_archive_content').val();
	var count = 0;		// keeps a count of the total number of answers imported
	inputSplit = input.split(';')
	
	storage.get(user, function(items) {
		var userLinks = items[user];
		
		// if no links present in the archive, then start new.
		if (typeof userLinks == 'undefined')
			userLinks = "";
		
		for (var i=0; i<inputSplit.length; i++) {
			
			// check if each link is valid and is not already present in the archive
			if (isValidLink(inputSplit[i]) & userLinks.indexOf(inputSplit[i]) == -1) {
				userLinks = userLinks + ';' + inputSplit[i];
				count++;
			}
			
		}
		
		var userDict = {};		// variable used to be able to use the chrome storage API
		userDict[user] = userLinks;
		
		storage.set(userDict, function() {
			alert(count+' answers imported');
			location.reload();
		})
		
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

		userLinks = userLinks.split(";")

		var randPos = Math.floor((Math.random()*userLinks.length)+1);

		if (isValidLink(userLinks[randPos])) {
			var chosenURL = userLinks[randPos];

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
			alert("Select answers to download offline.");
			return false;
		}

		// A limit of 10 links that can be downloaded at a time is set. This is based on intuition rather than solid technical know-how. 
		if (links.length > 10) {
			alert('Only 10 answers at a time supported. Currently ' + links.length + ' answers selected.');
			return false;
		}

		for (var i=0; i<links.length; i++) {
			
			// Skip if a blog link is chosen.

			if (links[i].charAt(0)!='/')
				continue;

			var answerURL = "http://www.quora.com" + links[i];
			var url = chrome.extension.getURL("download.html") + "?url=" + encodeURIComponent(answerURL);

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