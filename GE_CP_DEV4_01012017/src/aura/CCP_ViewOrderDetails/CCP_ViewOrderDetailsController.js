({
	scriptsLoaded : function(component, event, helper) {
        component.set("v.scriptFlag", true);
		helper.initDisplay(component);
    },
	
	doInit : function(component, event, helper) {
		var urlGON = helper.getUrlParameter(component, "on");
		if (urlGON == "undefined")
		{
			urlGON = "";
		}
		component.set("v.urlGON", urlGON);
		
		var action = component.get("c.fetchOrderDetails");
		action.setParams({"GON": urlGON});
		action.setCallback(this, function(response) {
			var state = response.getState();
			if (component.isValid() && state === "SUCCESS"){
				var orderDet = response.getReturnValue();
				if (orderDet.hasOwnProperty("GON"))
				{
					component.set("v.orderDetails", orderDet);
					component.set("v.dataFlag", true);
					helper.initDisplay(component);
				}
				else
				{
					helper.showError(component, "invalid");
				}
			}
			else if (state === "ERROR"){
				helper.showError(component, "exception");
			}
		});
		$A.enqueueAction(action);
	},
	
	doneRendering: function(component, event, helper) {
		var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		if (!renderFlag && scriptFlag && $("#accordion").length > 0)
		{
			// Call this only once at initial load
			component.set("v.initialLoad", true);
			$('#accordion').on('show.bs.collapse', function (e) {
				$("#" + e.target.id).prev().find(".ccp-accord-header-left").addClass("ccp-border-del-left");
				$("#" + e.target.id).prev().children().last().addClass("ccp-border-del-right");
				$("#" + e.target.id).parent().addClass("ccp-accord-shadow");
			});
			
			$('#accordion').on('hide.bs.collapse', function (e) {
				$("#" + e.target.id).prev().find(".ccp-accord-header-left").removeClass("ccp-border-del-left");
				$("#" + e.target.id).prev().children().last().removeClass("ccp-border-del-right");
				$("#" + e.target.id).parent().removeClass("ccp-accord-shadow");
			});
		}
	},
	
	doProcessInvoices : function(component, event, helper) {
        var invoicesArr = event.getParam("invoices");
		helper.processInvoices(component, invoicesArr);
	}
})