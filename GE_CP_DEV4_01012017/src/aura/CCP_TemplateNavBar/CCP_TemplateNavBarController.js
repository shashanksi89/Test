({
	scriptReady : function(component, event, helper) {
        component.set("v.scriptFlag", true);
    },
	
	doneRendering: function(component, event, helper) {
		var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		
		if (!renderFlag && scriptFlag && $("#list_0").length > 0)
		{
			// Call this only once at initial load
			component.set("v.initialLoad", true);
			
			var path = window.location.href;
            var res = path.split("/");
			var lastPart = res[res.length - 1];
			
			if (lastPart.indexOf("invoices") != -1)
			{
				$("#list_1").addClass("ccp-sidenav-active");
			}
			else if (lastPart.indexOf("contactus") != -1)
			{
				$("#list_5").addClass("ccp-sidenav-active");
			}
			else
			{
				$("#list_0").addClass("ccp-sidenav-active");
			}
		}
	}
})