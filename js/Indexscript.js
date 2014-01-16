var storage = chrome.storage.local;

// checks every 2 seconds if the Quora API has retured the name of the user

var intervalID = window.setInterval(checkUserLoggedIn, 2000);

// checkboxes at the side of each answer link are id'ed as chkbox<n>
// this variable keeps a tab on the <n> part of the checkbox
var checkBoxID = 1;

// array to store the subjects of the archive contents. Used for suggestions
var subjects = [];

/*
 * PURPOSE - Check if the username has been received from the Quora API.
 * 			If not, then display appropriate message. Else, call functions to populate content on the page
 * INPUT - none
 * OUTPUT - none; calls functions to populate content on the page.
 */

function checkUserLoggedIn(){
	if (typeof user == 'undefined') {
		$('#content').html('<h3>Waiting for Quora API to respond...</h3>')
	}
	else {
		// clears the windows.setInterval
		clearInterval(intervalID);
		
		populateArchiveStatus();		// populates the archive status div.
		
		$('#content').html('');
		contentPopulate();
	}
}


/*
 * PURPOSE - Validates the link to the answer
 * INPUT - link (string)
 * OUTPUT - true/false
 */

function isValidLink (link) {
	
	if (typeof link != 'string')
		return false;
	
	if (link.length == 0)
		return false;
		
	// link to a post is either of the format "http://startuplife.quora.com/15-Reasons-Why-Start-ups-are-ing-Hard" or 	"/Michael-Thomas-37/Posts/The-Paradox-of-Productivity"
	// this checks for links of the first type.
	if ( link.match(/(http|https):\/\/[\w\-+]+\.quora\.com\/[\w\-+]+/i) != null)	
		return true;
	
	
	// link is structured as http://www.quora.com<link>
	// Hence, the first character of the passed argument should be '/'
	
	if (link.charAt(0) != '/')
		return false;

	if (link.match(/[^\w+/-]/) != null)
		return false 
	
	try {
		link = link.split('/');
		
		// length 3 required for
		// answerer, link type (answer, post etc.), question text
		// optionally primary topic is also attached
		if (link.length < 3)
			return false;
		
		return true;
	}
	catch (e) {
		return false;
	}
	
}


/*
 * PURPOSE - Extracts the Answerer, Question text etc from the link argument
 * INPUT - link (string)
 * OUTPUT - Array of length 4 containing the foll. fields
 * 			1. Answerer
 * 			2. Link type (answer etc)
 * 			3. question text
 * 			4. Primary topic in which the question is posted
 */

function extractLinkProperties(link) {
		
		var linkSplit = link.split("/");
		var len = linkSplit.length;
		
		var personName = linkSplit[len-1];
		
		if (isNaN(parseInt(personName)) == false)
			personName = "Anonymous"
		
		personName = personName.replace(/[-0-9]/g, ' ');
		
		var linkType = linkSplit[len-2];
		var questionText = linkSplit[len-3];
		
		var questionTag = 'No-Primary-Topic'
		if (len-4>=0 && linkSplit[len-4] != "")		// i.e. there is a primary topic attached
			questionTag = linkSplit[len-4];
		
		var questionArray = [questionTag, questionText, linkType, personName]
		return questionArray
}


/*
 * PURPOSE - Populates the archive contents on the index page
 * INPUT - none
 * OUTPUT - none
 * The function internally calls displayLink for every link in the archive.
 */

function contentPopulate() {
	
	var userLinks;
	
	storage.get(user, function(items) {
  		userLinks = items[user];
  		
  		if (typeof userLinks == 'undefined') {
  			$('#content').append('<div style="text-align:center; margin-top: 50px;"><h1>No archived answers :(</h1><br />Need help? Visit <a href="https://sites.google.com/site/quoraarchive/" target="_blank">Quora Archive</a></div>')
  		}

		userLinks = userLinks.split(';');
  		
  		for (var i=0; i<userLinks.length; i++) {
  			
  			if (isValidLink(userLinks[i])){
  				
  				if ( userLinks[i].match(/(http|https):\/\/[\w\-+]+\.quora\.com\/[\w\-+]+/i) != null || userLinks[i].indexOf('answer') == -1)		// if the link is that of a post
  					displayBlogLink(userLinks[i])
  				else
  					displayAnswerLink(userLinks[i])
  			}
  		}
  		
  		populateSuggestionBoard();
	
	})
}


/*
 * PURPOSE - Displays a link to an answer in the appropriate region on the index page
 * INPUT - link (string)
 * OUTPUT - none
 */

function displayAnswerLink(link) {
	
	var linkProp = extractLinkProperties(link);
	
	var chkboxValue = link;
	
	var subject = linkProp[0];
	var subjectHREF = 'http://www.quora.com/' + subject;	// link to the primary topic page
	var subject_space = subject.replace(/-/g, ' ');
	
	var display = linkProp[3] + "'s " + linkProp[2].replace(/-/g, ' ') + ' to <strong>' + linkProp[1].replace(/-/g, ' ')+'</strong>';
	
	link = 'http://www.quora.com' + link;
	
	var div = $('body').find('#' + subject);
	
	var html = "";


	var subject_header_link = '<div class="span12 subject_header">'+subject_space+'<a href="'+subjectHREF+'" target="_blank" style="margin-left: 20px; font-size:10px;color:black" name="'+subject+'">Topic Page</a><a href="'+(subjectHREF+'/best_questions')+'" target="_blank" style="margin-left: 20px; font-size:10px;color:black">Best Questions</a></div>';

	var answer_link_content_html = '<div class="span11 answer_link"><input type="checkbox" style="margin-right:10px;" id="chkbox'+checkBoxID+'" value="'+chkboxValue+'"><a href="'+link+'" target="_blank">'+display+'  <span class="hidden_topic">'+subject_space + '</a></span></div>';

	
	if (div.length == 0) {		// if no div for the topic exists
		
		if (subject != 'No-Primary-Topic')
			subjects.push(subject);
		
		html = '<div class="row-fluid"  id="'+subject+'">' +
					 subject_header_link +
					 answer_link_content_html +
				'</div>'
		
		checkBoxID += 1;
		
		$('#content').prepend(html);
		
		$('#tags').append('<span><a href="#'+subject+'">'+subject_space+'</a></span>')
		
	}
	
	else {	// append to the existing topic div
		
		html = answer_link_content_html;
		checkBoxID += 1;
		
		$('#'+subject).append(html)
	}
	
	
}


/*
 * PURPOSE - Displays a link to a Post or Blog in the appropriate region on the index page. This is a separate function because the structure of a url to a blog is different from that of an answer.
 * INPUT - link (string)
 * OUTPUT - none
 */


function displayBlogLink(link) {
	
	var linkDisplay = link.substring(link.lastIndexOf('/')+1)
	linkDisplay = linkDisplay.replace(/-/g, ' ')
	
	var chkboxValue = link;
	
	var subject = "Blogs-and-Posts";

	var subject_space = subject.replace(/-/g, ' ');
	
	var display = '<strong>'+linkDisplay+'</strong>';


	/* post links are of 2 types. 
	// 1. http://startuplife.quora.com/15-Reasons-Why-Start-ups-are-ing-Hard
	// 2. /Michael-Thomas-37/Posts/The-Paradox-of-Productivity
	This is to add domain name to the 2nd category links
	*/
	
	if (link.charAt(0) == '/')
		link = 'http://www.quora.com' + link;
	
	var div = $('body').find('#' + subject);
	
	var html = "";
	
	if (div.length == 0) {		// if no div for the topic exists
		
		html = '<div class="row-fluid"  id="'+subject+'">' +
					'<div class="span12 subject_header">'+subject_space+'</div>' +
					'<div class="span12 answer_link"><input type="checkbox" style="margin-right:10px;" id="chkbox'+checkBoxID+'" value="'+chkboxValue+'"><a href="'+link+'" target="_blank">'+display+'  <span class="hidden_topic">'+subject_space + '</a></span></div>'+
				'</div>'
		
		checkBoxID += 1;
		
		$('#content').prepend(html);
		
		$('#tags').append('<span><a href="#'+subject+'">'+subject_space+'</a></span>')
		
	}
	
	else {	// append to the existing topic div
		
		html = '<div class="span12 answer_link"><input type="checkbox" style="margin-right:10px;" id="chkbox'+checkBoxID+'" value="'+chkboxValue+'"><a href="'+link+'" target="_blank">'+display+'  <span class="hidden_topic">'+subject_space + '</a></span></div>';
		checkBoxID += 1;
		
		$('#'+subject).append(html)
	}
	
	
}


/*
 * PURPOSE - Displays the memory status of the archive in the appropriate region on the index page
 * INPUT - none
 * OUTPUT - none
 */

function populateArchiveStatus() {
	
	var totalSpace = storage.QUOTA_BYTES;
	
	storage.getBytesInUse(function(space) {
		
	var usedSpace = space;
	var freeSpace = totalSpace - usedSpace;
	
	totalSpace = (totalSpace / (1024 * 1024)).toPrecision(3) + 'Mb';	// totalSpace to Mb
	
	if (usedSpace > (1024*1024)) {		// if used space > 1Mb then convert in Mb
		usedSpace = (usedSpace / (1024*1024)).toPrecision(3) + 'Mb';
	}
	else if (usedSpace > 1024) {		// if used space > 1Kb then convert in Kb
		usedSpace = (usedSpace / 1024).toPrecision(3) + 'Kb';
	}
	else {
		usedSpace = (usedSpace).toPrecision(3) + 'bytes';
	}
	
	if (freeSpace > (1024*1024)) {
		freeSpace = (freeSpace / (1024*1024)).toPrecision(3) + 'Mb';
	}
	else if (freeSpace > 1024) {
		freeSpace = (freeSpace / 1024).toPrecision(3) + 'Kb';
	}
	else {
		freeSpace = (freeSpace).toPrecision(3) + 'bytes';
	}
	
	$('#totalSpace').html('Available space: '+totalSpace);
	$('#usedSpace').html('Used Space: '+usedSpace);
	$('#availableSpace').html('Free space: '+freeSpace)
	
	});
}



/*
 * PURPOSE - Fetches the RSS feed for random 10 topics and displays a random question link from each
 * INPUT - none
 * OUTPUT - none
 */


function populateSuggestionBoard() {
	
	// empty Archive
	if (subjects.length==0)
		return;
	
	// shuffles the subjects
	subjects.sort(function() { return 0.5-Math.random() });
	
	var randStartPos = Math.floor(Math.random()*(subjects.length-11>0?subjects.length-11:0));
	
	for (var i=randStartPos; i<Math.min(randStartPos + 10, randStartPos+subjects.length); i++) {
		
		var url = "http://www.quora.com/" + subjects[i] +"/best_questions/rss";
		
		$.get(url, function(data) {
			var title = $(data).find('item title');
			var link = $(data).find('item link');
			var desc = $(data).find('item description');
			
			// there exists best answers for the particular topic
			if (title.length!=0) {
			
				var randPos = Math.floor(Math.random()*title.length); 		// random item in the rss feed.
			
				var html = '<div style="margin-bottom:15px"><a href="'+link[randPos].textContent+'" target="_blank">'+title[randPos].textContent+'</a><br>'+desc[randPos].textContent.match(/[\d]+ Answers|[\d]+ Answer/i)+'</div>'
			
				$('div#recommendedContent').append(html)
			}
			
		})
	}
	
	
}