var storage = chrome.storage.local;

var user = sessionStorage['loggedUser'];



displayExistingBuckets();



// displays the existing buckets on the index page
function displayExistingBuckets() {

	var bucketsLabel = user + ":Buckets";

	$('div#existing-buckets').html('');
  	
  	storage.get(bucketsLabel, function(items) {

  		var buckets = items[bucketsLabel];

  		// if no buckets are defined
  		if (typeof buckets == 'undefined' || buckets == '')
  			return ;

  		//buckets are stored in csv format
  		buckets = buckets.split(";");

  		for (var i=0;i <buckets.length; i++) {

  			if (buckets[i] == '')
  				continue;

  			var bucket_div_html = '<div class="bucket"><span class="bucket_label">'+buckets[i]+'</span><span class="bucket_options"><img class="bucket_edit" src="images/edit.png"><img class="bucket_delete" src="images/delete.png"></span></div>';

  			$('div#existing-buckets').append(bucket_div_html);

  		}

  	});

}


// adds a new bucket on clicking addBucket button

$('button#addNewBucket').bind('click', function() {
	var bucket = $('input#newBucketInput').val();

	// if textbox is empty
	if (bucket.length == 0)
		return;

	// Bucket with the name 'all' is not allowed. This causes discrepancy with the 'Show All' bucket option.
	if (bucket.toLowerCase() == 'all') {
		$('div#error-alert-div').html('All is a reserved word. Please specify a different bucket name.')
		$('div#error-alert-div').slideDown(300).delay(1500).slideUp(300);
		return;
	}

	addBucket(bucket);

})



/* 
 * PURPOSE - Add the bucket to the chrome local storage.
 * INPUT - Bucket name
 * OUTPUT - 
 */


function addBucket(bucket) {

	/*
		bucket - current bucket label to add
		buckets - existing set of buckets in the local storage
		bucketsLabel - key of the Key-Value pair in the local storage
		bucketsDict - temp variable to be able to update the local storage
	*/
  	
  	var buckets;

  	if (typeof user == 'undefined') {
  		alert("Cannot identify logged-in user. Reload Quora Archive home page and then try again.");
		return false;
  	}

  	var bucketsLabel = user + ":Buckets";
  	
  	storage.get(bucketsLabel, function(items) {

  		buckets = items[bucketsLabel];
  	
  		if (typeof buckets != 'undefined' && (buckets.toString().toLowerCase()).indexOf(bucket.toLowerCase()) != -1) {		// checks if the bucket is already present in the archive. Hence, first check if there are contents in the archive. If true, then check for the bucket.
  			$('div#error-alert-div').html('Bucket already exists.');
  			$('div#error-alert-div').slideDown(300).delay(1500).slideUp(300);
  			return;
  		}

  		if (typeof buckets == 'undefined') {		// i.e. the storage area is empty. Hence, no need to append. Initialize the variable with the current bucket.
  			buckets = bucket;
  		}
  		else {
  			buckets = buckets + ';' + bucket;		// semicolon separated values. appends bucket to the existing archive.
  		}
  	
  		var bucketsDict = {};		// temporary variable created to be able to use chrome local storage
  		bucketsDict[bucketsLabel] = buckets;
  		

  		try {
  			storage.set(bucketsDict, function() {
  				$('div#success-alert-div').html('Bucket successfully added.');
  				$('div#success-alert-div').slideDown(300).delay(1500).slideUp(300);
  				displayExistingBuckets();
  			})
  		}
  		catch(e) {
  			alert(e.message);
  		}
  	});
}

/*
* Makes the current bucket span editable and edits the entry in the local storage
*/

$('body').on('click', '.bucket_edit', function() {
	var bucket = $(this).parent().parent()[0];
	old_bucket_label = bucket.textContent;

	$('#edit_bucket_help').show();

	// makes the clicked button span editable by setting contentEditable attribute true
	$(this).parent().parent().find('.bucket_label').attr('contentEditable', 'true').focus();

	// executes the edit bucket code when enter key is pressed
	$('.bucket_label').keydown(function(e) {

		// keyCode of enter key = 13
		if(e.keyCode == 13) {

			$(this).attr('contentEditable', 'false');
			$('#edit_bucket_help').hide();

			var new_bucket_label = $(this).text().trim();
			
			if (new_bucket_label != old_bucket_label) {

				// first deletes the old bucket from the storage and then adds the new bucket label
				// because the delete_bucket function contains asynchronous code, hence putting addBucket in the callback of the delte_bucket function
				// so as to execute the former only when the old bucket is deleted
				delete_bucket(old_bucket_label, new_bucket_label, function() {
					addBucket(new_bucket_label);
				});
			}

			displayExistingBuckets();
		}

	})

	// when a click outside the bucket label is performed
	$('.bucket_label').bind('blur', function(){
		location.reload();
	})


})


// executed on clicking the delete option for a bucket
// gets the bucket name and then passes it to a function to remove it from the storage
$('body').on('click', '.bucket_delete', function() {
	var bucket = $(this).parent().parent()[0];
	bucket = bucket.textContent;

	delete_bucket_message = 'Deleting bucket: '+bucket+'. \nAll answers tagged with this bucket will be unclassified. \nContinue?';

	if(confirm(delete_bucket_message))
		delete_bucket(bucket, "");

})


/*
* PURPOSE: delete a bucket and tag all the answers tagged to the old bucket label to the new bucket label and then execute the callback function
*/

function delete_bucket(bucket, newBucket, callback) {

	storage.get(user, function(items) {
		var userLinks = items[user];

		var bucket_label = user +":Buckets";
		storage.get(bucket_label, function(buckets_item) {
			var buckets = buckets_item[bucket_label];
			
			// removing the bucket from the storage
			buckets = buckets.replace(bucket, '');
			buckets = buckets.replace(/;;/g, ';');

			// tagging answers tagged to old bucket to new bucket
			for (var i in userLinks) {

				var temp_answer_bucket = userLinks[i]["bucket"];

				if(temp_answer_bucket == bucket)
					userLinks[i]["bucket"] = newBucket;

			}


			// setting the new values in the storage
			var temp_buckets = {};
			temp_buckets[bucket_label] = buckets;

			var temp_userLinks = {};
			temp_userLinks[user] = userLinks;

			storage.set(temp_buckets, function() {
				storage.set(temp_userLinks, function() {
					displayExistingBuckets();
					callback();
				});
			})


		})

	})

}