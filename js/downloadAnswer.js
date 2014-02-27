
getURL();

var header_loaded = false;		// flag variable indicating if the head (question) has been loaded
var content_loaded = false;		// flag variable indicating if the body (answer) has been loaded
var fileName = "";				// stores the filename of the mhtml file

// check every 2 seconds if the content has been loaded. If yes, download the content.
var intervalID = window.setInterval(isContentLoaded, 2000);


/* 
*
* Purpose: Gets the URL from the window location
*
*/

function getURL() {

	// filters out the GET parameter portion from the URL

	var param = window.location.search.replace("?", "")
	param = param.split("&");

	var url = param[0].split("=")[1];
	var isBlog = param[1].split("=")[1];

	url = decodeURIComponent(url);


	loadContent(url, isBlog);

}


/* 
 * PURPOSE - Load the Question text and the Answer body from the URL passed as a GET parameter
 * INPUT - URL of the page
 * OUTPUT - None. Calls other functions to load the header and the body of the question.
 */

function loadContent(url, isBlog) {

	var header_url, body_url;

	if (isBlog === "true") {
		header_url = url + " h1.board_item_title";
		body_url = url + " div.board_item_description:first";
	}

	else {
		header_url = url + " div.question_text:first";
		body_url = url + " div.answer_content:first";
	}

	loadAnswerHeader(header_url, isBlog);
	loadAnswerBody(body_url);

}


/* 
 * PURPOSE - Loads the Question text from the passed URL
 * INPUT - URL of the page appended with the div tag of the header (ex: "http://www.quora.com/Business/How-do-you-create-a-business-plan/answer/Leonard-Kim-1 div.question_text")
 * OUTPUT - Loads the header received from the URL into div#answer_header
 */

function loadAnswerHeader(url, isBlog) {

	$("#answer_header").load(url, function(response, status, xhr) {
		
		if (status == 'success') {
			header_loaded = true;	// indicate that the header has been successfully loaded.


			if (isBlog === "true") {
				fileName = $('h1.board_item_title').text() + ".mhtml";
			}
			else {
				// Prepare the filename as "Leonard Kim's answer to - Business- How do you create a business plan.mhtml"
				fileName = $(".answer_user").text() + " " + $(".link_text").text() + ".mhtml";
			}

		}
		else {
			// if load fails, display the status on the page
			$('#answer_header').text(status);
		}

	});

}


/* 
 * PURPOSE - Loads the Answer body from the passed URL
 * INPUT - URL of the page appended with the div tag of the answer body (ex: "http://www.quora.com/Business/How-do-you-create-a-business-plan/answer/Leonard-Kim-1 div.answer_content")
 * OUTPUT - Loads the header received from the URL into div#answer_header
 */

function loadAnswerBody(url) {

	$("#answer_body").load(url, function (response, status, xhr) {
		
		if (status == 'success') {
			content_loaded = true;		// indicate that the answer body has been successfully loaded.

			// Stylesheet to highlight "Not for Repreduction" message
			var not_for_reproduction_style = {
				"margin-top": "20px",
				"font-size": "13px",
				"font-weight": "bold"
			}

			$('.answer_flag_note_text').parent().css(not_for_reproduction_style);

		}
		else {
			// if load fails, display the status on the page
			$('#answer_body').text(status);
		}
	});

}


/* 
 * PURPOSE - checks if the header and the answer content has been loaded. If yes, calls the saveAnswer function to download the answer offline.
 * INPUT - None
 * OUTPUT - None
 */

function isContentLoaded() {
	if (header_loaded == true && content_loaded==true) {
		clearInterval(intervalID);		// clears the 2 second interval to repeatedly check if the content has been loaded
		saveAnswer();
	}
}


/* 
 * PURPOSE - downloads the answer offline.
 * INPUT - None
 * OUTPUT - None
 */

function saveAnswer() {

	// get the ID of the current tab

	chrome.tabs.getCurrent(function(tab) {

		var obj = {"tabId": tab.id};	// prepare a temporary object for chrome.pageCapture

		chrome.pageCapture.saveAsMHTML(obj, function (blob) { 
			saveAs(blob, fileName);		// saveAs - referenced from Filesaver.js - saves the blob element with the predetermined fileName
		})

	})
}


/*
*
* PURPOSE: embeds youtube videos on clicking their thumbnails 
*
*/ 

$("body").on("click", "div.qtext_embed", function() {

	var data_embed = $(this).attr("data-embed");
	console.log(data_embed);
	$(this).html(data_embed);

})