// gets the current logged in user name from Quora API
var user = loggedUser();

var storage = chrome.storage.local;

// injecting Archive link on the Quora navigation bar

$("a.header_add_question_button").before('<li><a class="nav_item" href="' + chrome.extension.getURL("index.html") + '" target="_blank">Archive</a></li>');



// injecting archive link on Homepage feed, Blog posts feed, Subject page
$('body').on("mouseenter", "div.feed_item", function() {
	$(this).find('div.item_action_bar:first').append('<span id="item_action_bar_archive_link"><span class="bullet"> • </span> <span id="archiveLink_1" style="cursor: pointer; color:black; font-weight:bold">Archive</span></span>');

	$('#archiveLink_1').bind('click', function() {
		// passing the div which contains the Archive link (on the question page). This contains the timestamp field which links to the answer page.
		archiveClick($(this).parent());
	})
})

$('body').on("mouseleave", "div.feed_item", function() {
	$(this).find('div.item_action_bar').children('#item_action_bar_archive_link').remove();
})



// injecting archive link on Question page
$('body').on("mouseenter", "div.answer_wrapper", function() {
	$(this).find('div.item_action_bar:first').append('<span id="item_action_bar_archive_link"><span class="bullet"> • </span> <span id="archiveLink_2" style="cursor: pointer; color:black; font-weight:bold">Archive</span></span>');
	
	$('#archiveLink_2').bind('click', function() {
		// passing the div which contains the Archive link (on the question page). This contains the timestamp field which links to the answer page.
		archiveClick($(this).parent());
	})
})

$('body').on("mouseleave", "div.answer_wrapper", function() {
	$(this).find('div.item_action_bar').children('#item_action_bar_archive_link').remove();
})


// injecting archive link on Post page
$('body').on("mouseenter", "div.board_item_content", function() {
	$(this).find('div.blog_item_actions:first').append('<span id="item_action_bar_archive_link"><span class="bullet"> • </span> <span id="archiveLink_3" style="cursor: pointer; color:black; font-weight:bold">Archive</span></span>');
	
	$('#archiveLink_3').bind('click', function() {
		// passing the div which contains the Archive link (on the question page). This contains the timestamp field which links to the answer page.
		archiveClick($(this).parent());
	})
})

$('body').on("mouseleave", "div.board_item_content", function() {
	$(this).find('div.blog_item_actions').children('#item_action_bar_archive_link').remove();
})



// injecting archive link on profile page
$('body').on('mouseenter', 'div.profile_feed_item_preview, div.profile_feed_item', function() {

	$(this).find('a.answer_permalink:first, a.timestamp:first').css("display", "inherit");
	$(this).find('a.answer_permalink:first, a.timestamp:first').parent().append('<span id="item_action_bar_archive_link"><span class="bullet"> • </span> <span id="archiveLink_4" style="cursor: pointer; color:black; font-weight:bold">Archive</span></span>');

	$('#archiveLink_4').bind("click", function() {
		archiveClick($(this).parent());
	})

})

// removing archive link from profile page
$('body').on('mouseleave', 'div.profile_feed_item_preview, div.profile_feed_item', function() {
	$(this).find('span#item_action_bar_archive_link').remove();
})


// Adding status message div to the page
$('body').append('<div class="above_page_banner" id="answer_archived_message" style="display:none; background: green; color: white;">Answer archived.</div>');
$('body').append('<div class="above_page_banner" id="link_present_message" style="display:none">Link already present in the archive.</div>');
$('body').append('<div class="above_page_banner" id="custom_error_message" style="display:none; background:#a82300; color:white;"></div>');


/* Purpose - extract the link of the answer to archive from the timestamp or answer_permalink field. Pass it on to other function to add it to the archive.
 * Input - Parent div of the clicked archive button - currentElement.
 * Output - None; passes the extracted link to other function to add it to archive.
 */

function archiveClick(currentElement) {
	
	if (typeof user == 'undefined') {		// triggered when the API has still not responded with the username.
		alert("Quora API has still not responded with your ID. Please wait for a few seconds before re-trying or reload.");
		return false;
	}
	
	var link = $(currentElement).parent().parent().find("a.answer_permalink").attr('href');
		
	if (link == '' || typeof link == 'undefined') {		// triggered if the answer_permalink field is not found. If not, the script will search for another element with tag 'timestamp' to extract the link
  		var link = $(currentElement).parent().find("a.timestamp").attr('href');
  	}
  	
  	if (link == '' || typeof link == 'undefined') {
  		$('div#custom_error_message').text('Link not found. Try expanding the post and then clicking the archive link.')
  		$('div#custom_error_message').slideDown(300).delay(1500).slideUp(300);
  		return;
  	}
  	
	addLink(currentElement, link)

}

/* PURPOSE - Add the link to the chrome local storage.
 * INPUT - 1. Parent div of the clicked archive button
 * 		2. link to the answer page.
 * OUTPUT - Alert with a success or error message
 */


function addLink(element, link) {
  	
  	var userLinks;

  	if (typeof user == 'undefined') {
  		alert("Quora API has still not responded with your ID. Please wait for a few seconds before re-trying.");
		return false;
  	}
  	
  	storage.get(user, function(items) {
  		userLinks = items[user];
  	
  		if (typeof userLinks != 'undefined' && link in userLinks) {		// checks if the link is already present in the archive. Hence, first check if there are contents in the archive. If true, then check for the link.
  			$('div#link_present_message').slideDown(300).delay(1500).slideUp(300);
  			return;
  		}

  		
  		userLinks[link] = {"bucket": ""};		// add a new entry to existing links. Key= link, Value: Bucket
  		

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