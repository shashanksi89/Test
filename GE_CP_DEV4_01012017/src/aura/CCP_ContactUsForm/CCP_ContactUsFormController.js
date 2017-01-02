({
    doInit : function(component, event, helper){
        helper.fetchUser(component);
    },
    
    scriptReady : function(component, event, helper) {
		component.set("v.scriptFlag", true);
		helper.initDisplay(component);
    },
	
	sendEmail : function(component, event, helper) {
        var contactErrMsg = "Error: Some of the fields marked * have not been filled.";
        
        if ($.trim($( "#ccp-con-us-fName" ).val()) == "")
        {
            alert( contactErrMsg );
            $( "#ccp-con-us-fName" ).val("").focus();
            return;
        }
        
        if ($.trim($( "#ccp-con-us-lName" ).val()) == "")
        {
            alert( contactErrMsg );
            $( "#ccp-con-us-lName" ).val("").focus();
            return;
        }
        if ($.trim($( "#ccp-con-us-email" ).val()) == "")
        {
            alert( contactErrMsg );
            $( "#ccp-con-us-email" ).val("").focus();
            return;
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($( "#ccp-con-us-email" ).val()))  )
        {
            alert("Error: Please enter a valid email id.");
            $( "#ccp-con-us-email" ).focus();
            return;
        }
        
        if ($.trim($( "#ccp-con-us-phone" ).val()) == "")
        {
            alert(contactErrMsg) ;
            $( "#ccp-con-us-phone" ).val("").focus();
            return;
        }
        
        if ($.trim($( "#ccp-con-us-comments" ).val()) == "")
        {
            alert( contactErrMsg );
            $( "#ccp-con-us-comments" ).val("").focus();
            return;
        }
        
		helper.saveFile(component);
    }
})