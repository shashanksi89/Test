({
	onSystemError: function(component, event, handler) {
		console.log(event.getParam("message"));
		console.log(event.getParam("error"));
	},
	
	scriptsLoaded : function(component, event, helper) {
        component.set("v.scriptFlag", true);
		$("#headerMessageDiv").show();
		CCP_resizeHeader();
    },
	
	doneRendering: function(component, event, helper) {
		var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		
		if (scriptFlag && $("#headerOuterContainer").length > 0)
		{
			CCP_resizeHeader();
			
			if (!renderFlag)
			{
				// Call this only once at initial load
				component.set("v.initialLoad", true);
				
				$(window).resize(function() {
					CCP_resizeHeader();
				});
			}
		}
	},
	
    doInit: function(component, event, helper) {
        helper.fetchUser(component);
        helper.fetchHeadDisclaimer(component);
    }
})