({
/*******************************************************************
Change History

Changed: 20/Oct/16 Saurabh Deep
Defect: SIT Defect # 003
Desc: Changed sequence of file type and file size error. File type error will be shown first.
*******************************************************************/
	
	MAX_FILE_SIZE: 1 048 576, 
    CHUNK_SIZE: 500 000,
    
	showError : function(component, msg) {
		var errMsg = msg + "<br />Kindly visit Contact Us page and provide necessary information.";
		
		var scriptFlag = component.get("v.scriptFlag");
		if (scriptFlag)
		{
			// Hide load spinner
			$("#contactLoadInfo").hide();
			
			// Show the error message
			$("#contactErrorSection").html(errMsg).show();
		}
		else
		{
			document.getElementById("contactLoadInfo").style.display = "none";
			document.getElementById("contactErrorSection").innerHTML = errMsg;
			document.getElementById("contactErrorSection").style.display = "block";
		}
	},
    
	fetchUser : function(component){
        var action = component.get("c.fetchUserDetails");
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.defaultUser", response.getReturnValue());
				component.set("v.dataFlag", true);
				this.initDisplay(component);
            }
			else if (state === "ERROR"){
                // Even when an error occurs, do not show an error screen. Show the form without pre-populating the fields.
				component.set("v.dataFlag", true);
				this.initDisplay(component);
            }
        });
    	$A.enqueueAction(action); 
    },
	
    initDisplay : function(component) {
        var dataFlag = component.get("v.dataFlag");
        var scriptFlag = component.get("v.scriptFlag");
		
        if (dataFlag && scriptFlag)
        {
			$( "#actionType-select" ).toggleClass("selectpicker select_opt");
			$( "#actionType-select" ).selectpicker({dropupAuto: false, dropdownAlignRight: 'auto', size: false, selectOnTab: true});
			
			var userInfo = component.get("v.defaultUser");
			if (userInfo)
			{
				$( "#ccp-con-us-fName" ).val(userInfo.FirstName);
				$( "#ccp-con-us-lName" ).val(userInfo.LastName);
				$( "#ccp-con-us-email" ).val(userInfo.Email);
			}
			$("#contactLoadInfo").hide();
			$("#contactFormSection").show();
		}
	},
	
    saveFile : function(component) {
		var fileInput = component.find("file").getElement();
    	var file = fileInput.files[0];
		
		if(!file){
			$("#loadMessageDiv").text("Processing your request... please wait");
			$("#contactLoadInfo").show();
			$("#contactFormSection").hide();
			this.sendEmailWithAttach(component, '');
		}
		
		var _validFileExtensions = [".jpg", ".pdf", ".xlsx", ".xls", ".docx", ".doc", ".jpeg", ".bmp", ".png", ".zip"];
        var sFileName = file.name;
        if (sFileName.length > 0) {
            var blnValid = false;
            for (var j = 0; j < _validFileExtensions.length; j++) {
                var sCurExtension = _validFileExtensions[j];
                if (sFileName.substr(sFileName.length - sCurExtension.length, sCurExtension.length).toLowerCase() == sCurExtension.toLowerCase()) {
                    blnValid = true;
                    break;
                }
            }
            
            if (!blnValid) {
                alert("Error: File type not supported");
                return;
            }
        }
		
		if (file.size > this.MAX_FILE_SIZE) {
			alert('Error: File size greater than 1 MB');
			return;
		}
		
		$("#loadMessageDiv").text("Processing your request... please wait");
		$("#contactLoadInfo").show();
		$("#contactFormSection").hide();
		
		var fr = new FileReader();

        var self = this;
        fr.onload = function() {
            var fileContents = fr.result;
    	    var base64Mark = 'base64,';
            var dataStart = fileContents.indexOf(base64Mark) + base64Mark.length;

            fileContents = fileContents.substring(dataStart);
        
    	    self.upload(component, file, fileContents);
        };

        fr.readAsDataURL(file);
    },
    
    upload: function(component, file, fileContents) {
        var fromPos = 0;
        var toPos = Math.min(fileContents.length, fromPos + this.CHUNK_SIZE);
		
        // start with the initial chunk
        this.uploadChunk(component, file, fileContents, fromPos, toPos, '');   
    },
        
    uploadChunk : function(component, file, fileContents, fromPos, toPos, attachId) {
        var action = component.get("c.saveTheChunk"); 
        var chunk = fileContents.substring(fromPos, toPos);
        
		action.setParams({
            fileName: file.name,
            base64Data: encodeURIComponent(chunk), 
            contentType: file.type,
            fileId: attachId
        });
       
        var self = this;
        action.setCallback(this, function(response) {
			var state = response.getState();
			if (component.isValid() && state === "SUCCESS") {
				attachId = response.getReturnValue();
				fromPos = toPos;
				toPos = Math.min(fileContents.length, fromPos + self.CHUNK_SIZE);    
				if (fromPos < toPos) {
					self.uploadChunk(component, file, fileContents, fromPos, toPos, attachId);  
				}else{
					self.sendEmailWithAttach(component, attachId);
				}
			}
			else if (state === "ERROR") {
                this.showError(component, "An error occurred while uploading the attachment.");
            }
        });
            
        $A.run(function() {
            $A.enqueueAction(action); 
        });
    },
     
    sendEmailWithAttach : function(component, attachId) {
		var fName = $("#ccp-con-us-fName").val();
        var lName = $("#ccp-con-us-lName").val();
        var email = $("#ccp-con-us-email").val();
        var phone = $("#ccp-con-us-phone").val();
        var actionType = $( "#actionType-select option:selected" ).text();
        var comments = $("#ccp-con-us-comments").val();
        var action = component.get("c.sendEmailWithAttachment");	
		action.setParams({
			"firstName":fName,
			"lastName":lName,
			"email":email,
			"phone":phone,
			"actionType":actionType,
			"comments":comments,
			"attachId":attachId
		});
		
		action.setCallback(this, function(response) {
			var state = response.getState();
			if (component.isValid() && state === "SUCCESS") {
				$("#contactLoadInfo").hide();
				$("#thankYouSection").show();
			}
			else if (state === "ERROR") {
				this.showError(component, "An error occurred while sending the email.");
			}
		});
        $A.enqueueAction(action);
	}
})