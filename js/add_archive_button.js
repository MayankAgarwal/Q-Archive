// gets the current logged in user name from Quora API

var user = loggedUser();

var storage = chrome.storage.local;

// injecting Archive link on the Quora navigation bar

$("a.header_add_question_button").before('<li><a class="nav_item" href="' + chrome.extension.getURL("index.html") + '" target="_blank">Archive</a></li>');


// Injecting archive link on the question page

$('div.main_col').on("mouseenter", "div.answer_wrapper", function() {
	
	$(this).children('div.item_action_bar').append('<span id="item_action_bar_archive_link"><span class="bullet"> • </span> <span class="archiveLink" style="cursor: pointer">Archive</span></span>');
	
	$('.archiveLink').bind('click', function() {
		
		// passing the div which contains the Archive link (on the question page). This contains the timestamp field which links to the answer page.
		archiveClick($(this).parent());
	});
})


// Removing archive link from question page

$('div.main_col').on("mouseleave", "div.answer_wrapper", function() {
	$(this).children('div.item_action_bar').children('#item_action_bar_archive_link').remove();
})


// Injecting archive link on the homepage feed.

$('div.feed_col').on("mouseenter", "div.feed_item_answer_content", function() {
	$(this).children('div.item_action_bar').append('<span id="item_action_bar_archive_link"><span class="bullet"> • </span> <span class="archiveLink" style="cursor: pointer">Archive</span></span>');
	$('.archiveLink').bind('click', function() {
		archiveClick($(this).parent());
	});
})


// Removing archive link from homepage

$('div.feed_col').on("mouseleave", "div.feed_item_answer_content", function() {
	$(this).children('div.item_action_bar').children('#item_action_bar_archive_link').remove();
})

// Adding status message div to the page
$('body').append('<div class="above_page_banner" id="answer_archived_message" style="display:none; background: green; color: white;">Answer archived.</div>');
$('body').append('<div class="above_page_banner" id="link_present_message" style="display:none">Link already present in the archive.</div>');


/* Purpose - extract the link of the answer to archive from the timestamp or answer_permalink field. Pass it on to other function to add it to the archive.
 * Input - Parent div of the clicked archive button - currentElement.
 * Output - None; passes the extracted link to other function to add it to archive.
 */

function archiveClick(currentElement) {
	
	if (typeof user == 'undefined') {		// triggered when the API has still not responded with the username.
		alert("Quora API has still not responded with your ID. Please wait for a few seconds before re-trying.");
		return false;
	}
	
	var link = $(currentElement).parent().find(".answer_permalink").attr('href');
		
	if (link == '') {		// triggered if the answer_permalink field is not found. If not, the script will search for another element with tag 'timestamp' to extract the link
  		var link = $(currentElement).parent().find(".timestamp").attr('href');
  	}
	
	addLink(currentElement, link)

}

/* PURPOSE - Add the link to the archive (storage).
 * INPUT - 1. Parent div of the clicked archive button
 * 		2. link to the answer page.
 * OUTPUT - Alert with a success or error message
 */


function addLink(element, link) {
  	
  	var userLinks;
  	
  	storage.get(user, function(items) {
  		userLinks = items[user];
  	
  		if (typeof userLinks != 'undefined' && userLinks.indexOf(link) != -1) {
  			$('div#link_present_message').slideDown(300).delay(1500).slideUp(300);
  			return;
  		}

  		if (typeof userLinks == 'undefined') {		// i.e. the storage area is empty. Hence, no need to append. Initialize the variable with the current link.
  			userLinks = link;
  		}
  		else {
  			userLinks = userLinks + ';' + link;		// semicolon separated values. appends link to the existing archive.
  		}
  	
  		var userDict = {};		// temporary variable created to be able to use chrome local storage
  		userDict[user] = userLinks;
  		
  		try {
  			storage.set(userDict, function() {
  				$('div#answer_archived_message').slideDown(300).delay(1500).slideUp(300);
  			})
  		}
  		catch(e) {
  			alert(e.message);
  		}
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
	 		console.log(errorThrown)
	 	},
	 timeout: 15000
	});
}